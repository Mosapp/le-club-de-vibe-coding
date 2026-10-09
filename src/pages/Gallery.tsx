import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { navigate } from "@/lib/router";
import { useClub } from "@/lib/store";
import { GALLERY_TAGS, useGallery, usePhotographers, type GalleryPhoto } from "@/lib/gallery";
import heroPortrait from "@/media/gallery/hero-portrait.webp";
import "./gallery.css";

/* ==================================================================
   GALERIE — les photos de nos travaux, publiées par les photographes du club.
   Lecture : tout le monde (même sans compte). Publication : photographes + admins.
================================================================== */

const THEMES = ["clair", "obsidienne", "citron"] as const;
const WORD = "GALERIE".split("");
const FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter+Tight:wght@400;500;600;700&display=swap";

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* Les fenêtres sont rendues dans <body> : elles ne dépendent d'aucun parent. */
function Portal({ theme, children }: { theme: string; children: ReactNode }) {
  return createPortal(
    <div className="gal-portal" data-theme={theme}>
      {children}
    </div>,
    document.body,
  );
}

function Dialog({
  title,
  sub,
  onClose,
  children,
  theme,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  children: ReactNode;
  theme: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>("input, select, button, textarea")?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <Portal theme={theme}>
      <div className="gal-overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
        <div ref={ref} className="gal-dialog" role="dialog" aria-modal="true" aria-label={title}>
          <h2>{title}</h2>
          {sub && <p className="gal-sub">{sub}</p>}
          {children}
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------- publier des photos ------------------------- */

function PublishDialog({
  theme,
  onClose,
  publish,
  onDone,
}: {
  theme: string;
  onClose: () => void;
  publish: ReturnType<typeof useGallery>["publish"];
  onDone: (count: number) => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [tag, setTag] = useState<string>(GALLERY_TAGS[0]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const pick = (list: FileList | null) => {
    const next = [...(list ?? [])].filter((f) => f.type.startsWith("image/")).slice(0, 12);
    setFiles(next);
    setError(next.length === 0 && list?.length ? "Choisis des fichiers image (JPG, PNG, WebP…)." : null);
  };

  const submit = async () => {
    if (!files.length || busy) return;
    setError(null);
    setBusy(`Préparation… 0/${files.length}`);
    try {
      await publish(files, { tag, title: files.length === 1 ? title : "", caption }, (d, t) =>
        setBusy(`Envoi… ${d}/${t}`),
      );
      onDone(files.length);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "La publication a échoué.");
      setBusy(null);
    }
  };

  return (
    <Dialog theme={theme} title="Publier des photos" sub="Jusqu'à 12 photos à la fois. Elles sont allégées automatiquement pour charger vite." onClose={onClose}>
      <label className="gal-drop">
        {files.length ? `${files.length} photo${files.length > 1 ? "s" : ""} choisie${files.length > 1 ? "s" : ""}` : "Choisir des photos"}
        <small>Touche ici pour ouvrir ta galerie</small>
        <input type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
      </label>
      {previews.length > 0 && (
        <div className="gal-previews">
          {previews.map((u) => (
            <img key={u} src={u} alt="" />
          ))}
        </div>
      )}
      <label className="gal-field">
        Catégorie
        <select value={tag} onChange={(e) => setTag(e.target.value)}>
          {GALLERY_TAGS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      {files.length === 1 && (
        <label className="gal-field">
          Titre (facultatif)
          <input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Build night 01" />
        </label>
      )}
      <label className="gal-field">
        Légende (facultatif)
        <textarea rows={2} value={caption} maxLength={240} onChange={(e) => setCaption(e.target.value)} placeholder="Une phrase pour raconter la photo" />
      </label>
      {error && <p className="gal-error" role="alert">{error}</p>}
      <div className="gal-row">
        <button type="button" className="gal-pill" onClick={onClose} disabled={!!busy}>
          Annuler
        </button>
        <button type="button" className="gal-pill is-solid" onClick={submit} disabled={!files.length || !!busy}>
          {busy ?? `Publier ${files.length || ""}`.trim()}
        </button>
      </div>
    </Dialog>
  );
}

/* ------------------------- gérer les photographes (admin) ------------------------- */

function PhotographersDialog({ theme, onClose }: { theme: string; onClose: () => void }) {
  const { data, toast } = useClub();
  const { ids, loading, setPhotographer } = usePhotographers(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const members = data.members.filter((m) => m.status === "ACTIVE");

  const toggle = async (id: string, on: boolean) => {
    setBusyId(id);
    try {
      await setPhotographer(id, on);
    } catch (e) {
      toast({ title: "Action impossible", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
    setBusyId(null);
  };

  return (
    <Dialog theme={theme} title="Photographes" sub="Les photographes (et les admins) peuvent publier dans la galerie. Tout le monde peut la regarder." onClose={onClose}>
      <div className="gal-people">
        {loading && <p className="gal-sub">Chargement…</p>}
        {members.map((m) => {
          const admin = m.role === "ADMIN";
          const on = admin || ids.has(m.id);
          return (
            <div className="gal-person" key={m.id}>
              <span>
                {m.firstName} {m.lastName}
                <small>{admin ? "Admin — peut déjà publier" : on ? "Photographe" : "Membre"}</small>
              </span>
              {!admin && (
                <button type="button" className={`gal-pill${on ? " is-solid" : ""}`} disabled={busyId === m.id} onClick={() => void toggle(m.id, !on)}>
                  {on ? "Retirer" : "Nommer photographe"}
                </button>
              )}
            </div>
          );
        })}
      </div>
      <div className="gal-row">
        <button type="button" className="gal-pill is-solid" onClick={onClose}>
          Fermer
        </button>
      </div>
    </Dialog>
  );
}

/* ------------------------- visionneuse plein écran ------------------------- */

function Lightbox({
  theme,
  photos,
  index,
  setIndex,
  onClose,
  canDelete,
  onDelete,
}: {
  theme: string;
  photos: GalleryPhoto[];
  index: number;
  setIndex: (i: number) => void;
  onClose: () => void;
  canDelete: (p: GalleryPhoto) => boolean;
  onDelete: (p: GalleryPhoto) => void;
}) {
  const photo = photos[index];
  const go = useCallback(
    (d: number) => setIndex((index + d + photos.length) % photos.length),
    [index, photos.length, setIndex],
  );
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
      previous?.focus?.();
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  if (!photo) return null;
  return (
    <Portal theme={theme}>
      <div className="gal-lightbox" role="dialog" aria-modal="true" aria-label={photo.title || "Photo de la galerie"}>
        <div className="gal-lb-stage" onClick={(e) => e.target === e.currentTarget && onClose()}>
          <button ref={closeRef} type="button" className="gal-lb-btn gal-lb-close" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
          {photos.length > 1 && (
            <>
              <button type="button" className="gal-lb-btn gal-lb-prev" onClick={() => go(-1)} aria-label="Photo précédente">
                ←
              </button>
              <button type="button" className="gal-lb-btn gal-lb-next" onClick={() => go(1)} aria-label="Photo suivante">
                →
              </button>
            </>
          )}
          <img
            key={photo.id}
            className="gal-lb-img"
            src={photo.src}
            alt={photo.title || photo.caption || "Photo du club"}
            width={photo.width}
            height={photo.height}
            style={{ backgroundImage: `url(${photo.thumb})`, aspectRatio: `${photo.width} / ${photo.height}` }}
          />
        </div>
        <div className="gal-lb-info">
          <div>
            <h2>{photo.title || photo.tag}</h2>
            <p>
              {photo.caption && <>{photo.caption} · </>}
              {photo.tag} · {photo.authorName ? `par ${photo.authorName} · ` : ""}
              {fmtDate(photo.createdAt)}
            </p>
          </div>
          {canDelete(photo) && (
            <button type="button" className="gal-danger" onClick={() => onDelete(photo)}>
              Supprimer
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
}

/* ------------------------------ PAGE ------------------------------ */

export default function GalleryPage() {
  const { me, isAdmin, toast } = useClub();
  const { photos, loading, error, canPublish, publish, remove, enabled } = useGallery();
  const [themeIdx, setThemeIdx] = useState(0);
  const [ready, setReady] = useState(reducedMotion());
  const [tagFilter, setTagFilter] = useState<string>("all");
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [publishOpen, setPublishOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const heroRef = useRef<HTMLElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const theme = THEMES[themeIdx];

  /* Polices de la page (chargées seulement ici). */
  useEffect(() => {
    if (document.getElementById("gal-fonts")) return;
    const link = document.createElement("link");
    link.id = "gal-fonts";
    link.rel = "stylesheet";
    link.href = FONTS_HREF;
    document.head.appendChild(link);
  }, []);

  /* Fin de l'animation d'arrivée. */
  useEffect(() => {
    if (ready) return;
    const t = window.setTimeout(() => setReady(true), 1800);
    return () => window.clearTimeout(t);
  }, [ready]);

  /* Parallaxe : le titre et la photo bougent en sens inverse avec la souris. */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero || reducedMotion()) return;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.075;
      y += (ty - y) * 0.075;
      hero.style.setProperty("--wx", `${-x * 60}px`);
      hero.style.setProperty("--wy", `${-y * 36}px`);
      hero.style.setProperty("--px", `${x * 34}px`);
      hero.style.setProperty("--py", `${y * 18}px`);
      raf = Math.abs(tx - x) > 0.002 || Math.abs(ty - y) > 0.002 ? requestAnimationFrame(tick) : 0;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const r = hero.getBoundingClientRect();
      tx = (e.clientX - r.left) / r.width - 0.5;
      ty = (e.clientY - r.top) / r.height - 0.5;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const leave = () => {
      tx = 0;
      ty = 0;
      if (!raf) raf = requestAnimationFrame(tick);
    };
    hero.addEventListener("pointermove", move);
    hero.addEventListener("pointerleave", leave);
    return () => {
      hero.removeEventListener("pointermove", move);
      hero.removeEventListener("pointerleave", leave);
      cancelAnimationFrame(raf);
    };
  }, []);

  /* Curseur rond (souris uniquement). */
  useEffect(() => {
    const ring = ringRef.current;
    if (!ring || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      ring.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
      ring.classList.add("is-visible");
      ring.classList.toggle("is-large", !!(e.target as Element | null)?.closest?.("[data-cursor]"));
    };
    const out = (e: PointerEvent) => {
      if (!e.relatedTarget) ring.classList.remove("is-visible");
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerout", out);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", out);
    };
  }, []);

  const tags = useMemo(() => GALLERY_TAGS.filter((t) => photos.some((p) => p.tag === t)), [photos]);
  const visible = useMemo(
    () => (tagFilter === "all" ? photos : photos.filter((p) => p.tag === tagFilter)),
    [photos, tagFilter],
  );

  const burst = (e: React.MouseEvent) => {
    const hero = heroRef.current;
    if (!hero || reducedMotion()) return;
    const rect = hero.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    for (let i = 0; i < 18; i++) {
      const dot = document.createElement("span");
      const angle = Math.random() * Math.PI * 2;
      const dist = 28 + Math.random() * 92;
      dot.className = "gal-particle";
      dot.style.left = `${x}px`;
      dot.style.top = `${y}px`;
      hero.append(dot);
      dot
        .animate(
          [
            { transform: "translate(-50%, -50%) scale(1)", opacity: 1 },
            { transform: `translate(calc(-50% + ${Math.cos(angle) * dist}px), calc(-50% + ${Math.sin(angle) * dist}px)) scale(0)`, opacity: 0 },
          ],
          { duration: 500 + Math.random() * 450, easing: "cubic-bezier(.15,.7,.3,1)" },
        )
        .addEventListener("finish", () => dot.remove());
    }
  };

  const canDelete = useCallback((p: GalleryPhoto) => !!me && (isAdmin || p.authorId === me.id), [me, isAdmin]);

  const onDelete = async (p: GalleryPhoto) => {
    if (!window.confirm("Supprimer cette photo définitivement ?")) return;
    try {
      await remove(p);
      setOpenIdx(null);
      toast({ title: "Photo supprimée.", tone: "info" });
    } catch (e) {
      toast({ title: "Suppression impossible", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
  };

  const openPhoto = (p: GalleryPhoto) => {
    const i = visible.findIndex((v) => v.id === p.id);
    setOpenIdx(i >= 0 ? i : null);
  };

  const closeLightbox = useCallback(() => setOpenIdx(null), []);
  const closePublish = useCallback(() => setPublishOpen(false), []);
  const closeAdmin = useCallback(() => setAdminOpen(false), []);

  return (
    <div className={`gal${ready ? "" : " gal-intro"}`} data-theme={theme}>
      <header className="gal-mast">
        <button type="button" className="gal-brand" onClick={() => navigate(me ? "/app" : "/")}>
          {me ? "← Mon espace" : <>← Club de Vibe Coding<sup>®</sup></>}
        </button>
        <div className="gal-vol">
          Galerie
          <br />
          Volume 01 / 2026
        </div>
        <div className="gal-actions">
          <button type="button" className="gal-pill" onClick={() => setThemeIdx((themeIdx + 1) % THEMES.length)} aria-label="Changer l'ambiance de couleur">
            Ambiance
          </button>
          {isAdmin && (
            <button type="button" className="gal-pill" onClick={() => setAdminOpen(true)}>
              Photographes
            </button>
          )}
          {canPublish && (
            <button type="button" className="gal-pill is-solid" onClick={() => setPublishOpen(true)}>
              + Publier
            </button>
          )}
          {!me && (
            <button type="button" className="gal-pill" onClick={() => navigate("/login")}>
              Se connecter
            </button>
          )}
        </div>
      </header>

      <section ref={heroRef} className="gal-hero" aria-labelledby="gal-title">
        <p className="gal-kicker">
          Nos travaux,
          <br />
          en images.
        </p>
        <p className="gal-index">
          {photos.length} photo{photos.length > 1 ? "s" : ""}
          <br />
          publiée{photos.length > 1 ? "s" : ""}
        </p>
        <h1 id="gal-title" className="gal-word" aria-label="Galerie">
          <span className="gal-word-in" aria-hidden="true">
            {WORD.map((l, i) => (
              <span className="gal-letter" key={i} style={{ "--i": i } as CSSProperties}>
                {l}
              </span>
            ))}
          </span>
        </h1>
        <div className="gal-portrait">
          <div className="gal-portrait-in">
            <button type="button" data-cursor aria-label="Faire jaillir des étincelles" onClick={burst}>
              <img src={heroPortrait} alt="Portrait détouré d'un membre du club, avec des ailes blanches" fetchPriority="high" draggable={false} />
            </button>
          </div>
        </div>
        <p className="gal-credit">
          Portrait : membre du club
          <br />
          Abidjan · 2026
        </p>
        <p className="gal-hint">
          Clique pour
          <br />
          allumer.
        </p>
      </section>

      <main className="gal-body">
        <div className="gal-head">
          <div>
            <p className="gal-eyebrow">Les coulisses du club</p>
            <h2 className="gal-title">Tout voir</h2>
          </div>
          {tags.length > 0 && (
            <div className="gal-chips" role="group" aria-label="Filtrer par catégorie">
              <button type="button" className="gal-chip" aria-pressed={tagFilter === "all"} onClick={() => setTagFilter("all")}>
                Tout
              </button>
              {tags.map((t) => (
                <button key={t} type="button" className="gal-chip" aria-pressed={tagFilter === t} onClick={() => setTagFilter(t)}>
                  {t}
                </button>
              ))}
            </div>
          )}
        </div>

        {!enabled ? (
          <p className="gal-note">La galerie n'est pas connectée à la base de données (Supabase) sur cette version.</p>
        ) : error ? (
          <p className="gal-note">
            Impossible de charger la galerie pour le moment. Si c'est la première fois : exécute
            {" "}<code>supabase/migration-gallery.sql</code> dans Supabase.
          </p>
        ) : visible.length === 0 && !loading ? (
          <p className="gal-note">Aucune photo pour l'instant. Reviens vite !</p>
        ) : (
          <div className="gal-grid">
            {visible.map((p, i) => (
              <button
                key={p.id}
                type="button"
                className="gal-tile"
                data-cursor
                style={{ aspectRatio: `${p.width} / ${p.height}` }}
                onClick={() => setOpenIdx(i)}
                aria-label={`Agrandir : ${p.title || p.caption || p.tag}`}
              >
                <img src={p.thumb} alt={p.title || p.caption || "Photo du club"} width={p.width} height={p.height} loading="lazy" decoding="async" />
                <span className="gal-tile-cap">
                  <span>{p.title || p.tag}</span>
                  <span>{p.tag}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </main>

      <Portal theme={theme}>
        <div ref={ringRef} className="gal-cursor" aria-hidden="true" />
      </Portal>

      {openIdx !== null && visible.length > 0 && (
        <Lightbox
          theme={theme}
          photos={visible}
          index={Math.min(openIdx, visible.length - 1)}
          setIndex={setOpenIdx}
          onClose={closeLightbox}
          canDelete={canDelete}
          onDelete={(p) => void onDelete(p)}
        />
      )}
      {publishOpen && (
        <PublishDialog
          theme={theme}
          onClose={closePublish}
          publish={publish}
          onDone={(n) => toast({ title: n > 1 ? `${n} photos publiées.` : "Photo publiée.", description: "Elle est visible par tout le monde.", tone: "success" })}
        />
      )}
      {adminOpen && <PhotographersDialog theme={theme} onClose={closeAdmin} />}
    </div>
  );
}
