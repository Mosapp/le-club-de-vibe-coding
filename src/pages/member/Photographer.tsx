import { useEffect, useMemo, useState, type DragEvent } from "react";
import { PageHeader } from "@/pages/member/Shell";
import { Badge, Button, Card, EmptyState, Field, Icon, Input, Note, Select, Textarea } from "@/components/ui";
import { GALLERY_TAGS, useGallery, useIsPhotographer, type GalleryPhoto } from "@/lib/gallery";
import { navigate } from "@/lib/router";
import { useClub } from "@/lib/store";

/* ==================================================================
   ESPACE PHOTOGRAPHE — envoyer des photos et gérer les siennes.
   Les photos publiées sont visibles par tout le monde, même sans compte.
================================================================== */

const MAX_FILES = 12;

export default function PhotographerPage() {
  const { me, toast } = useClub();
  const allowed = useIsPhotographer();
  const { photos, publish, remove, enabled } = useGallery();

  const [files, setFiles] = useState<File[]>([]);
  const [tag, setTag] = useState<string>(GALLERY_TAGS[0]);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const previews = useMemo(() => files.map((f) => URL.createObjectURL(f)), [files]);
  useEffect(() => () => previews.forEach((u) => URL.revokeObjectURL(u)), [previews]);

  const mine = useMemo(() => photos.filter((p) => p.authorId === me?.id), [photos, me?.id]);

  const pick = (list: FileList | File[] | null) => {
    const all = [...(list ?? [])];
    const images = all.filter((f) => f.type.startsWith("image/")).slice(0, MAX_FILES);
    setFiles(images);
    if (all.length > 0 && images.length === 0) setError("Choisis des fichiers image (JPG, PNG, WebP…).");
    else if (all.filter((f) => f.type.startsWith("image/")).length > MAX_FILES) setError(`Maximum ${MAX_FILES} photos à la fois : les premières ont été gardées.`);
    else setError(null);
  };

  const onDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragging(false);
    pick(e.dataTransfer.files);
  };

  const submit = async () => {
    if (!files.length || busy) return;
    setError(null);
    setBusy(`Préparation… 0/${files.length}`);
    try {
      await publish(files, { tag, title: files.length === 1 ? title : "", caption }, (d, t) => setBusy(`Envoi… ${d}/${t}`));
      toast({
        title: files.length > 1 ? `${files.length} photos publiées.` : "Photo publiée.",
        description: "Elle est visible par tout le monde, même sans compte.",
        tone: "success",
      });
      setFiles([]);
      setTitle("");
      setCaption("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "La publication a échoué.");
    }
    setBusy(null);
  };

  const del = async (p: GalleryPhoto) => {
    if (!window.confirm("Supprimer cette photo définitivement ?")) return;
    setDeletingId(p.id);
    try {
      await remove(p);
      toast({ title: "Photo supprimée.", tone: "info" });
    } catch (e) {
      toast({ title: "Suppression impossible", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
    setDeletingId(null);
  };

  if (allowed === null) {
    return (
      <>
        <PageHeader title="Espace photographe" />
        <p className="mt-8 text-[14px] text-muted">Vérification de tes droits…</p>
      </>
    );
  }

  if (!allowed) {
    return (
      <>
        <PageHeader title="Espace photographe" subtitle="Cet espace est réservé aux photographes du club." />
        <div className="mt-8">
          <EmptyState
            icon="image"
            title="Tu n'es pas (encore) photographe."
            text="Demande à un admin de te nommer photographe : tu pourras alors publier des photos dans la galerie."
          />
          <div className="mt-5">
            <Button variant="secondary" iconRight="arrowRight" onClick={() => navigate("/galerie")}>
              Voir la galerie
            </Button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Espace photographe"
        subtitle="Envoie tes photos : elles sont allégées automatiquement, puis visibles dans la galerie par tous les visiteurs."
        action={
          <>
            <Badge tone="outline">{mine.length} photo(s) publiée(s)</Badge>
            <Button size="sm" variant="secondary" iconRight="arrowUpRight" onClick={() => navigate("/galerie")}>
              Voir la galerie
            </Button>
          </>
        }
      />

      {!enabled && (
        <div className="mt-8">
          <Note>La galerie n'est pas connectée à la base de données (Supabase) sur cette version.</Note>
        </div>
      )}

      <Card className="mt-8 p-6 md:p-7">
        <h2 className="text-[18px] font-semibold text-ink">Publier des photos</h2>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={`mt-5 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
            dragging ? "border-brand bg-brand-soft/60" : "border-line bg-surface-2 hover:border-brand/50"
          }`}
        >
          <Icon name="image" className="h-7 w-7 text-brand-ink" />
          <span className="text-[15px] font-medium text-ink">
            {files.length ? `${files.length} photo${files.length > 1 ? "s" : ""} choisie${files.length > 1 ? "s" : ""}` : "Choisir des photos"}
          </span>
          <span className="text-[13px] text-faint">Touche ici ou glisse-les. Jusqu'à {MAX_FILES} photos à la fois.</span>
          <input type="file" accept="image/*" multiple hidden onChange={(e) => pick(e.target.files)} />
        </label>

        {previews.length > 0 && (
          <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-4 md:grid-cols-6">
            {previews.map((u) => (
              <img key={u} src={u} alt="" className="aspect-square w-full rounded-xl border border-line object-cover" />
            ))}
          </div>
        )}

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Catégorie">
            <Select value={tag} onChange={(e) => setTag(e.target.value)}>
              {GALLERY_TAGS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          {files.length === 1 && (
            <Field label="Titre (facultatif)">
              <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. Build night 01" />
            </Field>
          )}
        </div>
        <div className="mt-5">
          <Field label="Légende (facultatif)">
            <Textarea value={caption} maxLength={240} onChange={(e) => setCaption(e.target.value)} placeholder="Une phrase pour raconter la photo" />
          </Field>
        </div>

        {error && (
          <p className="field-dark-error mt-5 rounded-xl border px-4 py-3 text-[14px]" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Button iconRight="arrowRight" onClick={() => void submit()} loading={!!busy} disabled={!files.length}>
            {busy ?? `Publier ${files.length || ""}`.trim()}
          </Button>
          {files.length > 0 && !busy && (
            <Button variant="ghost" onClick={() => setFiles([])}>
              Vider la sélection
            </Button>
          )}
        </div>
      </Card>

      <div className="mt-10">
        <h2 className="text-[18px] font-semibold text-ink">Mes photos</h2>
        {mine.length === 0 ? (
          <p className="mt-4 text-[14px] text-muted">Tu n'as pas encore publié de photo.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {mine.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <img src={p.thumb} alt={p.title || p.caption || "Ma photo"} loading="lazy" className="aspect-square w-full object-cover" />
                <div className="flex items-center justify-between gap-2 px-3 py-2.5">
                  <span className="label-mono min-w-0 truncate text-faint">{p.title || p.tag}</span>
                  <button
                    type="button"
                    onClick={() => void del(p)}
                    disabled={deletingId === p.id}
                    aria-label="Supprimer cette photo"
                    className="shrink-0 rounded-lg p-1.5 text-faint transition-colors hover:bg-ink/5 hover:text-red-600 disabled:opacity-40"
                  >
                    <Icon name="trash" className="h-4 w-4" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
