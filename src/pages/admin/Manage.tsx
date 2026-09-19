import { useState } from "react";
import { AdminHeader } from "@/pages/admin/Shell";
import { IdeaCard } from "@/components/cards";
import { MediaImage, MediaPlaceholder } from "@/components/media";
import {
  Badge,
  Button,
  Card,
  EmptyState,
  Field,
  Icon,
  Input,
  Modal,
  Note,
  Select,
  Textarea,
} from "@/components/ui";
import { EMPTY_STATES } from "@/config/content";
import { MEDIA_LIBRARY, resolveMedia } from "@/config/media";
import { navigate } from "@/lib/router";
import { formatDate, useClub, type ChallengeStatus, type IdeaStatus } from "@/lib/store";

/* ------------------------------------------------------------------
   petit utilitaire de rendu de liste
------------------------------------------------------------------ */

function AdminRow({
  title,
  meta,
  status,
  children,
}: {
  title: string;
  meta: string;
  status?: { label: string; tone: "moss" | "brand" | "violet" | "neutral" };
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-[16px] font-semibold text-ink">{title}</h3>
            {status && <Badge tone={status.tone}>{status.label}</Badge>}
          </div>
          <p className="label-mono mt-2 text-faint">{meta}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 md:justify-end">{children}</div>
      </div>
    </Card>
  );
}

/* ==================================================================
   PROJETS
================================================================== */

export function AdminProjects() {
  const { data, toggleProjectPublish, deleteProject } = useClub();
  const author = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Membre";
  };

  return (
    <>
      <AdminHeader
        title="Projets"
        subtitle="Publier, dépublier ou supprimer un projet. La création et l'édition détaillée se font depuis l'espace membre."
        action={
          <Button size="sm" variant="secondary" icon="plus" onClick={() => navigate("/app/projets")}>
            Créer un projet
          </Button>
        }
      />

      {data.projects.length === 0 ? (
        <EmptyState icon="code" title="Aucun projet enregistré." text={EMPTY_STATES.projects.text} />
      ) : (
        <div className="space-y-3">
          {data.projects.map((p) => (
            <AdminRow
              key={p.id}
              title={p.title}
              meta={`${author(p.authorId)} · ${p.kind} · ${formatDate(p.createdAt)}`}
              status={{ label: p.published ? "publié" : "brouillon", tone: p.published ? "moss" : "neutral" }}
            >
              <Button size="sm" variant="secondary" onClick={() => toggleProjectPublish(p.id)}>
                {p.published ? "Dépublier" : "Publier"}
              </Button>
              <Button size="sm" variant="secondary" icon="edit" onClick={() => navigate("/app/projets")}>
                Modifier
              </Button>
              <Button size="sm" variant="danger" icon="trash" onClick={() => deleteProject(p.id)}>
                Supprimer
              </Button>
            </AdminRow>
          ))}
        </div>
      )}
    </>
  );
}

/* ==================================================================
   DÉFIS
================================================================== */

export function AdminChallenges() {
  const { data, createChallenge, updateChallenge, deleteChallenge } = useClub();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    code: `DÉFI #${String(data.challenges.length + 1).padStart(2, "0")}`,
    title: "",
    description: "",
    difficulty: "Débutant",
    duration: "1 semaine",
    tech: "",
    status: "à venir" as ChallengeStatus,
  });

  const submit = () => {
    if (!form.title.trim()) return;
    createChallenge({
      code: form.code.trim() || `DÉFI #${String(data.challenges.length + 1).padStart(2, "0")}`,
      title: form.title.trim(),
      description: form.description.trim(),
      difficulty: form.difficulty,
      duration: form.duration,
      tech: form.tech.split(",").map((t) => t.trim()).filter(Boolean),
      status: form.status,
    });
    setForm({ ...form, title: "", description: "", tech: "" });
    setOpen(false);
  };

  return (
    <>
      <AdminHeader
        title="Défis"
        subtitle="Ouvrir un défi, changer son statut, le clôturer."
        action={
          <Button size="sm" icon="plus" onClick={() => setOpen(true)}>
            Nouveau défi
          </Button>
        }
      />

      {data.challenges.length === 0 ? (
        <EmptyState icon="target" title="Aucun défi." text="Crée le premier défi du club." />
      ) : (
        <div className="space-y-3">
          {data.challenges.map((c) => (
            <AdminRow
              key={c.id}
              title={`${c.code} — ${c.title}`}
              meta={`${c.difficulty} · ${c.duration} · ${c.participants.length} participant(s) · ${c.tech.join(", ") || "—"}`}
              status={{ label: c.status, tone: c.status === "actif" ? "brand" : c.status === "terminé" ? "moss" : "neutral" }}
            >
              <Select
                value={c.status}
                onChange={(e) => updateChallenge(c.id, { status: e.target.value as ChallengeStatus })}
                className="h-9 w-[128px] text-[13.5px]"
                aria-label="Statut du défi"
              >
                <option value="à venir">à venir</option>
                <option value="actif">actif</option>
                <option value="terminé">terminé</option>
              </Select>
              <Button size="sm" variant="danger" icon="trash" onClick={() => deleteChallenge(c.id)}>
                Supprimer
              </Button>
            </AdminRow>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouveau défi"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button icon="plus" onClick={submit}>
              Créer le défi
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Code">
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </Field>
            <Field label="Statut">
              <Select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ChallengeStatus })}
              >
                <option value="à venir">à venir</option>
                <option value="actif">actif</option>
                <option value="terminé">terminé</option>
              </Select>
            </Field>
          </div>
          <Field label="Titre" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Créer une landing page avec l'IA"
            />
          </Field>
          <Field label="Description">
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Difficulté">
              <Select value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
                {["Débutant", "Intermédiaire", "Avancé"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
            <Field label="Durée">
              <Select value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}>
                {["Un week-end", "1 semaine", "2 semaines", "1 mois"].map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Technologies" hint="Séparées par des virgules.">
            <Input value={form.tech} onChange={(e) => setForm({ ...form, tech: e.target.value })} placeholder="IA, Web" />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ==================================================================
   SESSIONS
================================================================== */

export function AdminSessions() {
  const { data, createSession, updateSession, deleteSession } = useClub();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    title: "Vibe Session",
    subject: "",
    date: "",
    time: "",
    host: "",
    link: "",
  });

  const submit = () => {
    if (!form.subject.trim()) return;
    createSession({
      title: form.title.trim() || "Vibe Session",
      subject: form.subject.trim(),
      date: form.date || null,
      time: form.time || null,
      host: form.host || (data.members[0]?.id ?? ""),
      link: form.link.trim() || null,
    });
    setForm({ ...form, subject: "", date: "", time: "", link: "" });
    setOpen(false);
  };

  const hostName = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Bureau du club";
  };

  return (
    <>
      <AdminHeader
        title="Sessions"
        subtitle="Planifier une session, indiquer l'intervenant et le lien de connexion."
        action={
          <Button size="sm" icon="plus" onClick={() => setOpen(true)}>
            Nouvelle session
          </Button>
        }
      />

      {data.sessions.length === 0 ? (
        <EmptyState icon="calendar" title="Aucune session." text="Planifie la première session du club." />
      ) : (
        <div className="space-y-3">
          {data.sessions.map((s) => (
            <AdminRow
              key={s.id}
              title={s.subject}
              meta={`${s.title} · ${s.date ? formatDate(s.date) : "date à confirmer"} · ${s.time ?? "horaire à confirmer"} · ${hostName(s.host)} · ${s.attendees.length} inscrit(s)`}
              status={{
                label: s.date && new Date(s.date).getTime() < Date.now() ? "passée" : "planifiée",
                tone: s.date && new Date(s.date).getTime() < Date.now() ? "neutral" : "violet",
              }}
            >
              <Input
                type="date"
                value={s.date ?? ""}
                onChange={(e) => updateSession(s.id, { date: e.target.value || null })}
                className="h-9 w-[152px] text-[13.5px]"
                aria-label="Date de la session"
              />
              <Button size="sm" variant="danger" icon="trash" onClick={() => deleteSession(s.id)}>
                Supprimer
              </Button>
            </AdminRow>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle session"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button icon="plus" onClick={submit}>
              Créer la session
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Format">
              <Select value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}>
                {["Vibe Session", "Atelier", "Démonstration", "Suivi de projet"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </Select>
            </Field>
            <Field label="Intervenant">
              <Select value={form.host} onChange={(e) => setForm({ ...form, host: e.target.value })}>
                <option value="">Bureau du club</option>
                {data.members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.firstName} {m.lastName}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Sujet" required>
            <Input
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              placeholder="Créer une mini application avec l'IA"
            />
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Date">
              <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Horaire">
              <Input value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} placeholder="14:00 – 17:00" />
            </Field>
          </div>
          <Field label="Lien" hint="Visio, salon, adresse — optionnel.">
            <Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="https://…" />
          </Field>
        </div>
      </Modal>
    </>
  );
}

/* ==================================================================
   IDÉES
================================================================== */

export function AdminIdeas() {
  const { data, setIdeaStatus, deleteIdea } = useClub();
  const author = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Membre du club";
  };

  return (
    <>
      <AdminHeader
        title="Idées"
        subtitle="Suivre les propositions de la communauté, changer leur statut, arbitrer."
        action={<Badge tone="outline">{data.ideas.length} proposition(s)</Badge>}
      />

      {data.ideas.length === 0 ? (
        <EmptyState icon="idea" title="Aucune idée proposée." text={EMPTY_STATES.ideas.text} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.ideas.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} authorName={author(idea.authorId)} hasVoted={false}>
              <Select
                value={idea.status}
                onChange={(e) => setIdeaStatus(idea.id, e.target.value as IdeaStatus)}
                className="h-9 w-[150px] text-[13px]"
                aria-label="Statut de l'idée"
              >
                <option value="proposée">proposée</option>
                <option value="en discussion">en discussion</option>
                <option value="retenue">retenue</option>
                <option value="refusée">refusée</option>
              </Select>
              <button
                type="button"
                onClick={() => deleteIdea(idea.id)}
                aria-label="Supprimer l'idée"
                className="rounded-lg border border-line p-1.5 text-faint transition-colors hover:border-red-300 hover:text-red-600"
              >
                <Icon name="trash" className="h-4 w-4" />
              </button>
            </IdeaCard>
          ))}
        </div>
      )}
    </>
  );
}

/* ==================================================================
   RÈGLEMENT
================================================================== */

export function AdminRules() {
  const { data, createRule, updateRule, deleteRule } = useClub();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", text: "" });

  const submit = () => {
    if (!form.title.trim()) return;
    createRule({ title: form.title.trim(), text: form.text.trim() });
    setForm({ title: "", text: "" });
    setOpen(false);
  };

  return (
    <>
      <AdminHeader
        title="Règlement"
        subtitle="Ajouter une règle, la faire évoluer, ou la retirer. Les propositions de membres arrivent via la boîte à idées."
        action={
          <Button size="sm" icon="plus" onClick={() => setOpen(true)}>
            Nouvelle règle
          </Button>
        }
      />

      <div className="space-y-3">
        {data.rules.map((r) => (
          <AdminRow
            key={r.id}
            title={`${r.n} — ${r.title}`}
            meta={`${r.source} · mise à jour ${formatDate(r.updatedAt)}`}
            status={{
              label: r.status,
              tone: r.status === "adoptée" ? "moss" : r.status === "en discussion" ? "violet" : "neutral",
            }}
          >
            <Select
              value={r.status}
              onChange={(e) =>
                updateRule(r.id, { status: e.target.value as "adoptée" | "en discussion" | "proposée" })
              }
              className="h-9 w-[150px] text-[13.5px]"
              aria-label="Statut de la règle"
            >
              <option value="proposée">proposée</option>
              <option value="en discussion">en discussion</option>
              <option value="adoptée">adoptée</option>
            </Select>
            <Button size="sm" variant="danger" icon="trash" onClick={() => deleteRule(r.id)}>
              Supprimer
            </Button>
          </AdminRow>
        ))}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nouvelle règle"
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button icon="plus" onClick={submit}>
              Ajouter
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <Field label="Titre" required>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </Field>
          <Field label="Texte">
            <Textarea value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
          </Field>
          <Note>La règle est créée avec le statut « en discussion » pour laisser la communauté réagir.</Note>
        </div>
      </Modal>
    </>
  );
}

/* ==================================================================
   MEDIA LIBRARY
================================================================== */

export function AdminMedia() {
  const { assignMedia, resetMedia, mediaVersion } = useClub();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ src: "", video: "" });

  const openEdit = (slot: string) => {
    const asset = resolveMedia(slot);
    setEditing(slot);
    setDraft({ src: asset.src ?? "", video: asset.video ?? "" });
  };

  const save = (slot: string) => {
    assignMedia(slot, { src: draft.src.trim() || null, video: draft.video.trim() || null });
    setEditing(null);
  };

  return (
    <>
      <AdminHeader
        title="Media Library"
        subtitle="Chaque emplacement du site est listé ici. Tu peux coller une URL d'image ou de vidéo, ou remplacer le fichier comme expliqué dans MEDIA_GUIDE.md."
        action={
          <Button size="sm" variant="secondary" icon="reset" onClick={resetMedia}>
            Réinitialiser
          </Button>
        }
      />

      <Note>
        <strong className="font-medium text-ink">Pour changer un fichier</strong> : dépose-le dans{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12.5px]">src/media/…</code> puis mets à jour la
        valeur <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12.5px]">src</code> dans{" "}
        <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-[12.5px]">src/config/media.ts</code>. Aucun
        composant n'est à modifier.
      </Note>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {MEDIA_LIBRARY.map((asset) => {
          const resolved = resolveMedia(asset.id);
          return (
            <Card key={asset.id} className="overflow-hidden">
              <div className="relative bg-surface-2">
                {resolved.video ? (
                  <MediaPlaceholder slot={asset.slot} label={asset.label} ratio={asset.ratio} rounded="rounded-none" />
                ) : resolved.src ? (
                  <MediaImage src={resolved.src} alt={asset.alt || asset.label} ratio={asset.ratio} rounded="rounded-none" />
                ) : (
                  <MediaPlaceholder slot={asset.slot} label={asset.label} ratio={asset.ratio} rounded="rounded-none" />
                )}
                <span className="label-mono absolute left-3 top-3 rounded-full bg-ink/70 px-2.5 py-1.5 text-white/85">
                  {asset.slot}
                </span>
              </div>

              <div className="p-5">
                <p className="text-[15px] font-semibold text-ink">{asset.label}</p>
                <p className="label-mono mt-2 text-faint">section {asset.section} · ratio {asset.ratio}</p>

                {editing === asset.id ? (
                  <div className="mt-4 space-y-4">
                    <Field label="URL image">
                      <Input
                        value={draft.src}
                        onChange={(e) => setDraft({ ...draft, src: e.target.value })}
                        placeholder="https://… ou /media/…"
                      />
                    </Field>
                    <Field label="URL vidéo" hint="Laisser vide pour utiliser l'image.">
                      <Input
                        value={draft.video}
                        onChange={(e) => setDraft({ ...draft, video: e.target.value })}
                        placeholder="https://…mp4"
                      />
                    </Field>
                    <div className="flex gap-2">
                      <Button size="sm" icon="check" onClick={() => save(asset.id)}>
                        Enregistrer
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="mt-3 truncate font-mono text-[12px] text-muted">
                      {resolved.video ? resolved.video : resolved.src ? resolved.src : "aucun média défini"}
                    </p>
                    <div className="mt-4 flex items-center gap-2">
                      <Button size="sm" variant="secondary" icon="edit" onClick={() => openEdit(asset.id)}>
                        Remplacer
                      </Button>
                      {resolved.video && <Badge tone="violet">vidéo</Badge>}
                    </div>
                  </>
                )}
              </div>
            </Card>
          );
        })}
      </div>
      <p className="label-mono text-faint">Version des médias : {mediaVersion + 1}</p>
    </>
  );
}
