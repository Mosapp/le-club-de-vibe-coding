import { useMemo, useState } from "react";
import { AdminHeader } from "@/pages/admin/Shell";
import { Badge, Button, Card, Chip, EmptyState, Icon, Input, Note } from "@/components/ui";
import { usePhotographers } from "@/lib/gallery";
import { navigate } from "@/lib/router";
import { initials, useClub } from "@/lib/store";

/* ==================================================================
   PHOTOGRAPHES — l'admin choisit qui peut publier dans la galerie.
   (Les admins peuvent déjà publier ; tout le monde peut regarder.)
================================================================== */

export function AdminPhotographers() {
  const { data, toast } = useClub();
  const { ids, loading, setPhotographer } = usePhotographers(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "photographers">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const members = useMemo(() => data.members.filter((m) => m.status === "ACTIVE"), [data.members]);
  const isOn = (id: string, role: string) => role === "ADMIN" || ids.has(id);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members
      .filter((m) => (filter === "photographers" ? isOn(m.id, m.role) : true))
      .filter((m) => (q ? `${m.firstName} ${m.lastName} ${m.level}`.toLowerCase().includes(q) : true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, filter, query, ids]);

  const count = members.filter((m) => m.role !== "ADMIN" && ids.has(m.id)).length;

  const toggle = async (id: string, name: string, on: boolean) => {
    setBusyId(id);
    try {
      await setPhotographer(id, on);
      toast({
        title: on ? `${name} est maintenant photographe.` : `${name} n'est plus photographe.`,
        tone: on ? "success" : "info",
      });
    } catch (e) {
      toast({ title: "Action impossible", description: e instanceof Error ? e.message : undefined, tone: "error" });
    }
    setBusyId(null);
  };

  return (
    <>
      <AdminHeader
        title="Photographes"
        subtitle="Choisis les membres qui peuvent publier des photos dans la galerie. Les admins peuvent déjà publier, et tout le monde peut regarder."
        action={
          <>
            <Button size="sm" variant="secondary" icon="image" onClick={() => navigate("/galerie")}>
              Voir la galerie
            </Button>
            <Badge tone="outline">{count} photographe(s)</Badge>
          </>
        }
      />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Chip active={filter === "all"} onClick={() => setFilter("all")}>
            Tous les membres
          </Chip>
          <Chip active={filter === "photographers"} onClick={() => setFilter("photographers")}>
            Photographes
          </Chip>
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

      {loading && <p className="text-[14px] text-muted">Chargement des photographes…</p>}

      {list.length === 0 ? (
        <EmptyState
          icon="image"
          title={filter === "photographers" ? "Aucun photographe pour l'instant." : "Aucun membre trouvé."}
          text={filter === "photographers" ? "Passe sur « Tous les membres » pour en nommer un." : "Essaie une autre recherche."}
        />
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line-2">
            {list.map((m) => {
              const admin = m.role === "ADMIN";
              const on = isOn(m.id, m.role);
              const name = `${m.firstName} ${m.lastName}`.trim();
              return (
                <li key={m.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-surface-2 text-[13px] font-semibold">
                      {initials(m)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium text-ink">{name}</p>
                      <p className="label-mono mt-1 text-faint">
                        {admin ? "Admin · peut déjà publier" : on ? "Photographe" : "Membre"}
                      </p>
                    </div>
                  </div>
                  {admin ? (
                    <Badge tone="outline">admin</Badge>
                  ) : (
                    <Button
                      size="sm"
                      variant={on ? "secondary" : "primary"}
                      loading={busyId === m.id}
                      onClick={() => void toggle(m.id, name, !on)}
                    >
                      {on ? "Retirer" : "Nommer photographe"}
                    </Button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      <Note>
        Un photographe peut publier ses photos et supprimer les siennes. Les admins peuvent supprimer toutes les photos.
      </Note>
    </>
  );
}
