import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import { buildSingleTrial, buildThemedGame, LETTERS, type Answer, type Trial } from "@/components/halloween-trials";
import { CHRISTMAS_THEME, NEW_YEAR_THEME } from "@/components/festive/themes";
import { FESTIVE_WINDOWS, NEW_YEAR, decemberDay, festiveNow, isOpen, previewDate, rememberPreview, useHashTick } from "@/config/festive";
import {
  festiveLeaderboard,
  festiveMine,
  festiveStart,
  festiveSubmit,
  loadLocal,
  roundSeed,
  saveLocal,
  type FestiveGame,
  type FestiveLocal,
  type LeaderRow,
} from "@/lib/festive";
import { haptic } from "@/lib/haptics";
import { navigate } from "@/lib/router";
import { cn } from "@/utils/cn";

/* ==================================================================
   🎄 JEUX DES FÊTES — page #/fetes
   - Calendrier de l'Avent : 1 énigme par jour (1er → 24 déc.), 1 point par bonne réponse
   - La hotte piratée : 9 épreuves + coffre, 3 tentatives, meilleur score retenu
   - Défi du Nouvel An : 5 énigmes, 1 essai, compte à rebours et feu d'artifice
   - Classements (Supabase : supabase/migration-fetes.sql)
   Le site reste libre d'accès : ces jeux sont un bonus.
================================================================== */

type Tab = "avent" | "hotte" | "nouvel_an" | "classement";

const fmtDate = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "long" });

function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(s / 60);
  return m > 0 ? `${m} min ${String(s % 60).padStart(2, "0")} s` : `${s} s`;
}

export default function FestivePage() {
  useHashTick();
  const preview = previewDate();
  const now = festiveNow();
  const [local, setLocal] = useState<FestiveLocal>(loadLocal);
  const [online, setOnline] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>(() =>
    isOpen(FESTIVE_WINDOWS.nouvelAn, now) ? "nouvel_an" : isOpen(FESTIVE_WINDOWS.hotte, now) ? "hotte" : "avent"
  );

  useEffect(() => {
    rememberPreview();
  }, [preview]);

  useEffect(() => {
    document.title = "🎄 Jeux des fêtes — Club de Vibe Coding";
  }, []);

  // Appareil déjà connu du serveur : on retrouve le nom sans le redemander.
  useEffect(() => {
    if (local.name) return;
    void festiveStart("").then((r) => {
      if (r.ok && r.data.name) update((p) => ({ ...p, name: r.data.name }));
    });
  }, []); // une fois à l'ouverture

  // Retrouve les résultats déjà enregistrés sur le serveur (autre onglet, données effacées…)
  useEffect(() => {
    if (!local.name) return;
    void festiveMine().then((r) => {
      setOnline(r.ok || r.reason !== "offline");
      if (!r.ok) return;
      setLocal((prev) => {
        const results = { ...prev.results };
        for (const x of r.data) results[`${x.game}:${x.round}`] = { score: x.score, max: x.max };
        const next = { ...prev, results };
        saveLocal(next);
        return next;
      });
    });
  }, [local.name]);

  const update = (fn: (p: FestiveLocal) => FestiveLocal) =>
    setLocal((prev) => {
      const next = fn(prev);
      saveLocal(next);
      return next;
    });

  const record = async (game: FestiveGame, round: string, score: number, max: number, durationMs: number) => {
    update((p) => ({ ...p, results: { ...p.results, [`${game}:${round}`]: { score, max } } }));
    if (preview) return;
    const r = await festiveSubmit(game, round, score, durationMs);
    if (!r.ok && r.reason === "offline") setOnline(false);
  };

  const outOfSeason = !isOpen(FESTIVE_WINDOWS.all, now);

  return (
    <main className="theme-dark xm-scene relative min-h-dvh overflow-clip pb-28 text-ink">
      <div className="relative z-10 mx-auto w-full max-w-3xl px-4 pt-6 sm:px-6">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={() => navigate("/")} className="rounded-full border border-line px-3.5 py-2 text-[13px] text-ink-2 hover:border-brand">
            ← Retour au site
          </button>
          {local.name && (
            <span className="truncate text-[13px] text-muted">
              🎅 <b className="text-ink">{local.name}</b>
            </span>
          )}
        </div>

        <header className="mt-8 text-center">
          <p className="label-mono text-[#ffd36b]">Club de Vibe Coding du LPELIA · Fêtes {new Date(FESTIVE_WINDOWS.all.from).getFullYear()}</p>
          <h1 className="mt-3 text-[clamp(2rem,7vw,3rem)] font-bold leading-[1.05] tracking-[-0.03em]">
            Les jeux <span className="xm-gold">des fêtes</span> 🎄
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[15px] leading-relaxed text-muted">
            Une énigme par jour jusqu'à Noël, la hotte piratée du Père Noël, puis le défi du Nouvel An. Grimpe dans les classements !
          </p>
        </header>

        {preview && (
          <p className="xm-preview mt-5 rounded-xl px-4 py-3 text-center text-[13px]">
            👀 Mode aperçu au <b>{fmtDate(preview)}</b> : rien n'est enregistré sur le serveur.
          </p>
        )}
        {online === false && !preview && (
          <p className="xm-preview mt-5 rounded-xl px-4 py-3 text-center text-[13px]">
            Les classements ne sont pas encore ouverts : tes réponses sont gardées sur cet appareil.
          </p>
        )}

        {outOfSeason ? (
          <Section>
            <p className="text-center text-[15px] leading-relaxed text-ink-2">
              Les jeux des fêtes ouvrent le <b className="text-ink">{fmtDate(FESTIVE_WINDOWS.all.from)}</b> et se terminent le{" "}
              {fmtDate(FESTIVE_WINDOWS.all.to - 1)}. À bientôt ❄️
            </p>
          </Section>
        ) : !local.name ? (
          <NameForm onDone={(name) => update((p) => ({ ...p, name }))} />
        ) : (
          <>
            <nav className="xm-tabs mt-7 grid grid-cols-4 gap-1 rounded-2xl p-1" aria-label="Jeux">
              {(
                [
                  ["avent", "🎁", "Calendrier"],
                  ["hotte", "🛷", "Hotte"],
                  ["nouvel_an", "🎆", "Nouvel An"],
                  ["classement", "🏆", "Classement"],
                ] as const
              ).map(([id, icon, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={tab === id ? "page" : undefined}
                  className={cn("rounded-xl px-1 py-2.5 text-[12.5px] font-semibold sm:text-[14px]", tab === id ? "xm-tab-on" : "text-muted hover:text-ink")}
                >
                  <span className="block text-[18px]" aria-hidden="true">
                    {icon}
                  </span>
                  {label}
                </button>
              ))}
            </nav>

            {tab === "avent" && <Advent now={now} local={local} record={record} />}
            {tab === "hotte" && <Hotte now={now} local={local} record={record} />}
            {tab === "nouvel_an" && <NewYear now={now} local={local} record={record} />}
            {tab === "classement" && <Leaderboards me={local.name} preview={!!preview} />}
          </>
        )}
      </div>
    </main>
  );
}

type Recorder = (game: FestiveGame, round: string, score: number, max: number, durationMs: number) => Promise<void>;

function Section({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("hw-card anim-pop mt-6 w-full rounded-[22px] p-5 sm:p-7", className)}>{children}</section>;
}

/* ------------------------------ Prénom ------------------------------ */

function NameForm({ onDone }: { onDone: (name: string) => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const clean = name.trim().replace(/\s+/g, " ");
    if (clean.length < 2) return setError("Indique ton prénom et ton nom pour le classement.");
    setBusy(true);
    const r = await festiveStart(clean);
    setBusy(false);
    if (!r.ok && r.reason === "name_taken") return setError("Ce nom joue déjà sur un autre appareil : un nom = un joueur.");
    if (!r.ok && r.reason === "name_invalid") return setError("Ce nom n'est pas valide.");
    haptic(20);
    onDone(r.ok ? r.data.name : clean);
  };

  return (
    <Section>
      <form onSubmit={submit} noValidate>
        <label htmlFor="xm-name" className="text-[15px] font-semibold text-ink">
          Ton prénom et ton nom, lutin codeur 🧝
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <input
            id="xm-name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError(null);
            }}
            maxLength={60}
            autoComplete="name"
            placeholder="Ex. : Awa Diallo"
            className="hw-input h-12 min-w-0 rounded-xl px-4 text-[16px] sm:flex-1"
          />
          <button type="submit" disabled={busy} className="hw-btn h-12 rounded-xl px-5 text-[15px] font-semibold text-white disabled:opacity-60">
            {busy ? "Vérification…" : "Entrer dans l'atelier 🎅"}
          </button>
        </div>
        <p role="status" aria-live="polite" className="mt-2 min-h-[1.1rem] text-[13px] text-[#fca5a5]">
          {error}
        </p>
        <p className="text-[12.5px] text-faint">Un seul nom par personne : c'est lui qui apparaîtra dans les classements.</p>
      </form>
    </Section>
  );
}

/* --------------------------- Une énigme --------------------------- */

function TrialPlayer({
  trial,
  label,
  onAnswer,
}: {
  trial: Trial;
  label: string;
  onAnswer: (value: Answer) => void;
}) {
  const [value, setValue] = useState<Answer | undefined>(undefined);
  const [locking, setLocking] = useState(false);
  const ready = trial.isReady(value);
  const { Widget } = trial;
  return (
    <div className={cn(locking && "hw-sealing")}>
      <div className="flex items-center gap-2 text-faint">
        <span aria-hidden="true">{trial.icon}</span>
        <span className="label-mono">{label}</span>
      </div>
      <h3 className="mt-2 text-[clamp(1.2rem,5vw,1.5rem)] font-bold leading-tight text-ink">{trial.title}</h3>
      <div className="mt-4 text-[15px] leading-relaxed text-ink-2">{trial.intro}</div>
      <fieldset className="mt-5 min-w-0">
        <legend className="text-[15px] font-semibold text-ink">{trial.question}</legend>
        <div className="mt-3">
          <Widget value={value} onChange={setValue} disabled={locking} />
        </div>
      </fieldset>
      <button
        type="button"
        disabled={!ready || locking}
        onClick={() => {
          if (value === undefined) return;
          haptic(20);
          setLocking(true);
          window.setTimeout(() => onAnswer(value), 350);
        }}
        className="hw-btn mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45"
      >
        {locking ? "Réponse envoyée… ✨" : ready ? "Valider ma réponse" : "Complète ta réponse"}
      </button>
    </div>
  );
}

/* ------------------------ Calendrier de l'Avent ------------------------ */

function Advent({ now, local, record }: { now: number; local: FestiveLocal; record: Recorder }) {
  const [day, setDay] = useState<number | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [feedback, setFeedback] = useState<{ day: number; ok: boolean } | null>(null);
  const today = decemberDay(now);
  const open = isOpen(FESTIVE_WINDOWS.avent, now);
  const offset = useMemo(() => roundSeed("avent", "ordre") % 9, []);
  const points = Object.entries(local.results).filter(([k, v]) => k.startsWith("avent:") && v.score > 0).length;

  const trial = useMemo(
    () => (day ? buildSingleTrial(roundSeed("avent", `d${day}`), day - 1 + offset, CHRISTMAS_THEME) : null),
    [day, offset]
  );

  if (trial && day) {
    return (
      <Section>
        <button type="button" onClick={() => setDay(null)} className="mb-4 text-[13px] text-muted hover:text-ink">
          ← Retour au calendrier
        </button>
        <TrialPlayer
          trial={trial}
          label={`Case du ${day} décembre`}
          onAnswer={(v) => {
            const ok = trial.isCorrect(v);
            void record("avent", `d${day}`, ok ? 1 : 0, 1, Date.now() - startedAt);
            setFeedback({ day, ok });
            setDay(null);
          }}
        />
      </Section>
    );
  }

  return (
    <Section>
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[clamp(1.3rem,5vw,1.7rem)] font-bold">🎁 Calendrier de l'Avent du codeur</h2>
          <p className="mt-1 text-[14px] text-muted">Une énigme par jour. Une seule réponse par case : 1 point si elle est juste.</p>
        </div>
        <p className="xm-gold text-[15px] font-bold">
          {points} pt{points > 1 ? "s" : ""}
        </p>
      </div>

      {feedback && (
        <p className={cn("anim-pop mt-4 rounded-xl px-4 py-3 text-center text-[14px]", feedback.ok ? "xm-good" : "xm-bad")}>
          {feedback.ok ? `🎉 Bonne réponse pour le ${feedback.day} décembre : +1 point !` : `❄️ Raté pour le ${feedback.day} décembre… Reviens demain !`}
        </p>
      )}

      <ol className="mt-5 grid grid-cols-4 gap-2 sm:grid-cols-6 sm:gap-2.5">
        {Array.from({ length: 24 }, (_, i) => i + 1).map((d) => {
          const res = local.results[`avent:d${d}`];
          const unlocked = open && d <= today;
          return (
            <li key={d}>
              <button
                type="button"
                disabled={!unlocked || !!res}
                onClick={() => {
                  setFeedback(null);
                  setStartedAt(Date.now());
                  setDay(d);
                }}
                className={cn("xm-tile flex aspect-square w-full flex-col items-center justify-center rounded-xl", res ? (res.score ? "is-good" : "is-bad") : unlocked ? "is-open" : "is-locked")}
                aria-label={`${d} décembre${res ? (res.score ? " : réussi" : " : raté") : unlocked ? " : à ouvrir" : " : pas encore"}`}
              >
                <span className="text-[clamp(1.05rem,4.5vw,1.4rem)] font-bold">{d}</span>
                <span className="text-[13px]" aria-hidden="true">
                  {res ? (res.score ? "⭐" : "❄️") : unlocked ? "🎁" : "🔒"}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      {!open && <p className="mt-4 text-center text-[13px] text-faint">Le calendrier est ouvert du 1er au 24 décembre.</p>}
    </Section>
  );
}

/* --------------------------- La hotte piratée --------------------------- */

const HOTTE_ATTEMPTS = 3;
const HOTTE_KEY = "cvc/fetes/hotte-en-cours";
type HotteRun = { attempt: number; startedAt: number; answers: Answer[] };

function Hotte({ now, local, record }: { now: number; local: FestiveLocal; record: Recorder }) {
  const open = isOpen(FESTIVE_WINDOWS.hotte, now);
  const done = [1, 2, 3].map((n) => local.results[`hotte:a${n}`]).filter(Boolean);
  const best = done.reduce((m, r) => Math.max(m, r.score), 0);
  const nextAttempt = done.length + 1;
  const [run, setRun] = useState<HotteRun | null>(() => {
    try {
      const raw = window.localStorage.getItem(HOTTE_KEY);
      const r = raw ? (JSON.parse(raw) as HotteRun) : null;
      return r && !local.results[`hotte:a${r.attempt}`] ? r : null;
    } catch {
      return null;
    }
  });
  const [last, setLast] = useState<number | null>(null);
  const game = useMemo(() => (run ? buildThemedGame(roundSeed("hotte", `a${run.attempt}`), CHRISTMAS_THEME) : null), [run?.attempt]);

  const saveRun = (r: HotteRun | null) => {
    setRun(r);
    try {
      if (r) window.localStorage.setItem(HOTTE_KEY, JSON.stringify(r));
      else window.localStorage.removeItem(HOTTE_KEY);
    } catch {
      /* rien */
    }
  };

  if (run && game) {
    const step = run.answers.length;
    if (step < game.trials.length) {
      return (
        <Section>
          <Progress current={step} total={game.trials.length + 1} />
          <TrialPlayer
            key={`${run.attempt}-${step}`}
            trial={game.trials[step]}
            label={`Épreuve ${step + 1} / ${game.trials.length + 1} · tentative ${run.attempt}/${HOTTE_ATTEMPTS}`}
            onAnswer={(v) => saveRun({ ...run, answers: [...run.answers, v] })}
          />
        </Section>
      );
    }
    return (
      <Section>
        <Progress current={step} total={game.trials.length + 1} />
        <Vault
          sources={game.vaultSources}
          digits={game.vaultCode.length}
          onSubmit={(code) => {
            const score = run.answers.filter((a, i) => game.trials[i].isCorrect(a)).length + (code === game.vaultCode ? 1 : 0);
            void record("hotte", `a${run.attempt}`, score, 10, Date.now() - run.startedAt);
            setLast(score);
            saveRun(null);
          }}
        />
      </Section>
    );
  }

  return (
    <Section>
      <h2 className="text-[clamp(1.3rem,5vw,1.7rem)] font-bold">🛷 La hotte piratée</h2>
      <p className="mt-2 text-[15px] leading-relaxed text-ink-2">
        Un virus a piraté la hotte du Père Noël et verrouillé les cadeaux dans un coffre. Résous <b className="text-ink">9 épreuves</b> (code,
        logique, Arduino), puis trouve le code du coffre. Ton <b className="text-ink">meilleur score</b> sur {HOTTE_ATTEMPTS} tentatives compte
        pour le classement.
      </p>
      {last !== null && (
        <p className={cn("anim-pop mt-4 rounded-xl px-4 py-3 text-center text-[15px]", last >= 7 ? "xm-good" : "xm-bad")}>
          {last === 10 ? "🏆 10/10 : la hotte est libérée !" : `Score de cette tentative : ${last}/10`}
        </p>
      )}
      <dl className="mt-5 grid grid-cols-2 gap-2.5 text-center">
        <div className="hw-stat rounded-xl p-3">
          <dt className="label-mono text-faint">Meilleur score</dt>
          <dd className="mt-2 text-2xl font-bold">{done.length ? `${best}/10` : "—"}</dd>
        </div>
        <div className="hw-stat rounded-xl p-3">
          <dt className="label-mono text-faint">Tentatives</dt>
          <dd className="mt-2 text-2xl font-bold">
            {done.length}/{HOTTE_ATTEMPTS}
          </dd>
        </div>
      </dl>
      {!open ? (
        <p className="mt-5 text-center text-[14px] text-muted">
          La hotte s'ouvre du <b className="text-ink">{fmtDate(FESTIVE_WINDOWS.hotte.from)}</b> au {fmtDate(FESTIVE_WINDOWS.hotte.to - 1)}.
        </p>
      ) : nextAttempt > HOTTE_ATTEMPTS ? (
        <p className="mt-5 text-center text-[14px] text-muted">Tu as utilisé tes {HOTTE_ATTEMPTS} tentatives. Regarde ton rang dans le classement 🏆</p>
      ) : (
        <button
          type="button"
          onClick={() => {
            setLast(null);
            saveRun({ attempt: nextAttempt, startedAt: Date.now(), answers: [] });
          }}
          className="hw-btn mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white"
        >
          {nextAttempt === 1 ? "Libérer la hotte 🎁" : `Nouvelle tentative (${nextAttempt}/${HOTTE_ATTEMPTS})`}
        </button>
      )}
    </Section>
  );
}

function Progress({ current, total }: { current: number; total: number }) {
  return (
    <ol className="mb-5 flex flex-wrap items-center justify-center gap-1.5" aria-label={`Étape ${current + 1} sur ${total}`}>
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          aria-hidden="true"
          className={cn("h-1.5 rounded-full", i < current ? "w-4 bg-[#ffd36b] sm:w-6" : i === current ? "w-8 bg-brand sm:w-10" : "w-4 bg-line sm:w-6")}
        />
      ))}
    </ol>
  );
}

function Vault({ sources, digits, onSubmit }: { sources: { step: number; title: string; choices: number }[]; digits: number; onSubmit: (code: string) => void }) {
  const [code, setCode] = useState("");
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (code.length === digits) onSubmit(code);
      }}
    >
      <h3 className="text-[clamp(1.2rem,5vw,1.5rem)] font-bold">🔐 Le coffre de la hotte</h3>
      <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
        Pour l'ouvrir, prends la position (A = 1, B = 2, C = 3, D = 4) de la <b className="text-ink">bonne réponse</b> de chaque épreuve à choix
        multiples, dans l'ordre :
      </p>
      <ul className="mt-3 space-y-1.5 text-[14px] text-muted">
        {sources.map((s) => (
          <li key={s.step}>
            • Épreuve {s.step} ({s.title}) : parmi {LETTERS.slice(0, s.choices).join(", ")}
          </li>
        ))}
      </ul>
      <input
        value={code}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, digits))}
        inputMode="numeric"
        autoComplete="off"
        placeholder="• • • •"
        aria-label={`Code du coffre (${digits} chiffres)`}
        className="hw-input hw-vault mt-5 h-16 w-full rounded-xl text-center font-mono text-[28px] tracking-[0.6em]"
      />
      <button
        type="submit"
        disabled={code.length !== digits}
        className="hw-btn mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white disabled:opacity-45"
      >
        Ouvrir le coffre 🗝️
      </button>
    </form>
  );
}

/* --------------------------- Nouvel An --------------------------- */

const NY_QUESTIONS = 5;

function NewYear({ now, local, record }: { now: number; local: FestiveLocal; record: Recorder }) {
  const open = isOpen(FESTIVE_WINDOWS.nouvelAn, now);
  const result = local.results["nouvel_an:final"];
  const [clock, setClock] = useState(now);
  const [run, setRun] = useState<{ startedAt: number; answers: Answer[] } | null>(null);
  const trials = useMemo(() => buildThemedGame(roundSeed("nouvel_an", "final"), NEW_YEAR_THEME).trials.slice(0, NY_QUESTIONS), []);
  const preview = previewDate();

  useEffect(() => {
    if (preview) return;
    const t = window.setInterval(() => setClock(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [preview]);

  const left = NEW_YEAR - clock;
  const celebrate = left <= 0 && left > -24 * 3600 * 1000;

  if (run) {
    const step = run.answers.length;
    return (
      <Section>
        <Progress current={step} total={NY_QUESTIONS} />
        <TrialPlayer
          key={step}
          trial={trials[step]}
          label={`Défi ${step + 1} / ${NY_QUESTIONS}`}
          onAnswer={(v) => {
            const answers = [...run.answers, v];
            if (answers.length < NY_QUESTIONS) return setRun({ ...run, answers });
            const score = answers.filter((a, i) => trials[i].isCorrect(a)).length;
            void record("nouvel_an", "final", score, NY_QUESTIONS, Date.now() - run.startedAt);
            setRun(null);
          }}
        />
      </Section>
    );
  }

  return (
    <Section className="relative overflow-hidden">
      {celebrate && <Fireworks />}
      <div className="relative">
        <h2 className="text-[clamp(1.3rem,5vw,1.7rem)] font-bold">🎆 Le défi du Nouvel An</h2>
        <div className="xm-countdown mt-5 rounded-2xl p-5 text-center">
          {left > 0 ? (
            <>
              <p className="label-mono text-faint">Bonne année dans</p>
              <Countdown ms={left} />
            </>
          ) : (
            <p className="xm-gold text-[clamp(1.6rem,7vw,2.4rem)] font-bold">🥂 Bonne année {new Date(NEW_YEAR).getFullYear()} !</p>
          )}
        </div>
        <p className="mt-5 text-[15px] leading-relaxed text-ink-2">
          {NY_QUESTIONS} énigmes, <b className="text-ink">un seul essai</b>, et le chrono tourne : le meilleur score, puis le plus rapide, gagne.
        </p>
        {result ? (
          <p className="xm-good mt-5 rounded-xl px-4 py-3 text-center text-[15px]">
            Ton score : <b>
              {result.score}/{NY_QUESTIONS}
            </b>{" "}
            · regarde ton rang dans le classement 🏆
          </p>
        ) : open ? (
          <button
            type="button"
            onClick={() => setRun({ startedAt: Date.now(), answers: [] })}
            className="hw-btn mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl text-[15px] font-semibold text-white"
          >
            Lancer le défi 🚀
          </button>
        ) : (
          <p className="mt-5 text-center text-[14px] text-muted">
            Le défi s'ouvre le <b className="text-ink">{fmtDate(FESTIVE_WINDOWS.nouvelAn.from)}</b> et dure jusqu'au{" "}
            {fmtDate(FESTIVE_WINDOWS.nouvelAn.to - 1)}.
          </p>
        )}
      </div>
    </Section>
  );
}

function Countdown({ ms }: { ms: number }) {
  const s = Math.floor(ms / 1000);
  const parts = [
    [Math.floor(s / 86400), "j"],
    [Math.floor((s % 86400) / 3600), "h"],
    [Math.floor((s % 3600) / 60), "min"],
    [s % 60, "s"],
  ] as const;
  return (
    <p className="mt-2 flex justify-center gap-2 sm:gap-3" aria-live="off">
      {parts.map(([v, u]) => (
        <span key={u} className="xm-count-box flex min-w-[3.6rem] flex-col rounded-xl px-2 py-2">
          <span className="font-mono text-[clamp(1.4rem,6vw,2rem)] font-bold text-ink">{String(v).padStart(2, "0")}</span>
          <span className="text-[11px] text-faint">{u}</span>
        </span>
      ))}
    </p>
  );
}

function Fireworks() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    type P = { x: number; y: number; vx: number; vy: number; life: number; color: string };
    let parts: P[] = [];
    let raf = 0;
    const colors = ["#ffd36b", "#ff6b6b", "#7cc4ff", "#86efac", "#f0a6ff"];
    const size = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    const burst = () => {
      const x = canvas.width * (0.15 + Math.random() * 0.7);
      const y = canvas.height * (0.15 + Math.random() * 0.4);
      const color = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < 48; i++) {
        const a = (i / 48) * Math.PI * 2;
        const v = 1.2 + Math.random() * 2.4;
        parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: 1, color });
      }
    };
    let frame = 0;
    const tick = () => {
      frame++;
      if (frame % 45 === 1) burst();
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      parts = parts.filter((p) => p.life > 0);
      for (const p of parts) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        p.life -= 0.012;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.fillRect(p.x, p.y, 2.4, 2.4);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };
    size();
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", size);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", size);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}

/* --------------------------- Classements --------------------------- */

function Leaderboards({ me, preview }: { me?: string; preview: boolean }) {
  const [game, setGame] = useState<FestiveGame>("avent");
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let alive = true;
    setRows(null);
    void festiveLeaderboard(game).then((r) => {
      if (!alive) return;
      if (r.ok) setRows(r.data);
      else {
        setOffline(true);
        setRows([]);
      }
    });
    return () => {
      alive = false;
    };
  }, [game]);

  const max = game === "avent" ? 24 : game === "hotte" ? 10 : NY_QUESTIONS;

  return (
    <Section>
      <h2 className="text-[clamp(1.3rem,5vw,1.7rem)] font-bold">🏆 Classements</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {(
          [
            ["avent", "🎁 Calendrier"],
            ["hotte", "🛷 Hotte"],
            ["nouvel_an", "🎆 Nouvel An"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setGame(id)}
            className={cn("rounded-full border px-3.5 py-2 text-[13px] font-semibold", game === id ? "xm-tab-on border-transparent" : "border-line text-muted")}
          >
            {label}
          </button>
        ))}
      </div>
      {preview && <p className="mt-4 text-[13px] text-faint">En mode aperçu, tes réponses n'apparaissent pas dans le classement.</p>}
      {rows === null ? (
        <p className="mt-6 text-center text-[14px] text-muted">Le Père Noël compte les points…</p>
      ) : offline ? (
        <p className="mt-6 text-center text-[14px] text-muted">Le classement n'est pas encore disponible.</p>
      ) : rows.length === 0 ? (
        <p className="mt-6 text-center text-[14px] text-muted">Personne n'a encore joué : sois le premier ! ❄️</p>
      ) : (
        <ol className="mt-5 space-y-2">
          {rows.map((r, i) => (
            <li key={r.name} className={cn("xm-row flex items-center gap-3 rounded-xl px-3 py-2.5", r.name === me && "is-me")}>
              <span className="w-8 shrink-0 text-center text-[15px] font-bold">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
              <span className="min-w-0 flex-1 truncate text-[14.5px] font-medium text-ink">{r.name}</span>
              <span className="text-right text-[12px] text-faint">{formatDuration(r.time_ms)}</span>
              <span className="xm-gold w-14 shrink-0 text-right text-[15px] font-bold">
                {r.points}/{max}
              </span>
            </li>
          ))}
        </ol>
      )}
    </Section>
  );
}
