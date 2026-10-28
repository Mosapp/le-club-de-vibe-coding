import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/utils/cn";

/* ==================================================================
   ÉNIGME D'HALLOWEEN — porte d'entrée du site
   Le visiteur doit résoudre une énigme (acrostiche) pour entrer.
   Une fois résolue, on s'en souvient dans le navigateur.
   Attention : c'est un jeu, pas une protection (la réponse est
   dans le code). Les membres connectés et les liens reçus par mail
   (confirmation, nouveau mot de passe) ne sont jamais bloqués.
================================================================== */

const STORAGE_KEY = "cvc/halloween-gate/v1";

/* La première lettre de chaque vers forme la réponse : V-I-B-E */
const POEM = [
  "Vacille une flamme au fond de la citrouille,",
  "Invisible, je guide les doigts sur le clavier,",
  "Battement partagé quand les idées se mélangent,",
  "Entre, si tu sens ce que le club respire.",
];

const HINTS = [
  "Les fantômes cachent toujours leurs secrets au tout début des choses…",
  "Lis le poème de haut en bas, mais ne garde que la première lettre de chaque vers.",
  "C'est le mot qui manque ici : « Club de ____ Coding ».",
];

const WRONG = [
  "La porte grince… mais reste close.",
  "Un rire glacé résonne. Ce n'est pas ça.",
  "Les chauves-souris secouent la tête.",
  "La citrouille pouffe de rire. Essaie encore.",
];

function normalize(v: string) {
  return v
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "");
}

function isAnswer(v: string) {
  const n = normalize(v);
  return n === "VIBE" || n === "VIBES" || n === "LAVIBE";
}

function readUnlocked() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function saveUnlocked() {
  try {
    window.localStorage.setItem(STORAGE_KEY, "1");
  } catch {
    /* navigation privée : l'énigme sera reproposée, rien de grave */
  }
}

/** Affiche l'énigme tant qu'elle n'est pas résolue, sinon le site. */
export function HalloweenGate({ bypass = false, children }: { bypass?: boolean; children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked);
  if (unlocked || bypass) return <>{children}</>;
  return (
    <RiddleScreen
      onSolved={() => {
        saveUnlocked();
        setUnlocked(true);
      }}
    />
  );
}

/* ----------------------------- Décor ----------------------------- */

function Bat({ className, style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 32" className={cn("hw-bat", className)} style={style} aria-hidden="true">
      <path
        fill="currentColor"
        d="M32 10c-1.6 0-2.6-2.6-3.4-4.2-.6 1.8-1 3.2-2.4 3.6C22 6 15 4.6 8 6c3 1.6 4.8 4.4 4.6 7.4-3-1.4-7-1.2-10.6.6 5 1 9.4 4.2 11 8.4 2.6-2.6 7.2-3.4 10.6-1.4 1-3 4.4-5 8.4-5s7.4 2 8.4 5c3.4-2 8-1.2 10.6 1.4 1.6-4.2 6-7.4 11-8.4-3.6-1.8-7.6-2-10.6-.6-.2-3 1.6-5.8 4.6-7.4-7-1.4-14 0-18.2 3.4-1.4-.4-1.8-1.8-2.4-3.6C34.6 7.4 33.6 10 32 10Z"
      />
    </svg>
  );
}

function Pumpkin({ lit }: { lit: boolean }) {
  return (
    <svg viewBox="0 0 120 110" className={cn("hw-pumpkin", lit && "is-lit")} aria-hidden="true">
      <path d="M58 22c0-8 3-14 9-18l4 4c-5 3-7 8-7 14z" fill="#3f5b2a" />
      <ellipse cx="38" cy="64" rx="30" ry="38" fill="#d9541c" />
      <ellipse cx="82" cy="64" rx="30" ry="38" fill="#d9541c" />
      <ellipse cx="60" cy="64" rx="28" ry="42" fill="#f0662f" />
      <ellipse cx="60" cy="64" rx="12" ry="40" fill="#f57a3f" opacity=".55" />
      <g className="hw-face">
        <path d="M34 52l14-10 4 16z" />
        <path d="M86 52L72 42l-4 16z" />
        <path d="M54 66l6-8 6 8z" />
        <path d="M30 76c10 14 50 14 60 0l-6 2-4 6-6-5-8 6-8-6-6 5-4-6z" />
      </g>
    </svg>
  );
}

/* ----------------------------- Écran ----------------------------- */

function RiddleScreen({ onSolved }: { onSolved: () => void }) {
  const [value, setValue] = useState("");
  const [tries, setTries] = useState(0);
  const [hintsShown, setHintsShown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);
  const [solved, setSolved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.title = "🎃 L'énigme du Club — Club de Vibe Coding";
    // Un petit secret pour les curieux qui ouvrent la console…
    console.log(
      "%c👻 Psst… les vers du poème cachent un mot. Regarde bien leur première lettre.",
      "color:#f0662f;font-size:14px;font-weight:bold"
    );
    return () => {
      document.title = "Club de Vibe Coding — Apprends à créer avec l'IA";
    };
  }, []);

  // Un indice est offert automatiquement après 2 puis 4 erreurs.
  useEffect(() => {
    if (tries === 2 || tries === 4) setHintsShown((h) => Math.max(h, tries / 2));
  }, [tries]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (solved) return;
    if (!value.trim()) {
      setError("Murmure au moins un mot à la porte…");
      inputRef.current?.focus();
      return;
    }
    if (isAnswer(value)) {
      setError(null);
      setSolved(true);
      haptic(30);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.setTimeout(onSolved, reduce ? 300 : 1900);
      return;
    }
    haptic(60);
    setError(WRONG[tries % WRONG.length]);
    setTries((t) => t + 1);
    setShake(true);
    window.setTimeout(() => setShake(false), 500);
    inputRef.current?.select();
  };

  const initialsGlow = hintsShown >= 2;

  return (
    <main className={cn("theme-dark hw-scene relative min-h-dvh overflow-hidden text-ink", solved && "is-solved")}>
      {/* Décor */}
      <div aria-hidden="true" className="hw-stars pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="hw-moon pointer-events-none absolute" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Bat className="left-[8%] top-[14%] w-12 sm:w-16" style={{ animationDelay: "0s" }} />
        <Bat className="right-[12%] top-[22%] w-9 sm:w-12" style={{ animationDelay: "-2.4s" }} />
        <Bat className="left-[62%] top-[8%] w-7 sm:w-10" style={{ animationDelay: "-4.1s" }} />
      </div>
      <div aria-hidden="true" className="hw-fog hw-fog-1 pointer-events-none absolute inset-x-0 bottom-0" />
      <div aria-hidden="true" className="hw-fog hw-fog-2 pointer-events-none absolute inset-x-0 bottom-0" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-28 sm:w-32">
          <Pumpkin lit={solved || tries > 0 || value.length > 0} />
        </div>

        <p className="label-mono mt-6 text-center leading-relaxed text-brand-ink">Club de Vibe Coding · Nuit d'Halloween</p>
        <h1 className="mt-3 text-center text-[clamp(1.7rem,6vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.03em]">
          {solved ? (
            <>La porte s'ouvre<span className="text-gradient">…</span></>
          ) : (
            <>La porte du club est <span className="hw-flicker text-brand">scellée</span></>
          )}
        </h1>
        <p className="mt-3 max-w-sm text-center text-[15px] leading-relaxed text-muted">
          {solved
            ? "Bienvenue, âme créative. Les citrouilles t'ouvrent le chemin."
            : "Seuls ceux qui percent l'énigme peuvent entrer. Lis le grimoire, trouve le mot de passe."}
        </p>

        <section
          aria-label="Énigme"
          className={cn(
            "hw-card mt-8 w-full rounded-[22px] p-5 sm:p-7",
            shake && "hw-shake",
            solved && "hw-card-open"
          )}
        >
          <div className="flex items-center gap-2 text-faint">
            <span aria-hidden="true">📜</span>
            <span className="label-mono">Le grimoire</span>
          </div>
          <blockquote className="mt-4 space-y-1.5 font-serif text-[clamp(1.05rem,4.2vw,1.3rem)] italic leading-snug text-ink-2">
            {POEM.map((line) => (
              <p key={line}>
                <span className={cn("hw-initial", initialsGlow && "is-glow")}>{line[0]}</span>
                {line.slice(1)}
              </p>
            ))}
          </blockquote>
          <p className="mt-4 text-[13.5px] text-muted">Quel mot ouvre la porte&nbsp;?</p>

          <form onSubmit={submit} className="mt-3 flex flex-col gap-3 sm:flex-row" noValidate>
            <label htmlFor="hw-answer" className="sr-only">
              Ta réponse
            </label>
            <input
              id="hw-answer"
              ref={inputRef}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                if (error) setError(null);
              }}
              disabled={solved}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="Murmure le mot…"
              aria-invalid={!!error}
              aria-describedby="hw-feedback"
              className="h-12 min-w-0 flex-1 rounded-xl border border-line bg-[#0a1017] px-4 text-[16px] tracking-[0.08em] text-ink placeholder:tracking-normal placeholder:text-faint focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={solved}
              className="hw-btn inline-flex h-12 items-center justify-center gap-2 rounded-xl px-5 text-[15px] font-semibold text-white disabled:opacity-80"
            >
              {solved ? "Bienvenue 🦇" : "Ouvrir la porte 🗝️"}
            </button>
          </form>

          <p id="hw-feedback" role="status" aria-live="polite" className="mt-3 min-h-[1.25rem] text-[13.5px]">
            {error && <span className="text-[#fca5a5]">{error}</span>}
            {solved && <span className="text-[#86efac]">Bravo ! L'énigme est résolue. 🎉</span>}
          </p>

          {/* Indices */}
          {!solved && (
            <div className="mt-4 border-t border-line pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="label-mono text-faint">
                  Indices · {hintsShown}/{HINTS.length}
                </span>
                {hintsShown < HINTS.length && (
                  <button
                    type="button"
                    onClick={() => setHintsShown((h) => Math.min(h + 1, HINTS.length))}
                    className="rounded-full border border-line px-3.5 py-2 text-[13px] font-medium text-ink-2 transition-colors hover:border-brand hover:text-brand-ink"
                  >
                    🕯️ Invoquer un indice
                  </button>
                )}
              </div>
              {hintsShown > 0 && (
                <ol className="mt-3 space-y-2">
                  {HINTS.slice(0, hintsShown).map((hint, i) => (
                    <li key={hint} className="hw-hint anim-pop flex gap-3 rounded-xl p-3 text-[14px] leading-relaxed text-ink-2">
                      <span aria-hidden="true">{["👻", "🕸️", "🎃"][i]}</span>
                      <span>{hint}</span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </section>

        <p className="mt-6 text-center text-[12px] text-faint">
          Déjà membre ?{" "}
          <a href="#/login" className="underline decoration-dotted underline-offset-4 hover:text-brand-ink">
            Connecte-toi
          </a>{" "}
          pour passer directement.
        </p>
      </div>
    </main>
  );
}
