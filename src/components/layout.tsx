import { useEffect, useState } from "react";
import { BRAND, FOOTER, NAV } from "@/config/content";
import { navigate, useRouterLink } from "@/lib/router";
import { useClub } from "@/lib/store";
import { cn } from "@/utils/cn";
import { Button, Icon } from "@/components/ui";

/* ==================================================================
   LOGO
================================================================== */

export function Logo({ dark = false, className }: { dark?: boolean; className?: string }) {
  const go = useRouterLink();
  return (
    <a
      href="#/"
      onClick={(e) => {
        e.preventDefault();
        go("/");
      }}
      className={cn("group inline-flex items-center gap-2.5", className)}
      aria-label={`${BRAND.name} — accueil`}
    >
      <span className="relative flex h-8 w-8 overflow-hidden rounded-[9px] bg-ink transition-transform duration-300 group-hover:-translate-y-0.5">
        <img src="/favicon.jpeg" alt="" className="h-full w-full object-cover" />
      </span>
      <span className={cn("flex flex-col leading-none", dark ? "text-white" : "text-ink")}>
        <span className="text-[14.5px] font-semibold tracking-[-0.02em]">Club de Vibe Coding</span>
        <span className={cn("label-mono mt-1 text-[9.5px]", dark ? "text-white/45" : "text-faint")}>
          Créer avec l'IA
        </span>
      </span>
    </a>
  );
}

/* ==================================================================
   NAVBAR (visiteur)
================================================================== */

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { me } = useClub();
  const go = useRouterLink();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const link = (label: string, href: string) => (
    <a
      key={href}
      href={href}
      onClick={(e) => {
        e.preventDefault();
        go(href);
      }}
      className="relative text-[14px] font-medium text-muted transition-colors duration-200 hover:text-ink"
    >
      {label}
    </a>
  );

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "border-b border-line/80 bg-paper/85 backdrop-blur-xl" : "border-b border-transparent",
      )}
    >
      <div className="container-x flex h-[70px] items-center justify-between gap-6">
        <Logo />

        <nav className="hidden items-center gap-7 lg:flex">{NAV.primary.map((l) => link(l.label, l.href))}</nav>

        <div className="hidden items-center gap-2.5 lg:flex">
          {me ? (
            <Button size="sm" variant="secondary" iconRight="arrowRight" onClick={() => navigate("/app")}>
              Mon espace
            </Button>
          ) : (
            <>
              <Button size="sm" variant="ghost" onClick={() => navigate("/login")}>
                Se connecter
              </Button>
              <Button size="sm" iconRight="arrowRight" onClick={() => navigate("/join")}>
                Rejoindre le club
              </Button>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={open}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface text-ink lg:hidden"
        >
          <Icon name={open ? "close" : "menu"} />
        </button>
      </div>

      {open && (
        <div className="anim-fade border-t border-line bg-paper px-5 pb-8 pt-5 lg:hidden">
          <nav className="flex flex-col divide-y divide-line-2">
            {NAV.primary.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={(e) => {
                  e.preventDefault();
                  setOpen(false);
                  go(l.href);
                }}
                className="py-3.5 text-[16px] font-medium text-ink"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#/app/reglement"
              onClick={(e) => {
                e.preventDefault();
                setOpen(false);
                go("#/app/reglement");
              }}
              className="py-3.5 text-[16px] font-medium text-ink"
            >
              Le règlement
            </a>
          </nav>
          <div className="mt-6 flex flex-col gap-3">
            {me ? (
              <Button full iconRight="arrowRight" onClick={() => navigate("/app")}>
                Mon espace
              </Button>
            ) : (
              <>
                <Button full iconRight="arrowRight" onClick={() => navigate("/join")}>
                  Rejoindre le club
                </Button>
                <Button full variant="secondary" onClick={() => navigate("/login")}>
                  Se connecter
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

/* ==================================================================
   FOOTER
================================================================== */

export function Footer() {
  const go = useRouterLink();
  return (
    <footer className="border-t border-line bg-surface">
      <div className="container-x py-14 md:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo />
            <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">{BRAND.tagline}</p>
            <p className="mt-6 max-w-sm text-[13.5px] leading-relaxed text-faint">{FOOTER.note}</p>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {FOOTER.columns.map((col) => (
              <div key={col.title}>
                <h3 className="label-mono text-faint">{col.title}</h3>
                <ul className="mt-4 space-y-3">
                  {col.links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        onClick={(e) => {
                          e.preventDefault();
                          go(l.href);
                        }}
                        className="text-[14px] text-muted transition-colors duration-200 hover:text-ink"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-3 border-t border-line-2 pt-7 sm:flex-row sm:items-center sm:justify-between">
          <p className="label-mono text-faint">
            © {new Date().getFullYear()} {BRAND.name}
          </p>
          <p className="label-mono text-faint">Less effects. More personality.</p>
        </div>
      </div>
    </footer>
  );
}
