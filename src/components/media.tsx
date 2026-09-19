import { useEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";
import { getMedia, resolveMedia, type MediaAsset } from "@/config/media";
import { useClub } from "@/lib/store";
import { RevealMask, useInView, useReducedMotion } from "@/lib/motion";
import { Icon } from "@/components/ui";

/* ==================================================================
   PLACEHOLDER ÉLÉGANT
   S'affiche quand aucun média n'est défini pour un emplacement.
================================================================== */

export function MediaPlaceholder({
  slot,
  label,
  ratio = "16/10",
  className,
  rounded = "rounded-card",
  compact = false,
}: {
  slot: string;
  label?: string;
  ratio?: string;
  className?: string;
  rounded?: string;
  compact?: boolean;
}) {
  const asset = getMedia(slot);
  return (
    <div
      className={cn(
        "paper-grain relative flex w-full items-center justify-center overflow-hidden border border-dashed border-line bg-surface-2",
        rounded,
        className,
      )}
      style={{ aspectRatio: ratio }}
      role="img"
      aria-label={`Emplacement média ${slot} — aucun média défini`}
    >
      <div className="flex flex-col items-center gap-2.5 px-6 text-center">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-faint">
          <Icon name="image" className="h-[18px] w-[18px]" />
        </div>
        {!compact && (
          <>
            <span className="label-mono text-muted">{slot}</span>
            <span className="max-w-[26ch] text-[13px] leading-snug text-faint">
              {label ?? asset.label} — ajouter une image ou une vidéo
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/* ==================================================================
   IMAGE
================================================================== */

export function MediaImage({
  src,
  alt,
  ratio = "16/10",
  className,
  rounded = "rounded-card",
  fit = "cover",
  priority = false,
  zoomOnHover = false,
  sizes,
}: {
  src: string | null | undefined;
  alt: string;
  ratio?: string;
  className?: string;
  rounded?: string;
  fit?: "cover" | "contain";
  priority?: boolean;
  zoomOnHover?: boolean;
  sizes?: string;
}) {
  const [failed, setFailed] = useState(false);
  const { ref, inView } = useInView<HTMLDivElement>({ threshold: 0.05 });

  if (!src || failed) {
    return <MediaPlaceholder slot="MEDIA" label={alt || "Visuel à définir"} ratio={ratio} className={className} rounded={rounded} />;
  }

  const show = priority || inView;

  return (
    <div
      ref={ref}
      className={cn("relative w-full overflow-hidden bg-surface-2", rounded, className)}
      style={{ aspectRatio: ratio }}
    >
      {show ? (
        <img
          src={src}
          alt={alt}
          sizes={sizes}
          loading={priority ? "eager" : "lazy"}
          decoding="async"
          onError={() => setFailed(true)}
          className={cn(
            "h-full w-full transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
            fit === "cover" ? "object-cover" : "object-contain",
            zoomOnHover && "group-hover:scale-[1.035]",
          )}
        />
      ) : (
        <div className="h-full w-full animate-pulse bg-line-2" />
      )}
    </div>
  );
}

/* ==================================================================
   VIDÉO
   - autoplay uniquement si autorisé et écran suffisamment large
   - mise en lecture/pause via IntersectionObserver
   - fallback élégant si la vidéo échoue
================================================================== */

export function MediaVideo({
  src,
  poster,
  title,
  ratio = "16/10",
  className,
  rounded = "rounded-card",
  autoPlay = true,
  loop = true,
  controls = false,
}: {
  src: string | null | undefined;
  poster?: string | null;
  title: string;
  ratio?: string;
  className?: string;
  rounded?: string;
  autoPlay?: boolean;
  loop?: boolean;
  controls?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [canAutoplay, setCanAutoplay] = useState(false);
  const reduced = useReducedMotion();

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setCanAutoplay(mq.matches && !reduced);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [reduced]);

  useEffect(() => {
    const el = wrapRef.current;
    const video = videoRef.current;
    if (!el || !video || typeof IntersectionObserver === "undefined") return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && autoPlay && canAutoplay) void video.play().catch(() => undefined);
        else video.pause();
      },
      { threshold: 0.25 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [autoPlay, canAutoplay]);

  if (!src || failed) {
    return (
      <MediaPlaceholder
        slot="VIDEO"
        label={poster ? title : `${title} — vidéo à définir`}
        ratio={ratio}
        className={className}
        rounded={rounded}
      />
    );
  }

  return (
    <div
      ref={wrapRef}
      className={cn("relative w-full overflow-hidden bg-ink", rounded, className)}
      style={{ aspectRatio: ratio }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster ?? undefined}
        title={title}
        muted
        playsInline
        loop={loop}
        controls={controls}
        preload="metadata"
        onError={() => setFailed(true)}
        className="h-full w-full object-cover"
      />
      {!controls && (
        <span className="label-mono pointer-events-none absolute bottom-3 left-3 rounded-full bg-ink/55 px-2.5 py-1.5 text-white/85 backdrop-blur-sm">
          Vidéo
        </span>
      )}
    </div>
  );
}

/* ==================================================================
   MEDIA SLOT
   Résout un média depuis la configuration centrale.
   <MediaSlot slot="HERO_MEDIA" ratio="4/5" />
================================================================== */

export function MediaSlot({
  slot,
  ratio,
  className,
  rounded = "rounded-card",
  priority = false,
  zoomOnHover = false,
  reveal = false,
  fit = "cover",
}: {
  slot: string;
  ratio?: string;
  className?: string;
  rounded?: string;
  priority?: boolean;
  zoomOnHover?: boolean;
  reveal?: boolean;
  fit?: "cover" | "contain";
}) {
  const { mediaVersion } = useClub();
  const asset: MediaAsset = resolveMedia(slot);
  const r = ratio ?? asset.ratio;

  const content =
    asset.video && asset.video.length > 0 ? (
      <MediaVideo
        key={`${asset.video}-${mediaVersion}`}
        src={asset.video}
        poster={asset.poster ?? asset.src}
        title={asset.alt || asset.label}
        ratio={r}
        className={className}
        rounded={rounded}
      />
    ) : asset.src ? (
      <MediaImage
        key={`${asset.src}-${mediaVersion}`}
        src={asset.src}
        alt={asset.alt || asset.label}
        ratio={r}
        className={className}
        rounded={rounded}
        priority={priority}
        zoomOnHover={zoomOnHover}
        fit={fit}
      />
    ) : (
      <MediaPlaceholder slot={slot} ratio={r} className={className} rounded={rounded} />
    );

  if (!reveal) return content;
  return <RevealMask>{content}</RevealMask>;
}

/* ==================================================================
   GALERIE SIMPLE (collage 2 colonnes, mobile : 1 colonne)
================================================================== */

export function MediaGallery({
  slots,
  className,
  gap = "gap-4",
}: {
  slots: string[];
  className?: string;
  gap?: string;
}) {
  return (
    <div className={cn("grid grid-cols-1 sm:grid-cols-2", gap, className)}>
      {slots.map((s, i) => (
        <MediaSlot key={s} slot={s} reveal={i > 0} className={i === 0 ? "sm:col-span-2" : ""} />
      ))}
    </div>
  );
}
