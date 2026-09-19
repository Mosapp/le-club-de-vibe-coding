import { useMemo, useState } from "react";
import { AdminHeader } from "@/pages/admin/Shell";
import {
  Badge,
  Button,
  Card,
  Chip,
  EmptyState,
  Icon,
  Input,
  Modal,
  Note,
  Select,
  Stat,
} from "@/components/ui";
import { EMPTY_STATES } from "@/config/content";
import { MEDIA_LIBRARY } from "@/config/media";
import { navigate } from "@/lib/router";
import { formatDate, initials, memberProgress, useClub, type Member } from "@/lib/store";
import { cn } from "@/utils/cn";

/* ==================================================================
   DASHBOARD
================================================================== */

export function AdminDashboard() {
  const { data, resetAll, me } = useClub();

  const activity = data.activity.slice(0, 8);
  const memberName = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Membre";
  };

  return (
    <>
      <AdminHeader
        title={`Bonjour ${me?.firstName}.`}
        subtitle="Vue d'ensemble du club : membres, projets, défis, sessions et idées. Aucun chiffre inventé — tout vient des données enregistrées."
        action={
          <>
            <Button size="sm" variant="secondary" icon="users" onClick={() => navigate("/admin/membres")}>
              Membres
            </Button>
            <Button size="sm" icon="image" onClick={() => navigate("/admin/medias")}>
              Media Library
            </Button>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Membres" value={data.members.length} hint={`${data.members.filter((m) => m.status === "ACTIVE").length} actifs`} />
        <Stat label="Projets" value={data.projects.length} tone="brand" hint={`${data.projects.filter((p) => !p.published).length} brouillon(s)`} />
        <Stat label="Défis" value={data.challenges.length} tone="violet" hint={`${data.challenges.filter((c) => c.status === "actif").length} actif(s)`} />
        <Stat label="Sessions" value={data.sessions.length} tone="moss" />
        <Stat label="Idées" value={data.ideas.length} hint={`${data.ideas.reduce((n, i) => n + i.votes.length, 0)} vote(s)`} />
        <Stat label="Règles" value={data.rules.length} />
        <Stat label="Emplacements média" value={MEDIA_LIBRARY.length} tone="brand" />
        <Stat label="Rôles admin" value={data.members.filter((m) => m.role === "ADMIN").length} />
      </div>

      <div className="grid gap-4 lg:grid-cols-12">
        <Card className="lg:col-span-7 p-6 md:p-7">
          <h2 className="text-[18px] font-semibold text-ink">Activité récente</h2>
          {activity.length === 0 ? (
            <p className="mt-4 text-[14px] text-muted">Aucune activité enregistrée pour l'instant.</p>
          ) : (
            <ul className="mt-5 divide-y divide-line-2">
              {activity.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-4 py-3.5">
                  <span className="flex min-w-0 items-center gap-3">
                    <span className="label-mono shrink-0 text-faint">{memberName(a.memberId)}</span>
                    <span className="truncate text-[14px] text-muted">{a.label}</span>
                  </span>
                  <span className="label-mono shrink-0 text-faint">{formatDate(a.at)}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="lg:col-span-5 p-6 md:p-7">
          <h2 className="text-[18px] font-semibold text-ink">Actions rapides</h2>
          <div className="mt-5 grid gap-2.5">
            {[
              { label: "Créer une session", route: "/admin/sessions", icon: "calendar" as const },
              { label: "Ouvrir un défi", route: "/admin/defis", icon: "target" as const },
              { label: "Ajouter une règle", route: "/admin/reglement", icon: "shield" as const },
              { label: "Remplacer un média", route: "/admin/medias", icon: "image" as const },
            ].map((a) => (
              <button
                key={a.route}
                type="button"
                onClick={() => navigate(a.route)}
                className="flex items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-[14px] text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ink/20"
              >
                <span className="flex items-center gap-3">
                  <Icon name={a.icon} className="h-[18px] w-[18px] text-muted" />
                  {a.label}
                </span>
                <Icon name="arrowRight" className="h-4 w-4 text-faint" />
              </button>
            ))}
          </div>
          <div className="mt-6 border-t border-line-2 pt-5">
            <Note>
              Les données de cette démonstration sont stockées dans le navigateur. La réinitialisation efface membres,
              projets, idées et médias surchargés.
            </Note>
            <Button size="sm" variant="danger" icon="reset" className="mt-4" onClick={resetAll}>
              Réinitialiser les données
            </Button>
          </div>
        </Card>
      </div>
    </>
  );
}

/* ==================================================================
   MEMBRES
================================================================== */

export function AdminMembers() {
  const { data, setMemberStatus, setMemberRole, deleteMember, me, toast } = useClub();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "ACTIVE" | "SUSPENDED" | "ADMIN">("all");
  const [detail, setDetail] = useState<Member | null>(null);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return data.members
      .filter((m) =>
        filter === "all"
          ? true
          : filter === "ADMIN"
            ? m.role === "ADMIN"
            : m.status === filter,
      )
      .filter((m) => (q ? `${m.firstName} ${m.lastName} ${m.level} ${m.goal}`.toLowerCase().includes(q) : true));
  }, [data.members, filter, query]);

  const exportMembers = () => {
    const headers = [
      "Identifiant",
      "Prenom",
      "Nom",
      "Niveau / classe",
      "Motivations",
      "Objectif",
      "Engagement",
      "Role",
      "Statut",
      "Date d'adhesion",
      "Derniere connexion",
    ];
    const escapeCell = (value: string | string[]) => {
      const text = Array.isArray(value) ? value.join(", ") : value;
      return `"${text.replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;
    };
    const rows = data.members.map((member) =>
      [
        member.id,
        member.firstName,
        member.lastName,
        member.level,
        member.motivations,
        member.goal,
        member.engagement,
        member.role === "ADMIN" ? "Administrateur" : "Membre",
        member.status === "ACTIVE" ? "Actif" : "Suspendu",
        formatDate(member.createdAt),
        formatDate(member.lastSeenAt),
      ]
        .map(escapeCell)
        .join(";"),
    );
    const csv = `\ufeff${headers.map(escapeCell).join(";")}\r\n${rows.join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `membres-club-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export des membres téléchargé.", tone: "success" });
  };

  return (
    <>
      <AdminHeader
        title="Membres"
        subtitle="Rechercher, consulter, modifier, suspendre ou réactiver un profil."
        action={
          <>
            <Button size="sm" variant="secondary" icon="download" onClick={exportMembers}>
              Exporter Excel
            </Button>
            <Badge tone="outline">{data.members.length} inscrit(s)</Badge>
          </>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {(
            [
              { k: "all", l: "Tous" },
              { k: "ACTIVE", l: "Actifs" },
              { k: "SUSPENDED", l: "Suspendus" },
              { k: "ADMIN", l: "Admins" },
            ] as const
          ).map((f) => (
            <Chip key={f.k} active={filter === f.k} onClick={() => setFilter(f.k)}>
              {f.l}
            </Chip>
          ))}
        </div>
        <div className="relative w-full sm:w-72">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un membre…"
            className="h-11 pl-10"
            aria-label="Rechercher un membre"
          />
          <Icon name="search" className="pointer-events-none absolute left-3.5 top-3.5 h-[18px] w-[18px] text-faint" />
        </div>
      </div>

      {list.length === 0 ? (
        <EmptyState icon="users" title={EMPTY_STATES.members.title} text={EMPTY_STATES.members.text} />
      ) : (
        <>
          {/* table desktop */}
          <Card className="hidden overflow-hidden lg:block">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line bg-surface-2">
                  {["Membre", "Niveau", "Engagement", "Progression", "Rôle", "Statut", ""].map((h) => (
                    <th key={h} className="label-mono px-5 py-3.5 text-faint">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line-2">
                {list.map((m) => (
                  <tr key={m.id} className="transition-colors hover:bg-surface-2/60">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-line bg-surface-2 text-[12.5px] font-semibold">
                          {initials(m)}
                        </span>
                        <div>
                          <p className="text-[14.5px] font-medium text-ink">
                            {m.firstName} {m.lastName}
                          </p>
                          <p className="label-mono mt-1 text-faint">{formatDate(m.createdAt)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-[14px] text-muted">{m.level}</td>
                    <td className="px-5 py-4 text-[14px] text-muted">{m.engagement}</td>
                    <td className="px-5 py-4 text-[14px] text-muted">{memberProgress(data, m.id).pct}%</td>
                    <td className="px-5 py-4">
                      <Select
                        value={m.role}
                        onChange={(e) => setMemberRole(m.id, e.target.value as "MEMBER" | "ADMIN")}
                        className="h-10 w-[112px] text-[13.5px]"
                        aria-label={`Rôle de ${m.firstName}`}
                      >
                        <option value="MEMBER">Membre</option>
                        <option value="ADMIN">Admin</option>
                      </Select>
                    </td>
                    <td className="px-5 py-4">
                      <Badge tone={m.status === "ACTIVE" ? "moss" : "neutral"}>
                        {m.status === "ACTIVE" ? "actif" : "suspendu"}
                      </Badge>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setDetail(m)}>
                          Voir
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => setMemberStatus(m.id, m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                        >
                          {m.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>

          {/* cartes mobile */}
          <div className="grid gap-3 lg:hidden">
            {list.map((m) => (
              <Card key={m.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-surface-2 text-[13px] font-semibold">
                      {initials(m)}
                    </span>
                    <div>
                      <p className="text-[15px] font-medium text-ink">
                        {m.firstName} {m.lastName}
                      </p>
                      <p className="label-mono mt-1 text-faint">
                        {m.level} · {m.engagement}
                      </p>
                    </div>
                  </div>
                  <Badge tone={m.status === "ACTIVE" ? "moss" : "neutral"}>
                    {m.status === "ACTIVE" ? "actif" : "suspendu"}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setDetail(m)}>
                    Consulter
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setMemberStatus(m.id, m.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE")}
                  >
                    {m.status === "ACTIVE" ? "Suspendre" : "Réactiver"}
                  </Button>
                  <Select
                    value={m.role}
                    onChange={(e) => setMemberRole(m.id, e.target.value as "MEMBER" | "ADMIN")}
                    className="h-9 flex-1 text-[13.5px]"
                    aria-label="Rôle"
                  >
                    <option value="MEMBER">Membre</option>
                    <option value="ADMIN">Admin</option>
                  </Select>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      <Modal
        open={!!detail}
        onClose={() => setDetail(null)}
        title={detail ? `${detail.firstName} ${detail.lastName}` : ""}
        description={detail ? `Membre depuis ${formatDate(detail.createdAt)}` : undefined}
        footer={
          detail && (
            <>
              {detail.id !== me?.id && (
                <Button
                  variant="danger"
                  icon="trash"
                  onClick={() => {
                    deleteMember(detail.id);
                    setDetail(null);
                  }}
                >
                  Supprimer le profil
                </Button>
              )}
              <Button variant="secondary" onClick={() => setDetail(null)}>
                Fermer
              </Button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                { k: "Niveau", v: detail.level },
                { k: "Engagement", v: detail.engagement },
                { k: "Rôle", v: detail.role === "ADMIN" ? "Administrateur" : "Membre" },
                { k: "Statut", v: detail.status === "ACTIVE" ? "Actif" : "Suspendu" },
                { k: "Projets", v: String(data.projects.filter((p) => p.authorId === detail.id).length) },
                { k: "Idées", v: String(data.ideas.filter((i) => i.authorId === detail.id).length) },
              ].map((row) => (
                <div key={row.k} className={cn("rounded-xl border border-line bg-surface-2 px-4 py-3")}>
                  <p className="label-mono text-faint">{row.k}</p>
                  <p className="mt-1.5 text-[14.5px] text-ink">{row.v}</p>
                </div>
              ))}
            </div>
            <div>
              <p className="label-mono text-faint">Objectif</p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink">{detail.goal || "—"}</p>
            </div>
            {detail.motivations.length > 0 && (
              <div>
                <p className="label-mono text-faint">Motivations</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {detail.motivations.map((mot) => (
                    <Badge key={mot} tone="outline">
                      {mot}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
