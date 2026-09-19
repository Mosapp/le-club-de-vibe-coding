import { useMemo, useState } from "react";
import { ChallengeCard, SessionCard } from "@/components/cards";
import { MediaSlot } from "@/components/media";
import { Badge, Button, Card, Chip, EmptyState, Icon, Note } from "@/components/ui";
import { EMPTY_STATES, SESSIONS_SECTION } from "@/config/content";
import { Reveal } from "@/lib/motion";
import { navigate } from "@/lib/router";
import { useClub } from "@/lib/store";
import { PageHeader } from "@/pages/member/Shell";

/* ==================================================================
   DÉFIS
================================================================== */

export function ChallengesPage() {
  const { data, me, toggleChallengeParticipation } = useClub();
  const [tab, setTab] = useState<"live" | "done">("live");

  const active = useMemo(() => data.challenges.filter((c) => c.status !== "terminé"), [data.challenges]);
  const done = useMemo(() => data.challenges.filter((c) => c.status === "terminé"), [data.challenges]);
  const list = tab === "live" ? active : done;

  return (
    <div className="space-y-8">
      <Reveal>
        <PageHeader
          title="Les défis du club."
          subtitle="Un objectif clair, une durée limitée, aucune obligation de réussir. Le but est de livrer quelque chose."
          action={
            <Button variant="secondary" icon="idea" onClick={() => navigate("/app/idees")}>
              Proposer un défi
            </Button>
          }
        >
          <div className="mt-8 flex gap-2">
            <Chip active={tab === "live"} onClick={() => setTab("live")}>
              Défis actifs ({active.length})
            </Chip>
            <Chip active={tab === "done"} onClick={() => setTab("done")}>
              Défis terminés ({done.length})
            </Chip>
          </div>
        </PageHeader>
      </Reveal>

      {list.length === 0 ? (
        <EmptyState
          icon="target"
          title={tab === "live" ? EMPTY_STATES.challenges.title : "Aucun défi terminé."}
          text={tab === "live" ? EMPTY_STATES.challenges.text : "Les défis archivés apparaîtront ici."}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((c, i) => (
            <Reveal key={c.id} delay={Math.min(i, 5) * 60}>
              <ChallengeCard
                challenge={c}
                participating={!!me && c.participants.includes(me.id)}
                onParticipate={() => toggleChallengeParticipation(c.id)}
              />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal>
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="max-w-md">
            <h3 className="text-[18px] font-semibold text-ink">Une idée de défi ?</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
              Les défis sont ouverts par l'équipe, mais ils viennent surtout des envies des membres.
            </p>
          </div>
          <Button variant="secondary" iconRight="arrowRight" onClick={() => navigate("/app/idees")}>
            Aller à la boîte à idées
          </Button>
        </Card>
      </Reveal>
    </div>
  );
}

/* ==================================================================
   SESSIONS
================================================================== */

export function SessionsPage() {
  const { data, me, toggleAttendance } = useClub();
  const host = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Bureau du club";
  };

  const { upcoming, past } = useMemo(() => {
    const sorted = [...data.sessions].sort((a, b) => String(b.date).localeCompare(String(a.date)));
    const up = sorted.filter((s) => s.date && new Date(s.date).getTime() >= Date.now() - 86_400_000);
    const pa = sorted.filter((s) => !s.date || new Date(s.date).getTime() < Date.now() - 86_400_000);
    return { upcoming: up.reverse(), past: pa };
  }, [data.sessions]);

  return (
    <div className="space-y-10">
      <Reveal>
        <PageHeader
          title="Les sessions de travail."
          subtitle="On arrive, on travaille, on repart avec quelque chose de concret."
        />
      </Reveal>

      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <div>
            <h2 className="label-mono mb-4 text-faint">Prochaines sessions</h2>
            {upcoming.length === 0 ? (
              <EmptyState icon="calendar" title={EMPTY_STATES.sessions.title} text={EMPTY_STATES.sessions.text} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {upcoming.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    hostName={host(s.host)}
                    attending={!!me && s.attendees.includes(me.id)}
                    onAttend={() => toggleAttendance(s.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-5">
          <Card className="overflow-hidden">
            <div className="group overflow-hidden">
              <MediaSlot slot={SESSIONS_SECTION.mediaSlot} rounded="rounded-none" />
            </div>
            <div className="p-6 md:p-7">
              <Badge tone="violet">{SESSIONS_SECTION.format.name}</Badge>
              <h3 className="mt-4 text-[19px] font-semibold leading-tight text-ink">{SESSIONS_SECTION.format.what}</h3>
              <ul className="mt-5 space-y-3 border-t border-line-2 pt-5">
                {SESSIONS_SECTION.format.details.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-[14px] leading-relaxed text-muted">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {d}
                  </li>
                ))}
              </ul>
              <p className="label-mono mt-5 text-faint">
                {SESSIONS_SECTION.format.when} · {SESSIONS_SECTION.format.time}
              </p>
            </div>
          </Card>
        </Reveal>
      </div>

      <div>
        <h2 className="label-mono mb-4 text-faint">Sessions passées</h2>
        {past.length === 0 ? (
          <Note>Aucune session passée pour l'instant. Les comptes-rendus arriveront ici.</Note>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {past.map((s) => (
              <SessionCard
                key={s.id}
                session={s}
                hostName={host(s.host)}
                attending={!!me && s.attendees.includes(me.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
