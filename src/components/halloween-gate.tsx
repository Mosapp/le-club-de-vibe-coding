import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { haptic } from "@/lib/haptics";
import { cn } from "@/utils/cn";
import { LETTERS, TRIALS, VAULT_CODE, type Answer, type Trial } from "@/components/halloween-trials";
import { HalloweenUltimate } from "@/components/halloween-ultimate";
import { finishAttempt, startPlayer } from "@/lib/halloween";

/* ==================================================================
   🎃 HALLOWEEN CODE MYSTERY — « Le secret du code maudit »
   Porte d'entrée du site : 10 épreuves à résoudre dans l'ordre
   (les épreuves sont dans halloween-trials.tsx, le coffre ici).
   - Il faut au moins PASS_SCORE/10 (5/10) pour entrer sur le site.
   - 10 tentatives maximum ; après 10 échecs, le site reste fermé.
   - Dans une tentative, une réponse validée est définitive et on ne
     dit pas quelles réponses sont fausses (seulement le score).
   - Dès qu'une tentative atteint le seuil, la personne entre : pas de
     nouvelle tentative pour améliorer son score.
   - La progression est gardée dans le navigateur : recharger la page
     ne remet ni le chrono, ni les réponses, ni les tentatives à zéro.
   - En cas de réussite, la personne reçoit un récapitulatif à envoyer
     à l'organisateur, puis elle entre sur le site.
   - Quand Supabase est en place (supabase/migration-halloween.sql),
     le serveur a le dernier mot : un nom = une seule participation,
     10 tentatives comptées côté serveur. Sans lui, le jeu reste local.
   - Une fois sur le site : mot de bienvenue + fragment de la phrase
     secrète, puis l'épreuve ultime (halloween-ultimate.tsx).
   Attention : les réponses des 10 épreuves sont dans le code du site ;
   seul le lien du trésor est vraiment caché (sur le serveur). Les membres connectés et les liens reçus par mail
   (confirmation, nouveau mot de passe) ne sont jamais bloqués.
================================================================== */

const STORAGE_KEY = "cvc/halloween-mystery/v3";

const TOTAL = TRIALS.length + 1;
const MAX_ATTEMPTS = 10;
/** score minimum (sur TOTAL) pour entrer sur le site */
const PASS_SCORE = 5;

const RULES = [
  "Chaque participant doit résoudre les épreuves dans l'ordre.",
  `Le site du club ne s'ouvre qu'aux détectives qui obtiennent au moins ${PASS_SCORE}/${TOTAL}.`,
  `Une seule participation par personne, ${MAX_ATTEMPTS} tentatives maximum. Après ${MAX_ATTEMPTS} échecs, le coffre se scelle pour toujours.`,
  "Une fois sur le site, chaque détective reçoit un fragment de la phrase secrète : l'épreuve ultime se gagne en équipe.",
  "Le gagnant sera déterminé selon les règles annoncées par l'organisateur : bonnes réponses et, en cas d'égalité, rapidité de participation.",
  "La date limite et les modalités de remise du prix seront communiquées par le club.",
];

type Progress = {
  name: string;
  /** début de la toute première tentative */
  firstStartedAt: number;
  /** numéro de la tentative en cours (1 à MAX_ATTEMPTS) */
  attempt: number;
  /** scores des tentatives ratées */
  history: number[];
  /** début de la tentative en cours */
  startedAt: number;
  answers: Answer[];
  vault?: string;
  finishedAt?: number;
  entered?: boolean;
  /** le serveur refuse toute nouvelle tentative */
  blocked?: boolean;
  /** le mot de bienvenue de l'épreuve ultime a déjà été montré */
  welcomed?: boolean;
};

function load(): Progress | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Progress) : null;
  } catch {
    return null;
  }
}

function save(p: Progress) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* navigation privée : la progression ne sera pas gardée, rien de grave */
  }
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} min ${String(s % 60).padStart(2, "0")} s` : `${s} s`;
}

function scoreOf(p: Progress) {
  const good = p.answers.filter((a, i) => TRIALS[i].isCorrect(a)).length;
  return good + (p.vault === VAULT_CODE ? 1 : 0);
}

function isSuccess(p: Progress) {
  return !!p.finishedAt && !p.blocked && scoreOf(p) >= PASS_SCORE;
}

/** Affiche le jeu tant que la personne n'a pas réussi, sinon le site. */
export function HalloweenGate({ bypass = false, children }: { bypass?: boolean; children: ReactNode }) {
  const [progress, setProgress] = useState<Progress | null>(load);
  const change = (p: Progress) => {
    save(p);
    setProgress(p);
  };
  // Réponse du serveur arrivée après coup : on repart de l'état le plus récent.
  const patch = (fn: (p: Progress) => Progress) =>
    setProgress((prev) => {
      if (!prev) return prev;
      const next = fn(prev);
      save(next);
      return next;
    });

  const played = !!progress?.entered && isSuccess(progress);
  if (bypass || played) {
    return (
      <>
        {children}
        {played && progress && (
          <HalloweenUltimate name={progress.name} autoOpen={!progress.welcomed} onSeen={() => patch((p) => ({ ...p, welcomed: true }))} />
        )}
      </>
    );
  }
  return <MysteryScreen progress={progress} onChange={change} onPatch={patch} />;
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

function Scenery() {
  return (
    <>
      <div aria-hidden="true" className="hw-stars pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="hw-moon pointer-events-none absolute" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <Bat className="left-[8%] top-[14%] w-12 sm:w-16" style={{ animationDelay: "0s" }} />
        <Bat className="right-[12%] top-[22%] w-9 sm:w-12" style={{ animationDelay: "-2.4s" }} />
        <Bat className="left-[62%] top-[8%] w-7 sm:w-10" style={{ animationDelay: "-4.1s" }} />
      </div>
      <div aria-hidden="true" className="hw-fog hw-fog-1 pointer-events-none absolute inset-x-0 bottom-0" />
      <div aria-hidden="true" className="hw-fog hw-fog-2 pointer-events-none absolute inset-x-0 bottom-0" />
    </>
  );
}

/* ----------------------------- Écran ----------------------------- */

function MysteryScreen({
  progress,
  onChange,
  onPatch,
}: {
  progress: Progress | null;
  onChange: (p: Progress) => void;
  onPatch: (fn: (p: Progress) => Progress) => void;
}) {
  const topRef = useRef<HTMLDivElement>(null);
  const step = !progress ? -1 : progress.finishedAt ? TOTAL : progress.answers.length;

  useEffect(() => {
    document.title = "🎃 Halloween Code Mystery — Club de Vibe Coding";
    return () => {
      document.title = "Club de Vibe Coding — Apprends à créer avec l'IA";
    };
  }, []);

  // À chaque nouvelle épreuve, on remonte en haut de la carte.
  useEffect(() => {
    if (step <= 0) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const el = topRef.current;
    if (!el) return;
    // window.scrollTo (et non scrollIntoView) : jamais de décalage horizontal sur mobile
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 16, behavior: reduce ? "auto" : "smooth" });
  }, [step]);

  return (
    <main className="theme-dark hw-scene relative min-h-dvh overflow-clip text-ink">
      <Scenery />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-xl flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-24 sm:w-28">
          <Pumpkin lit={step >= 0} />
        </div>

        <p className="label-mono mt-5 text-center leading-relaxed text-brand-ink">
          🎃 Halloween Code Mystery · Club de Vibe Coding du LPELIA
        </p>
        <h1 className="mt-3 text-center text-[clamp(1.7rem,6.5vw,2.6rem)] font-bold leading-[1.1] tracking-[-0.03em]">
          Le secret du <span className="hw-flicker text-brand">code maudit</span>
        </h1>

        <div ref={topRef} className="w-full" />

        {progress && step >= 0 && step < TOTAL && (
          <>
            <Steps current={step} />
            <p className="label-mono mt-3 text-faint">
              Tentative {progress.attempt} / {MAX_ATTEMPTS}
            </p>
          </>
        )}

        {step === -1 && (
          <Intro
            onStart={async (name) => {
              const r = await startPlayer(name);
              if (!r.ok && r.reason === "name_taken")
                return "Ce nom a déjà participé au Halloween Code Mystery : une seule participation par personne.";
              if (!r.ok && r.reason === "name_invalid") return "Ce nom n'est pas valide. Écris ton prénom et ton nom.";
              // Serveur indisponible : on joue quand même, en local.
              const done = r.ok ? r.data.attempts : 0;
              const now = Date.now();
              const fresh: Progress = { name, firstStartedAt: now, attempt: Math.min(done + 1, MAX_ATTEMPTS), history: [], startedAt: now, answers: [] };
              if (r.ok && !r.data.passed && done >= MAX_ATTEMPTS) {
                onChange({ ...fresh, finishedAt: now, blocked: true });
              } else {
                onChange(fresh);
              }
              return null;
            }}
          />
        )}

        {progress && step >= 0 && step < TRIALS.length && (
          <TrialCard
            key={step}
            index={step}
            trial={TRIALS[step]}
            onAnswer={(choice) => onChange({ ...progress, answers: [...progress.answers, choice] })}
          />
        )}

        {progress && step === TRIALS.length && (
          <VaultCard
            onSubmit={(code) => {
              const done: Progress = { ...progress, vault: code, finishedAt: Date.now() };
              onChange(done);
              // Le serveur compte la tentative ; s'il la refuse, le coffre se scelle.
              void finishAttempt(scoreOf(done)).then((r) => {
                if (!r.ok && r.reason === "no_attempts_left") onPatch((p) => ({ ...p, blocked: true }));
              });
            }}
          />
        )}

        {progress && step === TOTAL && (
          <ResultCard
            progress={progress}
            onEnter={() => onChange({ ...progress, entered: true })}
            onRetry={() =>
              onChange({
                ...progress,
                attempt: progress.attempt + 1,
                history: [...progress.history, scoreOf(progress)],
                startedAt: Date.now(),
                answers: [],
                vault: undefined,
                finishedAt: undefined,
              })
            }
          />
        )}

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

function Steps({ current }: { current: number }) {
  return (
    <ol className="mt-6 flex flex-wrap items-center justify-center gap-1.5" aria-label={`Épreuve ${current + 1} sur ${TOTAL}`}>
      {Array.from({ length: TOTAL }, (_, i) => (
        <li
          key={i}
          aria-hidden="true"
          className={cn(
            "h-1.5 rounded-full transition-all duration-500",
            i < current ? "w-4 bg-brand sm:w-6" : i === current ? "w-8 bg-brand-ink sm:w-10" : "w-4 bg-line sm:w-6"
          )}
        />
      ))}
    </ol>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("hw-card anim-pop mt-6 w-full rounded-[22px] p-5 sm:p-7", className)}>{children}</section>;
}

/* ---- Intro : histoire, récompense, règles, prénom ---- */

function Intro({ onStart }: { onStart: (name: string) => Promise<string | null> }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    if (name.trim().length < 2) {
      setError("Indique ton nom pour que le club puisse te retrouver.");
      return;
    }
    haptic(20);
    setBusy(true);
    const err = await onStart(name.trim().replace(/\s+/g, " "));
    setBusy(false);
    if (err) setError(err);
  };

  return (
    <Card>
      <p className="text-[15px] leading-relaxed text-ink-2">
        Une mystérieuse entité a piraté le site du club et enfermé une récompense dans un{" "}
        <b className="text-ink">coffre numérique</b>. Pour la récupérer, tu dois réussir{" "}
        <b className="text-ink">dix épreuves</b> (logique, code, électronique et Arduino), découvrir les indices cachés et déverrouiller le coffre.
        Le site ne s'ouvre qu'à partir de{" "}
        <b className="text-ink">
          {PASS_SCORE}/{TOTAL}
        </b>
        , et tu n'as que <b className="text-ink">{MAX_ATTEMPTS} tentatives</b>.
      </p>

      <div className="hw-reward mt-5 flex items-start gap-3 rounded-xl p-4">
        <span className="text-2xl" aria-hidden="true">🏆</span>
        <p className="text-[14.5px] leading-relaxed">
          <span className="label-mono block text-brand-ink">Récompense</span>
          <span className="mt-1.5 block font-semibold text-ink">Une semaine d'abonnement gratuit à Claude AI.</span>
        </p>
      </div>

      <details className="hw-rules mt-4 rounded-xl border border-line p-4">
        <summary className="cursor-pointer select-none text-[14px] font-semibold text-ink">📜 Règles du concours</summary>
        <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-[13.5px] leading-relaxed text-muted">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </details>

      <form onSubmit={submit} className="mt-5" noValidate>
        <label htmlFor="hw-name" className="text-[13.5px] text-muted">
          Ton prénom et ton nom, détective (pour le classement)
        </label>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <input
            id="hw-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            maxLength={60}
            autoComplete="name"
            placeholder="Ex. : Awa Diallo"
            aria-invalid={!!error}
            aria-describedby="hw-name-error"
            className="hw-input h-12 min-w-0 rounded-xl px-4 text-[16px] sm:flex-1"
          />
          <button
            type="submit"
            disabled={busy}
            className="hw-btn inline-flex h-12 items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Vérification…" : "Commencer l'enquête 🔦"}
          </button>
        </div>
        <p id="hw-name-error" role="status" aria-live="polite" className="mt-2 min-h-[1.1rem] text-[13px] text-[#fca5a5]">
          {error}
        </p>
        <p className="text-[12.5px] leading-relaxed text-faint">
          ⏱️ Le chrono démarre dès que tu commences. Dans une tentative, chaque réponse validée est définitive.
        </p>
      </form>
    </Card>
  );
}

/* ---- Épreuves 1 à 9 (QCM et épreuves interactives) ---- */

function TrialCard({ index, trial, onAnswer }: { index: number; trial: Trial; onAnswer: (value: Answer) => void }) {
  const [value, setValue] = useState<Answer | undefined>(undefined);
  const [locking, setLocking] = useState(false);
  const ready = trial.isReady(value);
  const { Widget } = trial;

  const confirm = () => {
    if (!ready || value === undefined || locking) return;
    haptic(20);
    setLocking(true);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.setTimeout(() => onAnswer(value), reduce ? 0 : 450);
  };

  return (
    <Card className={cn(locking && "hw-sealing")}>
      <div className="flex items-center gap-2 text-faint">
        <span aria-hidden="true">{trial.icon}</span>
        <span className="label-mono">
          Épreuve {index + 1} / {TOTAL}
        </span>
      </div>
      <h2 className="mt-2 text-[clamp(1.25rem,5vw,1.55rem)] font-bold leading-tight text-ink">{trial.title}</h2>
      <div className="mt-4 text-[15px] leading-relaxed text-ink-2">{trial.intro}</div>

      <fieldset className="mt-5 min-w-0">
        <legend className="text-[15px] font-semibold text-ink">{trial.question}</legend>
        <div className="mt-3">
          <Widget value={value} onChange={setValue} disabled={locking} />
        </div>
      </fieldset>

      <button
        type="button"
        onClick={confirm}
        disabled={!ready || locking}
        className="hw-btn mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {locking
          ? "Réponse scellée… 🕯️"
          : !ready
            ? "Complète ta réponse"
            : typeof value === "number" && "choices" in trial
              ? `Valider la réponse ${LETTERS[value]}`
              : "Valider ma réponse"}
      </button>
    </Card>
  );
}

/* ---- Épreuve 10 : le coffre ---- */

function VaultCard({ onSubmit }: { onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!/^\d{4}$/.test(code)) {
      setError(true);
      return;
    }
    haptic(30);
    onSubmit(code);
  };

  return (
    <Card>
      <div className="flex items-center gap-2 text-faint">
        <span aria-hidden="true">🔐</span>
        <span className="label-mono">
          Épreuve {TOTAL} / {TOTAL}
        </span>
      </div>
      <h2 className="mt-2 text-[clamp(1.25rem,5vw,1.55rem)] font-bold leading-tight text-ink">Le coffre maudit</h2>
      <p className="mt-4 text-[15px] leading-relaxed text-ink-2">
        Tu as terminé les neuf premières épreuves. Tu dois maintenant entrer le code final. Pour le former, récupère les
        chiffres associés aux <b className="text-ink">bonnes réponses des épreuves 1 à 4</b> :
      </p>
      <ul className="mt-3 space-y-1.5 text-[14px] leading-relaxed text-muted">
        <li>• Épreuve 1 : position de la bonne réponse parmi A, B, C, D.</li>
        <li>• Épreuve 2 : position de la bonne réponse parmi A, B, C, D.</li>
        <li>• Épreuve 3 : position de la bonne réponse parmi A, B, C.</li>
        <li>• Épreuve 4 : position de la bonne réponse parmi A, B, C, D.</li>
      </ul>
      <p className="mt-3 text-[13.5px] text-faint">Exemple : A = 1, B = 2, C = 3, D = 4. Entre les quatre chiffres dans l'ordre.</p>

      <form onSubmit={submit} className="mt-5" noValidate>
        <label htmlFor="hw-vault" className="sr-only">
          Code du coffre (4 chiffres)
        </label>
        <input
          id="hw-vault"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError(false);
          }}
          inputMode="numeric"
          autoComplete="off"
          placeholder="• • • •"
          aria-invalid={error}
          aria-describedby="hw-vault-error"
          className="hw-input hw-vault h-16 w-full rounded-xl text-center font-mono text-[28px] tracking-[0.6em]"
        />
        <p id="hw-vault-error" role="status" aria-live="polite" className="mt-2 min-h-[1.1rem] text-[13px] text-[#fca5a5]">
          {error && "Le coffre attend exactement 4 chiffres."}
        </p>
        <button
          type="submit"
          className="hw-btn mt-1 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-white"
        >
          Tenter d'ouvrir le coffre 🗝️
        </button>
        <p className="mt-3 text-center text-[12.5px] text-faint">⚠️ Un seul essai pour ce code dans cette tentative : vérifie bien.</p>
      </form>
    </Card>
  );
}

/* ---- Résultat : réussite (récapitulatif + entrée), échec (nouvelle tentative) ou coffre scellé ---- */

function ResultCard({ progress, onEnter, onRetry }: { progress: Progress; onEnter: () => void; onRetry: () => void }) {
  const score = scoreOf(progress);
  const success = score >= PASS_SCORE && !progress.blocked;
  const left = MAX_ATTEMPTS - progress.attempt;

  if (!success) {
    const sealed = left <= 0 || !!progress.blocked;
    return (
      <Card>
        <div className="text-center">
          <span className="text-5xl" aria-hidden="true">
            {sealed ? "⚰️" : "🔒"}
          </span>
          <h2 className="mt-3 text-[clamp(1.35rem,5.5vw,1.75rem)] font-bold leading-tight text-ink">
            {sealed ? "Le coffre est scellé pour toujours…" : "Le coffre reste scellé…"}
          </h2>
          <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-muted">
            {sealed
              ? `Tes ${MAX_ATTEMPTS} tentatives sont épuisées. L'entité garde le site du club dans l'ombre.`
              : `L'entité ricane : il te faut au moins ${PASS_SCORE}/${TOTAL} pour entrer. Elle ne te dira pas quelles réponses sont fausses…`}
          </p>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-2.5 text-center">
          <div className="hw-stat rounded-xl p-3">
            <dt className="label-mono text-faint">Score</dt>
            <dd className="mt-2 text-2xl font-bold text-ink">
              {score}/{TOTAL}
            </dd>
          </div>
          <div className="hw-stat rounded-xl p-3">
            <dt className="label-mono text-faint">Tentatives restantes</dt>
            <dd className={cn("mt-2 text-2xl font-bold", sealed ? "text-[#fca5a5]" : "text-ink")}>{sealed ? 0 : left}</dd>
          </div>
        </dl>

        {progress.history.length > 0 && (
          <p className="mt-3 text-center text-[13px] text-faint">
            Scores précédents : {progress.history.map((h) => `${h}/${TOTAL}`).join(" · ")}
          </p>
        )}

        {sealed ? (
          <p className="mt-5 text-center text-[13px] leading-relaxed text-faint">
            Si tu penses qu'il y a une erreur, contacte l'organisateur du club.
          </p>
        ) : (
          <button
            type="button"
            onClick={() => {
              haptic(20);
              onRetry();
            }}
            className="hw-btn mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-white"
          >
            Recommencer · tentative {progress.attempt + 1}/{MAX_ATTEMPTS} 🔁
          </button>
        )}
      </Card>
    );
  }

  return <SuccessCard progress={progress} onEnter={onEnter} />;
}

function SuccessCard({ progress, onEnter }: { progress: Progress; onEnter: () => void }) {
  const [copied, setCopied] = useState(false);
  const score = scoreOf(progress);
  const perfect = score === TOTAL;
  const end = progress.finishedAt ?? Date.now();
  const duration = formatDuration(end - progress.startedAt);
  const total = formatDuration(end - progress.firstStartedAt);
  const date = new Date(end).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "medium" });

  const summary = [
    "🎃 Halloween Code Mystery — Club de Vibe Coding du LPELIA",
    `Détective : ${progress.name}`,
    `Score : ${score}/${TOTAL} à la tentative ${progress.attempt}/${MAX_ATTEMPTS}`,
    ...(progress.history.length ? [`Scores des tentatives ratées : ${progress.history.map((h) => `${h}/${TOTAL}`).join(", ")}`] : []),
    `Temps de la tentative : ${duration}`,
    `Temps total depuis le début : ${total}`,
    `Terminé le : ${date}`,
  ].join("\n");

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(summary);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* presse-papiers indisponible : le texte reste visible à l'écran */
    }
  };

  return (
    <Card className="hw-card-open">
      <div className="text-center">
        <span className="text-5xl" aria-hidden="true">
          {perfect ? "🏆" : "🎃"}
        </span>
        <h2 className="mt-3 text-[clamp(1.35rem,5.5vw,1.75rem)] font-bold leading-tight text-ink">
          {perfect ? "Le coffre s'ouvre !" : "La porte du club s'entrouvre !"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-[14.5px] leading-relaxed text-muted">
          {perfect
            ? "Bravo détective, tu as brisé le code maudit. Envoie vite ta participation au club, puis entre sur le site !"
            : `Tu as obtenu au moins ${PASS_SCORE}/${TOTAL} : le site du club t'est ouvert. Envoie ta participation au club, puis entre !`}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-2 gap-2.5 text-center">
        <div className="hw-stat rounded-xl p-3">
          <dt className="label-mono text-faint">Score</dt>
          <dd className="mt-2 text-2xl font-bold text-ink">
            {score}/{TOTAL}
          </dd>
          <dd className="mt-1 text-[12px] text-faint">
            tentative {progress.attempt}/{MAX_ATTEMPTS}
          </dd>
        </div>
        <div className="hw-stat rounded-xl p-3">
          <dt className="label-mono text-faint">Temps total</dt>
          <dd className="mt-2 text-2xl font-bold text-ink">{total}</dd>
        </div>
      </dl>

      <pre className="hw-pre mt-4 whitespace-pre-wrap break-words rounded-xl p-4 text-[12.5px] leading-relaxed">{summary}</pre>

      <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
        <a
          href={`https://wa.me/?text=${encodeURIComponent(summary)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="hw-btn inline-flex h-12 items-center justify-center rounded-xl px-4 text-[14.5px] font-semibold text-white"
        >
          Envoyer sur WhatsApp
        </a>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-line px-4 text-[14.5px] font-semibold text-ink-2 transition-colors hover:border-brand hover:text-brand-ink"
        >
          {copied ? "Copié ✓" : "Copier le récapitulatif"}
        </button>
      </div>
      <p className="mt-3 text-center text-[12.5px] leading-relaxed text-faint">
        Envoie ce récapitulatif à l'organisateur du club : c'est lui qui fait foi pour le classement.
      </p>

      <button
        type="button"
        onClick={onEnter}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl border border-brand/50 px-5 text-[15px] font-semibold text-brand-ink transition-colors hover:bg-brand-soft"
      >
        Entrer sur le site du club →
      </button>
    </Card>
  );
}
