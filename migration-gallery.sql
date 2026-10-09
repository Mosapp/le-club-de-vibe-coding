-- ==================================================================
-- GALERIE PHOTO — migration ADDITIVE.
-- Ne modifie aucune table existante (members, projects, ideas…).
-- À coller dans Supabase > SQL Editor, puis "Run". Peut être relancée sans risque.
-- ==================================================================

-- 1) Qui est photographe ? (géré uniquement par les admins)
create table if not exists public.photographers (
  member_id uuid primary key references public.members(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- 2) Les photos publiées
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  caption text not null default '',
  tag text not null default 'Projet',
  path text not null,
  thumb_path text not null,
  width integer not null default 0,
  height integer not null default 0,
  author_id uuid not null references public.members(id) on delete cascade,
  author_name text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists gallery_photos_created_idx on public.gallery_photos (created_at desc);

alter table public.photographers enable row level security;
alter table public.gallery_photos enable row level security;

-- 3) Fonction : photographe ou admin actif
create or replace function public.is_photographer()
returns boolean language sql stable security definer set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.photographers p
    join public.members m on m.id = p.member_id
    where p.member_id = auth.uid() and m.status = 'ACTIVE'
  )
$$;

-- 4) Règles d'accès aux tables
drop policy if exists "photographers read" on public.photographers;
drop policy if exists "photographers admin insert" on public.photographers;
drop policy if exists "photographers admin delete" on public.photographers;
create policy "photographers read" on public.photographers for select to authenticated using (member_id = auth.uid() or public.is_admin());
create policy "photographers admin insert" on public.photographers for insert to authenticated with check (public.is_admin());
create policy "photographers admin delete" on public.photographers for delete to authenticated using (public.is_admin());

drop policy if exists "gallery public read" on public.gallery_photos;
drop policy if exists "gallery photographers insert" on public.gallery_photos;
drop policy if exists "gallery owner or admin delete" on public.gallery_photos;
create policy "gallery public read" on public.gallery_photos for select to anon, authenticated using (true);
create policy "gallery photographers insert" on public.gallery_photos for insert to authenticated with check (author_id = auth.uid() and public.is_photographer());
create policy "gallery owner or admin delete" on public.gallery_photos for delete to authenticated using (author_id = auth.uid() or public.is_admin());

-- 5) Stockage des fichiers (bucket public en lecture, écriture réservée)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('gallery', 'gallery', true, 8388608, array['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

drop policy if exists "gallery upload by photographers" on storage.objects;
drop policy if exists "gallery delete own or admin" on storage.objects;
create policy "gallery upload by photographers" on storage.objects for insert to authenticated
  with check (bucket_id = 'gallery' and (storage.foldername(name))[1] = auth.uid()::text and public.is_photographer());
create policy "gallery delete own or admin" on storage.objects for delete to authenticated
  using (bucket_id = 'gallery' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- 6) Temps réel : une nouvelle photo apparaît chez tout le monde sans recharger
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gallery_photos') then
    alter publication supabase_realtime add table public.gallery_photos;
  end if;
end
$$;
