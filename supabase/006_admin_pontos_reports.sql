-- ─────────────────────────────────────────────────────────────────────────────
-- 006_admin_pontos_reports.sql — Admin: registrar pontos esquecidos
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
-- ─────────────────────────────────────────────────────────────────────────────

-- A policy de INSERT do usuário comum limita a data de hoje (anti-backfill).
-- Para o super admin poder registrar pontos esquecidos (datas passadas) e
-- datas de outros usuários, adicionamos uma policy própria de INSERT.
-- (UPDATE e DELETE de admin já existem desde a migração 004.)

drop policy if exists "ponto: admin cria para outros" on public.ponto_registros;
create policy "ponto: admin cria para outros"
  on public.ponto_registros for insert
  with check (public.is_admin(auth.uid()));

-- Garante que a role authenticated tenha privilégio de INSERT na tabela
-- (o gate de verdade continua sendo o RLS: usuário comum só insere hoje,
-- admin insere para qualquer um em qualquer data).
grant insert on public.ponto_registros to authenticated;

-- Função de apoio: duração trabalhada de um dia já gravado (HH:MM), sem
-- depender do horário atual — usada no relatório de admin.
create or replace function public.minutos_trabalhados(
  p_entrada time,
  p_almoco  time,
  p_retorno time,
  p_saida   time
) returns integer
language sql immutable set search_path = public
as $$
  select
    coalesce(
      case when p_entrada is not null then greatest(0, extract(epoch from (coalesce(p_almoco, p_saida) - p_entrada)) / 60)::integer else 0 end
      +
      case when p_retorno is not null and p_saida is not null then greatest(0, extract(epoch from (p_saida - p_retorno)) / 60)::integer else 0 end
      , 0
    );
$$;

grant execute on function public.minutos_trabalhados(time, time, time, time) to authenticated, anon;
