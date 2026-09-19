create extension if not exists "pgcrypto";

create table if not exists public.members (
  id uuid primary key references auth.users(id) on delete cascade,
  first_name text not null,
  last_name text not null,
  avatar_url text,
  level text not null default '',
  motivations text[] not null default '{}',
  goal text not null default '',
  engagement text not null default '',
  role text not null default 'MEMBER' check (role in ('MEMBER', 'ADMIN')),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED')),
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  category text not null check (category in ('session', 'défi', 'règle', 'autre')),
  author_id uuid not null references public.members(id) on delete cascade,
  status text not null default 'proposée' check (status in ('proposée', 'en discussion', 'retenue', 'refusée')),
  created_at timestamptz not null default now()
);

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

alter table public.members enable row level security;
alter table public.ideas enable row level security;
alter table public.idea_votes enable row level security;
alter table public.notifications enable row level security;
alter table public.projects enable row level security;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.members where id = auth.uid() and role = 'ADMIN' and status = 'ACTIVE') $$;

create policy "members can read active members" on public.members for select to authenticated using (status = 'ACTIVE' or id = auth.uid() or public.is_admin());
create policy "members update own profile" on public.members for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "members insert own profile" on public.members for insert to authenticated with check (id = auth.uid());

create policy "members read ideas" on public.ideas for select to authenticated using (true);
create policy "members create ideas" on public.ideas for insert to authenticated with check (author_id = auth.uid());
create policy "admins update ideas" on public.ideas for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete ideas" on public.ideas for delete to authenticated using (public.is_admin());

create policy "members read published projects" on public.projects for select to authenticated using (published or author_id = auth.uid() or public.is_admin());
create policy "members create own projects" on public.projects for insert to authenticated with check (author_id = auth.uid());
create policy "owners update projects" on public.projects for update to authenticated using (author_id = auth.uid() or public.is_admin()) with check (author_id = auth.uid() or public.is_admin());
create policy "owners delete projects" on public.projects for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "members read votes" on public.idea_votes for select to authenticated using (true);
create policy "members vote once" on public.idea_votes for insert to authenticated with check (member_id = auth.uid());

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

alter publication supabase_realtime add table public.ideas;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.projects;
