-- Chronos — Schema do Supabase
-- Rode este arquivo inteiro em: Supabase Dashboard → SQL Editor → New query
-- Script idempotente: pode ser rodado várias vezes sem erro (reseta o schema antes de recriar).

-- ─────────────────────────────────────────────────────────────────────────
-- 0. Reset (remove versões anteriores, se existirem)
-- ─────────────────────────────────────────────────────────────────────────
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.ponto_registros cascade;
drop table if exists public.profiles cascade;
drop function if exists public.set_updated_at() cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.email_by_matricula(text) cascade;

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
