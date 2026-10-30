-- 🎄 Jeux des fêtes (Calendrier de l'Avent, La hotte piratée, Défi du Nouvel An) : joueurs, scores, classements.
-- À exécuter dans Supabase > SQL Editor. Sans danger si tu le relances.
-- Indépendant de migration-halloween.sql.
--
-- Ce que le serveur garantit :
--   - un nom = un seul joueur (et un appareil = un seul joueur) ;
--   - une seule réponse par case du calendrier, 3 tentatives pour la hotte, 1 essai pour le Nouvel An ;
--   - une case ou un jeu ne s'enregistre qu'aux bonnes dates ;
--   - les classements ne montrent que les noms et les points.
--
-- Année suivante : change 2026 dans festive_round_open() (et FESTIVE_YEAR dans src/config/festive.ts).
-- Pour voir les scores : Table Editor > festive_scores (et festive_players pour les noms).

-- 1. Tables
create table if not exists public.festive_players (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  name text not null,
  name_key text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.festive_scores (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.festive_players(id) on delete cascade,
  game text not null check (game in ('avent', 'hotte', 'nouvel_an')),
  round text not null,
  score int not null,
  max_score int not null,
  duration_ms int not null default 0,
  created_at timestamptz not null default now(),
  unique (player_id, game, round)
);
create index if not exists festive_scores_game_idx on public.festive_scores (game);

alter table public.festive_players enable row level security;
alter table public.festive_scores enable row level security;
revoke all on public.festive_players from anon, authenticated;
revoke all on public.festive_scores from anon, authenticated;

-- 2. Outils
create or replace function public.festive_normalize(p text)
returns text
language sql immutable
set search_path = public
as $$
  select trim(regexp_replace(
    translate(lower(coalesce(p, '')),
      'àâäáãåçéèêëíìîïñóòôöõúùûüýÿœæ',
      'aaaaaaceeeeiiiinooooouuuuyyoa'),
    '[^a-z0-9]+', ' ', 'g'));
$$;

-- L'heure du serveur (une fonction à part pour pouvoir la simuler pendant les tests).
create or replace function public.festive_now()
returns timestamptz
language sql stable
as $$ select now(); $$;

-- Une case / un jeu est-il ouvert ? Les dates sont en UTC, avec 3 h d'avance à l'ouverture
-- (fuseaux jusqu'à UTC+3) et 12 h de délai à la fermeture (fuseaux d'Amérique).
create or replace function public.festive_round_open(p_game text, p_round text)
returns boolean
language plpgsql stable
set search_path = public
as $$
declare
  y int := 2026;
  t timestamptz := public.festive_now();
  early interval := interval '3 hours';
  late interval := interval '12 hours';
  day int;
begin
  if p_game = 'avent' then
    if p_round !~ '^d([1-9]|1[0-9]|2[0-4])$' then return false; end if;
    day := substring(p_round from 2)::int;
    return t >= make_timestamptz(y, 12, day, 0, 0, 0, 'UTC') - early
       and t <  make_timestamptz(y, 12, 25, 0, 0, 0, 'UTC') + late;
  elsif p_game = 'hotte' then
    return p_round in ('a1', 'a2', 'a3')
       and t >= make_timestamptz(y, 12, 24, 0, 0, 0, 'UTC') - early
       and t <  make_timestamptz(y, 12, 31, 0, 0, 0, 'UTC') + late;
  elsif p_game = 'nouvel_an' then
    return p_round = 'final'
       and t >= make_timestamptz(y, 12, 31, 0, 0, 0, 'UTC') - early
       and t <  make_timestamptz(y + 1, 1, 7, 0, 0, 0, 'UTC') + late;
  end if;
  return false;
end;
$$;

create or replace function public.festive_max(p_game text)
returns int
language sql immutable
as $$ select case p_game when 'avent' then 1 when 'hotte' then 10 when 'nouvel_an' then 5 else 0 end; $$;

-- 3. Fonctions appelées par le site

-- Inscription (ou reprise sur le même appareil)
create or replace function public.festive_start(p_device text, p_name text)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  v public.festive_players;
  v_name text := trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_key text := public.festive_normalize(p_name);
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then
    raise exception 'device_invalid';
  end if;
  select * into v from public.festive_players where device_id = p_device;
  if found then
    return json_build_object('name', v.name);
  end if;
  if length(v_key) < 2 or length(v_name) > 60 then
    raise exception 'name_invalid';
  end if;
  if exists (select 1 from public.festive_players where name_key = v_key) then
    raise exception 'name_taken';
  end if;
  insert into public.festive_players (device_id, name, name_key) values (p_device, v_name, v_key) returning * into v;
  return json_build_object('name', v.name);
end;
$$;

-- Enregistrer un résultat (une seule fois par case / tentative)
create or replace function public.festive_submit(p_device text, p_game text, p_round text, p_score int, p_duration_ms int)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  v public.festive_players;
  v_max int := public.festive_max(p_game);
begin
  select * into v from public.festive_players where device_id = p_device;
  if not found then raise exception 'unknown_player'; end if;
  if v_max = 0 or p_score is null or p_score < 0 or p_score > v_max then raise exception 'invalid'; end if;
  if not public.festive_round_open(p_game, p_round) then raise exception 'closed'; end if;
  if p_game = 'hotte' and p_round <> 'a1'
     and not exists (select 1 from public.festive_scores
                     where player_id = v.id and game = 'hotte'
                       and round = 'a' || (substring(p_round from 2)::int - 1)) then
    raise exception 'invalid';
  end if;
  begin
    insert into public.festive_scores (player_id, game, round, score, max_score, duration_ms)
    values (v.id, p_game, p_round, p_score, v_max, greatest(0, least(coalesce(p_duration_ms, 0), 86400000)));
  exception when unique_violation then
    raise exception 'already_played';
  end;
  return json_build_object('ok', true);
end;
$$;

-- Mes résultats (pour retrouver sa progression sur un autre affichage)
create or replace function public.festive_mine(p_device text)
returns json
language sql stable security definer
set search_path = public
as $$
  select coalesce(json_agg(json_build_object('game', s.game, 'round', s.round, 'score', s.score, 'max', s.max_score) order by s.created_at), '[]'::json)
  from public.festive_scores s
  join public.festive_players p on p.id = s.player_id
  where p.device_id = p_device;
$$;

-- Classement d'un jeu (noms et points uniquement)
create or replace function public.festive_leaderboard(p_game text)
returns json
language sql stable security definer
set search_path = public
as $$
  with per_player as (
    select p.name,
           case when p_game = 'avent' then sum(s.score) else max(s.score) end as points,
           case when p_game = 'avent' then sum(s.duration_ms)
                else (array_agg(s.duration_ms order by s.score desc, s.duration_ms asc))[1] end as time_ms,
           count(*) as played,
           min(s.created_at) as first_at
    from public.festive_scores s
    join public.festive_players p on p.id = s.player_id
    where s.game = p_game
    group by p.id, p.name
  )
  select coalesce(json_agg(json_build_object('name', name, 'points', points, 'time_ms', time_ms, 'played', played)
                           order by points desc, time_ms asc, first_at asc), '[]'::json)
  from (select * from per_player order by points desc, time_ms asc, first_at asc limit 50) top;
$$;

revoke execute on function public.festive_round_open(text, text) from public, anon, authenticated;
grant execute on function public.festive_start(text, text) to anon, authenticated;
grant execute on function public.festive_submit(text, text, text, int, int) to anon, authenticated;
grant execute on function public.festive_mine(text) to anon, authenticated;
grant execute on function public.festive_leaderboard(text) to anon, authenticated;
