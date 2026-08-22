-- ─────────────────────────────────────────────────────────────────────────────
-- 012_audit_logs.sql — Registro de auditoria (logs) para super administradores
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
--
-- Registra automaticamente, via triggers, as ações sensíveis:
--   • promover / remover super admin           (profiles.is_admin)
--   • registrar / corrigir / excluir ponto de OUTRO usuário (correção de admin)
--   • criar / excluir convite
--   • criar / editar / excluir local autorizado
--
-- O log NUNCA quebra a operação principal: cada inserção de auditoria está
-- protegida por EXCEPTION (se falhar, a ação segue normalmente).
-- Só super admin consegue LER os logs (RLS). A escrita é feita pelos triggers
-- (security definer), então o cliente não insere/edita logs diretamente.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.audit_logs (
  id             bigint generated always as identity primary key,
  actor_id       uuid references public.profiles(id) on delete set null,  -- quem fez
  action         text not null,                                           -- ex: 'promoveu_admin'
  entity         text not null,                                           -- tabela alvo
  entity_id      text,                                                    -- id do registro alvo
  target_user_id uuid references public.profiles(id) on delete set null,  -- usuário afetado (quando aplicável)
  details        jsonb not null default '{}'::jsonb,
  created_at     timestamptz not null default now()
);

create index if not exists audit_logs_created_idx on public.audit_logs (created_at desc);

alter table public.audit_logs enable row level security;

drop policy if exists "audit: admin lê" on public.audit_logs;
create policy "audit: admin lê"
  on public.audit_logs for select
  using (public.is_admin(auth.uid()));

grant select on public.audit_logs to authenticated;

-- ── Trigger: profiles (promover/remover admin) ───────────────────────────────
create or replace function public.audit_profiles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if TG_OP = 'UPDATE' and NEW.is_admin is distinct from OLD.is_admin then
    begin
      insert into public.audit_logs (actor_id, action, entity, entity_id, target_user_id, details)
      values (
        auth.uid(),
        case when NEW.is_admin then 'promoveu_admin' else 'removeu_admin' end,
        'profiles', NEW.id::text, NEW.id,
        jsonb_build_object('nome', NEW.nome, 'matricula', NEW.matricula)
      );
    exception when others then null;  -- nunca quebra a operação principal
    end;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_audit_profiles on public.profiles;
create trigger trg_audit_profiles
  after update on public.profiles
  for each row execute function public.audit_profiles();

-- ── Trigger: ponto_registros (correção de ponto por admin) ───────────────────
-- Só registra quando quem mexe (auth.uid) é DIFERENTE do dono do ponto — ou
-- seja, um admin corrigindo o ponto de outra pessoa. O ponto normal do próprio
-- usuário (via registrar_ponto) não gera log.
create or replace function public.audit_ponto()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_actor uuid := auth.uid();
  r public.ponto_registros := coalesce(NEW, OLD);
begin
  if v_actor is not null and v_actor <> r.user_id then
    begin
      insert into public.audit_logs (actor_id, action, entity, entity_id, target_user_id, details)
      values (
        v_actor,
        case TG_OP when 'INSERT' then 'registrou_ponto' when 'UPDATE' then 'corrigiu_ponto' else 'excluiu_ponto' end,
        'ponto_registros', r.id::text, r.user_id,
        jsonb_build_object('data', r.data, 'entrada', r.entrada, 'almoco', r.almoco, 'retorno', r.retorno, 'saida', r.saida)
      );
    exception when others then null;
    end;
  end if;
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_audit_ponto on public.ponto_registros;
create trigger trg_audit_ponto
  after insert or update or delete on public.ponto_registros
  for each row execute function public.audit_ponto();

-- ── Trigger: convites (criar/excluir) ────────────────────────────────────────
create or replace function public.audit_convites()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  begin
    if TG_OP = 'INSERT' then
      insert into public.audit_logs (actor_id, action, entity, entity_id, details)
      values (coalesce(auth.uid(), NEW.created_by), 'criou_convite', 'convites', NEW.id::text,
              jsonb_build_object('email', NEW.email, 'nome', NEW.nome));
    elsif TG_OP = 'DELETE' then
      insert into public.audit_logs (actor_id, action, entity, entity_id, details)
      values (auth.uid(), 'excluiu_convite', 'convites', OLD.id::text,
              jsonb_build_object('email', OLD.email, 'nome', OLD.nome, 'usado', OLD.used_at is not null));
    end if;
  exception when others then null;
  end;
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_audit_convites on public.convites;
create trigger trg_audit_convites
  after insert or delete on public.convites
  for each row execute function public.audit_convites();

-- ── Trigger: locais_permitidos (criar/editar/excluir) ────────────────────────
create or replace function public.audit_locais()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  r public.locais_permitidos := coalesce(NEW, OLD);
begin
  begin
    insert into public.audit_logs (actor_id, action, entity, entity_id, details)
    values (
      auth.uid(),
      case TG_OP when 'INSERT' then 'criou_local' when 'UPDATE' then 'editou_local' else 'excluiu_local' end,
      'locais_permitidos', r.id::text,
      jsonb_build_object('nome', r.nome, 'raio_metros', r.raio_metros, 'ativo', r.ativo)
    );
  exception when others then null;
  end;
  return coalesce(NEW, OLD);
end $$;

drop trigger if exists trg_audit_locais on public.locais_permitidos;
create trigger trg_audit_locais
  after insert or update or delete on public.locais_permitidos
  for each row execute function public.audit_locais();
