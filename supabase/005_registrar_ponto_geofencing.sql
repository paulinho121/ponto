-- ─────────────────────────────────────────────────────────────────────────────
-- 005_registrar_ponto_geofencing.sql — Geofencing server-side + bloqueio de backfill
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Função auxiliar de distância (Haversine, em metros) ──────────────────
create or replace function public.distancia_metros(
  lat1 double precision, lon1 double precision,
  lat2 double precision, lon2 double precision
) returns double precision
language sql immutable set search_path = public
as $$
  select 6371000 * 2 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2) +
    cos(radians(lat1)) * cos(radians(lat2)) *
    power(sin(radians(lon2 - lon1) / 2), 2)
  ));
$$;

-- ── 2. RPC registrar_ponto: única via de escrita dos registros de ponto ─────
--    - Só para o próprio usuário autenticado (auth.uid())
--    - Só para hoje (impede backfill/fraude retroativa)
--    - Só preenche colunas ainda vazias (impede alterar horários já batidos)
--    - Geofencing server-side: se houver locais ativos, valida a posição GPS
--      recebida contra o local mais próximo dentro do raio configurado
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
  v_user_id   uuid := auth.uid();
  v_record    public.ponto_registros;
  v_existing  public.ponto_registros;
  v_closest   public.locais_permitidos;
  v_dist      double precision;
  v_action    text;
  v_action_set boolean;
begin
  if v_user_id is null then
    raise exception 'Você precisa estar autenticado.';
  end if;

  if p_actions is null or array_length(p_actions, 1) = 0 then
    raise exception 'Nenhuma ação informada.';
  end if;

  if p_time is null then
    raise exception 'Hora não informada.';
  end if;

  if p_data <> current_date then
    raise exception 'Só é permitido registrar ponto para hoje.';
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

  -- Impede alterar horários já registrados no dia
  select * into v_existing
  from public.ponto_registros
  where user_id = v_user_id and data = p_data;

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
    p_data,
    case when 'entrada' = any(p_actions) then p_time else null end,
    case when 'almoco'   = any(p_actions) then p_time else null end,
    case when 'retorno'  = any(p_actions) then p_time else null end,
    case when 'saida'    = any(p_actions) then p_time else null end
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

-- ── 3. Trava backfill nas chamadas diretas à API (além do RPC) ──────────────
--    Usuário só pode criar/atualizar registros de HOJE via Supabase API.
drop policy if exists "ponto: usuário cria os próprios registros" on public.ponto_registros;
create policy "ponto: usuário cria os próprios registros"
  on public.ponto_registros for insert
  with check (auth.uid() = user_id and data = current_date);

drop policy if exists "ponto: usuário atualiza os próprios registros" on public.ponto_registros;
create policy "ponto: usuário atualiza os próprios registros"
  on public.ponto_registros for update
  using (auth.uid() = user_id and data = current_date);
