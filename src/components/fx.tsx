import { useEffect, useRef, useState } from "react";
import { navigate } from "@/lib/router";
import { useClub } from "@/lib/store";
import { useReducedMotion } from "@/lib/motion";
import { Button } from "@/components/ui";

/* ------------------------------------------------------------------
   EFFETS "HOOK" — légers, sans bibliothèque, pensés pour le mobile.
   Tous respectent prefers-reduced-motion.
------------------------------------------------------------------ */

/** Barre de progression de lecture (orange → bleu) en haut de page. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
      if (ref.current) ref.current.style.transform = `scaleX(${p})`;
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, []);
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[70] h-[3px]">
      <div
        ref={ref}
        className="h-full origin-left bg-gradient-to-r from-brand via-[#ff8f61] to-violet"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}

/** Mot qui change dans le titre : CRÉER → CODER → LANCER… */
export function RotatingWord({ words, className }: { words: string[]; className?: string }) {
  const reduced = useReducedMotion();
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = window.setInterval(() => setI((v) => (v + 1) % words.length), 2400);
    return () => window.clearInterval(id);
  }, [reduced, words.length]);
  return (
    <span className={className} aria-label={words[0]}>
      <span key={i} aria-hidden="true" className="rot-word inline-block">
        {words[i]}
      </span>
    </span>
  );
}

/* ------------------------------------------------------------------
   TERMINAL QUI "TAPE" : une idée devient une app, en boucle.
------------------------------------------------------------------ */

const SCENARIOS = [
  {
    prompt: "Un site pour mon club de foot",
    steps: ["Pages et navigation créées", "Design responsive généré", "Formulaire d'inscription branché"],
  },
  {
    prompt: "Une app de quiz pour réviser",
    steps: ["Questions et scores structurés", "Interface mobile générée", "Classement des joueurs ajouté"],
  },
  {
    prompt: "Un portfolio pour montrer mes projets",
    steps: ["Galerie de projets créée", "Animations douces ajoutées", "Lien de partage prêt"],
  },
];

export function TypeTerminal() {
  const reduced = useReducedMotion();
  const [s, setS] = useState(0);
  const [typed, setTyped] = useState(0);
  const [steps, setSteps] = useState(0);
  const scenario = SCENARIOS[s];
  const total = scenario.steps.length + 1;

  useEffect(() => {
    if (reduced) {
      setTyped(SCENARIOS[0].prompt.length);
      setSteps(SCENARIOS[0].steps.length + 1);
      return;
    }
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(() => !cancelled && fn(), ms));
    };
    const sc = SCENARIOS[s];
    const count = sc.steps.length + 1;
    setTyped(0);
    setSteps(0);
    let i = 0;
    const step = (k: number) =>
      later(() => {
        setSteps(k + 1);
        if (k + 1 < count) step(k + 1);
        else later(() => setS((v) => (v + 1) % SCENARIOS.length), 3400);
      }, 650);
    const type = () => {
      i += 1;
      setTyped(i);
      if (i < sc.prompt.length) later(type, 34 + Math.random() * 34);
      else step(0);
    };
    later(type, 450);
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, [s, reduced]);

  const prompt = scenario.prompt.slice(0, typed);
  const typing = typed < scenario.prompt.length || steps === 0;

  return (
    <div className="min-h-[250px] space-y-3.5 px-5 pb-28 pt-6 font-mono text-[13px] leading-relaxed md:px-7 md:pt-8 md:text-[14px]">
      <p className="sr-only">Exemple : une idée de projet est transformée en application grâce à l'IA.</p>
      <p aria-hidden="true" className={`flex items-start gap-3 text-ink ${typing ? "term-cursor" : ""}`}>
        <span className="text-violet">›</span>
        <span>{prompt}</span>
      </p>
      {scenario.steps.slice(0, Math.max(0, steps)).map((text) => (
        <p aria-hidden="true" key={`${s}-${text}`} className="term-line flex items-start gap-3 text-muted">
          <span className="text-brand">✓</span>
          <span>{text}</span>
        </p>
      ))}
      {steps >= total && (
        <p aria-hidden="true" key={`${s}-done`} className="term-line flex items-start gap-3 text-brand-ink">
          <span>▸</span>
          <span>Prêt à partager.</span>
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------
   BARRE D'ACTION COLLÉE EN BAS (mobile uniquement)
   Apparaît après le hero, disparaît devant l'appel à l'action final.
------------------------------------------------------------------ */

export function StickyJoinBar() {
  const { me } = useClub();
  const [past, setPast] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const onScroll = () => setPast(window.scrollY > 640);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const targets = [document.getElementById("cta-final"), document.querySelector("footer")].filter(
      (t): t is Element => !!t,
    );
    if (!targets.length || typeof IntersectionObserver === "undefined") return;
    const seen = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) seen.add(entry.target);
          else seen.delete(entry.target);
        });
        setAtEnd(seen.size > 0);
      },
      { threshold: 0.15 },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, []);

  const show = past && !atEnd;
  return (
    <div
      className={`pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 pt-3 transition-transform duration-300 ease-out md:hidden ${
        show ? "translate-y-0" : "translate-y-full"
      }`}
      aria-hidden={!show}
    >
      <div className="flex items-center justify-between gap-3 pb-3">
        <p className="text-[13px] leading-tight text-muted">
          {me ? "Content de te revoir" : "Prêt·e à créer avec l'IA ?"}
        </p>
        <Button
          size="sm"
          iconRight="arrowRight"
          tabIndex={show ? 0 : -1}
          onClick={() => navigate(me ? "/app" : "/join")}
          className="shadow-[0_0_24px_-6px_rgba(240,102,47,0.7)]"
        >
          {me ? "Mon espace" : "Rejoindre le club"}
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------
   LUEUR QUI SUIT LE DOIGT / LA SOURIS
   - sur les cartes : spotlight localisé
   - dans le hero : halo qui suit le point de contact
------------------------------------------------------------------ */

export function useTouchGlow(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    let timer = 0;
    const setVars = (target: HTMLElement, x: number, y: number) => {
      const rect = target.getBoundingClientRect();
      target.style.setProperty("--mx", `${x - rect.left}px`);
      target.style.setProperty("--my", `${y - rect.top}px`);
    };
    const onMove = (e: PointerEvent) => {
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".rounded-card");
      if (card && el.contains(card)) setVars(card, e.clientX, e.clientY);
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      const card = (e.target as HTMLElement | null)?.closest<HTMLElement>(".rounded-card");
      if (card && e.pointerType !== "mouse") {
        card.classList.add("spot-on");
        window.clearTimeout(timer);
        timer = window.setTimeout(() => card.classList.remove("spot-on"), 650);
      }
    };
    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerdown", onDown, { passive: true });
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerdown", onDown);
      window.clearTimeout(timer);
    };
  }, [root]);
}

/** Halo + parallaxe du hero (met à jour des variables CSS, sans re-render React). */
export function useHeroMotion(section: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = section.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let hx = 0;
    let hy = 0;
    const apply = () => {
      raf = 0;
      el.style.setProperty("--hx", `${hx}px`);
      el.style.setProperty("--hy", `${hy}px`);
      el.style.setProperty("--sy", `${Math.min(window.scrollY, 900)}`);
    };
    const queue = () => {
      if (!raf) raf = window.requestAnimationFrame(apply);
    };
    const onPointer = (e: PointerEvent) => {
      const rect = el.getBoundingClientRect();
      hx = e.clientX - rect.left;
      hy = e.clientY - rect.top;
      el.style.setProperty("--hero-spot", "1");
      queue();
    };
    const onLeave = () => el.style.setProperty("--hero-spot", "0");
    el.addEventListener("pointermove", onPointer, { passive: true });
    el.addEventListener("pointerdown", onPointer, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    el.addEventListener("pointerup", onLeave);
    window.addEventListener("scroll", queue, { passive: true });
    queue();
    return () => {
      el.removeEventListener("pointermove", onPointer);
      el.removeEventListener("pointerdown", onPointer);
      el.removeEventListener("pointerleave", onLeave);
      el.removeEventListener("pointerup", onLeave);
      window.removeEventListener("scroll", queue);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [section]);
}
