-- ─────────────────────────────────────────────────────────────────────────────
-- 007_avatar_url_safety.sql — Trava extra de segurança no avatar (defesa em
-- profundidade: além do sanitize no front, o banco rejeita URLs não-http).
-- Idempotente e não-destrutivo — seguro rodar mais de uma vez.
-- ─────────────────────────────────────────────────────────────────────────────

-- Limpa avatares inválidos que porventura existam (evita falha ao criar a
-- constraint se alguma linha já violar a regra).
update public.profiles
   set avatar_url = null
 where avatar_url is not null
   and avatar_url !~ '^https?://';

-- Só aceita URLs http/https em avatar_url (bloqueia javascript:, data:, etc.)
alter table public.profiles
  drop constraint if exists profiles_avatar_url_http_check;

alter table public.profiles
  add constraint profiles_avatar_url_http_check
  check (avatar_url is null or avatar_url ~ '^https?://');
