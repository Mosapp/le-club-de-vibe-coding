import { useEffect, useState } from "react";

/* ------------------------------------------------------------------
   FÊTES DE FIN D'ANNÉE — dates (heure de l'appareil du visiteur)
   Tout s'affiche et disparaît automatiquement entre ces dates.
   Pour l'année suivante : changer YEAR ici ET dans
   supabase/migration-fetes.sql (fonction festive_round_open).

   Aperçu avant l'heure : ouvrir le site avec #/fetes?apercu=2026-12-05
   (ou n'importe quelle date) pour voir les fêtes comme ce jour-là.
   En aperçu, rien n'est enregistré sur le serveur.
------------------------------------------------------------------ */

export const FESTIVE_YEAR = 2026;
const Y = FESTIVE_YEAR;

/** Mois JS : 11 = décembre, 0 = janvier. */
const d = (year: number, month: number, day: number) => new Date(year, month, day, 0, 0, 0).getTime();

export const FESTIVE_WINDOWS = {
  /** Neige sur tout le site */
  snow: { from: d(Y, 11, 1), to: d(Y + 1, 0, 7) },
  /** Père Noël 3D */
  santa: { from: d(Y, 11, 1), to: d(Y, 11, 27) },
  /** Calendrier de l'Avent : une case par jour du 1er au 24 ; rattrapage possible jusqu'au 25 à 00:00 */
  avent: { from: d(Y, 11, 1), to: d(Y, 11, 25) },
  /** La hotte piratée */
  hotte: { from: d(Y, 11, 24), to: d(Y, 11, 31) },
  /** Défi du Nouvel An (compte à rebours jusqu'au 1er janvier 00:00) */
  nouvelAn: { from: d(Y, 11, 31), to: d(Y + 1, 0, 7) },
  /** Toute la période des fêtes (bouton « Jeux des fêtes », page /fetes) */
  all: { from: d(Y, 11, 1), to: d(Y + 1, 0, 7) },
} as const;

export const NEW_YEAR = d(Y + 1, 0, 1);

export type FestiveWindow = { from: number; to: number };

/** Date d'aperçu passée dans l'adresse (#/fetes?apercu=AAAA-MM-JJ), sinon null. */
export function previewDate(): number | null {
  try {
    const raw = window.location.hash.split("?")[1] ?? "";
    const v = new URLSearchParams(raw).get("apercu");
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) {
      const [yy, mm, dd] = v.split("-").map(Number);
      // midi : évite les surprises de fuseau horaire
      return new Date(yy, mm - 1, dd, 12, 0, 0).getTime();
    }
    const stored = window.sessionStorage.getItem("cvc/fetes-apercu");
    return stored ? Number(stored) : null;
  } catch {
    return null;
  }
}

/** Mémorise l'aperçu pour la session (pour que la neige reste en naviguant). */
export function rememberPreview() {
  const p = previewDate();
  try {
    if (p) window.sessionStorage.setItem("cvc/fetes-apercu", String(p));
  } catch {
    /* rien */
  }
}

/** Re-render quand l'adresse change (ex. ajout de ?apercu=… sans recharger la page). */
export function useHashTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const on = () => setTick((t) => t + 1);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
}

export function festiveNow() {
  return previewDate() ?? Date.now();
}

export function isOpen(w: FestiveWindow, now = festiveNow()) {
  return now >= w.from && now < w.to;
}

/** Jour de décembre (1 à 31) dans l'année des fêtes, ou 0 avant décembre, 32 après. */
export function decemberDay(now = festiveNow()) {
  const date = new Date(now);
  if (date.getFullYear() < Y || (date.getFullYear() === Y && date.getMonth() < 11)) return 0;
  if (date.getFullYear() > Y) return 32;
  return date.getDate();
}
