import type { Theme } from "@/components/halloween-trials";

/* Textes des énigmes pour les fêtes : même logique que Halloween, autre histoire. */

export const CHRISTMAS_THEME: Theme = {
  seq: { icon: "🎄", title: "Les boules du sapin", lead: "Les boules du sapin portent des numéros mystérieux :" },
  bin: { icon: "✉️", title: "La lettre codée au Père Noël", lead: "Un lutin a reçu cette lettre en binaire :" },
  doors: {
    icon: "🏠",
    title: "Les trois cheminées",
    lead: "Le Père Noël hésite devant trois cheminées.",
    noun: "cheminée",
    Noun: "Cheminée",
    prep: "dans",
    item: "Le cadeau",
    question: "Dans quelle cheminée se trouve le cadeau ?",
  },
  cpp: {
    icon: "🧝",
    title: "Le bug du lutin",
    actor: "Un lutin programmeur a écrit ce code C++ pour l'atelier.",
    messages: ["JOYEUX NOEL", "HO HO HO", "BONNES FETES", "VIVE LE VENT"],
  },
  res: { icon: "✨", title: "La guirlande qui ne doit pas griller", actor: "Un lutin" },
  blink: { icon: "⭐", title: "L'étoile clignotante du sapin", subject: "L'étoile du sapin" },
  analog: { icon: "❄️", title: "Le capteur de neige", lead: "Une photorésistance (LDR) guette les flocons." },
  ultra: {
    icon: "🛷",
    title: "Le radar à traîneau",
    target: "le traîneau du Père Noël",
    emoji: "🛷",
    question: "Place le traîneau à la distance calculée par le programme.",
    label: "Distance du traîneau en cm",
  },
  serial: {
    icon: "🎁",
    actor: "Le Père Noël",
    names: [
      ["cadeaux", "cadeaux"],
      ["lutins", "lutins"],
      ["rennes", "rennes"],
      ["boules", "boules"],
    ],
  },
};

export const NEW_YEAR_THEME: Theme = {
  ...CHRISTMAS_THEME,
  seq: { icon: "🎆", title: "Les feux d'artifice", lead: "Les fusées s'envolent dans cet ordre :" },
  bin: { icon: "🥂", title: "Le vœu codé", lead: "Un vœu de bonne année est caché en binaire :" },
  cpp: {
    icon: "🕛",
    title: "Le bug de minuit",
    actor: "Un développeur pressé a écrit ce code C++ juste avant minuit.",
    messages: ["BONNE ANNEE", "HAPPY NEW YEAR", "MEILLEURS VOEUX", "VIVE 2027"],
  },
  blink: { icon: "🎇", title: "Le compte à rebours lumineux", subject: "La LED du compte à rebours" },
  serial: {
    icon: "🎉",
    actor: "Le DJ du réveillon",
    names: [
      ["fusées", "fusees"],
      ["confettis", "confettis"],
      ["invités", "invites"],
      ["bougies", "bougies"],
    ],
  },
};
