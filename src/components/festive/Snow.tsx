import { useEffect, useRef } from "react";
import { cn } from "@/utils/cn";

/* ❄️ Neige sur tout le site : un seul <canvas> fixe, sans interaction (pointer-events: none).
   - plus discrète (dim) sur la page des jeux, pour lire les énigmes ;
   - le nombre de flocons dépend de la taille de l'écran (moins sur mobile) ;
   - pause quand l'onglet est caché ;
   - « réduire les animations » : quelques flocons immobiles seulement. */

type Flake = { x: number; y: number; r: number; vy: number; vx: number; phase: number; alpha: number };

export function Snow({ dim = false }: { dim?: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let flakes: Flake[] = [];
    let raf = 0;
    let last = performance.now();

    const make = (anywhere: boolean): Flake => {
      const depth = Math.random(); // 0 = loin (petit, lent), 1 = près (gros, rapide)
      return {
        x: Math.random() * w,
        y: anywhere ? Math.random() * h : -10,
        r: 0.8 + depth * 2.6,
        vy: 18 + depth * 52,
        vx: -6 + Math.random() * 12,
        phase: Math.random() * Math.PI * 2,
        alpha: 0.35 + depth * 0.55,
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = reduce ? 18 : Math.round(Math.min(140, Math.max(40, (w * h) / 9000)));
      flakes = Array.from({ length: count }, () => make(true));
      if (reduce) draw();
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const f of flakes) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255,255,255,${f.alpha})`;
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const tick = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000);
      last = t;
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.phase += dt * 1.2;
        f.y += f.vy * dt;
        f.x += (f.vx + Math.sin(f.phase) * 14) * dt;
        if (f.y > h + 10 || f.x < -20 || f.x > w + 20) flakes[i] = make(false);
      }
      draw();
      raf = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden && !reduce) {
        last = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    if (!reduce) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className={cn("pointer-events-none fixed inset-0 z-[45] h-full w-full", dim && "opacity-40")}
    />
  );
}
