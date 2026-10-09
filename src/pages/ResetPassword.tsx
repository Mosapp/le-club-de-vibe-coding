import { useEffect, useState } from "react";
import { Logo } from "@/components/layout";
import { Button, Field, Icon, PasswordInput } from "@/components/ui";
import { navigate } from "@/lib/router";
import { ApiError, useClub } from "@/lib/store";
import { supabase } from "@/lib/supabase";

/* Page ouverte par le lien « mot de passe oublié » reçu par mail :
   la personne choisit un nouveau mot de passe, puis entre dans son espace. */

export default function ResetPassword() {
  const { updatePassword, me } = useClub();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<{ password?: string; confirm?: string }>({});
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(supabase ? null : false);

  // le lien du mail ouvre une session temporaire : sans elle (lien expiré / ouvert tel quel), on l'explique.
  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    const check = () =>
      void supabase!.auth.getSession().then(({ data }) => {
        if (!cancelled) setHasSession(!!data.session);
      });
    check();
    const id = window.setTimeout(check, 2500); // laisse le temps à Supabase de lire le lien
    return () => {
      cancelled = true;
      window.clearTimeout(id);
    };
  }, []);

  useEffect(() => {
    if (done && me) navigate("/app", { replace: true });
  }, [done, me]);

  const submit = async () => {
    const fe: { password?: string; confirm?: string } = {};
    if (password.length < 6) fe.password = "Le mot de passe doit contenir au moins 6 caractères.";
    if (confirm !== password) fe.confirm = "Les deux mots de passe ne sont pas identiques.";
    setFieldError(fe);
    if (fe.password || fe.confirm) return;
    setError(null);
    setSaving(true);
    try {
      await updatePassword(password);
      setDone(true);
      window.setTimeout(() => navigate("/app", { replace: true }), 1200);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible de changer le mot de passe. Réessaie.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="theme-dark theme-dark-page relative flex min-h-dvh flex-col overflow-hidden bg-paper px-5 py-8 text-ink md:px-10">
      <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative flex items-center justify-between">
        <Logo />
        <button type="button" onClick={() => navigate("/login")} className="label-mono inline-flex items-center gap-1.5 text-muted hover:text-ink">
          <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
          Connexion
        </button>
      </div>

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
        {hasSession === false ? (
          <>
            <h1 className="text-[clamp(1.7rem,5vw,2.3rem)] font-bold leading-[1.05] tracking-[-0.03em]">
              Ce lien n'est plus <span className="text-gradient">valable.</span>
            </h1>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted">
              Le lien a expiré ou a déjà été utilisé. Redemande un lien depuis la page de connexion, il arrive en quelques secondes.
            </p>
            <div className="mt-8">
              <Button size="lg" iconRight="arrowRight" onClick={() => navigate("/login")}>
                Redemander un lien
              </Button>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-[clamp(1.7rem,5vw,2.3rem)] font-bold leading-[1.05] tracking-[-0.03em]">
              Choisis un nouveau <span className="text-gradient">mot de passe.</span>
            </h1>
            <p className="mt-4 text-[15.5px] leading-relaxed text-muted">6 caractères minimum. Tu seras connecté juste après.</p>

            {error && (
              <p className="field-dark-error mt-7 flex items-center gap-2 rounded-xl border px-4 py-3 text-[14px]" role="alert">
                <Icon name="close" className="h-4 w-4" />
                {error}
              </p>
            )}

            <form
              className="neon-window mt-8 space-y-6 rounded-2xl p-6 md:p-8"
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
            >
              <Field label="Nouveau mot de passe" required error={fieldError.password}>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  invalid={!!fieldError.password}
                  autoFocus
                />
              </Field>
              <Field label="Confirme le mot de passe" required error={fieldError.confirm}>
                <PasswordInput
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  autoComplete="new-password"
                  invalid={!!fieldError.confirm}
                />
              </Field>
              <Button type="submit" iconRight="arrowRight" loading={saving || done || hasSession === null} disabled={done}>
                {done ? "Mot de passe changé" : "Enregistrer"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
