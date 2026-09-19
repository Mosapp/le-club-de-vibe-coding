import { useCallback, useEffect, useMemo, useState } from "react";

/* ------------------------------------------------------------------
   ROUTEUR PAR HASH
   Le build est un fichier unique (dist/index.html) : le routage par
   hash garantit que chaque route fonctionne peu importe l'hébergement.
   Routes :  /  /join  /login  /app/*  /admin/*
------------------------------------------------------------------ */

function readRoute(): string {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw.startsWith("/")) return "/";
  return raw.split("?")[0] || "/";
}

export function useRoute() {
  const [path, setPath] = useState<string>(() => readRoute());

  useEffect(() => {
    const onChange = () => {
      const raw = window.location.hash.replace(/^#/, "");
      // Les ancres internes (#section) ne changent pas de route.
      if (!raw.startsWith("/")) return;
      setPath(raw.split("?")[0] || "/");
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return path;
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  const target = `#${to.startsWith("/") ? to : `/${to}`}`;
  if (window.location.hash === target) {
    window.scrollTo({ top: 0, behavior: "auto" });
    return;
  }
  if (opts.replace) {
    window.history.replaceState(null, "", target);
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  } else {
    window.location.hash = target;
  }
  window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
}

/** Scrolle vers une ancre de la page courante. */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = el.getBoundingClientRect().top + window.scrollY - 78;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}

export function useRouterLink() {
  const go = useCallback((to: string) => {
    if (to.startsWith("/")) navigate(to);
    else if (to.startsWith("#/")) navigate(to.slice(1));
    else if (to.startsWith("#")) scrollToId(to.slice(1));
    else window.open(to, "_blank", "noopener,noreferrer");
  }, []);
  return go;
}

/** Découpe un chemin en segments : /admin/membres → ["admin","membres"] */
export function useSegments() {
  const path = useRoute();
  return useMemo(() => path.split("/").filter(Boolean), [path]);
}
