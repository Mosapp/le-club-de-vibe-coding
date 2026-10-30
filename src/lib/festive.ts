import { supabase } from "@/lib/supabase";
import { deviceId } from "@/lib/halloween";

/* ------------------------------------------------------------------
   JEUX DES FÊTES — appels au serveur (Supabase)
   Fonctions SQL : supabase/migration-fetes.sql
   Sans Supabase (ou migration pas encore exécutée) : on renvoie
   "offline" et les jeux fonctionnent en local, sans classement.
------------------------------------------------------------------ */

export type FestiveGame = "avent" | "hotte" | "nouvel_an";
export type FestiveResult = { game: FestiveGame; round: string; score: number; max: number };
export type LeaderRow = { name: string; points: number; time_ms: number; played: number };
export type Reply<T> = { ok: true; data: T } | { ok: false; reason: string };

async function call<T>(fn: string, args: Record<string, unknown>): Promise<Reply<T>> {
  if (!supabase) return { ok: false, reason: "offline" };
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) {
      const missing = error.code === "PGRST202" || /could not find the function/i.test(error.message);
      if (missing) return { ok: false, reason: "offline" };
      const known = ["name_taken", "name_invalid", "unknown_player", "closed", "already_played", "invalid"];
      return { ok: false, reason: known.find((k) => error.message.includes(k)) ?? "error" };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export const festiveStart = (name: string) => call<{ name: string }>("festive_start", { p_device: deviceId(), p_name: name });

export const festiveSubmit = (game: FestiveGame, round: string, score: number, durationMs: number) =>
  call<{ ok: true }>("festive_submit", { p_device: deviceId(), p_game: game, p_round: round, p_score: score, p_duration_ms: Math.round(durationMs) });

export const festiveMine = () => call<FestiveResult[]>("festive_mine", { p_device: deviceId() });

export const festiveLeaderboard = (game: FestiveGame) => call<LeaderRow[]>("festive_leaderboard", { p_game: game });

/* --------------------------- Mémoire locale --------------------------- */

const KEY = "cvc/fetes/v1";

export type FestiveLocal = {
  name?: string;
  /** résultats déjà joués, clé `${game}:${round}` */
  results: Record<string, { score: number; max: number }>;
};

export function loadLocal(): FestiveLocal {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<FestiveLocal>;
      return { ...parsed, results: parsed.results ?? {} };
    }
  } catch {
    /* rien */
  }
  return { results: {} };
}

export function saveLocal(v: FestiveLocal) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(v));
  } catch {
    /* navigation privée */
  }
}

/** Graine stable pour un joueur + une manche (même appareil = mêmes questions). */
export function roundSeed(game: string, round: string) {
  const text = `${deviceId()}|${game}|${round}`;
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
