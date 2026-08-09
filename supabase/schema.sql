-- Chronos — Schema do Supabase (instalação do zero)
-- Rode este arquivo inteiro em: Supabase Dashboard → SQL Editor → New query
--
-- ⚠️ Este script é DESTRUTIVO (dropa e recria as tabelas do zero) — use
-- apenas em um projeto novo, sem dados reais ainda. Se o banco já tem
-- usuários/registros cadastrados, NÃO rode este arquivo de novo; aplique
-- só as migrações incrementais (ex: 002_admin_locais.sql).

-- ─────────────────────────────────────────────────────────────────────────
-- 0. Reset (remove versões anteriores, se existirem)
-- ─────────────────────────────────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.locais_permitidos cascade;
drop table if exists public.ponto_registros cascade;
drop table if exists public.profiles cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.email_by_matricula(text) cascade;
drop function if exists public.protect_is_admin() cascade;

-- ─────────────────────────────────────────────────────────────────────────
-- 1. PROFILES (dados do pesquisador, 1:1 com auth.users)
-- ─────────────────────────────────────────────────────────────────────────
create table public.profiles (
  id           uuid primary key references auth.users(id) on delete cascade,
  matricula    text unique not null,
  nome         text not null,
  categoria    text not null check (categoria in ('IC', 'PG')),
  lab          text,
  orientador   text,
  carga_horas  numeric not null default 20,
  telefone     text,
  email        text,
  avatar_url   text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles: usuário vê o próprio perfil"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: usuário edita o próprio perfil"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles: usuário cria o próprio perfil"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Impede que o próprio usuário se promova a admin via API (auth.uid() só é
-- nulo em chamadas feitas fora da API, ex: SQL Editor / service role).
create function public.protect_is_admin()
returns trigger as $$
begin
  if auth.uid() is not null then
    new.is_admin = old.is_admin;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger profiles_protect_is_admin
  before update on public.profiles
  for each row execute function public.protect_is_admin();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. REGISTROS DE PONTO (um registro por usuário por dia)
-- ─────────────────────────────────────────────────────────────────────────
create table public.ponto_registros (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles(id) on delete cascade,
  data         date not null,
  entrada      time,
  almoco       time,
  retorno      time,
  saida        time,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (user_id, data)
);

alter table public.ponto_registros enable row level security;

create policy "ponto: usuário vê os próprios registros"
  on public.ponto_registros for select
  using (auth.uid() = user_id);

create policy "ponto: usuário cria os próprios registros"
  on public.ponto_registros for insert
  with check (auth.uid() = user_id);

create policy "ponto: usuário atualiza os próprios registros"
  on public.ponto_registros for update
  using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- 3. updated_at automático
-- ─────────────────────────────────────────────────────────────────────────
create function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger ponto_registros_set_updated_at
  before update on public.ponto_registros
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 4. Índice para consultas de histórico (por usuário, mais recentes primeiro)
-- ─────────────────────────────────────────────────────────────────────────
create index ponto_registros_user_data_idx
  on public.ponto_registros (user_id, data desc);

-- ─────────────────────────────────────────────────────────────────────────
-- 5. Auto-criação de perfil no cadastro (trigger em auth.users)
--    O front chama supabase.auth.signUp(...) passando os dados extras em
--    options.data; este trigger lê esses metadados e cria a linha em
--    public.profiles automaticamente, já com privilégio para ignorar RLS
--    (security definer) — necessário porque no momento do INSERT o usuário
--    ainda pode não ter uma sessão ativa (ex: confirmação de email pendente).
-- ─────────────────────────────────────────────────────────────────────────
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, matricula, nome, categoria, lab, orientador, carga_horas, telefone, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'matricula',
    coalesce(new.raw_user_meta_data ->> 'nome', 'Pesquisador'),
    coalesce(new.raw_user_meta_data ->> 'categoria', 'IC'),
    new.raw_user_meta_data ->> 'lab',
    new.raw_user_meta_data ->> 'orientador',
    coalesce((new.raw_user_meta_data ->> 'carga_horas')::numeric, 20),
    new.raw_user_meta_data ->> 'telefone',
    new.email
  );
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────
-- 6. Login por matrícula
--    O login da tela é feito por matrícula, mas o Supabase Auth autentica
--    por email. Esta função (security definer) traduz matrícula → email
--    sem expor o resto da tabela profiles à role anon (RLS continua
--    bloqueando leitura direta da tabela).
-- ─────────────────────────────────────────────────────────────────────────
create function public.email_by_matricula(p_matricula text)
returns text as $$
  select email from public.profiles where matricula = p_matricula limit 1;
$$ language sql security definer set search_path = public;

grant execute on function public.email_by_matricula(text) to anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- 7. Locais permitidos para bater o ponto (super admin)
-- ─────────────────────────────────────────────────────────────────────────
create table public.locais_permitidos (
  id           uuid primary key default gen_random_uuid(),
  nome         text not null,
  latitude     double precision not null,
  longitude    double precision not null,
  raio_metros  integer not null default 100,
  ativo        boolean not null default true,
  created_by   uuid references public.profiles(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table public.locais_permitidos enable row level security;

create policy "locais: usuário autenticado lê"
  on public.locais_permitidos for select
  using (auth.uid() is not null);

create policy "locais: admin insere"
  on public.locais_permitidos for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "locais: admin atualiza"
  on public.locais_permitidos for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "locais: admin exclui"
  on public.locais_permitidos for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create trigger locais_permitidos_set_updated_at
  before update on public.locais_permitidos
  for each row execute function public.set_updated_at();

-- Promova seu primeiro super admin rodando manualmente (ajuste a matrícula):
-- update public.profiles set is_admin = true where matricula = 'SUA_MATRICULA';
