import { useMemo } from "react";
import { MediaSlot } from "@/components/media";
import { ProjectCard } from "@/components/cards";
import { Badge, Button, Card, EmptyState, Icon, ProgressBar, Stat } from "@/components/ui";
import { EMPTY_STATES } from "@/config/content";
import { navigate } from "@/lib/router";
import { memberProgress, useClub } from "@/lib/store";
import { PageHeader } from "@/pages/member/Shell";
import { Reveal } from "@/lib/motion";

export default function MemberHome() {
  const { data, me } = useClub();

  const progress = useMemo(() => memberProgress(data, me?.id ?? ""), [data, me?.id]);

  const nextChallenge = useMemo(
    () => data.challenges.find((c) => c.status !== "terminé") ?? null,
    [data.challenges],
  );
  const nextSession = useMemo(() => {
    const upcoming = data.sessions
      .filter((s) => s.date && new Date(s.date).getTime() >= Date.now() - 86_400_000)
      .sort((a, b) => String(a.date).localeCompare(String(b.date)));
    return upcoming[0] ?? null;
  }, [data.sessions]);

  if (!me) return null;

  const clubProjects = data.projects.filter((p) => p.published).slice(0, 3);
  const author = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Membre du club";
  };

  return (
    <div className="space-y-10">
      <Reveal>
        <PageHeader
          title={`Bonjour, ${me.firstName}.`}
          subtitle="Qu'est-ce qu'on construit aujourd'hui ?"
          action={
            <>
              <Button variant="secondary" icon="idea" onClick={() => navigate("/app/idees")}>
                Boîte à idées
              </Button>
              <Button iconRight="arrowRight" onClick={() => navigate("/app/projets")}>
                Partager un projet
              </Button>
            </>
          }
        />
      </Reveal>

      {/* ---------- objectif + progression ---------- */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Reveal className="lg:col-span-7">
          <Card className="h-full overflow-hidden">
            <div className="grid sm:grid-cols-[1.1fr_0.9fr]">
              <div className="p-6 md:p-8">
                <Badge tone="brand">Mon objectif</Badge>
                <p className="mt-5 text-[19px] leading-relaxed text-ink md:text-[21px]">
                  {me.goal || "Tu n'as pas encore défini d'objectif. Écris-le : ça change tout."}
                </p>
                <dl className="mt-7 grid grid-cols-2 gap-4 border-t border-line-2 pt-5">
                  <div>
                    <dt className="label-mono text-faint">Niveau</dt>
                    <dd className="mt-1.5 text-[14.5px] text-ink">{me.level}</dd>
                  </div>
                  <div>
                    <dt className="label-mono text-faint">Engagement</dt>
                    <dd className="mt-1.5 text-[14.5px] text-ink">{me.engagement}</dd>
                  </div>
                </dl>
                <Button
                  size="sm"
                  variant="ghost"
                  className="mt-5 -ml-3"
                  iconRight="arrowRight"
                  onClick={() => navigate("/app/profil")}
                >
                  Modifier mon objectif
                </Button>
              </div>
              <div className="relative hidden overflow-hidden border-l border-line sm:block">
                <MediaSlot slot="COMMUNITY_MEDIA_02" rounded="rounded-none" className="h-full" ratio="3/4" />
              </div>
            </div>
          </Card>
        </Reveal>

        <Reveal delay={80} className="lg:col-span-5">
          <Card className="flex h-full flex-col p-6 md:p-8">
            <Badge tone="violet">Ma progression</Badge>
            <div className="mt-6 flex items-end justify-between">
              <span className="text-[42px] font-semibold leading-none tracking-tight text-ink">{progress.pct}%</span>
              <span className="label-mono text-faint">{progress.points} pts</span>
            </div>
            <ProgressBar value={progress.pct} tone="violet" className="mt-5" />
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              Calculée sur ta participation réelle : projets publiés, défis rejoints, sessions et idées proposées.
            </p>
            <dl className="mt-6 grid grid-cols-2 gap-4 border-t border-line-2 pt-5">
              {[
                { k: "Projets", v: progress.projects },
                { k: "Défis", v: progress.challenges },
                { k: "Sessions", v: progress.sessions },
                { k: "Idées", v: progress.ideas },
              ].map((row) => (
                <div key={row.k} className="flex items-baseline justify-between">
                  <dt className="label-mono text-faint">{row.k}</dt>
                  <dd className="text-[15px] font-medium text-ink">{row.v}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </Reveal>
      </div>

      {/* ---------- prochain défi / prochaine session ---------- */}
      <div className="grid gap-4 md:grid-cols-2">
        <Reveal>
          <Card hover className="h-full p-6 md:p-8">
            <div className="flex items-center justify-between">
              <Badge tone="outline">Prochain défi</Badge>
              <Icon name="target" className="h-5 w-5 text-brand-ink" />
            </div>
            {nextChallenge ? (
              <>
                <p className="label-mono mt-6 text-brand-ink">{nextChallenge.code}</p>
                <h3 className="mt-3 text-[21px] font-semibold leading-tight text-ink">{nextChallenge.title}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">{nextChallenge.description}</p>
                <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-line-2 pt-5 text-[13.5px] text-muted">
                  <span>{nextChallenge.difficulty}</span>
                  <span className="h-3 w-px bg-line" />
                  <span>{nextChallenge.duration}</span>
                  <span className="h-3 w-px bg-line" />
                  <span>
                    {nextChallenge.participants.length > 0
                      ? `${nextChallenge.participants.length} participant(s)`
                      : "Aucun participant pour l'instant"}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  iconRight="arrowRight"
                  className="mt-6"
                  onClick={() => navigate("/app/defis")}
                >
                  Voir le défi
                </Button>
              </>
            ) : (
              <p className="mt-6 text-[15px] leading-relaxed text-muted">{EMPTY_STATES.challenges.text}</p>
            )}
          </Card>
        </Reveal>

        <Reveal delay={80}>
          <Card hover className="h-full p-6 md:p-8">
            <div className="flex items-center justify-between">
              <Badge tone="outline">Prochaine session</Badge>
              <Icon name="calendar" className="h-5 w-5 text-violet" />
            </div>
            {nextSession ? (
              <>
                <p className="label-mono mt-6 text-violet">{nextSession.title}</p>
                <h3 className="mt-3 text-[21px] font-semibold leading-tight text-ink">{nextSession.subject}</h3>
                <p className="mt-3 text-[14.5px] leading-relaxed text-muted">
                  {nextSession.date ? new Date(nextSession.date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" }) : "Date à confirmer"}
                  {nextSession.time ? ` · ${nextSession.time}` : ""}
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  iconRight="arrowRight"
                  className="mt-6"
                  onClick={() => navigate("/app/sessions")}
                >
                  Voir la session
                </Button>
              </>
            ) : (
              <p className="mt-6 text-[15px] leading-relaxed text-muted">{EMPTY_STATES.sessions.text}</p>
            )}
          </Card>
        </Reveal>
      </div>

      {/* ---------- projets du club ---------- */}
      <Reveal>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <h2 className="text-[22px] font-semibold text-ink">Projets du club</h2>
          <Button size="sm" variant="ghost" iconRight="arrowRight" className="-ml-3" onClick={() => navigate("/app/projets")}>
            Tout voir
          </Button>
        </div>
      </Reveal>

      {clubProjects.length === 0 ? (
        <Reveal>
          <EmptyState
            icon="code"
            title={EMPTY_STATES.projects.title}
            text={EMPTY_STATES.projects.text}
            action={
              <Button iconRight="arrowRight" onClick={() => navigate("/app/projets")}>
                {EMPTY_STATES.projects.cta}
              </Button>
            }
          />
        </Reveal>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {clubProjects.map((p, i) => (
            <Reveal key={p.id} delay={i * 70}>
              <ProjectCard
                title={p.title}
                description={p.description}
                tech={p.tech}
                imageUrl={p.imageUrl}
                author={author(p.authorId)}
                actionLabel={p.authorId === me.id ? "Modifier" : "Découvrir"}
                onClick={() => navigate("/app/projets")}
              />
            </Reveal>
          ))}
        </div>
      )}

      {/* ---------- état du club ---------- */}
      <Reveal>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Membres" value={data.members.length} hint="profils enregistrés" />
          <Stat label="Projets publiés" value={data.projects.filter((p) => p.published).length} tone="brand" />
          <Stat label="Défis" value={data.challenges.length} tone="violet" />
          <Stat
            label="Sessions planifiées"
            value={data.sessions.filter((s) => s.date && new Date(s.date).getTime() > Date.now()).length}
            tone="moss"
          />
        </div>
      </Reveal>
    </div>
  );
}
