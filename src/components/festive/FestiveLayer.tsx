import { lazy, Suspense, useEffect } from "react";
import { FESTIVE_WINDOWS, isOpen, previewDate, rememberPreview, useHashTick } from "@/config/festive";
import { navigate, useRoute } from "@/lib/router";
import { Snow } from "@/components/festive/Snow";

/* 🎄 Décor des fêtes, ajouté par-dessus tout le site aux bonnes dates :
   neige, Père Noël 3D et bouton « Jeux des fêtes ». En dehors des dates : rien du tout. */

const Santa3D = lazy(() => import("@/components/festive/Santa3D").then((m) => ({ default: m.Santa3D })));

export function FestiveLayer() {
  const path = useRoute();
  useHashTick();
  useEffect(() => {
    if (path === "/fetes") rememberPreview();
  });

  const preview = previewDate() !== null;
  const snow = preview || isOpen(FESTIVE_WINDOWS.snow);
  const santa = preview || isOpen(FESTIVE_WINDOWS.santa);
  const games = preview || isOpen(FESTIVE_WINDOWS.all);
  // Pas de décor dans l'espace admin
  if (path.startsWith("/admin")) return null;

  return (
    <>
      {snow && <Snow dim={path === "/fetes"} />}
      {santa && path !== "/fetes" && (
        <Suspense fallback={null}>
          <Santa3D />
        </Suspense>
      )}
      {games && path !== "/fetes" && (
        <button
          type="button"
          onClick={() => navigate("/fetes")}
          className="xm-fab theme-dark fixed right-4 z-[60] inline-flex h-12 items-center gap-2 rounded-full px-4 text-[14px] font-semibold text-white"
          aria-label="Jeux des fêtes"
        >
          <span aria-hidden="true">🎄</span>
          <span className="hidden sm:inline">Jeux des fêtes</span>
        </button>
      )}
    </>
  );
}
