-- ─────────────────────────────────────────────────────────────────────────────
-- 010_ponto_hora_servidor.sql — Horário do ponto carimbado pelo SERVIDOR
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
--
-- Antes: registrar_ponto recebia p_time do cliente (o relógio do celular),
-- então dava para forjar o horário. Além disso, o RLS ainda permitia um
-- usuário inserir/atualizar o registro de HOJE direto pela API, com hora
-- arbitrária, sem passar pelo RPC.
--
-- Agora:
--   1. registrar_ponto ignora qualquer hora/data do cliente e usa o relógio
--      do servidor no fuso do laboratório (America/Fortaleza, UTC-3).
--   2. As policies de INSERT/UPDATE do usuário comum são removidas, então o
--      ÚNICO caminho de escrita de ponto é o RPC (que carimba a hora). O RPC
--      é security definer, então continua funcionando sem essas policies.
--   3. O admin mantém suas policies (registrar ponto esquecido/corrigir).
--
-- ⚠️ Fuso: ajuste 'America/Fortaleza' abaixo se o laboratório for em outro fuso.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. RPC com hora do servidor ──────────────────────────────────────────────
-- Mantém a MESMA assinatura (o front continua chamando igual); p_time e p_data
-- passam a ser ignorados — ficam só por compatibilidade com o cliente atual.
create or replace function public.registrar_ponto(
  p_actions     text[],
  p_time        time,
  p_latitude    double precision,
  p_longitude   double precision,
  p_data        date default current_date
) returns public.ponto_registros
language plpgsql security definer set search_path = public
as $$
declare
  v_user_id    uuid := auth.uid();
  v_now        timestamptz := now();
  v_time       time := (v_now at time zone 'America/Fortaleza')::time;  -- hora do servidor
  v_today      date := (v_now at time zone 'America/Fortaleza')::date;  -- dia do servidor
  v_record     public.ponto_registros;
  v_existing   public.ponto_registros;
  v_closest    public.locais_permitidos;
  v_dist       double precision;
  v_action     text;
  v_action_set boolean;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar autenticado.';
  end if;

  if p_actions is null or array_length(p_actions, 1) = 0 then
    raise exception 'Nenhuma ação informada.';
  end if;

  -- Ações válidas e sem duplicidade
  foreach v_action in array p_actions loop
    if v_action not in ('entrada', 'almoco', 'retorno', 'saida') then
      raise exception 'Ação inválida: %', v_action;
    end if;
  end loop;

  if (select count(distinct a) from unnest(p_actions) a) <> array_length(p_actions, 1) then
    raise exception 'Ação duplicada.';
  end if;

  -- Geofencing: se há locais ativos, exige posição dentro do raio do mais próximo
  if exists (select 1 from public.locais_permitidos where ativo = true) then
    if p_latitude is null or p_longitude is null then
      raise exception 'Localização não informada. Ative o GPS para bater o ponto.';
    end if;

    select * into v_closest
    from public.locais_permitidos
    where ativo = true
    order by public.distancia_metros(latitude, longitude, p_latitude, p_longitude)
    limit 1;

    v_dist := public.distancia_metros(
      v_closest.latitude, v_closest.longitude, p_latitude, p_longitude
    );

    if v_dist > v_closest.raio_metros then
      raise exception 'Ponto negado: você está a %m de "%" (raio permitido: %m).', round(v_dist), v_closest.nome, v_closest.raio_metros;
    end if;
  end if;

  -- Impede alterar horários já registrados no dia (usa a data do servidor)
  select * into v_existing
  from public.ponto_registros
  where user_id = v_user_id and data = v_today;

  if v_existing.id is not null then
    foreach v_action in array p_actions loop
      v_action_set := case v_action
        when 'entrada' then v_existing.entrada is not null
        when 'almoco'  then v_existing.almoco  is not null
        when 'retorno' then v_existing.retorno is not null
        when 'saida'   then v_existing.saida   is not null
        else true
      end;
      if v_action_set then
        raise exception 'O horário de % já foi registrado hoje.', v_action;
      end if;
    end loop;
  end if;

  insert into public.ponto_registros (user_id, data, entrada, almoco, retorno, saida)
  values (
    v_user_id,
    v_today,
    case when 'entrada' = any(p_actions) then v_time else null end,
    case when 'almoco'   = any(p_actions) then v_time else null end,
    case when 'retorno'  = any(p_actions) then v_time else null end,
    case when 'saida'    = any(p_actions) then v_time else null end
  )
  on conflict (user_id, data) do update set
    entrada = case when 'entrada' = any(p_actions) then excluded.entrada else ponto_registros.entrada end,
    almoco  = case when 'almoco'   = any(p_actions) then excluded.almoco  else ponto_registros.almoco  end,
    retorno = case when 'retorno'  = any(p_actions) then excluded.retorno else ponto_registros.retorno end,
    saida   = case when 'saida'    = any(p_actions) then excluded.saida   else ponto_registros.saida   end,
    updated_at = now()
  returning * into v_record;

  return v_record;
end;
$$;

grant execute on function public.registrar_ponto(text[], time, double precision, double precision, date) to authenticated;

-- ── 2. Fecha a escrita direta pela API (usuário comum) ───────────────────────
-- Sem estas policies, um usuário não consegue mais inserir/atualizar o próprio
-- registro direto pela API com hora forjada — o único caminho é o RPC acima,
-- que é security definer (bypassa RLS) e carimba a hora do servidor.
drop policy if exists "ponto: usuário cria os próprios registros"    on public.ponto_registros;
drop policy if exists "ponto: usuário atualiza os próprios registros" on public.ponto_registros;

-- Observações:
--  • A leitura do próprio registro continua liberada (policy de SELECT intacta).
--  • As policies de admin (criar/atualizar/excluir para outros) continuam
--    valendo — o admin ainda registra ponto esquecido e corrige horários.
