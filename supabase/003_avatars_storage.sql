-- Ponto Qfam — Migração: bucket de fotos de perfil (avatares)
-- Rode isto no Supabase Dashboard → SQL Editor.
--
-- Não-destrutivo e idempotente — seguro rodar mesmo com dados reais já no
-- banco, e pode ser executado mais de uma vez sem problema.
--
-- Bucket público: a leitura da foto é liberada para qualquer um com o link
-- (padrão do Supabase para avatares), mas o caminho do arquivo inclui o uuid
-- do usuário e só o próprio dono pode enviar/substituir/excluir a sua foto.
-- Os demais dados do perfil continuam protegidos pelas políticas da tabela
-- profiles (RLS), que não são afetadas por esta migração.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists "avatars: leitura pública" on storage.objects;
create policy "avatars: leitura pública"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "avatars: usuário envia a própria foto" on storage.objects;
create policy "avatars: usuário envia a própria foto"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: usuário atualiza a própria foto" on storage.objects;
create policy "avatars: usuário atualiza a própria foto"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars: usuário exclui a própria foto" on storage.objects;
create policy "avatars: usuário exclui a própria foto"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
