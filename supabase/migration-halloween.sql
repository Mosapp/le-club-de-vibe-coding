-- 🎃 Halloween Code Mystery : participants, fragments de la phrase secrète et trésor.
-- À exécuter dans Supabase > SQL Editor (et à RELANCER après chaque mise à jour de ce fichier).
-- Sans danger si tu le relances : tout est "if not exists" / "create or replace",
-- et le lien du trésor déjà enregistré n'est pas écrasé.
--
-- AVANT D'EXÉCUTER : remplace COLLE_ICI_LE_LIEN_CLAUDE_CODE (tout en bas, étape 6)
-- par le vrai lien du trésor. Tu peux aussi le changer plus tard avec :
--   update public.halloween_secret set treasure_url = 'https://…' where id = 1;
--
-- Ce que le serveur garantit :
--   - un nom = une seule participation (et un appareil = un seul participant) ;
--   - 10 tentatives maximum, comptées ici et pas dans le navigateur ;
--   - chaque détective qui atteint 5/10 reçoit UN mot de la phrase (n°1, 2, … 10, puis on recommence) ;
--   - le lien du trésor n'est jamais envoyé au site, sauf à un détective qui donne la phrase complète.
--
-- Pour voir les participants (classement, qui a trouvé le trésor) :
--   Table Editor > halloween_players, triée par passed_at ou claimed_at.

-- 1. Les participants
create table if not exists public.halloween_players (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  name text not null,
  name_key text not null unique,
  attempts int not null default 0,
  best_score int not null default 0,
  passed_at timestamptz,
  fragment int,
  claim_tries int not null default 0,
  claimed_at timestamptz,
  created_at timestamptz not null default now()
);

-- 2. Le secret : phrase de 10 mots + lien du trésor (une seule ligne)
create table if not exists public.halloween_secret (
  id int primary key default 1 check (id = 1),
  words text[] not null,
  treasure_url text not null
);

-- 3. Personne ne lit ces tables directement : tout passe par les fonctions ci-dessous
alter table public.halloween_players enable row level security;
alter table public.halloween_secret enable row level security;
revoke all on public.halloween_players from anon, authenticated;
revoke all on public.halloween_secret from anon, authenticated;

-- 4. Outils
create or replace function public.halloween_normalize(p text)
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

create or replace function public.halloween_state(v public.halloween_players)
returns json
language sql stable security definer
set search_path = public
as $$
  select json_build_object(
    'name', v.name,
    'attempts', v.attempts,
    'max', 10,
    'passed', v.passed_at is not null,
    'fragment', v.fragment,
    'word', case when v.passed_at is not null and v.fragment is not null
                 then (select s.words[v.fragment] from public.halloween_secret s where s.id = 1) end,
    'total', (select coalesce(array_length(s.words, 1), 10) from public.halloween_secret s where s.id = 1),
    'claimed', v.claimed_at is not null,
    'claim_tries_left', greatest(0, 10 - v.claim_tries)
  );
$$;
revoke execute on function public.halloween_state(public.halloween_players) from public, anon, authenticated;

-- 5. Les fonctions appelées par le site

-- Inscription (ou reprise sur le même appareil)
create or replace function public.halloween_start(p_device text, p_name text)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  v public.halloween_players;
  v_name text := trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'));
  v_key text := public.halloween_normalize(p_name);
begin
  if p_device is null or length(p_device) < 8 or length(p_device) > 64 then
    raise exception 'device_invalid';
  end if;

  select * into v from public.halloween_players where device_id = p_device;
  if found then
    return public.halloween_state(v);
  end if;

  if length(v_key) < 2 or length(v_name) > 60 then
    raise exception 'name_invalid';
  end if;
  if exists (select 1 from public.halloween_players where name_key = v_key) then
    raise exception 'name_taken';
  end if;

  insert into public.halloween_players (device_id, name, name_key)
  values (p_device, v_name, v_key)
  returning * into v;
  return public.halloween_state(v);
end;
$$;

-- Fin d'une tentative : le serveur compte les tentatives et distribue les fragments
create or replace function public.halloween_finish(p_device text, p_score int)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  v public.halloween_players;
  v_score int := least(10, greatest(0, coalesce(p_score, 0)));
  v_total int;
begin
  select * into v from public.halloween_players where device_id = p_device for update;
  if not found then
    raise exception 'unknown_player';
  end if;
  if v.passed_at is not null then
    return public.halloween_state(v);
  end if;
  if v.attempts >= 10 then
    raise exception 'no_attempts_left';
  end if;

  if v_score >= 5 then
    -- un seul détective à la fois reçoit son numéro de fragment
    perform pg_advisory_xact_lock(31102026);
    select coalesce(array_length(words, 1), 10) into v_total from public.halloween_secret where id = 1;
    update public.halloween_players
       set attempts = attempts + 1,
           best_score = greatest(best_score, v_score),
           passed_at = now(),
           fragment = (select count(*) from public.halloween_players where passed_at is not null) % coalesce(v_total, 10) + 1
     where id = v.id
     returning * into v;
  else
    update public.halloween_players
       set attempts = attempts + 1,
           best_score = greatest(best_score, v_score)
     where id = v.id
     returning * into v;
  end if;
  return public.halloween_state(v);
end;
$$;

-- Épreuve ultime : la phrase complète contre le lien du trésor
create or replace function public.halloween_claim(p_device text, p_phrase text)
returns json
language plpgsql security definer
set search_path = public
as $$
declare
  v public.halloween_players;
  s public.halloween_secret;
begin
  select * into v from public.halloween_players where device_id = p_device for update;
  if not found or v.passed_at is null then
    raise exception 'not_passed';
  end if;
  select * into s from public.halloween_secret where id = 1;

  if v.claimed_at is null then
    if v.claim_tries >= 10 then
      raise exception 'no_claims_left';
    end if;
    if public.halloween_normalize(p_phrase) <> public.halloween_normalize(array_to_string(s.words, ' ')) then
      update public.halloween_players set claim_tries = claim_tries + 1 where id = v.id;
      return json_build_object('ok', false, 'tries_left', greatest(0, 9 - v.claim_tries));
    end if;
    update public.halloween_players set claimed_at = now() where id = v.id;
  end if;

  return json_build_object(
    'ok', true,
    'url', case when s.treasure_url like 'COLLE_ICI%' then null else s.treasure_url end
  );
end;
$$;

grant execute on function public.halloween_start(text, text) to anon, authenticated;
grant execute on function public.halloween_finish(text, int) to anon, authenticated;
grant execute on function public.halloween_claim(text, text) to anon, authenticated;

-- 6. La phrase secrète (10 mots) et le trésor
insert into public.halloween_secret (id, words, treasure_url)
values (
  1,
  array['Seuls', 'ensemble', 'les', 'détectives', 'brisent', 'le', 'sort', 'du', 'code', 'maudit'],
  'COLLE_ICI_LE_LIEN_CLAUDE_CODE'
)
on conflict (id) do nothing;
