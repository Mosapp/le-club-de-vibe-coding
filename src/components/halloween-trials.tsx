import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/* ==================================================================
   ÉPREUVES DU « HALLOWEEN CODE MYSTERY »
   9 épreuves + le coffre (dans halloween-gate.tsx) :
   - 4 QCM (suite logique, binaire, portes, bug C++)
   - 5 épreuves interactives électronique / Arduino / capteurs
   Chaque tentative reçoit une « graine » (seed) : elle choisit les
   valeurs de chaque énigme, l'ordre des réponses et l'ordre des
   épreuves. Deux candidats n'ont donc pas les mêmes questions.
   Sans graine (progression d'avant cette version), on rejoue
   exactement le jeu d'origine (« LEGACY »).
================================================================== */

export type Answer = number | string | number[];

export type WidgetProps<T extends Answer = Answer> = {
  value: T | undefined;
  onChange: (v: T) => void;
  disabled: boolean;
};

export type Trial = {
  icon: string;
  title: string;
  intro: ReactNode;
  question: string;
  Widget: (p: WidgetProps) => ReactNode;
  /** la réponse est-elle complète (bouton « Valider » actif) ? */
  isReady: (v: Answer | undefined) => boolean;
  isCorrect: (v: Answer) => boolean;
  /** texte court pour le récapitulatif */
  show: (v: Answer) => string;
  /** QCM : index de la bonne réponse (sert au code du coffre) */
  qcmAnswer?: number;
};

export type Game = {
  trials: Trial[];
  /** code du coffre : position (1, 2, 3…) de la bonne réponse de chaque QCM, dans l'ordre du jeu */
  vaultCode: string;
  /** les QCM qui forment le code, dans l'ordre */
  vaultSources: { step: number; title: string; choices: number }[];
};

export const LETTERS = ["A", "B", "C", "D"];

/* --------------------------- Outils d'affichage --------------------------- */

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="hw-pre mt-3 whitespace-pre-wrap break-words rounded-xl p-3.5 text-[12.5px] leading-relaxed sm:p-4 sm:text-[13px]">
      <code>{children}</code>
    </pre>
  );
}

function Stepper({
  value,
  min,
  max,
  step = 1,
  disabled,
  onChange,
  label,
}: {
  value: number;
  min: number;
  max: number;
  step?: number;
  disabled: boolean;
  onChange: (v: number) => void;
  label: string;
}) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const btn =
    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line text-[18px] font-semibold text-ink-2 transition-colors hover:border-brand disabled:opacity-40";
  return (
    <div className="flex items-center gap-3">
      <button type="button" className={btn} disabled={disabled || value <= min} onClick={() => onChange(clamp(value - step))} aria-label={`${label} : moins`}>
        −
      </button>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
        className="hw-range min-w-0 flex-1"
      />
      <button type="button" className={btn} disabled={disabled || value >= max} onClick={() => onChange(clamp(value + step))} aria-label={`${label} : plus`}>
        +
      </button>
    </div>
  );
}

/* ------------------------------- Hasard ---------------------------------- */

export type Rng = () => number;

/** Générateur pseudo-aléatoire reproductible : même graine = même jeu (utile après un rechargement). */
function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const int = (rng: Rng, min: number, max: number) => min + Math.floor(rng() * (max - min + 1));
const pick = <T,>(rng: Rng, arr: readonly T[]) => arr[Math.floor(rng() * arr.length)];
function shuffle<T>(rng: Rng, arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Nouvelle graine pour une tentative. */
export function newSeed() {
  return Math.floor(Math.random() * 2 ** 31);
}

/* ------------------------------- Thèmes ---------------------------------- */

/** Les textes de chaque énigme : la logique (et donc les réponses) ne dépend que de la graine. */
export type Theme = {
  seq: { icon: string; title: string; lead: string };
  bin: { icon: string; title: string; lead: string };
  doors: { icon: string; title: string; lead: string; noun: string; Noun: string; prep: string; item: string; question: string };
  cpp: { icon: string; title: string; actor: string; messages: readonly string[] };
  res: { icon: string; title: string; actor: string };
  blink: { icon: string; title: string; subject: string };
  analog: { icon: string; title: string; lead: string };
  ultra: { icon: string; title: string; target: string; emoji: string; question: string; label: string };
  serial: { icon: string; actor: string; names: readonly (readonly [string, string])[] };
};

export const HALLOWEEN_THEME: Theme = {
  seq: { icon: "👁️", title: "Le regard de la citrouille", lead: "Une citrouille mystérieuse affiche cette suite :" },
  bin: { icon: "👻", title: "Le message du fantôme", lead: "Le fantôme a laissé ce message codé :" },
  doors: {
    icon: "🚪",
    title: "La porte hantée",
    lead: "Trois portes sont devant toi.",
    noun: "porte",
    Noun: "Porte",
    prep: "derrière",
    item: "Le trésor",
    question: "Derrière quelle porte se trouve le trésor ?",
  },
  cpp: {
    icon: "💀",
    title: "Le crâne des développeurs",
    actor: "Le fantôme programmeur a laissé un code C++ hanté.",
    messages: ["HAPPY HALLOWEEN", "BOUH !", "TRICK OR TREAT", "CODE MAUDIT"],
  },
  res: { icon: "🔌", title: "La LED qui ne doit pas griller", actor: "Le fantôme" },
  blink: { icon: "💡", title: "L'œil clignotant de la citrouille", subject: "L'œil de la citrouille" },
  analog: { icon: "🌙", title: "Le capteur de clair de lune", lead: "Une photorésistance (LDR) surveille la lune." },
  ultra: {
    icon: "📡",
    title: "Le radar à fantômes",
    target: "un fantôme",
    emoji: "👻",
    question: "Place le fantôme à la distance calculée par le programme.",
    label: "Distance du fantôme en cm",
  },
  serial: {
    icon: "🖥️",
    actor: "Le fantôme",
    names: [
      ["citrouilles", "citrouilles"],
      ["fantômes", "fantomes"],
      ["bonbons", "bonbons"],
      ["chauves-souris", "chauvesSouris"],
    ],
  },
};

/* --------------------------------- QCM ---------------------------------- */

type QcmInput = Omit<Trial, "Widget" | "isReady" | "isCorrect" | "show" | "qcmAnswer"> & { choices: string[]; answer: number };

function qcm(t: QcmInput): Trial {
  const Widget = ({ value, onChange, disabled }: WidgetProps) => (
    <div className="grid gap-2.5">
      {t.choices.map((c, i) => (
        <label
          key={c}
          className={cn("hw-choice flex cursor-pointer items-start gap-3 rounded-xl p-3.5 text-[14.5px] leading-snug", value === i && "is-picked")}
        >
          <input type="radio" name={t.title} className="sr-only" checked={value === i} onChange={() => onChange(i)} disabled={disabled} />
          <span className="hw-letter flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-mono text-[13px] font-semibold">
            {LETTERS[i]}
          </span>
          <span className="break-words pt-0.5">{c}</span>
        </label>
      ))}
    </div>
  );
  return {
    ...t,
    Widget,
    isReady: (v) => typeof v === "number",
    isCorrect: (v) => v === t.answer,
    show: (v) => LETTERS[v as number] ?? "?",
    qcmAnswer: t.answer,
  };
}

/** QCM dont les propositions sont mélangées : renvoie les choix et l'index de la bonne réponse. */
function mixChoices(rng: Rng, correct: string, wrong: string[]) {
  const choices = shuffle(rng, [correct, ...wrong]);
  return { choices, answer: choices.indexOf(correct) };
}

/* ---- Suite logique ---- */

function sequenceTrial(rng: Rng, th: Theme = HALLOWEEN_THEME): Trial {
  const kind = int(rng, 0, 4);
  let terms: number[];
  let next: number;
  if (kind === 0) {
    const a = int(rng, 1, 3);
    const r = pick(rng, [2, 3]);
    terms = [0, 1, 2, 3].map((k) => a * r ** k);
    next = a * r ** 4;
  } else if (kind === 1) {
    const a = int(rng, 1, 9);
    const d = int(rng, 3, 9);
    terms = [0, 1, 2, 3].map((k) => a + k * d);
    next = a + 4 * d;
  } else if (kind === 2) {
    const n = int(rng, 1, 4);
    terms = [0, 1, 2, 3].map((k) => (n + k) ** 2);
    next = (n + 4) ** 2;
  } else if (kind === 3) {
    const a = int(rng, 1, 3);
    const b = int(rng, 1, 4);
    terms = [a, b];
    while (terms.length < 5) terms.push(terms[terms.length - 1] + terms[terms.length - 2]);
    next = terms[3] + terms[4];
  } else {
    const a = int(rng, 1, 6);
    terms = [a, a + 1, a + 3, a + 6];
    next = a + 10;
  }
  const last = terms[terms.length - 1];
  const gap = last - terms[terms.length - 2];
  const pool = [next + 1, next - 1, next + 2, next - 2, last + gap, last * 2, next + gap, next - gap].filter((n, i, arr) => n > 0 && n !== next && arr.indexOf(n) === i);
  const { choices, answer } = mixChoices(rng, String(next), shuffle(rng, pool).slice(0, 3).map(String));
  return qcm({
    icon: th.seq.icon,
    title: th.seq.title,
    intro: (
      <>
        <p>{th.seq.lead}</p>
        <p className="hw-code mt-3 text-center text-[clamp(1.2rem,5.5vw,1.7rem)] font-semibold tracking-[0.08em]">{[...terms, "?"].join(" — ")}</p>
      </>
    ),
    question: "Quel nombre complète cette suite ?",
    choices,
    answer,
  });
}

/* ---- Message binaire ---- */

const WORDS = ["CODE", "BITS", "BUGS", "LOOP", "DATA", "BYTE", "HACK", "NODE", "CHIP", "WIFI", "LUNE", "NUIT", "MODE", "GAME", "CAVE"];

function binaryTrial(rng: Rng, th: Theme = HALLOWEEN_THEME): Trial {
  const word = pick(rng, WORDS);
  const others = shuffle(
    rng,
    WORDS.filter((w) => w !== word)
  );
  // Des leurres qui commencent comme le bon mot quand c'est possible : il faut décoder plus d'une lettre.
  const similar = others.filter((w) => w[0] === word[0]);
  const wrong = [...similar, ...others.filter((w) => w[0] !== word[0])].slice(0, 3);
  const { choices, answer } = mixChoices(rng, word, wrong);
  return qcm({
    icon: th.bin.icon,
    title: th.bin.title,
    intro: (
      <>
        <p>{th.bin.lead}</p>
        <p className="hw-code mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-[clamp(0.95rem,4vw,1.15rem)]">
          {[...word].map((c, i) => (
            <span key={i}>{c.charCodeAt(0).toString(2).padStart(8, "0")}</span>
          ))}
        </p>
        <p className="mt-3">Chaque groupe représente une lettre en code binaire ASCII (A = 01000001, B = 01000010…).</p>
      </>
    ),
    question: "Quel mot obtiens-tu ?",
    choices,
    answer,
  });
}

/* ---- Portes hantées (logique) ---- */

const DOORS = [
  { name: "rouge", cls: "hw-door-red" },
  { name: "bleue", cls: "hw-door-blue" },
  { name: "noire", cls: "hw-door-black" },
];

type DoorClue = { target: number; is: boolean };

function doorsPuzzle(rng: Rng) {
  for (let tries = 0; tries < 300; tries++) {
    const clues: DoorClue[] = DOORS.map(() => ({ target: int(rng, 0, 2), is: rng() < 0.5 }));
    const oneTrue = rng() < 0.6;
    const solutions = [0, 1, 2].filter((t) => {
      const truths = clues.filter((c) => (c.target === t) === c.is).length;
      return oneTrue ? truths === 1 : truths === 2;
    });
    if (solutions.length === 1) return { clues, oneTrue, treasure: solutions[0] };
  }
  // Repli : l'énigme d'origine
  return {
    clues: [
      { target: 0, is: false },
      { target: 0, is: true },
      { target: 1, is: false },
    ],
    oneTrue: true,
    treasure: 1,
  };
}

function doorsTrial(rng: Rng, th: Theme = HALLOWEEN_THEME): Trial {
  const { clues, oneTrue, treasure } = doorsPuzzle(rng);
  const d = th.doors;
  const label = (i: number) => `La ${d.noun} ${DOORS[i].name}`;
  const { choices, answer } = mixChoices(
    rng,
    label(treasure),
    [0, 1, 2].filter((i) => i !== treasure).map(label)
  );
  return qcm({
    icon: d.icon,
    title: d.title,
    intro: (
      <>
        <p>{d.lead}</p>
        <ul className="mt-3 space-y-2">
          {clues.map((c, i) => (
            <li key={i} className={cn("hw-door", DOORS[i].cls)}>
              <b>
                {d.Noun} {DOORS[i].name} :
              </b>{" "}
              « {d.item} {c.is ? "est" : "n'est pas"} {d.prep} la {d.noun} {DOORS[c.target].name}. »
            </li>
          ))}
        </ul>
        <p className="mt-3">
          {oneTrue ? (
            <>
              Une <b className="text-ink">seule</b> de ces trois affirmations est vraie.
            </>
          ) : (
            <>
              Une <b className="text-ink">seule</b> de ces trois affirmations est fausse.
            </>
          )}
        </p>
      </>
    ),
    question: d.question,
    choices,
    answer,
  });
}

/* ---- Bug C++ ---- */

const CPP_BUGS = [
  {
    code: (m: string) => `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "${m}" << endl\n    return 0;\n}`,
    fix: "Il manque un point-virgule (;) après endl.",
  },
  {
    code: (m: string) => `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "${m}" << endl;\n    return 0;\n`,
    fix: "Il manque l'accolade fermante } à la fin de main().",
  },
  {
    code: (m: string) => `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << '${m}' << endl;\n    return 0;\n}`,
    fix: "Le texte doit être entre guillemets doubles \" \" et non entre apostrophes.",
  },
  {
    code: (m: string) => `using namespace std;\n\nint main() {\n    cout << "${m}" << endl;\n    return 0;\n}`,
    fix: "Il manque #include <iostream> pour pouvoir utiliser cout.",
  },
  {
    code: (m: string) => `#include <iostream>\nusing namespace std;\n\nint main() {\n    Cout << "${m}" << endl;\n    return 0;\n}`,
    fix: "cout doit s'écrire en minuscules : le C++ fait la différence.",
  },
  {
    code: (m: string) => `#include <iostream>\nusing namespace std;\n\nint main() {\n    cout >> "${m}" >> endl;\n    return 0;\n}`,
    fix: "Avec cout, il faut utiliser << et non >>.",
  },
];

const CPP_WRONG = [
  "Il faut remplacer cout par cin.",
  "Il faut supprimer int main().",
  "Il faut remplacer #include <iostream> par #include <string>.",
  "Il faut supprimer la ligne return 0;.",
  "Il faut remplacer endl par end.",
  "Il faut écrire le message en minuscules.",
];

function cppTrial(rng: Rng, th: Theme = HALLOWEEN_THEME): Trial {
  const bug = pick(rng, CPP_BUGS);
  const msg = pick(rng, th.cpp.messages);
  // Pas de leurre qui parle d'un #include absent du code
  const pool = CPP_WRONG.filter((w) => !(bug.code("").startsWith("using") && w.includes("#include")));
  const { choices, answer } = mixChoices(rng, bug.fix, shuffle(rng, pool).slice(0, 3));
  return qcm({
    icon: th.cpp.icon,
    title: th.cpp.title,
    intro: (
      <>
        <p>
          {th.cpp.actor} Il veut afficher le message <b className="text-ink">{msg}</b>, mais une erreur empêche le programme de fonctionner
          correctement.
        </p>
        <CodeBlock>{bug.code(msg)}</CodeBlock>
      </>
    ),
    question: "Quelle est l'erreur dans ce programme ?",
    choices,
    answer,
  });
}

/* ----------------------- La résistance de la LED ----------------------- */

const COLORS = [
  { name: "noir", hex: "#111111" },
  { name: "marron", hex: "#7b4a1e" },
  { name: "rouge", hex: "#d62828" },
  { name: "orange", hex: "#f77f00" },
  { name: "jaune", hex: "#f6d743" },
  { name: "vert", hex: "#2a9d4b" },
  { name: "bleu", hex: "#2563eb" },
  { name: "violet", hex: "#8b3fd1" },
  { name: "gris", hex: "#8b8f97" },
  { name: "blanc", hex: "#f4f4f4" },
];
const BAND_LABELS = ["1er chiffre", "2e chiffre", "Multiplicateur"];

function ohms(bands: number[]) {
  return (bands[0] * 10 + bands[1]) * 10 ** bands[2];
}
function formatOhms(v: number) {
  if (v >= 1_000_000) return `${+(v / 1_000_000).toFixed(2)} MΩ`;
  if (v >= 1000) return `${+(v / 1000).toFixed(2)} kΩ`;
  return `${v} Ω`;
}

function ResistorWidget({ value, onChange, disabled }: WidgetProps) {
  const bands = (value as number[] | undefined) ?? [0, 0, 0];
  const set = (i: number, c: number) => onChange(bands.map((b, j) => (j === i ? (c + 10) % 10 : b)));
  return (
    <div>
      <svg viewBox="0 0 300 70" className="mx-auto w-full max-w-[340px]" aria-hidden="true">
        <line x1="0" y1="35" x2="300" y2="35" stroke="#9aa5b1" strokeWidth="4" />
        <rect x="70" y="12" width="160" height="46" rx="18" fill="#d9b98a" />
        {bands.map((b, i) => (
          <rect key={i} x={98 + i * 30} y="12" width="14" height="46" fill={COLORS[b].hex} stroke="#00000055" />
        ))}
        <rect x="200" y="12" width="10" height="46" fill="#c9a227" />
      </svg>
      <p className="hw-code mt-1 text-center text-[20px] font-semibold" aria-live="polite">
        R = {formatOhms(ohms(bands))}
      </p>
      <div className="mt-4 grid gap-2.5">
        {bands.map((b, i) => (
          <div key={i} className="flex items-center justify-between gap-2 rounded-xl border border-line p-1.5 pl-2.5 sm:p-2 sm:pl-3">
            <span className="min-w-0 text-[12.5px] leading-tight text-muted sm:text-[13px]">{BAND_LABELS[i]}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={disabled}
                onClick={() => set(i, b - 1)}
                className="h-9 w-9 shrink-0 rounded-lg border border-line text-ink-2 hover:border-brand"
                aria-label={`${BAND_LABELS[i]} : couleur précédente`}
              >
                ‹
              </button>
              <span className="flex w-[76px] items-center gap-1.5 text-[13px] font-medium text-ink sm:w-[88px] sm:gap-2 sm:text-[13.5px]">
                <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" style={{ background: COLORS[b].hex }} />
                {COLORS[b].name}
              </span>
              <button
                type="button"
                disabled={disabled}
                onClick={() => set(i, b + 1)}
                className="h-9 w-9 shrink-0 rounded-lg border border-line text-ink-2 hover:border-brand"
                aria-label={`${BAND_LABELS[i]} : couleur suivante`}
              >
                ›
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function resistorTrial(supply: number, vf: number, ma: number, th: Theme = HALLOWEEN_THEME): Trial {
  const target = Math.round((supply - vf) / (ma / 1000));
  const source =
    supply === 5 ? (
      <>
        une broche de l'Arduino qui délivre <b className="text-ink">5 V</b>
      </>
    ) : (
      <>
        une alimentation de <b className="text-ink">{supply} V</b>
      </>
    );
  return {
    icon: th.res.icon,
    title: th.res.title,
    intro: (
      <>
        <p>
          {th.res.actor} veut allumer une LED {vf === 2 ? "rouge" : "bleue"} avec {source}. La LED garde <b className="text-ink">{vf} V</b> à ses
          bornes et doit recevoir <b className="text-ink">{ma} mA</b>. Sans résistance, elle grille !
        </p>
        <p className="mt-3">
          Rappel : loi d'Ohm <span className="hw-code">R = U / I</span> (U = tension restante pour la résistance), et le code couleur :
        </p>
        <ul className="mt-3 grid grid-cols-5 gap-1.5 text-center text-[11.5px] text-muted">
          {COLORS.map((c, i) => (
            <li key={c.name} className="rounded-lg border border-line px-1 py-1.5">
              <span className="mx-auto mb-1 block h-3 w-3 rounded-full border border-white/20" style={{ background: c.hex }} />
              {i} · {c.name}
            </li>
          ))}
        </ul>
        <p className="mt-2 text-[13px] text-faint">Le 3e anneau est le multiplicateur : nombre de zéros à ajouter.</p>
      </>
    ),
    question: "Fabrique la résistance qui protège la LED en réglant ses 3 anneaux.",
    Widget: ResistorWidget,
    isReady: (v) => Array.isArray(v),
    isCorrect: (v) => ohms(v as number[]) === target,
    show: (v) => `${(v as number[]).map((b) => COLORS[b].name).join("-")} (${formatOhms(ohms(v as number[]))})`,
  };
}

function randomResistor(rng: Rng, th: Theme = HALLOWEEN_THEME) {
  return resistorTrial(pick(rng, [5, 9, 12]), pick(rng, [2, 3]), pick(rng, [10, 20]), th);
}

/* ------------------------------ Le Blink ------------------------------ */

function makeBlinkWidget(lines: string[]) {
  return function BlinkWidget({ value, onChange, disabled }: WidgetProps) {
    const order = (value as number[] | undefined) ?? [];
    const pool = lines.map((_, i) => i).filter((i) => !order.includes(i));
    return (
      <div>
        <div className="hw-pre rounded-xl p-3.5 font-mono text-[12.5px] leading-relaxed sm:text-[13px]">
          <div className="text-faint">void loop() {"{"}</div>
          <ol className="my-1.5 space-y-1.5 pl-4">
            {Array.from({ length: lines.length }, (_, slot) => {
              const line = order[slot];
              return (
                <li key={slot}>
                  {line === undefined ? (
                    <span className="hw-slot block rounded-md px-2 py-1.5 text-faint">// ligne {slot + 1} ?</span>
                  ) : (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => onChange(order.filter((_, j) => j !== slot))}
                      className="hw-chip is-placed w-full rounded-md px-2 py-1.5 text-left"
                      aria-label={`Retirer ${lines[line]}`}
                    >
                      {lines[line]} <span className="float-right text-faint">✕</span>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
          <div className="text-faint">{"}"}</div>
        </div>
        <p className="mt-3 text-[13px] text-muted">{pool.length ? "Touche les lignes dans l'ordre d'exécution :" : "Touche une ligne placée pour la retirer."}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {pool.map((i) => (
            <button
              key={i}
              type="button"
              disabled={disabled}
              onClick={() => onChange([...order, i])}
              className="hw-chip rounded-lg px-3 py-2 font-mono text-[13px]"
            >
              {lines[i]}
            </button>
          ))}
        </div>
      </div>
    );
  };
}

function duration(ms: number) {
  if (ms === 500) return "une demi-seconde";
  if (ms % 1000 === 0) return ms === 1000 ? "1 seconde" : `${ms / 1000} secondes`;
  return `${String(ms / 1000).replace(".", ",")} seconde`;
}

/** lines = lignes dans l'ordre où elles sont proposées ; order = bon ordre (index dans lines). */
function blinkTrial(
  pin: number,
  onMs: number,
  offMs: number,
  startOn: boolean,
  lines: string[],
  order: number[],
  th: Theme = HALLOWEEN_THEME
): Trial {
  const first = startOn ? `allumée ${duration(onMs)}` : `éteinte ${duration(offMs)}`;
  const second = startOn ? `éteinte ${duration(offMs)}` : `allumée ${duration(onMs)}`;
  return {
    icon: th.blink.icon,
    title: th.blink.title,
    intro: (
      <>
        <p>
          {th.blink.subject} est une LED branchée sur la broche {pin}. Elle doit rester <b className="text-ink">{first}</b>, puis{" "}
          <b className="text-ink">{second}</b>, et recommencer à l'infini.
        </p>
        <CodeBlock>{`void setup() {\n  pinMode(${pin}, OUTPUT);\n}`}</CodeBlock>
        <p className="mt-3 text-[13px] text-faint">Rappel : delay() attend un temps en millisecondes.</p>
      </>
    ),
    question: "Remets les lignes de loop() dans le bon ordre.",
    Widget: makeBlinkWidget(lines),
    isReady: (v) => Array.isArray(v) && v.length === lines.length,
    isCorrect: (v) => (v as number[]).join() === order.join(),
    show: (v) => (v as number[]).map((i) => lines[i].replace(/;$/, "")).join(" → "),
  };
}

function randomBlink(rng: Rng, th: Theme = HALLOWEEN_THEME) {
  const pin = pick(rng, [13, 12, 8, 7]);
  const [onMs, offMs] = shuffle(rng, [200, 250, 300, 500, 750, 1000, 1500, 2000]).slice(0, 2);
  const startOn = rng() < 0.6;
  const high = `digitalWrite(${pin}, HIGH);`;
  const low = `digitalWrite(${pin}, LOW);`;
  const correct = startOn ? [high, `delay(${onMs});`, low, `delay(${offMs});`] : [low, `delay(${offMs});`, high, `delay(${onMs});`];
  let lines = shuffle(rng, correct);
  if (lines.join() === correct.join()) lines = [lines[1], lines[0], lines[3], lines[2]];
  return blinkTrial(pin, onMs, offMs, startOn, lines, correct.map((l) => lines.indexOf(l)), th);
}

/* -------------------------- Capteur de lumière -------------------------- */

function makeAnalogWidget(pin: string) {
  return function AnalogWidget({ value, onChange, disabled }: WidgetProps) {
    const v = typeof value === "number" ? value : 0;
    return (
      <div>
        <div className="hw-pre rounded-xl p-4 text-center font-mono">
          <span className="text-faint">analogRead({pin}) = </span>
          <span className="hw-code text-[24px] font-semibold">{v}</span>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
            <div className="h-full rounded-full bg-brand" style={{ width: `${(v / 1023) * 100}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[11px] text-faint">
            <span>0</span>
            <span>1023</span>
          </div>
        </div>
        <div className="mt-4">
          <Stepper value={v} min={0} max={1023} disabled={disabled} onChange={onChange} label={`Valeur lue sur ${pin}`} />
        </div>
      </div>
    );
  };
}

function analogTrial(volts: number, pin: string, min: number, max: number, th: Theme = HALLOWEEN_THEME): Trial {
  return {
    icon: th.analog.icon,
    title: th.analog.title,
    intro: (
      <>
        <p>
          {th.analog.lead} Ce soir, elle envoie <b className="text-ink">{String(volts).replace(".", ",")} V</b> sur
          l'entrée analogique <b className="text-ink">{pin}</b> d'un Arduino Uno alimenté en <b className="text-ink">5 V</b>.
        </p>
        <p className="mt-3">Le convertisseur de l'Arduino Uno travaille sur 10 bits : il transforme 0 V → 5 V en un nombre entre 0 et 1023.</p>
        <CodeBlock>{`int lumiere = analogRead(${pin});\nSerial.println(lumiere);`}</CodeBlock>
      </>
    ),
    question: `Règle la valeur que va lire analogRead(${pin}).`,
    Widget: makeAnalogWidget(pin),
    isReady: (v) => typeof v === "number",
    isCorrect: (v) => (v as number) >= min && (v as number) <= max,
    show: (v) => String(v),
  };
}

function randomAnalog(rng: Rng, th: Theme = HALLOWEEN_THEME) {
  const volts = pick(rng, [1, 1.5, 2, 2.5, 3, 3.5, 4]);
  const expected = Math.round((volts / 5) * 1023);
  return analogTrial(volts, pick(rng, ["A0", "A1", "A2", "A3"]), expected - 3, expected + 3, th);
}

/* -------------------------- Capteur à ultrasons -------------------------- */

function makeUltrasonicWidget(emoji: string, label: string) {
  return function UltrasonicWidget({ value, onChange, disabled }: WidgetProps) {
    const cm = typeof value === "number" ? value : 40;
    const pct = (cm / 50) * 100;
    return (
      <div>
        <div className="hw-pre relative h-24 overflow-hidden rounded-xl" aria-hidden="true">
          <div className="absolute left-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            <span className="block h-5 w-5 rounded-full border-2 border-[#9aa5b1] bg-[#1d2833]" />
            <span className="block h-5 w-5 rounded-full border-2 border-[#9aa5b1] bg-[#1d2833]" />
          </div>
          <div
            className="hw-wave absolute top-1/2 h-px -translate-y-1/2 border-t-2 border-dashed border-brand/50"
            style={{ left: 50, width: `calc((100% - 70px) * ${pct / 100})` }}
          />
          <span
            className="absolute top-1/2 -translate-y-1/2 text-[30px] transition-[left] duration-200"
            style={{ left: `calc(46px + (100% - 76px) * ${pct / 100})` }}
          >
            {emoji}
          </span>
          <div className="absolute inset-x-[50px] bottom-1.5 flex justify-between font-mono text-[10px] text-faint">
            <span>0</span>
            <span>25</span>
            <span>50 cm</span>
          </div>
        </div>
        <p className="hw-code mt-3 text-center text-[20px] font-semibold">distance = {cm} cm</p>
        <div className="mt-3">
          <Stepper value={cm} min={0} max={50} disabled={disabled} onChange={onChange} label={label} />
        </div>
      </div>
    );
  };
}

function ultrasonicTrial(micros: number, th: Theme = HALLOWEEN_THEME): Trial {
  // Même calcul qu'en C++ : multiplication puis division en double, puis troncature vers int.
  const exact = micros * 0.034 / 2;
  const accepted = new Set([Math.trunc(exact), Math.round(exact)]);
  return {
    icon: th.ultra.icon,
    title: th.ultra.title,
    intro: (
      <>
        <p>
          Un capteur à ultrasons <b className="text-ink">HC-SR04</b> envoie un « bip » qui rebondit sur {th.ultra.target}. L'Arduino mesure la durée de
          l'aller-retour de l'écho :
        </p>
        <CodeBlock>{`// l'écho a duré ${micros} µs\nlong duree = pulseIn(echoPin, HIGH);\n\n// distance en cm\nint distance = duree * 0.034 / 2;`}</CodeBlock>
        <p className="mt-3 text-[13px] text-faint">0,034 cm/µs est la vitesse du son ; on divise par 2 car l'onde fait l'aller et le retour.</p>
      </>
    ),
    question: th.ultra.question,
    Widget: makeUltrasonicWidget(th.ultra.emoji, th.ultra.label),
    isReady: (v) => typeof v === "number",
    isCorrect: (v) => accepted.has(v as number),
    show: (v) => `${v} cm`,
  };
}

function randomUltrasonic(rng: Rng, th: Theme = HALLOWEEN_THEME) {
  return ultrasonicTrial(int(rng, 300, 1400) * 2, th);
}

/* ---------------------------- Moniteur série ---------------------------- */

function SerialWidget({ value, onChange, disabled }: WidgetProps) {
  const [focus, setFocus] = useState(false);
  return (
    <div className={cn("hw-pre rounded-xl p-3.5 font-mono text-[13px]", focus && "ring-2 ring-brand/40")}>
      <div className="flex items-center justify-between border-b border-line pb-2 text-[11px] text-faint">
        <span>Moniteur série</span>
        <span>9600 bauds</span>
      </div>
      <label htmlFor="hw-serial" className="mt-3 flex items-center gap-2">
        <span className="text-brand">&gt;</span>
        <input
          id="hw-serial"
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value.replace(/[^\d-]/g, "").slice(0, 6))}
          onFocus={() => setFocus(true)}
          onBlur={() => setFocus(false)}
          disabled={disabled}
          inputMode="numeric"
          autoComplete="off"
          placeholder="tape ce qui s'affiche…"
          aria-label="Ce qu'affiche le moniteur série"
          className="hw-code min-w-0 flex-1 bg-transparent text-[18px] outline-none placeholder:text-[13px] placeholder:text-faint"
        />
      </label>
    </div>
  );
}

function serialTrial(name: string, code: string, result: number, th: Theme = HALLOWEEN_THEME): Trial {
  return {
    icon: th.serial.icon,
    title: `Le compteur de ${name}`,
    intro: (
      <>
        <p>Ce programme est téléversé dans l'Arduino. {th.serial.actor} ouvre le moniteur série…</p>
        <CodeBlock>{code}</CodeBlock>
      </>
    ),
    question: "Quel nombre s'affiche dans le moniteur série ?",
    Widget: SerialWidget,
    isReady: (v) => typeof v === "string" && v.trim() !== "",
    isCorrect: (v) => String(v).trim() === String(result),
    show: (v) => String(v),
  };
}

function serialProgram(variable: string, start: number, loop: string, body: string) {
  return `int ${variable} = ${start};\n\nvoid setup() {\n  Serial.begin(9600);\n  ${loop} {\n    ${body}\n  }\n  Serial.println(${variable});\n}\n\nvoid loop() {}`;
}

function randomSerial(rng: Rng, th: Theme = HALLOWEEN_THEME) {
  const [name, variable] = pick(rng, th.serial.names);
  const kind = int(rng, 0, 2);
  if (kind === 0) {
    const start = int(rng, 1, 9);
    const a = int(rng, 0, 2);
    const b = a + int(rng, 2, 4);
    let r = start;
    for (let i = a; i <= b; i++) r += i;
    return serialTrial(name, serialProgram(variable, start, `for (int i = ${a}; i <= ${b}; i++)`, `${variable} = ${variable} + i;`), r, th);
  }
  if (kind === 1) {
    const start = int(rng, 1, 5);
    const n = int(rng, 3, 5);
    const step = int(rng, 2, 5);
    return serialTrial(name, serialProgram(variable, start, `for (int i = 0; i < ${n}; i++)`, `${variable} += ${step};`), start + n * step, th);
  }
  const start = int(rng, 1, 3);
  const n = int(rng, 3, 4);
  return serialTrial(name, serialProgram(variable, start, `for (int i = 0; i < ${n}; i++)`, `${variable} = ${variable} * 2;`), start * 2 ** n, th);
}

/* ------------------------------ Le jeu ------------------------------ */

function gameFrom(trials: Trial[]): Game {
  const qcms = trials.map((t, i) => ({ t, step: i + 1 })).filter(({ t }) => t.qcmAnswer !== undefined);
  return {
    trials,
    vaultCode: qcms.map(({ t }) => (t.qcmAnswer as number) + 1).join(""),
    vaultSources: qcms.map(({ t, step }) => ({
      step,
      title: t.title,
      choices: (t as Trial & { choices?: string[] }).choices?.length ?? 4,
    })),
  };
}

/** Le jeu d'origine, pour les progressions commencées avant les énigmes aléatoires. */
function legacyGame(): Game {
  const legacy: Trial[] = [
    qcm({
      icon: "👁️",
      title: "Le regard de la citrouille",
      intro: (
        <>
          <p>Une citrouille mystérieuse affiche cette suite :</p>
          <p className="hw-code mt-3 text-center text-[clamp(1.3rem,6vw,1.8rem)] font-semibold tracking-[0.12em]">2 — 4 — 8 — 16 — ?</p>
        </>
      ),
      question: "Quel nombre complète cette suite ?",
      choices: ["18", "24", "32", "36"],
      answer: 2,
    }),
    qcm({
      icon: "👻",
      title: "Le message du fantôme",
      intro: (
        <>
          <p>Le fantôme a laissé ce message codé :</p>
          <p className="hw-code mt-3 flex flex-wrap justify-center gap-x-3 gap-y-1 text-center text-[clamp(0.95rem,4vw,1.15rem)]">
            <span>01000011</span>
            <span>01001111</span>
            <span>01000100</span>
            <span>01000101</span>
          </p>
          <p className="mt-3">Chaque groupe représente une lettre en code binaire ASCII.</p>
        </>
      ),
      question: "Quel mot obtiens-tu ?",
      choices: ["CODE", "GAME", "CAVE", "MODE"],
      answer: 0,
    }),
    qcm({
      icon: "🚪",
      title: "La porte hantée",
      intro: (
        <>
          <p>Trois portes sont devant toi.</p>
          <ul className="mt-3 space-y-2">
            <li className="hw-door hw-door-red">
              <b>Porte rouge :</b> « Le trésor n'est pas derrière la porte rouge. »
            </li>
            <li className="hw-door hw-door-blue">
              <b>Porte bleue :</b> « Le trésor est derrière la porte rouge. »
            </li>
            <li className="hw-door hw-door-black">
              <b>Porte noire :</b> « Le trésor n'est pas derrière la porte bleue. »
            </li>
          </ul>
          <p className="mt-3">
            Une <b className="text-ink">seule</b> de ces trois affirmations est vraie.
          </p>
        </>
      ),
      question: "Derrière quelle porte se trouve le trésor ?",
      choices: ["La porte rouge", "La porte bleue", "La porte noire"],
      answer: 1,
    }),
    qcm({
      icon: "💀",
      title: "Le crâne des développeurs",
      intro: (
        <>
          <p>
            Le fantôme programmeur a laissé un code C++ hanté. Il veut afficher le message <b className="text-ink">HAPPY HALLOWEEN</b>, mais une
            erreur empêche le programme de fonctionner.
          </p>
          <CodeBlock>{CPP_BUGS[0].code("HAPPY HALLOWEEN")}</CodeBlock>
        </>
      ),
      question: "Quelle est l'erreur dans ce programme ?",
      choices: [
        "Il manque un point-virgule (;) après endl.",
        "Il faut remplacer cout par cin.",
        "Il faut supprimer int main().",
        "Il faut remplacer #include <iostream> par #include <string>.",
      ],
      answer: 0,
    }),
    resistorTrial(5, 2, 20),
    blinkTrial(13, 1000, 500, true, ["delay(500);", "digitalWrite(13, HIGH);", "delay(1000);", "digitalWrite(13, LOW);"], [1, 2, 3, 0]),
    analogTrial(2.5, "A0", 510, 514),
    ultrasonicTrial(1000),
    serialTrial("citrouilles", serialProgram("citrouilles", 3, "for (int i = 1; i <= 4; i++)", "citrouilles = citrouilles + i;"), 13),
  ];
  return gameFrom(legacy);
}

const cache = new Map<string, Game>();

/** Le jeu d'une tentative : mêmes questions pour une même graine, jeu d'origine sans graine. */
export function buildGame(seed?: number): Game {
  const key = seed === undefined ? "legacy" : String(seed);
  const hit = cache.get(key);
  if (hit) return hit;
  let game: Game;
  if (seed === undefined) {
    game = legacyGame();
  } else {
    game = buildThemedGame(seed, HALLOWEEN_THEME);
  }
  cache.set(key, game);
  return game;
}

/** Les 9 types d'énigmes, dans l'ordre où ils consomment le hasard. */
export const TRIAL_KINDS: ((rng: Rng, th: Theme) => Trial)[] = [
  sequenceTrial,
  binaryTrial,
  doorsTrial,
  cppTrial,
  randomResistor,
  randomBlink,
  randomAnalog,
  randomUltrasonic,
  randomSerial,
];

/** Un jeu complet (9 énigmes mélangées + code du coffre) pour une graine et un thème. */
export function buildThemedGame(seed: number, theme: Theme): Game {
  const rng = mulberry32(seed);
  const trials = TRIAL_KINDS.map((make) => make(rng, theme));
  return gameFrom(shuffle(rng, trials));
}

/** Une seule énigme d'un type donné (0 à 8), pour une graine et un thème. */
export function buildSingleTrial(seed: number, kind: number, theme: Theme): Trial {
  const n = TRIAL_KINDS.length;
  return TRIAL_KINDS[((kind % n) + n) % n](mulberry32(seed), theme);
}
