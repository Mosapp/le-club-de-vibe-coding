create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  kind text not null check (kind in ('web', 'mobile', 'ia', 'autres')),
  tech text[] not null default '{}',
  media_slot text,
  image_url text,
  link text,
  author_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  published boolean not null default true
);

alter table public.projects enable row level security;

drop policy if exists "members read published projects" on public.projects;
drop policy if exists "members create own projects" on public.projects;
drop policy if exists "owners update projects" on public.projects;
drop policy if exists "owners delete projects" on public.projects;

create policy "members read published projects" on public.projects for select to authenticated using (published or author_id = auth.uid() or public.is_admin());
create policy "members create own projects" on public.projects for insert to authenticated with check (author_id = auth.uid());
create policy "owners update projects" on public.projects for update to authenticated using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "owners delete projects" on public.projects for delete to authenticated using (author_id = auth.uid() or public.is_admin());

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects'
  ) then
    alter publication supabase_realtime add table public.projects;
  end if;
end
$$;
