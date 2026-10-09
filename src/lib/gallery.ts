import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useClub } from "@/lib/store";

/* ------------------------------------------------------------------
   GALERIE — accès aux données (autonome : ne touche pas au store du club)
   Tables : gallery_photos, photographers · Bucket : gallery
   Voir supabase/migration-gallery.sql
------------------------------------------------------------------ */

export const GALLERY_BUCKET = "gallery";
export const GALLERY_TAGS = ["Projet", "Session", "Défi", "Événement", "Équipe"] as const;

export interface GalleryPhoto {
  id: string;
  title: string;
  caption: string;
  tag: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  src: string;
  thumb: string;
  width: number;
  height: number;
  path: string;
  thumbPath: string;
}

interface Row {
  id: string;
  title: string;
  caption: string;
  tag: string;
  path: string;
  thumb_path: string;
  width: number;
  height: number;
  author_id: string;
  author_name: string;
  created_at: string;
}

function publicUrl(path: string): string {
  return supabase ? supabase.storage.from(GALLERY_BUCKET).getPublicUrl(path).data.publicUrl : "";
}

function toPhoto(r: Row): GalleryPhoto {
  return {
    id: r.id,
    title: r.title,
    caption: r.caption,
    tag: r.tag,
    authorId: r.author_id,
    authorName: r.author_name,
    createdAt: r.created_at,
    src: publicUrl(r.path),
    thumb: publicUrl(r.thumb_path),
    width: r.width || 4,
    height: r.height || 3,
    path: r.path,
    thumbPath: r.thumb_path,
  };
}

/* Redimensionne + convertit en WebP (JPEG si le navigateur ne sait pas) : galeries rapides, même en 3G. */
async function compressImage(file: File, maxSide: number, quality: number) {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    try {
      bitmap = await createImageBitmap(file);
    } catch {
      throw new Error(`« ${file.name} » : format d'image non pris en charge.`);
    }
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Ton navigateur ne peut pas préparer l'image.");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();
  const toBlob = (type: string) => new Promise<Blob | null>((res) => canvas.toBlob(res, type, quality));
  let blob = await toBlob("image/webp");
  if (!blob || blob.type !== "image/webp") blob = await toBlob("image/jpeg");
  if (!blob) throw new Error("Impossible de compresser l'image.");
  return { blob, width, height, ext: blob.type === "image/webp" ? "webp" : "jpg" };
}

export function useGallery() {
  const { me } = useClub();
  const [photos, setPhotos] = useState<GalleryPhoto[]>([]);
  const [loading, setLoading] = useState<boolean>(!!supabase);
  const [error, setError] = useState<string | null>(null);
  const [canPublish, setCanPublish] = useState(false);

  const load = useCallback(async () => {
    const sb = supabase;
    if (!sb) return;
    const { data, error: err } = await sb
      .from("gallery_photos")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (err) {
      setError(err.message);
    } else {
      setError(null);
      setPhotos(((data ?? []) as Row[]).map(toPhoto));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const sb = supabase;
    if (!sb) return;
    void load();
    const channel = sb
      .channel("gallery-photos")
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery_photos" }, () => void load())
      .subscribe();
    return () => {
      void sb.removeChannel(channel);
    };
  }, [load]);

  const meId = me?.id;
  useEffect(() => {
    const sb = supabase;
    let off = false;
    if (!sb || !meId) {
      setCanPublish(false);
      return;
    }
    void sb.rpc("is_photographer").then(({ data, error: err }) => {
      if (!off) setCanPublish(!err && data === true);
    });
    return () => {
      off = true;
    };
  }, [meId]);

  const publish = useCallback(
    async (
      files: File[],
      meta: { tag: string; title: string; caption: string },
      onProgress?: (done: number, total: number) => void,
    ) => {
      const sb = supabase;
      if (!sb || !me) throw new Error("Connecte-toi pour publier.");
      let done = 0;
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error(`« ${file.name} » n'est pas une image.`);
        const full = await compressImage(file, 1800, 0.82);
        const thumb = await compressImage(file, 640, 0.78);
        const id = crypto.randomUUID();
        const path = `${me.id}/${id}.${full.ext}`;
        const thumbPath = `${me.id}/${id}-t.${thumb.ext}`;
        const bucket = sb.storage.from(GALLERY_BUCKET);
        const up1 = await bucket.upload(path, full.blob, { contentType: full.blob.type, cacheControl: "31536000" });
        if (up1.error) throw new Error(up1.error.message);
        const up2 = await bucket.upload(thumbPath, thumb.blob, { contentType: thumb.blob.type, cacheControl: "31536000" });
        if (up2.error) {
          await bucket.remove([path]);
          throw new Error(up2.error.message);
        }
        const { error: err } = await sb.from("gallery_photos").insert({
          title: meta.title.trim(),
          caption: meta.caption.trim(),
          tag: meta.tag,
          path,
          thumb_path: thumbPath,
          width: full.width,
          height: full.height,
          author_id: me.id,
          author_name: `${me.firstName} ${me.lastName}`.trim(),
        });
        if (err) {
          await bucket.remove([path, thumbPath]);
          throw new Error(err.message);
        }
        done += 1;
        onProgress?.(done, files.length);
      }
      await load();
    },
    [me, load],
  );

  const remove = useCallback(async (photo: GalleryPhoto) => {
    const sb = supabase;
    if (!sb) return;
    const { error: err } = await sb.from("gallery_photos").delete().eq("id", photo.id);
    if (err) throw new Error(err.message);
    await sb.storage.from(GALLERY_BUCKET).remove([photo.path, photo.thumbPath]);
    setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
  }, []);

  return { photos, loading, error, canPublish, publish, remove, enabled: !!supabase };
}

/* Admin : choisir qui peut publier. */
export function usePhotographers(enabled: boolean) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sb = supabase;
    if (!enabled || !sb) return;
    let off = false;
    setLoading(true);
    void sb
      .from("photographers")
      .select("member_id")
      .then(({ data }) => {
        if (off) return;
        setIds(new Set(((data ?? []) as { member_id: string }[]).map((r) => r.member_id)));
        setLoading(false);
      });
    return () => {
      off = true;
    };
  }, [enabled]);

  const setPhotographer = useCallback(async (memberId: string, on: boolean) => {
    const sb = supabase;
    if (!sb) return;
    const res = on
      ? await sb.from("photographers").insert({ member_id: memberId })
      : await sb.from("photographers").delete().eq("member_id", memberId);
    if (res.error) throw new Error(res.error.message);
    setIds((prev) => {
      const next = new Set(prev);
      if (on) next.add(memberId);
      else next.delete(memberId);
      return next;
    });
  }, []);

  return { ids, loading, setPhotographer };
}
