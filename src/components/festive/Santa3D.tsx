import { useEffect, useState } from "react";
import { SantaIllustrated } from "@/components/festive/SantaIllustrated";

/* 🎅 Père Noël 3D
   Dépose le modèle dans public/santa/santa.glb (format glTF binaire, idéalement < 5 Mo, compressé Draco).
   - Tant que le fichier n'existe pas : Père Noël dessiné et animé (SantaIllustrated),
     et la bibliothèque 3D n'est pas téléchargée.
   - S'il contient des animations, la première est jouée en boucle (ex. « coucou »).
   - Sur téléphone, bouton « Voir chez moi » : le Père Noël apparaît dans la pièce (réalité augmentée). */

const MODEL = "./santa/santa.glb";
const HIDE_KEY = "cvc/santa-masque";

async function modelExists() {
  try {
    const r = await fetch(MODEL, { method: "HEAD", cache: "no-cache" });
    // Certains hébergeurs renvoient la page d'accueil (HTML) pour un fichier absent.
    return r.ok && !(r.headers.get("content-type") ?? "").includes("text/html");
  } catch {
    return false;
  }
}

export function Santa3D() {
  const [status, setStatus] = useState<"checking" | "model" | "none">("checking");
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(() => {
    try {
      return window.sessionStorage.getItem(HIDE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (hidden) return;
    let alive = true;
    void modelExists().then(async (ok) => {
      if (!alive) return;
      if (!ok) return setStatus("none");
      await import("@google/model-viewer");
      if (alive) setStatus("model");
    });
    return () => {
      alive = false;
    };
  }, [hidden]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const hide = () => {
    setHidden(true);
    try {
      window.sessionStorage.setItem(HIDE_KEY, "1");
    } catch {
      /* rien */
    }
  };

  if (hidden || status === "checking") return null;
  if (status === "none") return <SantaIllustrated onHide={hide} />;

  return (
    <>
      <div className="xm-santa-bubble fixed left-3 z-[55] sm:left-5">
        <button type="button" onClick={() => setOpen(true)} className="block h-full w-full" aria-label="Voir le Père Noël en 3D">
          <model-viewer
            src={MODEL}
            alt="Le Père Noël en 3D"
            autoplay=""
            auto-rotate=""
            auto-rotate-delay="0"
            rotation-per-second="18deg"
            interaction-prompt="none"
            disable-zoom=""
            loading="lazy"
            shadow-intensity="0.6"
            exposure="1.05"
            camera-orbit="0deg 80deg auto"
            style={{ width: "100%", height: "100%", background: "transparent", pointerEvents: "none" }}
          />
        </button>
        <button
          type="button"
          onClick={hide}
          className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-[11px] text-white"
          aria-label="Masquer le Père Noël"
        >
          ✕
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3" role="dialog" aria-modal="true" aria-label="Le Père Noël en 3D">
          <button type="button" aria-label="Fermer" onClick={() => setOpen(false)} className="absolute inset-0 bg-[#050b14]/80 backdrop-blur-sm" />
          <div className="xm-santa-stage relative h-[min(82dvh,640px)] w-full max-w-xl overflow-hidden rounded-[24px]">
            <model-viewer
              src={MODEL}
              alt="Le Père Noël en 3D — fais-le tourner avec le doigt"
              autoplay=""
              camera-controls=""
              auto-rotate=""
              touch-action="pan-y"
              shadow-intensity="1"
              shadow-softness="0.8"
              exposure="1.1"
              environment-image="neutral"
              ar=""
              ar-modes="webxr scene-viewer quick-look"
              style={{ width: "100%", height: "100%", background: "transparent" }}
            >
              <button
                slot="ar-button"
                type="button"
                className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-2.5 text-[14px] font-semibold text-[#b3122b] shadow-lg"
              >
                📱 Voir chez moi
              </button>
            </model-viewer>
            <p className="pointer-events-none absolute left-0 right-0 top-4 text-center text-[13px] font-medium text-white/80">
              Fais tourner le Père Noël avec le doigt 🎅
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white"
              aria-label="Fermer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  );
}
