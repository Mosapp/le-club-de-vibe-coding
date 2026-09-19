import { useEffect, useState, type ReactNode } from "react";
import { Logo } from "@/components/layout";
import { Button, Icon, type IconName } from "@/components/ui";
import { navigate, useRoute, useRouterLink } from "@/lib/router";
import { initials, useClub } from "@/lib/store";
import { cn } from "@/utils/cn";

const NAV_ITEMS: { label: string; route: string; icon: IconName; mobile?: boolean }[] = [
  { label: "Accueil", route: "/app", icon: "layers", mobile: true },
  { label: "Projets", route: "/app/projets", icon: "code", mobile: true },
  { label: "Défis", route: "/app/defis", icon: "target", mobile: true },
  { label: "Sessions", route: "/app/sessions", icon: "calendar", mobile: true },
  { label: "Idées", route: "/app/idees", icon: "idea", mobile: true },
  { label: "Règlement", route: "/app/reglement", icon: "shield" },
  { label: "Profil", route: "/app/profil", icon: "user", mobile: true },
];

export function PageHeader({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="border-b border-line pb-8">
      <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-[clamp(1.6rem,4.4vw,2.4rem)] font-semibold leading-[1.05] text-ink">{title}</h1>
          {subtitle && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{subtitle}</p>}
        </div>
        {action && <div className="flex shrink-0 flex-wrap items-center gap-3">{action}</div>}
      </div>
      {children}
    </header>
  );
}

export function MemberShell({
  children,
  allowAnonymous = false,
}: {
  children: ReactNode;
  allowAnonymous?: boolean;
}) {
  const { me, signOut, isAdmin } = useClub();
  const route = useRoute();
  const go = useRouterLink();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    if (!me && !allowAnonymous) navigate("/login", { replace: true });
  }, [me, allowAnonymous]);

  useEffect(() => setMenuOpen(false), [route]);

  const isActive = (r: string) => (r === "/app" ? route === "/app" : route.startsWith(r));

  return (
    <div className="min-h-screen bg-paper lg:flex">
      {/* ---------------- sidebar desktop ---------------- */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-line bg-surface px-5 py-6 lg:flex">
        <Logo />

        <nav className="mt-10 flex flex-1 flex-col gap-0.5">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.route}
              href={`#${item.route}`}
              onClick={(e) => {
                e.preventDefault();
                go(item.route);
              }}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14.5px] transition-all duration-200",
                isActive(item.route)
                  ? "bg-ink text-white"
                  : "text-muted hover:bg-ink/5 hover:text-ink",
              )}
            >
              <Icon
                name={item.icon}
                className={cn("h-[18px] w-[18px] transition-colors", isActive(item.route) ? "text-brand" : "")}
              />
              {item.label}
            </a>
          ))}
        </nav>

        {me ? (
          <div className="mt-6 space-y-3 border-t border-line-2 pt-5">
            {isAdmin && (
              <button
                type="button"
                onClick={() => navigate("/admin")}
                className="flex w-full items-center gap-2.5 rounded-xl border border-line px-3 py-2.5 text-[13.5px] font-medium text-ink transition-colors hover:border-ink/25"
              >
                <Icon name="shield" className="h-[18px] w-[18px] text-brand-ink" />
                Espace admin
              </button>
            )}
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2 text-[13px] font-semibold text-ink">
                {me.avatarUrl ? <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(me)}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-medium leading-tight text-ink">
                  {me.firstName} {me.lastName}
                </p>
                <p className="label-mono mt-1 text-faint">{me.level}</p>
              </div>
              <button
                type="button"
                onClick={signOut}
                aria-label="Se déconnecter"
                className="rounded-lg p-1.5 text-faint transition-colors hover:bg-ink/5 hover:text-ink"
              >
                <Icon name="logout" className="h-[18px] w-[18px]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-line-2 pt-5">
            <p className="text-[13.5px] leading-relaxed text-muted">
              Tu consultes la version publique de cette page.
            </p>
            <Button full size="sm" className="mt-4" iconRight="arrowRight" onClick={() => navigate("/join")}>
              Rejoindre le club
            </Button>
          </div>
        )}
      </aside>

      {/* ---------------- contenu ---------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* header mobile */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-line bg-paper/90 px-5 backdrop-blur-md lg:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink"
          >
            <Icon name={menuOpen ? "close" : "menu"} />
          </button>
        </header>

        {menuOpen && (
          <div className="anim-fade border-b border-line bg-surface px-5 py-5 lg:hidden">
            <nav className="grid gap-1">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.route}
                  href={`#${item.route}`}
                  onClick={(e) => {
                    e.preventDefault();
                    go(item.route);
                  }}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-3 text-[15px]",
                    isActive(item.route) ? "bg-ink text-white" : "text-ink",
                  )}
                >
                  <Icon name={item.icon} className="h-[18px] w-[18px]" />
                  {item.label}
                </a>
              ))}
            </nav>
            <div className="mt-4 flex gap-3 border-t border-line-2 pt-4">
              {isAdmin && (
                <Button size="sm" variant="secondary" onClick={() => navigate("/admin")}>
                  Admin
                </Button>
              )}
              {me ? (
                <Button size="sm" variant="secondary" icon="logout" onClick={signOut}>
                  Se déconnecter
                </Button>
              ) : (
                <Button size="sm" iconRight="arrowRight" onClick={() => navigate("/join")}>
                  Rejoindre le club
                </Button>
              )}
            </div>
          </div>
        )}

        <main className="flex-1 px-5 pb-28 pt-8 md:px-8 lg:px-12 lg:pb-16 lg:pt-12">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </main>
      </div>

      {/* ---------------- nav mobile bas ---------------- */}
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-line bg-surface/95 backdrop-blur-md lg:hidden">
        {NAV_ITEMS.filter((i) => i.mobile).map((item) => (
          <a
            key={item.route}
            href={`#${item.route}`}
            onClick={(e) => {
              e.preventDefault();
              go(item.route);
            }}
            className={cn(
              "flex flex-col items-center gap-1.5 py-3 transition-colors",
              isActive(item.route) ? "text-brand-ink" : "text-faint",
            )}
          >
            <Icon name={item.icon} className="h-[19px] w-[19px]" />
            <span className="text-[10.5px] font-medium">{item.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
