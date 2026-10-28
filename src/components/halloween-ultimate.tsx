import { useEffect, useRef, useState, type FormEvent } from "react";
import { claimTreasure, startPlayer, type HalloweenServerState } from "@/lib/halloween";
import { haptic } from "@/lib/haptics";
import { cn } from "@/utils/cn";

/* ==================================================================
   🎃 ÉPREUVE ULTIME — une fois sur le site
   Mot de bienvenue + indice : le fragment (un mot sur 10) de la
   phrase secrète. Chaque détective n'a qu'un mot : il faut se
   regrouper pour reconstituer la phrase et ouvrir le trésor.
   Le lien du trésor n'est jamais dans le code du site : seul le
   serveur le renvoie, contre la phrase complète.
================================================================== */

type Load = { status: "loading" } | { status: "ready"; state: HalloweenServerState } | { status: "offline" };

export function HalloweenUltimate({ name, autoOpen, onSeen }: { name: string; autoOpen: boolean; onSeen: () => void }) {
  const [open, setOpen] = useState(autoOpen);

  useEffect(() => {
    if (autoOpen) onSeen();
  }, []); // une seule fois, à l'arrivée sur le site

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hw-ultimate-fab theme-dark fixed right-4 z-[60] inline-flex h-12 items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-white"
        aria-label="Ouvrir l'épreuve ultime"
      >
        <span aria-hidden="true">🎃</span>
        <span className="hidden sm:inline">Épreuve ultime</span>
      </button>
      {open && <UltimateDialog name={name} onClose={() => setOpen(false)} />}
    </>
  );
}

function UltimateDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const [phrase, setPhrase] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [treasure, setTreasure] = useState<{ url: string | null } | null>(null);
  const [copied, setCopied] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let alive = true;
    startPlayer(name).then((r) => {
      if (!alive) return;
      setLoad(r.ok ? { status: "ready", state: r.data } : { status: "offline" });
    });
    return () => {
      alive = false;
    };
  }, [name]);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  // Ponctuation ignorée : « maudit ! » compte pour un seul mot.
  const words = phrase.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const state = load.status === "ready" ? load.state : null;
  const triesLeft = state?.claim_tries_left ?? 0;

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (sending || !state) return;
    if (words !== state.total) {
      setFeedback(`La phrase secrète compte exactement ${state.total} mots (tu en as ${words}).`);
      return;
    }
    setSending(true);
    setFeedback(null);
    const r = await claimTreasure(phrase);
    setSending(false);
    if (!r.ok) {
      setFeedback(
        r.reason === "no_claims_left"
          ? "Tu as épuisé tes essais. Demande à un détective de ton équipe d'ouvrir le trésor."
          : "Le grimoire ne répond pas. Vérifie ta connexion et réessaie."
      );
      return;
    }
    if (!r.data.ok) {
      haptic(60);
      setLoad({ status: "ready", state: { ...state, claim_tries_left: r.data.tries_left } });
      setFeedback(`Le sort résiste… Ce n'est pas la bonne phrase. Essais restants : ${r.data.tries_left}.`);
      return;
    }
    haptic(30);
    setTreasure({ url: r.data.url });
  };

  const copy = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* le lien reste affiché */
    }
  };

  return (
    <div className="theme-dark fixed inset-0 z-[70] flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-labelledby="hw-ult-title">
      <button type="button" aria-label="Fermer" onClick={onClose} className="absolute inset-0 bg-black/70 backdrop-blur-sm" tabIndex={-1} />

      <div className="hw-card anim-pop relative max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-[24px] p-5 pb-8 text-ink sm:rounded-[24px] sm:p-7">
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full border border-line text-muted hover:text-ink"
          aria-label="Fermer l'épreuve ultime"
        >
          ✕
        </button>

        <p className="label-mono pr-12 text-brand-ink">🎃 Épreuve ultime</p>
        <h2 id="hw-ult-title" className="mt-3 pr-10 text-[clamp(1.4rem,5.5vw,1.9rem)] font-bold leading-tight">
          Bienvenue dans le club, <span className="text-brand">{name}</span> !
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-2">
          Tu as franchi la porte… mais le vrai trésor dort encore : <b className="text-ink">un accès gratuit à Claude Code</b>, scellé par une
          phrase secrète de <b className="text-ink">10 mots</b>.
        </p>

        {/* L'indice : le fragment */}
        <div className="hw-fragment mt-5 rounded-2xl p-4 text-center sm:p-5">
          <p className="label-mono text-faint">Ton fragment de la phrase</p>
          {load.status === "loading" && <p className="mt-4 text-[14px] text-muted">L'entité te le murmure…</p>}
          {load.status === "offline" && (
            <p className="mt-4 text-[14px] leading-relaxed text-muted">
              Les fragments ne sont pas encore distribués. Reviens un peu plus tard, détective.
            </p>
          )}
          {state && state.word && state.fragment && (
            <>
              <p className="mt-3 text-[13px] text-muted">
                Mot n°<b className="text-ink">{state.fragment}</b> sur {state.total}
              </p>
              <p className="hw-code mt-2 break-words text-[clamp(1.8rem,9vw,2.6rem)] font-bold">« {state.word} »</p>
              <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
                {Array.from({ length: state.total }, (_, i) => (
                  <span key={i} className={cn("h-2 w-2 rounded-full sm:h-2.5 sm:w-2.5", i + 1 === state.fragment ? "bg-brand" : "bg-line")} />
                ))}
              </div>
            </>
          )}
          {state && !state.word && <p className="mt-4 text-[14px] text-muted">Ton fragment n'est pas encore prêt. Reviens plus tard.</p>}
        </div>

        <div className="hw-hint-box mt-5 rounded-2xl p-4 text-[14.5px] leading-relaxed">
          <p className="font-semibold text-ink">🕯️ Seul, tu ne possèdes qu'un seul mot.</p>
          <p className="mt-1.5 text-ink-2">
            Les 9 autres sont entre les mains d'autres détectives du club. Trouve-les, échangez vos fragments, remettez les mots dans l'ordre
            de leur numéro… <b className="text-ink">Seul, tu n'iras nulle part. Ensemble, vous briserez le sort.</b>
          </p>
        </div>

        {/* La phrase */}
        {treasure ? (
          <div className="hw-reward mt-5 rounded-2xl p-5 text-center">
            <p className="text-4xl" aria-hidden="true">
              🏆
            </p>
            <p className="mt-2 text-[18px] font-bold text-ink">Le sort est brisé !</p>
            {treasure.url ? (
              <>
                <p className="mt-2 text-[14px] text-muted">Le trésor est à toi :</p>
                <a
                  href={treasure.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hw-btn mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl px-4 text-[15px] font-semibold text-white"
                >
                  Récupérer Claude Code gratuit ↗
                </a>
                <button
                  type="button"
                  onClick={() => copy(treasure.url!)}
                  className="mt-2.5 inline-flex h-11 w-full items-center justify-center rounded-xl border border-line text-[14px] font-semibold text-ink-2 hover:border-brand"
                >
                  {copied ? "Lien copié ✓" : "Copier le lien"}
                </button>
              </>
            ) : (
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Bonne phrase ! L'organisateur n'a pas encore caché le lien dans le coffre : reviens bientôt, ton exploit est enregistré.
              </p>
            )}
          </div>
        ) : state?.claimed ? (
          <form onSubmit={submit} className="mt-5">
            <p className="text-[14px] text-muted">Tu as déjà brisé le sort. Retape la phrase pour revoir le trésor.</p>
            <PhraseInput phrase={phrase} setPhrase={setPhrase} words={words} total={state.total} disabled={sending} />
            <SubmitButton sending={sending} />
          </form>
        ) : state?.word ? (
          <form onSubmit={submit} className="mt-5">
            <label htmlFor="hw-phrase" className="text-[15px] font-semibold text-ink">
              Vous avez les 10 mots ? Écris la phrase secrète :
            </label>
            <PhraseInput phrase={phrase} setPhrase={setPhrase} words={words} total={state.total} disabled={sending || triesLeft <= 0} />
            <SubmitButton sending={sending} disabled={triesLeft <= 0} />
            <p className="mt-2 text-center text-[12.5px] text-faint">{triesLeft} essai{triesLeft > 1 ? "s" : ""} restant{triesLeft > 1 ? "s" : ""}</p>
          </form>
        ) : null}

        <p id="hw-ult-feedback" role="status" aria-live="polite" className="mt-3 min-h-[1.1rem] text-center text-[13.5px] text-[#fca5a5]">
          {feedback}
        </p>
      </div>
    </div>
  );
}

function PhraseInput({
  phrase,
  setPhrase,
  words,
  total,
  disabled,
}: {
  phrase: string;
  setPhrase: (v: string) => void;
  words: number;
  total: number;
  disabled: boolean;
}) {
  return (
    <>
      <textarea
        id="hw-phrase"
        value={phrase}
        onChange={(e) => setPhrase(e.target.value.slice(0, 300))}
        disabled={disabled}
        rows={3}
        placeholder="Mot 1, mot 2, mot 3… dans l'ordre des numéros"
        className="hw-input mt-3 w-full resize-none rounded-xl p-3.5 text-[16px] leading-relaxed"
      />
      <p className={cn("mt-1 text-right font-mono text-[12px]", words === total ? "text-[#86efac]" : "text-faint")}>
        {words} / {total} mots
      </p>
    </>
  );
}

function SubmitButton({ sending, disabled = false }: { sending: boolean; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={sending || disabled}
      className="hw-btn mt-3 inline-flex h-12 w-full items-center justify-center rounded-xl px-5 text-[15px] font-semibold text-white disabled:opacity-50"
    >
      {sending ? "Le grimoire s'ouvre…" : "Briser le sort 🔓"}
    </button>
  );
}
