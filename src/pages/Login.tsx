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
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <MediaSlot slot="COMMUNITY_MEDIA_02" ratio="3/4" rounded="rounded-none" className="h-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/50" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Logo dark />
          <p className="max-w-xs text-[24px] font-semibold leading-[1.2] text-white">
            Content de te revoir. <span className="accent-serif text-brand">On a des trucs à construire.</span>
          </p>
        </div>
      </aside>

      <main className="flex flex-col px-5 py-8 md:px-10 lg:px-16 lg:py-12">
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
          <h1 className="text-[clamp(1.8rem,4.6vw,2.5rem)] font-semibold leading-[1.06] text-ink">
            Reprendre là où tu t'es arrêté.
          </h1>
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">Connecte-toi avec ton email et ton mot de passe.</p>

          {error && (
            <p className="mt-7 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              <Icon name="close" className="h-4 w-4" />
              {error}
            </p>
          )}

          <form className="mt-10 space-y-6" onSubmit={(event) => { event.preventDefault(); void enter(); }}>
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
