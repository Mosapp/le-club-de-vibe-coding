import { useState } from "react";
import { Logo } from "@/components/layout";
import { MediaSlot } from "@/components/media";
import { Button, Field, Icon, Input, Note, PasswordInput } from "@/components/ui";
import { navigate } from "@/lib/router";
import { ApiError, useClub } from "@/lib/store";

/* Connexion : reconnaît les profils déjà enregistrés sur cet appareil.
   En production, cette page branche un vrai flux d'authentification serveur. */

export default function Login() {
  const { signIn, pending } = useClub();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const enter = async () => {
    setError(null);
    try {
      await signIn(email.trim(), password);
      navigate("/app");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible. Réessaie.");
    }
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
            Reprendre là où <span className="text-gradient">tu t'es arrêté.</span>
          </h1>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">Connecte-toi avec ton email et ton mot de passe.</p>

          {error && (
            <p className="field-dark-error mt-7 flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px]">
              <Icon name="close" className="h-4 w-4" />
              {error}
            </p>
          )}

          <form className="neon-window mt-9 space-y-6 rounded-2xl p-6 shadow-[0_40px_100px_-50px_rgba(240,102,47,0.5)] md:p-8" onSubmit={(event) => { event.preventDefault(); void enter(); }}>
            <Field label="Email" required>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </Field>
            <Field label="Mot de passe" required>
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
            </Field>
            <Button type="submit" iconRight="arrowRight" loading={pending.signIn}>
              Se connecter
            </Button>
          </form>

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
