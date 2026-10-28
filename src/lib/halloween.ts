import { supabase } from "@/lib/supabase";

/* ------------------------------------------------------------------
   HALLOWEEN CODE MYSTERY — appels au serveur (Supabase)
   Fonctions SQL : supabase/migration-halloween.sql
   Si Supabase n'est pas configuré ou si la migration n'a pas encore
   été exécutée, on renvoie "offline" : le jeu continue en local et
   l'épreuve ultime affiche « bientôt disponible ».
------------------------------------------------------------------ */

export type HalloweenServerState = {
  name: string;
  attempts: number;
  max: number;
  passed: boolean;
  fragment: number | null;
  word: string | null;
  total: number;
  claimed: boolean;
  claim_tries_left: number;
};

export type ClaimResult = { ok: true; url: string | null } | { ok: false; tries_left: number };

export type ServerReply<T> = { ok: true; data: T } | { ok: false; reason: string };

const DEVICE_KEY = "cvc/halloween-device";

/** Identifiant aléatoire de cet appareil (un appareil = un participant). */
export function deviceId() {
  try {
    let id = window.localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
      window.localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return `volatile-${Math.random().toString(36).slice(2, 12)}`;
  }
}

async function call<T>(fn: string, args: Record<string, unknown>): Promise<ServerReply<T>> {
  if (!supabase) return { ok: false, reason: "offline" };
  try {
    const { data, error } = await supabase.rpc(fn, args);
    if (error) {
      // Fonction absente = migration pas encore exécutée
      const missing = error.code === "PGRST202" || /could not find the function/i.test(error.message);
      if (missing) return { ok: false, reason: "offline" };
      const known = ["name_taken", "name_invalid", "no_attempts_left", "not_passed", "no_claims_left", "unknown_player"];
      return { ok: false, reason: known.find((k) => error.message.includes(k)) ?? "error" };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export function startPlayer(name: string) {
  return call<HalloweenServerState>("halloween_start", { p_device: deviceId(), p_name: name });
}

export function finishAttempt(score: number) {
  return call<HalloweenServerState>("halloween_finish", { p_device: deviceId(), p_score: score });
}

export function claimTreasure(phrase: string) {
  return call<ClaimResult>("halloween_claim", { p_device: deviceId(), p_phrase: phrase });
}
