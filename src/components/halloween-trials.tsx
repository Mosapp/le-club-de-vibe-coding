import { useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/* ==================================================================
   ÉPREUVES DU « HALLOWEEN CODE MYSTERY »
   1 à 4 : QCM (logique, binaire, portes, C++)
   5 à 9 : épreuves interactives électronique / Arduino / capteurs
   10    : le coffre (dans halloween-gate.tsx)
   Chaque épreuve fournit son widget, sa vérification et un texte
   lisible pour le récapitulatif envoyé à l'organisateur.
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

/* --------------------------------- QCM ---------------------------------- */

function qcm(t: Omit<Trial, "Widget" | "isReady" | "isCorrect" | "show"> & { choices: string[]; answer: number }): Trial & { answer: number } {
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
  };
}

const QCM_TRIALS = [
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
        <CodeBlock>{`#include <iostream>
using namespace std;

int main() {
    cout << "HAPPY HALLOWEEN" << endl
    return 0;
}`}</CodeBlock>
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
];

/** Code du coffre : position (1, 2, 3…) de la bonne réponse des épreuves 1 à 4 */
export const VAULT_CODE = QCM_TRIALS.map((t) => t.answer + 1).join("");

/* ----------------------- Épreuve 5 : la résistance ----------------------- */

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

const resistorTrial: Trial = {
  icon: "🔌",
  title: "La LED qui ne doit pas griller",
  intro: (
    <>
      <p>
        Le fantôme veut allumer une LED rouge sur une broche de l'Arduino qui délivre <b className="text-ink">5 V</b>. La LED garde{" "}
        <b className="text-ink">2 V</b> à ses bornes et doit recevoir <b className="text-ink">20 mA</b>. Sans résistance, elle grille !
      </p>
      <p className="mt-3">
        Rappel : loi d'Ohm <span className="hw-code">R = U / I</span>, et le code couleur d'une résistance :
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
  isCorrect: (v) => ohms(v as number[]) === 150,
  show: (v) => `${(v as number[]).map((b) => COLORS[b].name).join("-")} (${formatOhms(ohms(v as number[]))})`,
};

/* ------------------------- Épreuve 6 : le Blink ------------------------- */

const BLINK_LINES = ["delay(500);", "digitalWrite(13, HIGH);", "delay(1000);", "digitalWrite(13, LOW);"];
const BLINK_ORDER = [1, 2, 3, 0];

function BlinkWidget({ value, onChange, disabled }: WidgetProps) {
  const order = (value as number[] | undefined) ?? [];
  const pool = BLINK_LINES.map((_, i) => i).filter((i) => !order.includes(i));
  return (
    <div>
      <div className="hw-pre rounded-xl p-3.5 font-mono text-[12.5px] leading-relaxed sm:text-[13px]">
        <div className="text-faint">void loop() {"{"}</div>
        <ol className="my-1.5 space-y-1.5 pl-4">
          {Array.from({ length: BLINK_LINES.length }, (_, slot) => {
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
                    aria-label={`Retirer ${BLINK_LINES[line]}`}
                  >
                    {BLINK_LINES[line]} <span className="float-right text-faint">✕</span>
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
            {BLINK_LINES[i]}
          </button>
        ))}
      </div>
    </div>
  );
}

const blinkTrial: Trial = {
  icon: "💡",
  title: "L'œil clignotant de la citrouille",
  intro: (
    <>
      <p>
        L'œil de la citrouille est une LED branchée sur la broche 13. Elle doit rester <b className="text-ink">allumée 1 seconde</b>, puis{" "}
        <b className="text-ink">éteinte une demi-seconde</b>, et recommencer à l'infini.
      </p>
      <CodeBlock>{`void setup() {
  pinMode(13, OUTPUT);
}`}</CodeBlock>
      <p className="mt-3 text-[13px] text-faint">Rappel : delay() attend un temps en millisecondes.</p>
    </>
  ),
  question: "Remets les lignes de loop() dans le bon ordre.",
  Widget: BlinkWidget,
  isReady: (v) => Array.isArray(v) && v.length === BLINK_LINES.length,
  isCorrect: (v) => (v as number[]).join() === BLINK_ORDER.join(),
  show: (v) => (v as number[]).map((i) => BLINK_LINES[i].replace(/;$/, "")).join(" → "),
};

/* --------------------- Épreuve 7 : capteur de lumière --------------------- */

function AnalogWidget({ value, onChange, disabled }: WidgetProps) {
  const v = typeof value === "number" ? value : 0;
  return (
    <div>
      <div className="hw-pre rounded-xl p-4 text-center font-mono">
        <span className="text-faint">analogRead(A0) = </span>
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
        <Stepper value={v} min={0} max={1023} disabled={disabled} onChange={onChange} label="Valeur lue sur A0" />
      </div>
    </div>
  );
}

const analogTrial: Trial = {
  icon: "🌙",
  title: "Le capteur de clair de lune",
  intro: (
    <>
      <p>
        Une photorésistance (LDR) surveille la lune. Ce soir, elle envoie <b className="text-ink">2,5 V</b> sur l'entrée analogique{" "}
        <b className="text-ink">A0</b> d'un Arduino Uno alimenté en <b className="text-ink">5 V</b>.
      </p>
      <p className="mt-3">Le convertisseur de l'Arduino Uno travaille sur 10 bits : il transforme 0 V → 5 V en un nombre entre 0 et 1023.</p>
      <CodeBlock>{`int lumiere = analogRead(A0);
Serial.println(lumiere);`}</CodeBlock>
    </>
  ),
  question: "Règle la valeur que va lire analogRead(A0).",
  Widget: AnalogWidget,
  isReady: (v) => typeof v === "number",
  isCorrect: (v) => (v as number) >= 510 && (v as number) <= 514,
  show: (v) => String(v),
};

/* ---------------------- Épreuve 8 : capteur à ultrasons ---------------------- */

function UltrasonicWidget({ value, onChange, disabled }: WidgetProps) {
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
          👻
        </span>
        <div className="absolute inset-x-[50px] bottom-1.5 flex justify-between font-mono text-[10px] text-faint">
          <span>0</span>
          <span>25</span>
          <span>50 cm</span>
        </div>
      </div>
      <p className="hw-code mt-3 text-center text-[20px] font-semibold">distance = {cm} cm</p>
      <div className="mt-3">
        <Stepper value={cm} min={0} max={50} disabled={disabled} onChange={onChange} label="Distance du fantôme en cm" />
      </div>
    </div>
  );
}

const ultrasonicTrial: Trial = {
  icon: "📡",
  title: "Le radar à fantômes",
  intro: (
    <>
      <p>
        Un capteur à ultrasons <b className="text-ink">HC-SR04</b> envoie un « bip » qui rebondit sur un fantôme. L'Arduino mesure la durée de
        l'aller-retour de l'écho :
      </p>
      <CodeBlock>{`// l'écho a duré 1000 µs
long duree = pulseIn(echoPin, HIGH);

// distance en cm
int distance = duree * 0.034 / 2;`}</CodeBlock>
      <p className="mt-3 text-[13px] text-faint">0,034 cm/µs est la vitesse du son ; on divise par 2 car l'onde fait l'aller et le retour.</p>
    </>
  ),
  question: "Place le fantôme à la distance calculée par le programme.",
  Widget: UltrasonicWidget,
  isReady: (v) => typeof v === "number",
  isCorrect: (v) => v === 17,
  show: (v) => `${v} cm`,
};

/* ----------------------- Épreuve 9 : moniteur série ----------------------- */

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

const serialTrial: Trial = {
  icon: "🖥️",
  title: "Le compteur de citrouilles",
  intro: (
    <>
      <p>Ce programme est téléversé dans l'Arduino. Le fantôme ouvre le moniteur série…</p>
      <CodeBlock>{`int citrouilles = 3;

void setup() {
  Serial.begin(9600);
  for (int i = 1; i <= 4; i++) {
    citrouilles = citrouilles + i;
  }
  Serial.println(citrouilles);
}

void loop() {}`}</CodeBlock>
    </>
  ),
  question: "Quel nombre s'affiche dans le moniteur série ?",
  Widget: SerialWidget,
  isReady: (v) => typeof v === "string" && v.trim() !== "",
  isCorrect: (v) => String(v).trim() === "13",
  show: (v) => String(v),
};

/* ------------------------------------------------------------------------ */

export const TRIALS: Trial[] = [...QCM_TRIALS, resistorTrial, blinkTrial, analogTrial, ultrasonicTrial, serialTrial];
