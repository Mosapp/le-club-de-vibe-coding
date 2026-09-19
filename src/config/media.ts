/* ------------------------------------------------------------------
   SYSTÈME DE MÉDIAS — CLUB DE VIBE CODING
   ------------------------------------------------------------------
   Toutes les images / vidéos du site passent par ce fichier.

   POUR CHANGER UN MÉDIA :
   1. Dépose ton fichier dans  src/media/<dossier>/
      (ou utilise une URL externe / un chemin /media/... si tu sers
       un dossier public).
   2. Change uniquement la valeur `src` (ou `video`) ci-dessous.

   Aucun composant React n'a besoin d'être modifié.
   Si `src` vaut null → un placeholder élégant s'affiche.

   Voir MEDIA_GUIDE.md pour les dimensions recommandées.
------------------------------------------------------------------ */

import heroImg from "@/media/hero/hero.jpg";
import vibeImg from "@/media/vibe/vibe-explainer.jpg";
import community01 from "@/media/community/community-01.jpg";
import community02 from "@/media/community/community-02.jpg";
import community03 from "@/media/community/community-03.jpg";
import project01 from "@/media/projects/project-01.jpg";
import project02 from "@/media/projects/project-02.jpg";
import project03 from "@/media/projects/project-03.jpg";
import session01 from "@/media/sessions/session-01.jpg";
import challenge01 from "@/media/challenges/challenge-01.jpg";

export type MediaRatio = "4/5" | "3/4" | "1/1" | "4/3" | "16/10" | "16/9" | "3/2";

export interface MediaAsset {
  /** Identifiant stable utilisé dans l'interface (ne pas renommer) */
  id: string;
  /** Nom de l'emplacement, ex. HERO_MEDIA */
  slot: string;
  /** Libellé lisible affiché dans la Media Library */
  label: string;
  /** Image (import local, chemin /media/... ou URL https) */
  src: string | null;
  /** Vidéo optionnelle (mp4 / webm). Si défini, elle remplace l'image */
  video?: string | null;
  /** Image de couverture de la vidéo */
  poster?: string | null;
  /** Texte alternatif obligatoire */
  alt: string;
  ratio: MediaRatio;
  /** Section du site où le média est utilisé */
  section: "hero" | "vibe" | "community" | "projects" | "sessions" | "challenges" | "global";
}

export const MEDIA: Record<string, MediaAsset> = {
  HERO_MEDIA: {
    id: "HERO_MEDIA",
    slot: "HERO_MEDIA",
    label: "Hero — visuel principal",
    src: heroImg,
    video: null, // ex: "/media/hero/hero-video.mp4"
    poster: null, // ex: "/media/hero/hero-poster.webp"
    alt: "Une membre du club prototype une interface sur son ordinateur portable, dans un studio lumineux.",
    ratio: "4/5",
    section: "hero",
  },
  VIBE_CODING_MEDIA: {
    id: "VIBE_CODING_MEDIA",
    slot: "VIBE_CODING_MEDIA",
    label: "C'est quoi le Vibe Coding — visuel / vidéo",
    src: vibeImg,
    video: null,
    poster: null,
    alt: "Un ordinateur portable, un croquis d'interface papier et des post-its : une idée en train de devenir un projet.",
    ratio: "4/3",
    section: "vibe",
  },
  COMMUNITY_MEDIA_01: {
    id: "COMMUNITY_MEDIA_01",
    slot: "COMMUNITY_MEDIA_01",
    label: "Communauté — grand visuel",
    src: community01,
    video: null,
    poster: null,
    alt: "Quatre membres du club échangent autour d'une table, ordinateurs ouverts et croquis papier posés devant eux.",
    ratio: "16/10",
    section: "community",
  },
  COMMUNITY_MEDIA_02: {
    id: "COMMUNITY_MEDIA_02",
    slot: "COMMUNITY_MEDIA_02",
    label: "Communauté — visuel secondaire",
    src: community02,
    video: null,
    poster: null,
    alt: "Deux membres font du pair programming devant un écran.",
    ratio: "4/3",
    section: "community",
  },
  COMMUNITY_MEDIA_03: {
    id: "COMMUNITY_MEDIA_03",
    slot: "COMMUNITY_MEDIA_03",
    label: "Communauté — portrait",
    src: community03,
    video: null,
    poster: null,
    alt: "Un membre du club, ordinateur portable sous le bras, dans un espace de travail lumineux.",
    ratio: "4/5",
    section: "community",
  },
  PROJECT_IMAGE_01: {
    id: "PROJECT_IMAGE_01",
    slot: "PROJECT_IMAGE_01",
    label: "Exemple de projet 01",
    src: project01,
    video: null,
    poster: null,
    alt: "Aperçu d'une page web épurée avec une grande typographie et un bouton orange.",
    ratio: "16/10",
    section: "projects",
  },
  PROJECT_IMAGE_02: {
    id: "PROJECT_IMAGE_02",
    slot: "PROJECT_IMAGE_02",
    label: "Exemple de projet 02",
    src: project02,
    video: null,
    poster: null,
    alt: "Aperçu d'une application mobile minimaliste sur deux écrans.",
    ratio: "16/10",
    section: "projects",
  },
  PROJECT_IMAGE_03: {
    id: "PROJECT_IMAGE_03",
    slot: "PROJECT_IMAGE_03",
    label: "Exemple de projet 03",
    src: project03,
    video: null,
    poster: null,
    alt: "Aperçu d'une interface d'outil assisté par IA avec un champ de prompt.",
    ratio: "16/10",
    section: "projects",
  },
  PROJECT_IMAGE_04: {
    id: "PROJECT_IMAGE_04",
    slot: "PROJECT_IMAGE_04",
    label: "Exemple de projet 04",
    src: null, // aucun média → placeholder élégant
    video: null,
    poster: null,
    alt: "",
    ratio: "16/10",
    section: "projects",
  },
  SESSION_MEDIA: {
    id: "SESSION_MEDIA",
    slot: "SESSION_MEDIA",
    label: "Sessions — visuel",
    src: session01,
    video: null,
    poster: null,
    alt: "Une session de travail du club : six personnes assises en demi-cercle, un facilitateur au tableau.",
    ratio: "3/2",
    section: "sessions",
  },
  CHALLENGE_MEDIA: {
    id: "CHALLENGE_MEDIA",
    slot: "CHALLENGE_MEDIA",
    label: "Défis — visuel",
    src: challenge01,
    video: null,
    poster: null,
    alt: "Croquis d'une page web dessiné au marqueur sur papier, avec un feutre orange posé à côté.",
    ratio: "4/3",
    section: "challenges",
  },
};

export type MediaSlot = keyof typeof MEDIA;

/** Récupère un média par son emplacement (toujours défini, jamais `undefined`). */
export function getMedia(slot: MediaSlot | string): MediaAsset {
  return (
    MEDIA[slot] ?? {
      id: slot,
      slot,
      label: slot,
      src: null,
      video: null,
      poster: null,
      alt: "",
      ratio: "16/10",
      section: "global",
    }
  );
}

/** Liste des médias pour la Media Library admin. */
export const MEDIA_LIBRARY: MediaAsset[] = Object.values(MEDIA);

/** Résolution runtime (permet à l'admin de surcharger un média localement). */
const OVERRIDES_KEY = "cvc/media-overrides/v1";

export function readMediaOverrides(): Record<string, { src: string | null; video: string | null }> {
  try {
    return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function writeMediaOverride(id: string, value: { src: string | null; video: string | null }) {
  const next = { ...readMediaOverrides(), [id]: value };
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
}

export function clearMediaOverrides() {
  localStorage.removeItem(OVERRIDES_KEY);
}

/** Média effectif = configuration + éventuelle surcharge admin. */
export function resolveMedia(slot: MediaSlot | string): MediaAsset {
  const base = getMedia(slot);
  const override = readMediaOverrides()[base.id];
  if (!override) return base;
  return { ...base, src: override.src ?? base.src, video: override.video ?? base.video };
}
