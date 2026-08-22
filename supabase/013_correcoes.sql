-- ─────────────────────────────────────────────────────────────────────────────
-- 013_correcoes.sql — Solicitações de correção de ponto (usuário pede, admin aprova)
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
--
-- Fluxo: o usuário cria um pedido (data + horários corretos + motivo). Um super
-- admin aprova ou rejeita. Ao APROVAR, os horários são aplicados ao ponto do dia
-- (só os campos preenchidos no pedido; os demais são mantidos). A aplicação passa
-- pelos triggers de auditoria (registra 'corrigiu_ponto'); além disso a própria
-- decisão (aprovou/rejeitou) é registrada nos logs.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.correcao_pedidos (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  data          date not null,
  entrada       time,
  almoco        time,
  retorno       time,
  saida         time,
  motivo        text not null,
  status        text not null default 'pendente' check (status in ('pendente','aprovado','rejeitado')),
  revisado_por  uuid references public.profiles(id) on delete set null,
  revisado_em   timestamptz,
  resposta      text,
  created_at    timestamptz not null default now()
);

create index if not exists correcao_pedidos_status_idx on public.correcao_pedidos (status, created_at desc);
create index if not exists correcao_pedidos_user_idx   on public.correcao_pedidos (user_id, created_at desc);

alter table public.correcao_pedidos enable row level security;

drop policy if exists "correcao: usuário cria"        on public.correcao_pedidos;
drop policy if exists "correcao: usuário vê próprias"  on public.correcao_pedidos;
drop policy if exists "correcao: admin vê todas"       on public.correcao_pedidos;

create policy "correcao: usuário cria"
  on public.correcao_pedidos for insert
  with check (auth.uid() = user_id and status = 'pendente');

create policy "correcao: usuário vê próprias"
  on public.correcao_pedidos for select
  using (auth.uid() = user_id);

create policy "correcao: admin vê todas"
  on public.correcao_pedidos for select
  using (public.is_admin(auth.uid()));

grant select, insert on public.correcao_pedidos to authenticated;

-- ── Revisar (aprovar/rejeitar) — super admin ────────────────────────────────
create or replace function public.revisar_correcao(
  p_id       uuid,
  p_aprovar  boolean,
  p_resposta text default null
) returns public.correcao_pedidos
language plpgsql security definer set search_path = public
as $$
declare
  v_ped public.correcao_pedidos;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas super administradores podem revisar correções.'
      using errcode = 'insufficient_privilege';
  end if;

  select * into v_ped from public.correcao_pedidos where id = p_id for update;
  if not found then
    raise exception 'Solicitação não encontrada.';
  end if;
  if v_ped.status <> 'pendente' then
    raise exception 'Esta solicitação já foi revisada.';
  end if;

  if p_aprovar then
    -- Aplica os horários informados; mantém os já existentes onde o pedido é nulo
    insert into public.ponto_registros (user_id, data, entrada, almoco, retorno, saida)
    values (v_ped.user_id, v_ped.data, v_ped.entrada, v_ped.almoco, v_ped.retorno, v_ped.saida)
    on conflict (user_id, data) do update set
      entrada = coalesce(excluded.entrada, ponto_registros.entrada),
      almoco  = coalesce(excluded.almoco,  ponto_registros.almoco),
      retorno = coalesce(excluded.retorno, ponto_registros.retorno),
      saida   = coalesce(excluded.saida,   ponto_registros.saida),
      updated_at = now();
  end if;

  update public.correcao_pedidos
  set status       = case when p_aprovar then 'aprovado' else 'rejeitado' end,
      revisado_por = auth.uid(),
      revisado_em  = now(),
      resposta     = nullif(btrim(p_resposta), '')
  where id = p_id
  returning * into v_ped;

  return v_ped;
end;
$$;

grant execute on function public.revisar_correcao(uuid, boolean, text) to authenticated;

-- ── Auditoria: registra a decisão (aprovou/rejeitou) ────────────────────────
create or replace function public.audit_correcao()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'UPDATE' and NEW.status is distinct from OLD.status and NEW.status <> 'pendente' then
    begin
      insert into public.audit_logs (actor_id, action, entity, entity_id, target_user_id, details)
      values (
        auth.uid(),
        case when NEW.status = 'aprovado' then 'aprovou_correcao' else 'rejeitou_correcao' end,
        'correcao_pedidos', NEW.id::text, NEW.user_id,
        jsonb_build_object('data', NEW.data, 'motivo', NEW.motivo, 'resposta', NEW.resposta)
      );
    exception when others then null;
    end;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_audit_correcao on public.correcao_pedidos;
create trigger trg_audit_correcao
  after update on public.correcao_pedidos
  for each row execute function public.audit_correcao();
