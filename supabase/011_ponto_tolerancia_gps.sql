-- ─────────────────────────────────────────────────────────────────────────────
-- 011_ponto_tolerancia_gps.sql — Geofencing tolera a imprecisão do GPS
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
--
-- Problema: usuários no local recebiam "você está distante do local". Causa
-- principal: o app enviava a PRIMEIRA leitura de GPS (Wi-Fi/celular, imprecisa)
-- antes do GPS travar. Além de melhorar a captação no app, aqui o servidor
-- passa a receber a precisão (accuracy) e a tolerá-la ao comparar a distância.
--
-- A tolerância é LIMITADA (teto de 100 m) para não virar brecha: mesmo que
-- alguém envie uma precisão enorme forjada, o ganho máximo é 100 m — irrelevante
-- perto dos raios configurados, mas suficiente para cobrir a variação real do GPS.
--
-- Assinatura nova adiciona p_accuracy COM valor padrão, então o front antigo
-- (que não envia esse parâmetro) continua funcionando via o padrão.
-- ─────────────────────────────────────────────────────────────────────────────

-- Remove versões anteriores (5 e 6 argumentos) para recriar de forma limpa.
drop function if exists public.registrar_ponto(text[], time, double precision, double precision, date);
drop function if exists public.registrar_ponto(text[], time, double precision, double precision, date, double precision);

create function public.registrar_ponto(
  p_actions     text[],
  p_time        time,
  p_latitude    double precision,
  p_longitude   double precision,
  p_data        date default current_date,
  p_accuracy    double precision default null
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
  v_tol        double precision;
  v_action     text;
  v_action_set boolean;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar autenticado.';
  end if;

  if p_actions is null or array_length(p_actions, 1) = 0 then
    raise exception 'Nenhuma ação informada.';
  end if;

  foreach v_action in array p_actions loop
    if v_action not in ('entrada', 'almoco', 'retorno', 'saida') then
      raise exception 'Ação inválida: %', v_action;
    end if;
  end loop;

  if (select count(distinct a) from unnest(p_actions) a) <> array_length(p_actions, 1) then
    raise exception 'Ação duplicada.';
  end if;

  -- Geofencing: se há locais ativos, exige posição dentro do raio do mais próximo,
  -- tolerando a imprecisão do GPS (accuracy), limitada a 100 m.
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

    v_tol := least(greatest(coalesce(p_accuracy, 0), 0), 100);

    if v_dist > v_closest.raio_metros + v_tol then
      raise exception 'Ponto negado: você está a %m de "%" (raio permitido: %m).%',
        round(v_dist), v_closest.nome, v_closest.raio_metros,
        case
          when coalesce(p_accuracy, 0) > 100
            then ' O sinal de GPS está impreciso (±' || round(p_accuracy) || 'm). Vá para uma área mais aberta e tente novamente.'
          else ''
        end;
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

grant execute on function public.registrar_ponto(text[], time, double precision, double precision, date, double precision) to authenticated;
