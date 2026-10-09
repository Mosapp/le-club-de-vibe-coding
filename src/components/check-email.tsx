import { useEffect, useState } from "react";
import { Button, Icon, Note } from "@/components/ui";
import { ApiError, useClub } from "@/lib/store";

/* Écran « Vérifie ta boîte mail » : affiché après l'inscription quand l'email doit être confirmé.
   Propose d'ouvrir la messagerie, de renvoyer le mail (avec délai anti-spam) et de corriger l'adresse. */

const COOLDOWN = 60;

/** Lien direct vers la boîte mail selon le fournisseur (sinon aucun bouton). */
function mailboxLink(email: string): { label: string; href: string } | null {
  const domain = email.split("@")[1]?.toLowerCase() ?? "";
  if (domain === "gmail.com" || domain === "googlemail.com") return { label: "Ouvrir Gmail", href: "https://mail.google.com/" };
  if (/^(outlook|hotmail|live|msn)\./.test(domain)) return { label: "Ouvrir Outlook", href: "https://outlook.live.com/mail/" };
  if (/^yahoo\./.test(domain) || domain === "ymail.com") return { label: "Ouvrir Yahoo Mail", href: "https://mail.yahoo.com/" };
  if (domain === "icloud.com" || domain === "me.com") return { label: "Ouvrir iCloud Mail", href: "https://www.icloud.com/mail" };
  return null;
}

export function CheckEmail({
  email,
  onChangeEmail,
  onLogin,
}: {
  email: string;
  onChangeEmail: () => void;
  onLogin: () => void;
}) {
  const { resendConfirmation } = useClub();
  const [cooldown, setCooldown] = useState(COOLDOWN);
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const mailbox = mailboxLink(email);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(id);
  }, [cooldown]);

  const resend = async () => {
    setSending(true);
    setFeedback(null);
    try {
      await resendConfirmation(email);
      setFeedback({ tone: "ok", text: "Email renvoyé. Regarde aussi dans tes spams." });
      setCooldown(COOLDOWN);
    } catch (err) {
      setFeedback({ tone: "error", text: err instanceof ApiError ? err.message : "Impossible de renvoyer l'email." });
      if (err instanceof ApiError && err.code === "rate_limited") setCooldown(COOLDOWN);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="theme-dark theme-dark-page relative flex min-h-dvh items-center justify-center overflow-hidden bg-paper px-5 py-16 text-ink">
      <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />
      <div className="anim-pop relative w-full max-w-lg text-center" role="status" aria-live="polite">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand/25 bg-brand-soft">
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true" stroke="#ff8f61" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="5" width="18" height="14" rx="2.5" />
            <path d="m4 7 8 6 8-6" />
          </svg>
        </span>
        <h1 className="mt-8 text-[clamp(1.9rem,5.6vw,2.8rem)] font-semibold leading-[1.05] text-ink">
          Vérifie ta boîte mail
        </h1>
        <p className="mx-auto mt-5 max-w-sm text-[16px] leading-relaxed text-muted">
          Ton compte est créé. On a envoyé un lien de confirmation à{" "}
          <strong className="break-all font-semibold text-ink">{email}</strong>. Clique dessus pour entrer dans ton espace.
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[14px] leading-relaxed text-faint">
          Rien reçu au bout de quelques minutes ? Regarde dans les <strong className="text-muted">spams</strong> ou les courriers indésirables.
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          {mailbox && (
            <a
              href={mailbox.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand px-6 text-[15px] font-medium text-white transition-transform hover:-translate-y-0.5"
            >
              {mailbox.label}
              <Icon name="arrowUpRight" className="h-4 w-4" />
            </a>
          )}
          <Button size="lg" variant="secondary" onClick={resend} loading={sending} disabled={cooldown > 0}>
            {cooldown > 0 ? `Renvoyer l'email (${cooldown} s)` : "Renvoyer l'email"}
          </Button>
        </div>

        {feedback && (
          <div className="mt-5 text-left">
            <Note tone={feedback.tone === "ok" ? "brand" : "neutral"}>{feedback.text}</Note>
          </div>
        )}

        <div className="mt-8 flex flex-col items-center gap-2 text-[14px] text-muted">
          <button type="button" onClick={onChangeEmail} className="font-medium text-brand-ink underline underline-offset-2">
            Mauvaise adresse ? La corriger
          </button>
          <span>
            Email déjà confirmé ?{" "}
            <button type="button" onClick={onLogin} className="font-medium text-brand-ink underline underline-offset-2">
              Se connecter
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}
