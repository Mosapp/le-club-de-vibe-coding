import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "@/utils/cn";

/* ------------------------------------------------------------------
   ANIMATIONS — volontairement minimalistes
   fade-in · slide-up léger · reveal d'image · hover doux
   Tout respecte prefers-reduced-motion (voir index.css).
------------------------------------------------------------------ */

export function useReducedMotion() {
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

export function useInView<T extends HTMLElement>(options: { once?: boolean; threshold?: number } = {}) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setInView(true);
            if (options.once !== false) obs.disconnect();
          } else if (options.once === false) {
            setInView(false);
          }
        });
      },
      { threshold: options.threshold ?? 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [options.once, options.threshold]);

  return { ref, inView } as const;
}

interface RevealProps {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article" | "header" | "figure";
}

/** Apparition en fondu + léger décalage vertical. */
export function Reveal({ children, delay = 0, className, as = "div" }: RevealProps) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const Tag = as as "div";
  return (
    <Tag
      ref={ref}
      className={cn("reveal", inView && "is-in", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

/** Révélation d'image par masque vertical. */
export function RevealMask({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.2 });
  return (
    <div ref={ref} className={cn("reveal-img", inView && "is-in", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

/** Apparition à l'entrée d'une page. */
export function PageFade({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("anim-fade", className)}>{children}</div>;
}
