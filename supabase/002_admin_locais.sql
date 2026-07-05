-- Chronos — Migração incremental: super admins + locais permitidos
-- Rode isto no Supabase Dashboard → SQL Editor.
--
-- ⚠️ Diferente do schema.sql inicial, este arquivo é NÃO-DESTRUTIVO:
-- ele não derruba tabelas existentes, então é seguro rodar mesmo com
-- usuários e registros de ponto reais já no banco. Pode ser executado
-- mais de uma vez sem problema (idempotente).

-- ─────────────────────────────────────────────────────────────────────────
-- 1. Papel de super admin
-- ─────────────────────────────────────────────────────────────────────────
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Trava de segurança: impede que o próprio usuário (via API/cliente) se
-- promova a admin alterando o próprio perfil. Atualizações feitas fora da
-- API (SQL Editor / service role, onde auth.uid() é nulo) continuam livres —
-- é assim que você promove o primeiro admin manualmente.
create or replace function public.protect_is_admin()
returns trigger as $$
begin
  if auth.uid() is not null then
    new.is_admin = old.is_admin;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists profiles_protect_is_admin on public.profiles;
create trigger profiles_protect_is_admin
  before update on public.profiles
  for each row execute function public.protect_is_admin();

-- ─────────────────────────────────────────────────────────────────────────
-- 2. Locais permitidos para bater o ponto
-- ─────────────────────────────────────────────────────────────────────────
create table if not exists public.locais_permitidos (
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

-- Qualquer pesquisador logado pode ler os locais (necessário para validar
-- a própria localização antes de bater o ponto). Só admins podem escrever.
drop policy if exists "locais: usuário autenticado lê" on public.locais_permitidos;
create policy "locais: usuário autenticado lê"
  on public.locais_permitidos for select
  using (auth.uid() is not null);

drop policy if exists "locais: admin insere" on public.locais_permitidos;
create policy "locais: admin insere"
  on public.locais_permitidos for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists "locais: admin atualiza" on public.locais_permitidos;
create policy "locais: admin atualiza"
  on public.locais_permitidos for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop policy if exists "locais: admin exclui" on public.locais_permitidos;
create policy "locais: admin exclui"
  on public.locais_permitidos for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

drop trigger if exists locais_permitidos_set_updated_at on public.locais_permitidos;
create trigger locais_permitidos_set_updated_at
  before update on public.locais_permitidos
  for each row execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- 3. Promova seu primeiro super admin (rode manualmente, ajustando a matrícula)
-- ─────────────────────────────────────────────────────────────────────────
-- update public.profiles set is_admin = true where matricula = 'SUA_MATRICULA';
