import { useState } from "react";
import { Logo } from "@/components/layout";
import { MediaSlot } from "@/components/media";
import { Button, Card, EmptyState, Icon, Note } from "@/components/ui";
import { navigate } from "@/lib/router";
import { ApiError, formatDate, initials, useClub } from "@/lib/store";
import { cn } from "@/utils/cn";

/* Connexion : reconnaît les profils déjà enregistrés sur cet appareil.
   En production, cette page branche un vrai flux d'authentification serveur. */

export default function Login() {
  const { data, signIn, pending, me } = useClub();
  const [error, setError] = useState<string | null>(null);

  const enter = async (id: string) => {
    setError(null);
    try {
      await signIn(id);
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
          <p className="mt-4 max-w-md text-[15.5px] leading-relaxed text-muted">
            Choisis ton profil pour entrer dans ton espace membre. Les profils listés ici sont ceux enregistrés sur cet
            appareil.
          </p>

          {error && (
            <p className="mt-7 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              <Icon name="close" className="h-4 w-4" />
              {error}
            </p>
          )}

          <div className="mt-10">
            {data.members.length === 0 ? (
              <EmptyState
                icon="user"
                title="Aucun profil enregistré pour l'instant."
                text="Sois le premier membre du club : l'inscription prend moins de deux minutes."
                action={
                  <Button iconRight="arrowRight" onClick={() => navigate("/join")}>
                    Rejoindre le club
                  </Button>
                }
              />
            ) : (
              <ul className="grid gap-3">
                {data.members.map((m) => (
                  <li key={m.id}>
                    <Card hover className="flex items-center gap-4 p-4">
                      <span
                        className={cn(
                          "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-[14px] font-semibold text-ink",
                          m.status === "SUSPENDED" && "opacity-50",
                        )}
                      >
                        {initials(m)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[15px] font-medium text-ink">
                          {m.firstName} {m.lastName}
                          {m.role === "ADMIN" && (
                            <span className="label-mono ml-2 text-brand-ink">admin</span>
                          )}
                        </p>
                        <p className="label-mono mt-1.5 text-faint">
                          {m.level} · membre depuis {formatDate(m.createdAt)}
                          {m.status === "SUSPENDED" && " · suspendu"}
                        </p>
                      </div>
                      {m.status === "SUSPENDED" ? (
                        <span className="label-mono text-faint">Indisponible</span>
                      ) : m.id === me?.id ? (
                        <Button size="sm" variant="secondary" iconRight="arrowRight" onClick={() => navigate("/app")}>
                          Mon espace
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          iconRight="arrowRight"
                          loading={pending.signIn}
                          onClick={() => enter(m.id)}
                        >
                          Entrer
                        </Button>
                      )}
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </div>

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
