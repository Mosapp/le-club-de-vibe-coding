import { useMemo, useState } from "react";
import { ProjectCard } from "@/components/cards";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Field,
  Icon,
  Input,
  Modal,
  Select,
  Textarea,
} from "@/components/ui";
import { EMPTY_STATES } from "@/config/content";
import { MEDIA_LIBRARY } from "@/config/media";
import { Reveal } from "@/lib/motion";
import { ApiError, useClub, type ProjectKind } from "@/lib/store";

const FILTERS: { key: "all" | ProjectKind; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "web", label: "Web" },
  { key: "mobile", label: "Mobile" },
  { key: "ia", label: "IA" },
  { key: "autres", label: "Autres" },
];

export default function ProjectsPage() {
  const { data, me, createProject, updateProject, deleteProject, toggleProjectPublish, isAdmin } = useClub();
  const [filter, setFilter] = useState<"all" | ProjectKind>("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    kind: "web" as ProjectKind,
    tech: "",
    imageUrl: "",
    mediaSlot: "",
    link: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const projects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.projects
      .filter((p) => p.published || p.authorId === me?.id || isAdmin)
      .filter((p) => (filter === "all" ? true : p.kind === filter))
      .filter((p) =>
        q.length === 0
          ? true
          : [p.title, p.description, p.tech.join(" ")].join(" ").toLowerCase().includes(q),
      );
  }, [data.projects, filter, query, me?.id, isAdmin]);

  const author = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Membre du club";
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({ title: "", description: "", kind: "web", tech: "", imageUrl: "", mediaSlot: "", link: "" });
    setError(null);
    setOpen(true);
  };

  const openEdit = (id: string) => {
    const p = data.projects.find((x) => x.id === id);
    if (!p) return;
    setEditingId(id);
    setForm({
      title: p.title,
      description: p.description,
      kind: p.kind,
      tech: p.tech.join(", "),
      imageUrl: p.imageUrl ?? "",
      mediaSlot: p.mediaSlot ?? "",
      link: p.link ?? "",
    });
    setError(null);
    setOpen(true);
  };

  const submit = async () => {
    setError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      kind: form.kind,
      tech: form.tech
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      mediaSlot: form.mediaSlot || null,
      imageUrl: form.imageUrl.trim() || null,
      link: form.link.trim() || null,
    };
    try {
      if (editingId) updateProject(editingId, payload);
      else await createProject(payload);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer le projet.");
    }
  };

  const detailProject = data.projects.find((p) => p.id === detail) ?? null;

  return (
    <div className="space-y-8">
      <Reveal>
        <header className="border-b border-line pb-8">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <Badge tone="brand">Mur des créations</Badge>
              <h1 className="mt-4 text-[clamp(1.6rem,4.4vw,2.4rem)] font-semibold leading-[1.05] text-ink">
                Ce que les membres construisent.
              </h1>
              <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">
                Chaque projet est accompagné d'une explication : comment il a été pensé, avec quels outils.
              </p>
            </div>
            <Button icon="plus" onClick={openCreate}>
              Partager un projet
            </Button>
          </div>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <Chip key={f.key} active={filter === f.key} onClick={() => setFilter(f.key)}>
                  {f.label}
                </Chip>
              ))}
            </div>
            <div className="relative w-full sm:w-72">
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Rechercher un projet…"
                className="h-11 pl-10"
                aria-label="Rechercher un projet"
              />
              <Icon name="search" className="pointer-events-none absolute left-3.5 top-3.5 h-[18px] w-[18px] text-faint" />
            </div>
          </div>
        </header>
      </Reveal>

      {projects.length === 0 ? (
        <EmptyState
          icon="code"
          title={query || filter !== "all" ? "Aucun projet ne correspond." : EMPTY_STATES.projects.title}
          text={query || filter !== "all" ? "Essaie un autre mot-clé ou un autre filtre." : EMPTY_STATES.projects.text}
          action={
            query || filter !== "all" ? (
              <Button
                variant="secondary"
                icon="reset"
                onClick={() => {
                  setQuery("");
                  setFilter("all");
                }}
              >
                Réinitialiser
              </Button>
            ) : (
              <Button icon="plus" onClick={openCreate}>
                {EMPTY_STATES.projects.cta}
              </Button>
            )
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p, i) => (
            <Reveal key={p.id} delay={Math.min(i, 6) * 60}>
              <ProjectCard
                title={p.title}
                description={p.description}
                tech={p.tech}
                slot={p.mediaSlot}
                imageUrl={p.imageUrl}
                author={author(p.authorId)}
                actionLabel={p.authorId === me?.id ? "Mon projet" : "Découvrir"}
                onClick={() => setDetail(p.id)}
              />
            </Reveal>
          ))}
        </div>
      )}

      {/* --------- création / édition --------- */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Modifier le projet" : "Partager un projet"}
        description="Un titre, une phrase d'explication, et c'est déjà bien."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button onClick={submit} icon={editingId ? "edit" : "plus"}>
              {editingId ? "Enregistrer" : "Publier"}
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <Field label="Nom du projet" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Mon assistant de révisions"
            />
          </Field>
          <Field label="Description" required hint="Comment tu l'as construit, ce que ça fait, ce qui reste à faire.">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="J'ai commencé par…"
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Catégorie">
              <Select value={form.kind} onChange={(e) => setForm({ ...form, kind: e.target.value as ProjectKind })}>
                <option value="web">Web</option>
                <option value="mobile">Mobile</option>
                <option value="ia">IA</option>
                <option value="autres">Autres</option>
              </Select>
            </Field>
            <Field label="Technologies" hint="Séparées par des virgules.">
              <Input
                value={form.tech}
                onChange={(e) => setForm({ ...form, tech: e.target.value })}
                placeholder="React, Vite, IA"
              />
            </Field>
          </div>
          <Field label="Visuel existant" hint="Choisis un emplacement média déjà configuré, ou colle une URL d'image.">
            <Select
              value={form.mediaSlot}
              onChange={(e) => setForm({ ...form, mediaSlot: e.target.value })}
            >
              <option value="">Aucun (placeholder)</option>
              {MEDIA_LIBRARY.filter((m) => m.section === "projects").map((m) => (
                <option key={m.id} value={m.id}>
                  {m.slot}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="URL de l'image" hint="Optionnel — peut être vide.">
            <Input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          <Field label="Lien du projet" hint="Optionnel — démo, dépôt, page.">
            <Input
              value={form.link}
              onChange={(e) => setForm({ ...form, link: e.target.value })}
              placeholder="https://…"
            />
          </Field>
          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              <Icon name="close" className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>
      </Modal>

      {/* --------- détail --------- */}
      <Modal
        open={!!detailProject}
        onClose={() => setDetail(null)}
        title={detailProject?.title ?? ""}
        description={detailProject ? `par ${author(detailProject.authorId)}` : undefined}
        size="lg"
        footer={
          detailProject && (
            <>
              {detailProject.link && (
                <a
                  href={detailProject.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-11 items-center gap-2 rounded-xl border border-line bg-surface px-5 text-[14px] font-medium text-ink transition-colors hover:border-ink/25"
                >
                  Ouvrir le projet
                  <Icon name="arrowUpRight" className="h-4 w-4" />
                </a>
              )}
              {(detailProject.authorId === me?.id || isAdmin) && (
                <Button variant="secondary" icon="edit" onClick={() => { setDetail(null); openEdit(detailProject.id); }}>
                  Modifier
                </Button>
              )}
              {isAdmin && (
                <>
                  <Button variant="secondary" onClick={() => toggleProjectPublish(detailProject.id)}>
                    {detailProject.published ? "Dépublier" : "Publier"}
                  </Button>
                  <Button
                    variant="danger"
                    icon="trash"
                    onClick={() => {
                      deleteProject(detailProject.id);
                      setDetail(null);
                    }}
                  >
                    Supprimer
                  </Button>
                </>
              )}
            </>
          )
        }
      >
        {detailProject && (
          <div className="space-y-6">
            <ProjectCard
              title={detailProject.title}
              description={detailProject.description}
              tech={detailProject.tech}
              slot={detailProject.mediaSlot}
              imageUrl={detailProject.imageUrl}
              className="border-0 shadow-none"
            />
            <Card className="p-5">
              <dl className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="label-mono text-faint">Catégorie</dt>
                  <dd className="mt-1.5 text-[14.5px] text-ink">{detailProject.kind}</dd>
                </div>
                <div>
                  <dt className="label-mono text-faint">Statut</dt>
                  <dd className="mt-1.5 text-[14.5px] text-ink">
                    {detailProject.published ? "Publié" : "Brouillon"}
                  </dd>
                </div>
              </dl>
            </Card>
            {!detailProject.link && !isAdmin && detailProject.authorId !== me?.id && (
              <p className="text-[13.5px] text-muted">
                Ce projet n'a pas encore de lien public. Demande à son auteur lors de la prochaine session.
              </p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
