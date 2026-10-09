create extension if not exists "pgcrypto";

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('session', 'défi', 'règle', 'autre')),
  author_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'proposée' check (status in ('proposée', 'en discussion', 'retenue', 'refusée')),
  created_at timestamptz not null default now()
);

create table if not exists public.idea_votes (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  member_id uuid not null references public.members(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (idea_id, member_id)
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null default 'NEW_IDEA',
  title text not null,
  description text not null default '',
  idea_id uuid references public.ideas(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.notifications enable row level security;

drop policy if exists "members read ideas" on public.ideas;
drop policy if exists "members create ideas" on public.ideas;
drop policy if exists "admins update ideas" on public.ideas;
drop policy if exists "admins delete ideas" on public.ideas;
create policy "members read ideas" on public.ideas for select to authenticated using (true);
create policy "members create ideas" on public.ideas for insert to authenticated with check (author_id = auth.uid());
create policy "admins update ideas" on public.ideas for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete ideas" on public.ideas for delete to authenticated using (public.is_admin());

drop policy if exists "members read votes" on public.idea_votes;
drop policy if exists "members vote once" on public.idea_votes;
create policy "members read votes" on public.idea_votes for select to authenticated using (true);
create policy "members vote once" on public.idea_votes for insert to authenticated with check (member_id = auth.uid());

drop policy if exists "members read notifications" on public.notifications;
create policy "members read notifications" on public.notifications for select to authenticated using (true);

create or replace function public.notify_new_idea()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.notifications (title, description, idea_id)
  values ('Nouvelle proposition dans la communauté.', NEW.title, NEW.id);
  return NEW;
end;
$$;

drop trigger if exists on_new_idea on public.ideas;
create trigger on_new_idea after insert on public.ideas for each row execute function public.notify_new_idea();

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'projects') then
    alter publication supabase_realtime add table public.projects;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ideas') then
    alter publication supabase_realtime add table public.ideas;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'idea_votes') then
    alter publication supabase_realtime add table public.idea_votes;
  end if;
end
$$;
