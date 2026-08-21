-- ─────────────────────────────────────────────────────────────────────────────
-- 009_cargos_e_promover_admin.sql
--   1. Amplia os cargos aceitos no cadastro: Orientador, PG, IC, PQ
--   2. Permite que um super admin promova/rebaixe outro usuário a super admin
-- Script idempotente (pode ser rodado múltiplas vezes) e não-destrutivo.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Cargos (coluna profiles.categoria) ────────────────────────────────────
--    O schema.sql original restringia a IC/PG. Trocamos o CHECK pelos 4 cargos.
--    Os valores antigos (IC, PG) continuam válidos, então nenhuma linha quebra.
alter table public.profiles drop constraint if exists profiles_categoria_check;
alter table public.profiles
  add constraint profiles_categoria_check
  check (categoria in ('Orientador', 'PG', 'IC', 'PQ'));

-- ── 2. Promover/rebaixar super admin ─────────────────────────────────────────
--    O RLS (migração 004) já deixa um admin atualizar outros perfis, e o
--    trigger protect_is_admin já libera a troca de is_admin quando quem chama
--    é admin. Ainda assim, centralizamos a ação num RPC security definer para:
--      • deixar a intenção explícita (uma função só para isso);
--      • impedir que um admin remova o PRÓPRIO acesso (evita se trancar de fora);
--      • não depender da ordem de avaliação das policies de UPDATE.
create or replace function public.set_user_admin(p_user_id uuid, p_is_admin boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Apenas super administradores podem alterar privilégios.'
      using errcode = 'insufficient_privilege';
  end if;

  if p_user_id = auth.uid() and p_is_admin = false then
    raise exception 'Você não pode remover o seu próprio acesso de super administrador.'
      using errcode = 'check_violation';
  end if;

  update public.profiles set is_admin = p_is_admin where id = p_user_id;

  if not found then
    raise exception 'Usuário não encontrado.' using errcode = 'no_data_found';
  end if;
end;
$$;

grant execute on function public.set_user_admin(uuid, boolean) to authenticated;
