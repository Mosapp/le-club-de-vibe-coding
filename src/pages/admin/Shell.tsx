import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout";
import { Button, Card, Icon, Note, type IconName } from "@/components/ui";
import { navigate, useRoute, useRouterLink } from "@/lib/router";
import { useClub } from "@/lib/store";
import { cn } from "@/utils/cn";

const ADMIN_NAV: { label: string; route: string; icon: IconName }[] = [
  { label: "Vue d'ensemble", route: "/admin", icon: "layers" },
  { label: "Membres", route: "/admin/membres", icon: "users" },
  { label: "Projets", route: "/admin/projets", icon: "code" },
  { label: "Défis", route: "/admin/defis", icon: "target" },
  { label: "Sessions", route: "/admin/sessions", icon: "calendar" },
  { label: "Idées", route: "/admin/idees", icon: "idea" },
  { label: "Règlement", route: "/admin/reglement", icon: "shield" },
  { label: "Media Library", route: "/admin/medias", icon: "image" },
];

export function AdminHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="border-b border-line pb-7">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="label-mono text-faint">Administration</p>
          <h1 className="mt-3 text-[clamp(1.5rem,4vw,2.1rem)] font-semibold leading-[1.05] text-ink">{title}</h1>
          {subtitle && <p className="mt-3 max-w-2xl text-[14.5px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div>}
      </div>
    </header>
  );
}

/** Écran d'accès : aucune fonction admin n'est rendue sans rôle ADMIN. */
function AdminGate() {
  const { me } = useClub();

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16">
      <div className="w-full max-w-lg">
        <Logo />
        <Card className="mt-8 p-7 md:p-9">
          <p className="label-mono text-faint">Espace administrateur</p>
          <h1 className="mt-4 text-[26px] font-semibold leading-tight text-ink">Accès réservé.</h1>

          {!me ? (
            <>
              <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
                Connecte-toi avec un profil ayant les droits administrateur. Aucune fonction d'administration n'est
                chargée avant ça.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button iconRight="arrowRight" onClick={() => navigate("/login")}>
                  Se connecter
                </Button>
                <Button variant="secondary" onClick={() => navigate("/join")}>
                  Créer un profil
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-4 text-[14.5px] leading-relaxed text-muted">
                Ton profil n'est pas autorisé à accéder à cet espace. Seuls les membres du bureau configurés par le
                responsable du club peuvent l'ouvrir.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Button variant="secondary" iconRight="arrowRight" onClick={() => navigate("/app")}>
                  Retour à mon espace
                </Button>
              </div>
            </>
          )}
        </Card>
        <div className="mt-6">
          <Note>
            En production, l'attribution des rôles se fait côté serveur. Un membre ne doit jamais pouvoir devenir admin
            en modifiant une valeur dans son navigateur.
          </Note>
        </div>
      </div>
    </div>
  );
}

export function AdminShell({ children }: { children: ReactNode }) {
  const { me, isAdmin, signOut } = useClub();
  const route = useRoute();
  const go = useRouterLink();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => setNavOpen(false), [route]);

  if (!me || !isAdmin) return <AdminGate />;

  const isActive = (r: string) => (r === "/admin" ? route === "/admin" : route.startsWith(r));

  return (
    <div className="min-h-screen bg-paper lg:flex">
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col bg-ink px-5 py-6 lg:flex">
        <Logo dark />

        <p className="label-mono mt-10 text-white/35">Administration</p>
        <nav className="mt-4 flex flex-1 flex-col gap-0.5">
          {ADMIN_NAV.map((item) => (
            <a
              key={item.route}
              href={`#${item.route}`}
              onClick={(e) => {
                e.preventDefault();
                go(item.route);
              }}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors duration-200",
                isActive(item.route) ? "bg-white text-ink" : "text-white/60 hover:bg-white/8 hover:text-white",
              )}
            >
              <Icon name={item.icon} className="h-[18px] w-[18px]" />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="mt-6 border-t border-white/10 pt-5">
          <p className="text-[14px] font-medium text-white">
            {me.firstName} {me.lastName}
          </p>
          <p className="label-mono mt-1.5 text-white/40">Administrateur</p>
          <div className="mt-4 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => navigate("/app")}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-3 py-2 text-[13px] text-white/75 transition-colors hover:border-white/35 hover:text-white"
            >
              <Icon name="user" className="h-4 w-4" />
              Mon espace membre
            </button>
            <button
              type="button"
              onClick={signOut}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-[13px] text-white/50 transition-colors hover:text-white"
            >
              <Icon name="logout" className="h-4 w-4" />
              Se déconnecter
            </button>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 border-b border-line bg-paper/92 backdrop-blur-md lg:hidden">
          <div className="flex h-16 items-center justify-between px-5">
            <Logo />
            <button
              type="button"
              onClick={() => setNavOpen((v) => !v)}
              aria-label="Menu administration"
              aria-expanded={navOpen}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink"
            >
              <Icon name={navOpen ? "close" : "menu"} />
            </button>
          </div>
          {navOpen && (
            <nav className="anim-fade grid gap-1 border-t border-line bg-surface px-5 py-4">
              {ADMIN_NAV.map((item) => (
                <a
                  key={item.route}
                  href={`#${item.route}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.route);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px]",
                    isActive(item.route) ? "bg-ink text-white" : "text-ink",
                  )}
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  {item.label}
                </a>
              ))}
              <button
                type="button"
                onClick={signOut}
                className="mt-2 flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] text-muted"
              >
                <Icon name="logout" className="h-[18px] w-[18px]" />
                Se déconnecter
              </button>
            </nav>
          )}
        </header>

        <main className="flex-1 px-5 py-8 md:px-8 lg:px-12 lg:py-12">
          <div className="mx-auto w-full max-w-6xl space-y-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
