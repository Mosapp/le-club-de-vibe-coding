-- Galerie + photographes. À exécuter UNE fois dans Supabase > SQL Editor.
-- Sans danger si tu le relances : tout est "if not exists" / "drop policy if exists".
-- Prérequis : la fonction public.is_admin() de schema.sql doit déjà exister.

-- 1. Qui est photographe
create table if not exists public.photographers (
  member_id uuid primary key references public.members(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2. Les photos
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  caption text not null default '',
  tag text not null default 'Projet',
  path text not null,
  thumb_path text not null,
  width int not null default 4,
  height int not null default 3,
  author_id uuid not null references public.members(id) on delete cascade,
  author_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists gallery_photos_created_idx on public.gallery_photos (created_at desc);

-- 3. "Puis-je publier ?" : photographe ou admin
create or replace function public.is_photographer()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(public.is_admin(), false)
      or exists (select 1 from public.photographers where member_id = auth.uid());
$$;
grant execute on function public.is_photographer() to anon, authenticated;

-- 4. Règles d'accès
alter table public.photographers enable row level security;
alter table public.gallery_photos enable row level security;

drop policy if exists "read photographers" on public.photographers;
drop policy if exists "admins add photographers" on public.photographers;
drop policy if exists "admins remove photographers" on public.photographers;
create policy "read photographers" on public.photographers for select to authenticated using (true);
create policy "admins add photographers" on public.photographers for insert to authenticated with check (public.is_admin());
create policy "admins remove photographers" on public.photographers for delete to authenticated using (public.is_admin());

drop policy if exists "anyone reads gallery" on public.gallery_photos;
drop policy if exists "photographers publish" on public.gallery_photos;
drop policy if exists "owners or admins delete photos" on public.gallery_photos;
create policy "anyone reads gallery" on public.gallery_photos for select to anon, authenticated using (true);
create policy "photographers publish" on public.gallery_photos for insert to authenticated
  with check (author_id = auth.uid() and public.is_photographer());
create policy "owners or admins delete photos" on public.gallery_photos for delete to authenticated
  using (author_id = auth.uid() or public.is_admin());

-- 5. Stockage des images (bucket public en lecture)
insert into storage.buckets (id, name, public) values ('gallery', 'gallery', true)
on conflict (id) do update set public = true;

drop policy if exists "photographers upload gallery" on storage.objects;
drop policy if exists "owners or admins delete gallery files" on storage.objects;
create policy "photographers upload gallery" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and public.is_photographer() and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owners or admins delete gallery files" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 6. Mise à jour en direct de la galerie
do $$
begin
  alter publication supabase_realtime add table public.gallery_photos;
exception when duplicate_object then null;
end $$;
