import { useState } from "react";
import { Logo } from "@/components/layout";
import { MediaSlot } from "@/components/media";
import { Button, Field, Icon, Input, Note, PasswordInput } from "@/components/ui";
import { navigate } from "@/lib/router";
import { ApiError, useClub } from "@/lib/store";

/* Connexion : reconnaît les profils déjà enregistrés sur cet appareil.
   En production, cette page branche un vrai flux d'authentification serveur. */

export default function Login() {
  const { signIn, pending, resendConfirmation, requestPasswordReset } = useClub();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"login" | "forgot">("login");

  const validEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const enter = async () => {
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);
    try {
      await signIn(email.trim(), password);
      navigate("/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible. Réessaie.");
      if (err instanceof ApiError && err.code === "email_not_confirmed") setNeedsConfirm(true);
    }
  };

  const resend = async () => {
    setBusy(true);
    setError(null);
    try {
      await resendConfirmation(email.trim());
      setNeedsConfirm(false);
      setInfo("Email de confirmation renvoyé. Ouvre-le (regarde aussi dans les spams), puis reviens te connecter.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de renvoyer l'email.");
    } finally {
      setBusy(false);
    }
  };

  const sendReset = async () => {
    setError(null);
    setInfo(null);
    if (!validEmail(email)) {
      setError("Entre l'adresse email de ton compte.");
      return;
    }
    setBusy(true);
    try {
      await requestPasswordReset(email.trim());
      setInfo(`Si un compte existe pour ${email.trim()}, un lien pour choisir un nouveau mot de passe vient d'être envoyé. Pense à regarder dans les spams.`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'envoyer le mail. Réessaie.");
    } finally {
      setBusy(false);
    }
  };

  const switchMode = (next: "login" | "forgot") => {
    setMode(next);
    setError(null);
    setInfo(null);
    setNeedsConfirm(false);
  };

  return (
    <div className="theme-dark theme-dark-page grid min-h-dvh bg-paper text-ink lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <aside className="relative hidden overflow-hidden bg-[#05080c] lg:block">
        <MediaSlot slot="COMMUNITY_MEDIA_02" ratio="3/4" rounded="rounded-none" className="h-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-[#05080c] via-[#05080c]/55 to-[#05080c]/25" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Logo dark />
          <p className="max-w-xs text-[24px] font-semibold leading-[1.2] text-white">
            Content de te revoir. <span className="text-gradient">On a des trucs à construire.</span>
          </p>
        </div>
      </aside>

      <main className="relative isolate flex flex-col overflow-hidden px-5 py-8 md:px-10 lg:px-16 lg:py-12">
        <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0 -z-10" />
        <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0 -z-10" />
        <div className="flex items-center justify-between">
          <Logo />
          <button
            type="button"
            onClick={() => navigate("/")}
            className="label-mono inline-flex items-center gap-1.5 text-muted hover:text-ink"
          >
            <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
            Accueil
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center py-12">
          <h1 className="text-[clamp(1.9rem,5vw,2.7rem)] font-bold leading-[1.04] tracking-[-0.03em] text-ink">
            {mode === "login" ? (
              <>Reprendre là où <span className="text-gradient">tu t'es arrêté.</span></>
            ) : (
              <>Mot de passe <span className="text-gradient">oublié ?</span></>
            )}
          </h1>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
            {mode === "login"
              ? "Connecte-toi avec ton email et ton mot de passe."
              : "Pas de panique : entre ton email, on t'envoie un lien pour en choisir un nouveau."}
          </p>

          {error && (
            <div className="field-dark-error mt-7 rounded-xl border px-4 py-3 text-[14px]" role="alert">
              <p className="flex items-start gap-2">
                <Icon name="close" className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </p>
              {needsConfirm && (
                <button
                  type="button"
                  onClick={resend}
                  disabled={busy}
                  className="mt-3 font-medium underline underline-offset-2 disabled:opacity-50"
                >
                  {busy ? "Envoi…" : "Renvoyer l'email de confirmation"}
                </button>
              )}
              {mode === "login" && error.startsWith("Email ou mot de passe incorrect") && (
                <button type="button" onClick={() => switchMode("forgot")} className="mt-3 block font-medium underline underline-offset-2">
                  J'ai oublié mon mot de passe
                </button>
              )}
            </div>
          )}

          {info && (
            <div className="mt-7" role="status" aria-live="polite">
              <Note tone="brand">{info}</Note>
            </div>
          )}

          {mode === "login" ? (
            <form className="neon-window mt-9 space-y-6 rounded-2xl p-6 shadow-[0_40px_100px_-50px_rgba(240,102,47,0.5)] md:p-8" onSubmit={(event) => { event.preventDefault(); void enter(); }}>
              <Field label="Email" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
              </Field>
              <Field label="Mot de passe" required>
                <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <Button type="submit" iconRight="arrowRight" loading={pending.signIn}>
                  Se connecter
                </Button>
                <button
                  type="button"
                  onClick={() => switchMode("forgot")}
                  className="text-[14px] font-medium text-brand-ink underline underline-offset-2"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </form>
          ) : (
            <form
              className="neon-window mt-9 space-y-6 rounded-2xl p-6 shadow-[0_40px_100px_-50px_rgba(240,102,47,0.5)] md:p-8"
              onSubmit={(event) => {
                event.preventDefault();
                void sendReset();
              }}
            >
              <Field label="Email de ton compte" required>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required autoFocus />
              </Field>
              <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
                <Button type="submit" iconRight="arrowRight" loading={busy}>
                  Envoyer le lien
                </Button>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-[14px] font-medium text-brand-ink underline underline-offset-2"
                >
                  Retour à la connexion
                </button>
              </div>
            </form>
          )}

          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            <Note>
              Pas encore membre ?{" "}
              <button
                type="button"
                onClick={() => navigate("/join")}
                className="font-medium text-brand-ink underline underline-offset-2"
              >
                Rejoindre le club
              </button>
            </Note>
            <Note>
              Espace administrateur ?{" "}
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="font-medium text-brand-ink underline underline-offset-2"
              >
                Y accéder
              </button>
            </Note>
          </div>
        </div>
      </main>
    </div>
  );
}
