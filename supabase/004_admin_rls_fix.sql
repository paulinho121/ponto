-- ─────────────────────────────────────────────────────────────────────────────
-- 004_admin_rls_fix.sql — Correções de admin e Row Level Security
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Função is_admin() security definer para resolver bloqueios/recursões ──
--    Resolve o problema de policies que fazem select from profiles dentro
--    da própria policy, causando loops/recursões

drop function if exists public.is_admin(uuid) cascade;

create function public.is_admin(user_id uuid default auth.uid())
returns boolean
language plpgsql
security definer set search_path = public
stable
as $$
declare
  admin_status boolean;
begin
  select p.is_admin into admin_status
  from public.profiles p
  where p.id = user_id;
  
  return coalesce(admin_status, false);
end;
$$;

-- ── 2. Policies de admin em profiles ─────────────────────────────────────────
--    Permite que admins possam listar e gerenciar usuários

drop policy if exists "profiles: admin lista todos" on public.profiles;
drop policy if exists "profiles: admin atualiza outros" on public.profiles;
drop policy if exists "profiles: admin exclui outros" on public.profiles;

-- Admin pode ler todos os perfis
create policy "profiles: admin lista todos"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

-- Admin pode atualizar perfis de outros usuários
create policy "profiles: admin atualiza outros"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

-- ── 3. Policies de admin em ponto_registros ──────────────────────────────────
--    Permite que admins possam gerenciar registros de ponto

drop policy if exists "ponto: admin lista todos" on public.ponto_registros;
drop policy if exists "ponto: admin atualiza outros" on public.ponto_registros;
drop policy if exists "ponto: admin exclui outros" on public.ponto_registros;

-- Admin pode ler registros de todos os usuários
create policy "ponto: admin lista todos"
  on public.ponto_registros for select
  using (public.is_admin(auth.uid()));

-- Admin pode atualizar registros de outros usuários
create policy "ponto: admin atualiza outros"
  on public.ponto_registros for update
  using (public.is_admin(auth.uid()));

-- Admin pode excluir registros de outros usuários
create policy "ponto: admin exclui outros"
  on public.ponto_registros for delete
  using (public.is_admin(auth.uid()));

-- ── 4. Limitação de INSERT/UPDATE do usuário em ponto_registros ──────────────
--    Restringe que usuários só possam editar registros de hoje e ontem

-- Modifica a política de INSERT para limitar a datas recentes
drop policy if exists "ponto: usuário cria os próprios registros" on public.ponto_registros;
create policy "ponto: usuário cria os próprios registros"
  on public.ponto_registros for insert
  with check (
    auth.uid() = user_id 
    and data >= current_date - interval '1 day'  -- Hoje ou ontem apenas
    and data <= current_date + interval '1 day'  -- Evita datas futuras
  );

-- Modifica a política de UPDATE para limitar a datas recentes
drop policy if exists "ponto: usuário atualiza os próprios registros" on public.ponto_registros;
create policy "ponto: usuário atualiza os próprios registros"
  on public.ponto_registros for update
  using (
    auth.uid() = user_id 
    and data >= current_date - interval '1 day'  -- Hoje ou ontem apenas
    and data <= current_date                     -- Não permite editar datas futuras
  );

-- ── 5. Reescreve policies de locais_permitidos usando is_admin() ────────────

drop policy if exists "locais: admin insere" on public.locais_permitidos;
drop policy if exists "locais: admin atualiza" on public.locais_permitidos;
drop policy if exists "locais: admin exclui" on public.locais_permitidos;

-- Admin pode inserir locais
create policy "locais: admin insere"
  on public.locais_permitidos for insert
  with check (public.is_admin(auth.uid()));

-- Admin pode atualizar locais
create policy "locais: admin atualiza"
  on public.locais_permitidos for update
  using (public.is_admin(auth.uid()));

-- Admin pode excluir locais
create policy "locais: admin exclui"
  on public.locais_permitidos for delete
  using (public.is_admin(auth.uid()));

-- ── 6. Garante que usuários autenticados ainda possam ler locais ────────────

drop policy if exists "locais: usuário autenticado lê" on public.locais_permitidos;
create policy "locais: usuário autenticado lê"
  on public.locais_permitidos for select
  using (auth.uid() is not null);

-- ── 7. Atualiza a função protect_is_admin para evitar conflitos ─────────────

drop function if exists public.protect_is_admin() cascade;

create function public.protect_is_admin()
returns trigger as $$
begin
  -- Impede que usuários não-admins alterem is_admin
  if auth.uid() is not null and not public.is_admin(auth.uid()) then
    if (OLD.is_admin is distinct from NEW.is_admin) then
      NEW.is_admin = OLD.is_admin;
    end if;
  end if;
  return NEW;
end;
$$ language plpgsql security definer set search_path = public;

-- Reconecta o trigger à função atualizada
drop trigger if exists profiles_protect_is_admin on public.profiles;
create trigger profiles_protect_is_admin
  before update on public.profiles
  for each row execute function public.protect_is_admin();

-- ── 8. Concede permissão de execução da função is_admin ─────────────────────

grant execute on function public.is_admin(uuid) to anon, authenticated;