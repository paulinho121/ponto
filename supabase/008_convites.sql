-- ─────────────────────────────────────────────────────────────────────────────
-- 008_convites.sql — Cadastro apenas por convite (super admin gera os links)
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
--
-- Modelo: convite de USO ÚNICO e personalizado.
--   • O super admin gera um convite (opcionalmente pré-preenchendo nome/email
--     e uma validade). Isso devolve um token; o link fica cadastro.html?convite=TOKEN.
--   • O convidado abre o link, completa o cadastro e o convite é consumido
--     (used_at/used_by) — o mesmo link não serve para uma segunda pessoa.
--   • Todo convite cria um PESQUISADOR COMUM; promover a super admin continua
--     sendo manual (is_admin no banco).
--
-- O gate real é no servidor: a função handle_new_user() passa a EXIGIR um
-- convite válido nos metadados do signUp e aborta a criação da conta se o
-- token faltar, estiver expirado ou já usado. A checagem no front é só UX.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Tabela de convites ────────────────────────────────────────────────────
create table if not exists public.convites (
  id           uuid primary key default gen_random_uuid(),
  token        text unique not null,
  email        text,                        -- pré-preenchimento opcional
  nome         text,                        -- pré-preenchimento opcional
  created_by   uuid references public.profiles(id) on delete set null,
  expires_at   timestamptz,                 -- null = não expira
  used_at      timestamptz,                 -- null = ainda não usado
  used_by      uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now()
);

create index if not exists convites_token_idx      on public.convites (token);
create index if not exists convites_created_at_idx  on public.convites (created_at desc);

alter table public.convites enable row level security;

-- ── 2. RLS: só super admin enxerga e gerencia convites ───────────────────────
--    O convidado (anon) NUNCA lê esta tabela direto — valida o token pela
--    função validar_convite() (security definer) abaixo.
drop policy if exists "convites: admin lista"    on public.convites;
drop policy if exists "convites: admin insere"   on public.convites;
drop policy if exists "convites: admin atualiza" on public.convites;
drop policy if exists "convites: admin exclui"   on public.convites;

create policy "convites: admin lista"
  on public.convites for select
  using (public.is_admin(auth.uid()));

create policy "convites: admin insere"
  on public.convites for insert
  with check (public.is_admin(auth.uid()));

create policy "convites: admin atualiza"
  on public.convites for update
  using (public.is_admin(auth.uid()));

create policy "convites: admin exclui"
  on public.convites for delete
  using (public.is_admin(auth.uid()));

-- ── 3. Gerar convite (super admin) ───────────────────────────────────────────
--    Gera um token url-safe (2× uuid sem hífens = 64 hex chars, sem depender
--    da extensão pgcrypto) e devolve id + token. O link é montado no front.
create or replace function public.criar_convite(
  p_email       text default null,
  p_nome        text default null,
  p_expira_dias integer default 7
) returns json
language plpgsql
security definer set search_path = public
as $$
declare
  v_token text;
  v_id    uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas super administradores podem criar convites.'
      using errcode = 'insufficient_privilege';
  end if;

  v_token := replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', '');

  insert into public.convites (token, email, nome, created_by, expires_at)
  values (
    v_token,
    nullif(btrim(p_email), ''),
    nullif(btrim(p_nome), ''),
    auth.uid(),
    case
      when p_expira_dias is null or p_expira_dias <= 0 then null
      else now() + make_interval(days => p_expira_dias)
    end
  )
  returning id into v_id;

  return json_build_object('id', v_id, 'token', v_token);
end;
$$;

grant execute on function public.criar_convite(text, text, integer) to authenticated;

-- ── 4. Validar convite (público, sem expor a tabela) ─────────────────────────
--    Chamado pela tela de cadastro antes de exibir o formulário. Devolve só o
--    necessário (válido? e os campos de pré-preenchimento), nunca a linha toda.
create or replace function public.validar_convite(p_token text)
returns json
language plpgsql
security definer set search_path = public
stable
as $$
declare
  c public.convites;
begin
  select * into c from public.convites where token = p_token;

  if not found then
    return json_build_object('valido', false, 'motivo', 'inexistente');
  end if;
  if c.used_at is not null then
    return json_build_object('valido', false, 'motivo', 'usado');
  end if;
  if c.expires_at is not null and c.expires_at <= now() then
    return json_build_object('valido', false, 'motivo', 'expirado');
  end if;

  return json_build_object('valido', true, 'email', c.email, 'nome', c.nome);
end;
$$;

grant execute on function public.validar_convite(text) to anon, authenticated;

-- ── 5. Gate no cadastro: exige convite válido e o consome ────────────────────
--    Substitui handle_new_user() adicionando a exigência do convite ANTES de
--    criar o perfil. Se o token faltar/for inválido, RAISE aborta a transação
--    inteira — inclusive o insert em auth.users — então nenhuma conta é criada.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_token     text := new.raw_user_meta_data ->> 'convite_token';
  v_convite   public.convites;
begin
  -- 5.1 Exige um token
  if v_token is null or btrim(v_token) = '' then
    raise exception 'Cadastro apenas por convite: token ausente.'
      using errcode = 'check_violation';
  end if;

  -- 5.2 Trava a linha do convite e valida (o FOR UPDATE serializa cadastros
  --     concorrentes com o mesmo token: o segundo verá used_at preenchido).
  select * into v_convite
  from public.convites
  where token = v_token
  for update;

  if not found then
    raise exception 'Convite inválido.' using errcode = 'check_violation';
  end if;
  if v_convite.used_at is not null then
    raise exception 'Este convite já foi utilizado.' using errcode = 'check_violation';
  end if;
  if v_convite.expires_at is not null and v_convite.expires_at <= now() then
    raise exception 'Convite expirado.' using errcode = 'check_violation';
  end if;

  -- 5.3 Cria o perfil (pesquisador comum; is_admin fica no default false)
  insert into public.profiles (id, matricula, nome, categoria, lab, orientador, carga_horas, telefone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'matricula',
    coalesce(new.raw_user_meta_data ->> 'nome', v_convite.nome, 'Pesquisador'),
    coalesce(new.raw_user_meta_data ->> 'categoria', 'IC'),
    new.raw_user_meta_data ->> 'lab',
    new.raw_user_meta_data ->> 'orientador',
    coalesce((new.raw_user_meta_data ->> 'carga_horas')::numeric, 20),
    new.raw_user_meta_data ->> 'telefone',
    coalesce(new.email, v_convite.email)
  );

  -- 5.4 Consome o convite (agora que o perfil existe, o FK used_by é válido)
  update public.convites
  set used_at = now(), used_by = new.id
  where id = v_convite.id;

  return new;
end;
$$;

-- O trigger on_auth_user_created já aponta para esta função (definido no
-- schema.sql); substituir a função basta. Recriado aqui por segurança caso
-- este seja o primeiro script rodado após um reset parcial.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
