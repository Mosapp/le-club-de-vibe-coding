import { useRef, useState } from "react";
import { MediaSlot } from "@/components/media";
import { ProjectCard } from "@/components/cards";
import {
  Badge,
  Button,
  Card,
  Chip,
  Field,
  Icon,
  Input,
  Modal,
  ProgressBar,
  Select,
  Textarea,
} from "@/components/ui";
import { JOIN } from "@/config/content";
import { Reveal } from "@/lib/motion";
import { navigate } from "@/lib/router";
import { formatDate, initials, memberProgress, useClub } from "@/lib/store";

export default function ProfilePage() {
  const { data, me, updateProfile, signOut, isAdmin } = useClub();
  const [open, setOpen] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    firstName: me?.firstName ?? "",
    lastName: me?.lastName ?? "",
    level: me?.level ?? "",
    goal: me?.goal ?? "",
    engagement: me?.engagement ?? "",
  });

  if (!me) return null;
  const progress = memberProgress(data, me.id);
  const myProjects = data.projects.filter((p) => p.authorId === me.id);
  const myIdeas = data.ideas.filter((i) => i.authorId === me.id);

  const save = () => {
    if (!form.firstName.trim() || !form.lastName.trim()) return;
    updateProfile({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      level: form.level,
      goal: form.goal.trim(),
      engagement: form.engagement,
    });
    setOpen(false);
  };

  const choosePhoto = (file: File | undefined) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setPhotoError("Choisis un fichier image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("La photo doit faire 2 Mo maximum.");
      return;
    }
    setPhotoError(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") updateProfile({ avatarUrl: reader.result });
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = () => {
    updateProfile({ avatarUrl: undefined });
    setPhotoError(null);
    if (photoInputRef.current) photoInputRef.current.value = "";
  };

  return (
    <div className="space-y-8">
      {/* ---------- en-tête profil ---------- */}
      <Reveal>
        <Card className="overflow-hidden">
          <div className="relative h-32 bg-ink md:h-40">
            <MediaSlot slot="COMMUNITY_MEDIA_01" ratio="16/9" rounded="rounded-none" className="absolute inset-0 h-full" />
            <div aria-hidden="true" className="absolute inset-0 bg-ink/55" />
          </div>
          <div className="px-6 pb-6 md:px-8 md:pb-8">
            <div className="-mt-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-end gap-4">
                <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface text-[24px] font-semibold text-ink shadow-[0_12px_30px_-20px_rgba(23,23,23,0.6)]">
                  {me.avatarUrl ? <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(me)}
                </span>
                <div className="pb-1">
                  <h1 className="text-[clamp(1.4rem,4vw,2rem)] font-semibold leading-tight text-ink">
                    {me.firstName} {me.lastName}
                  </h1>
                  <p className="label-mono mt-2 text-faint">
                    {me.level} · {me.engagement} · depuis {formatDate(me.createdAt)}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {isAdmin && (
                  <Button size="sm" variant="secondary" icon="shield" onClick={() => navigate("/admin")}>
                    Espace admin
                  </Button>
                )}
                <Button size="sm" variant="secondary" icon="edit" onClick={() => setOpen(true)}>
                  Modifier
                </Button>
                <Button size="sm" variant="ghost" icon="logout" onClick={signOut}>
                  Déconnexion
                </Button>
              </div>
            </div>

            {me.motivations.length > 0 && (
              <div className="mt-7 flex flex-wrap gap-2 border-t border-line-2 pt-6">
                {me.motivations.map((m) => (
                  <Badge key={m} tone="outline">
                    {m}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </Card>
      </Reveal>

      {/* ---------- objectif + progression ---------- */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <Card className="h-full p-6 md:p-8">
            <Badge tone="brand">Mon objectif</Badge>
            <p className="mt-5 text-[18px] leading-relaxed text-ink md:text-[20px]">
              {me.goal || "Aucun objectif défini pour l'instant."}
            </p>
            <div className="mt-7 grid grid-cols-2 gap-4 border-t border-line-2 pt-5">
              <div>
                <dt className="label-mono text-faint">Niveau</dt>
                <dd className="mt-1.5 text-[14.5px] text-ink">{me.level}</dd>
              </div>
              <div>
                <dt className="label-mono text-faint">Engagement</dt>
                <dd className="mt-1.5 text-[14.5px] text-ink">{me.engagement}</dd>
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-5">
          <Card className="flex h-full flex-col p-6 md:p-8">
            <Badge tone="violet">Ma progression</Badge>
            <div className="mt-6 flex items-end justify-between">
              <span className="text-[40px] font-semibold leading-none tracking-tight text-ink">{progress.pct}%</span>
              <span className="label-mono text-faint">{progress.points} pts</span>
            </div>
            <ProgressBar value={progress.pct} tone="violet" className="mt-5" />
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line-2 pt-5">
              {[
                { k: "Projets", v: progress.projects },
                { k: "Défis", v: progress.challenges },
                { k: "Sessions", v: progress.sessions },
                { k: "Idées", v: progress.ideas },
                { k: "Votes", v: progress.votes },
                { k: "Rôle", v: me.role === "ADMIN" ? "Admin" : "Membre" },
              ].map((row) => (
                <div key={row.k} className="flex items-baseline justify-between">
                  <dt className="label-mono text-faint">{row.k}</dt>
                  <dd className="text-[14.5px] font-medium text-ink">{row.v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </Reveal>
      </div>

      {/* ---------- projets ---------- */}
      <Reveal>
        <h2 className="text-[22px] font-semibold text-ink">Mes projets</h2>
      </Reveal>
      {myProjects.length === 0 ? (
        <Reveal>
          <Card className="flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div className="max-w-md">
              <h3 className="text-[17px] font-semibold text-ink">Tu n'as pas encore partagé de projet.</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
                Un projet en cours, un prototype cassé, une idée à moitié finie : tout se partage ici.
              </p>
            </div>
            <Button icon="plus" onClick={() => navigate("/app/projets")}>
              Partager un projet
            </Button>
          </Card>
        </Reveal>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {myProjects.map((p) => (
            <ProjectCard
              key={p.id}
              title={p.title}
              description={p.description}
              tech={p.tech}
              imageUrl={p.imageUrl}
              slot={p.mediaSlot}
              actionLabel={p.published ? "Publié" : "Brouillon"}
              onClick={() => navigate("/app/projets")}
            />
          ))}
        </div>
      )}

      {/* ---------- idées ---------- */}
      <Reveal>
        <h2 className="text-[22px] font-semibold text-ink">Mes idées</h2>
      </Reveal>
      {myIdeas.length === 0 ? (
        <Reveal>
          <Card className="flex flex-col items-start gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <p className="max-w-md text-[14.5px] leading-relaxed text-muted">
              Aucune idée proposée. Une envie de session ou de défi ? C'est le bon endroit.
            </p>
            <Button variant="secondary" icon="idea" onClick={() => navigate("/app/idees")}>
              Boîte à idées
            </Button>
          </Card>
        </Reveal>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {myIdeas.map((idea) => (
            <Card key={idea.id} className="p-6">
              <div className="flex items-start justify-between gap-4">
                <Badge tone="outline">{idea.category}</Badge>
                <span className="label-mono text-faint">{idea.votes.length} vote(s)</span>
              </div>
              <h3 className="mt-4 text-[17px] font-semibold text-ink">{idea.title}</h3>
              {idea.description && <p className="mt-2 text-[14px] leading-relaxed text-muted">{idea.description}</p>}
            </Card>
          ))}
        </div>
      )}

      {/* ---------- édition ---------- */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Modifier mon profil"
        description="Tes réponses aident le club à préparer les sessions."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button icon="check" onClick={save}>
              Enregistrer
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <Field label="Photo de profil">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-line bg-surface-2 text-[20px] font-semibold text-ink">
                {me.avatarUrl ? <img src={me.avatarUrl} alt="" className="h-full w-full object-cover" /> : initials(me)}
              </span>
              <div className="flex flex-wrap gap-2">
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(event) => choosePhoto(event.target.files?.[0])}
                />
                <Button type="button" size="sm" variant="secondary" icon="image" onClick={() => photoInputRef.current?.click()}>
                  Choisir une photo
                </Button>
                {me.avatarUrl && (
                  <Button type="button" size="sm" variant="ghost" onClick={removePhoto}>
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
            {photoError && <p className="mt-2 text-[13px] text-red-600">{photoError}</p>}
            <p className="mt-2 text-[13px] text-muted">JPG, PNG ou autre image, 2 Mo maximum.</p>
          </Field>
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Prénom" required>
              <Input value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </Field>
            <Field label="Nom" required>
              <Input value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </Field>
          </div>
          <Field label="Niveau">
            <Select value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })}>
              {JOIN.levels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Objectif personnel">
            <Textarea value={form.goal} onChange={(e) => setForm({ ...form, goal: e.target.value })} maxLength={320} />
          </Field>
          <Field label="Niveau d'engagement">
            <div className="flex flex-wrap gap-2.5">
              {JOIN.engagements.map((e) => (
                <Chip
                  key={e.value}
                  active={form.engagement === e.value}
                  onClick={() => setForm({ ...form, engagement: e.value })}
                >
                  {e.value}
                </Chip>
              ))}
            </div>
          </Field>
          <p className="flex items-start gap-2 text-[13px] leading-relaxed text-faint">
            <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
            Tes informations restent dans ton navigateur tant que le club n'a pas de serveur dédié.
          </p>
        </div>
      </Modal>
    </div>
  );
}
