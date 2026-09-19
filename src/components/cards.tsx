import { cn } from "@/utils/cn";
import { MediaImage, MediaPlaceholder } from "@/components/media";
import { Badge, Button, Card, Icon } from "@/components/ui";
import { formatDate, type Challenge, type Idea, type Session } from "@/lib/store";
import { getMedia } from "@/config/media";

/* ==================================================================
   CARTE PROJET
   ┌──────────────────────┐
   │       IMAGE          │
   ├──────────────────────┤
   │ Titre                │
   │ Description          │
   │ Découvrir →          │
   └──────────────────────┘
================================================================== */

export function ProjectCard({
  title,
  description,
  tech,
  slot,
  imageUrl,
  author,
  actionLabel = "Découvrir",
  onClick,
  className,
  ratio = "16/10",
}: {
  title: string;
  description: string;
  tech?: string[];
  slot?: string | null;
  imageUrl?: string | null;
  author?: string;
  actionLabel?: string;
  onClick?: () => void;
  className?: string;
  ratio?: string;
}) {
  const asset = slot ? getMedia(slot) : null;
  const src = imageUrl ?? asset?.src ?? null;
  const alt = imageUrl ? `Aperçu du projet ${title}` : asset?.alt || `Aperçu du projet ${title}`;
  const r = ratio ?? asset?.ratio ?? "16/10";

  return (
    <Card as="article" hover className={cn("group flex h-full flex-col overflow-hidden", className)}>
      <button
        type="button"
        onClick={onClick}
        className="relative block overflow-hidden text-left"
        aria-label={`${actionLabel} — ${title}`}
      >
        {src ? (
          <MediaImage src={src} alt={alt} ratio={r} rounded="rounded-none" zoomOnHover />
        ) : (
          <MediaPlaceholder slot={slot ?? "PROJECT_IMAGE"} label={`Projet — ${title}`} ratio={r} rounded="rounded-none" />
        )}
      </button>

      <div className="flex flex-1 flex-col p-5 md:p-6">
        <h3 className="text-[18px] font-semibold leading-tight text-ink">{title}</h3>
        {author && <p className="label-mono mt-2 text-faint">par {author}</p>}
        <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-muted">{description}</p>

        {tech && tech.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {tech.map((t) => (
              <span
                key={t}
                className="rounded-md border border-line bg-surface-2 px-2 py-1 font-mono text-[11px] tracking-wide text-muted"
              >
                {t}
              </span>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onClick}
          className="mt-5 inline-flex items-center gap-1.5 self-start text-[14px] font-medium text-ink transition-colors duration-200 hover:text-brand-ink"
        >
          {actionLabel}
          <Icon
            name="arrowRight"
            className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </button>
      </div>
    </Card>
  );
}

/* ==================================================================
   CARTE DÉFI
================================================================== */

const statusTone = {
  "à venir": "neutral",
  actif: "brand",
  terminé: "moss",
} as const;

export function ChallengeCard({
  challenge,
  participating,
  onParticipate,
  compact = false,
}: {
  challenge: Challenge;
  participating: boolean;
  onParticipate?: () => void;
  compact?: boolean;
}) {
  return (
    <Card hover className="flex h-full flex-col p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <span className="label-mono text-brand-ink">{challenge.code}</span>
        <Badge tone={statusTone[challenge.status]}>{challenge.status}</Badge>
      </div>
      <h3 className="mt-4 text-[19px] font-semibold leading-tight text-ink">{challenge.title}</h3>
      <p className="mt-3 flex-1 text-[14.5px] leading-relaxed text-muted">{challenge.description}</p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-line-2 pt-4 sm:grid-cols-4">
        <div>
          <dt className="label-mono text-faint">Difficulté</dt>
          <dd className="mt-1.5 text-[13.5px] font-medium text-ink">{challenge.difficulty}</dd>
        </div>
        <div>
          <dt className="label-mono text-faint">Durée</dt>
          <dd className="mt-1.5 text-[13.5px] font-medium text-ink">{challenge.duration}</dd>
        </div>
        <div>
          <dt className="label-mono text-faint">Participants</dt>
          <dd className="mt-1.5 text-[13.5px] font-medium text-ink">
            {challenge.participants.length > 0 ? challenge.participants.length : "—"}
          </dd>
        </div>
        <div>
          <dt className="label-mono text-faint">Technos</dt>
          <dd className="mt-1.5 text-[13.5px] font-medium text-ink">{challenge.tech.join(", ")}</dd>
        </div>
      </dl>

      {!compact && onParticipate && (
        <Button
          size="sm"
          variant={participating ? "secondary" : "primary"}
          icon={participating ? "check" : "plus"}
          className="mt-5 self-start"
          onClick={onParticipate}
        >
          {participating ? "Je participe" : "Participer"}
        </Button>
      )}
    </Card>
  );
}

/* ==================================================================
   CARTE SESSION
================================================================== */

export function SessionCard({
  session,
  hostName,
  attending,
  onAttend,
}: {
  session: Session;
  hostName: string;
  attending: boolean;
  onAttend?: () => void;
}) {
  return (
    <Card hover className="flex h-full flex-col p-5 md:p-6">
      <div className="flex items-center justify-between gap-4">
        <span className="label-mono text-violet">{session.title}</span>
        {session.date && <Badge tone="outline">{formatDate(session.date)}</Badge>}
      </div>
      <h3 className="mt-4 text-[19px] font-semibold leading-tight text-ink">{session.subject}</h3>
      <dl className="mt-4 space-y-2.5 text-[14px]">
        <div className="flex items-center gap-2.5 text-muted">
          <Icon name="calendar" className="h-4 w-4 text-faint" />
          {session.date ? formatDate(session.date) : "Date à confirmer"}
        </div>
        <div className="flex items-center gap-2.5 text-muted">
          <Icon name="clock" className="h-4 w-4 text-faint" />
          {session.time ?? "Horaire à confirmer"}
        </div>
        <div className="flex items-center gap-2.5 text-muted">
          <Icon name="user" className="h-4 w-4 text-faint" />
          {hostName}
        </div>
      </dl>
      <div className="mt-auto flex flex-wrap items-center gap-3 pt-5">
        {onAttend && (
          <Button
            size="sm"
            variant={attending ? "secondary" : "dark"}
            icon={attending ? "check" : "plus"}
            onClick={onAttend}
          >
            {attending ? "Je viens" : "Je m'inscris"}
          </Button>
        )}
        {session.link && (
          <a
            href={session.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-ink hover:text-brand-ink"
          >
            Rejoindre le lien
            <Icon name="arrowUpRight" className="h-4 w-4" />
          </a>
        )}
      </div>
    </Card>
  );
}

/* ==================================================================
   CARTE IDÉE
================================================================== */

export function IdeaCard({
  idea,
  authorName,
  hasVoted,
  onVote,
  children,
}: {
  idea: Idea;
  authorName: string;
  hasVoted: boolean;
  onVote?: () => void;
  children?: React.ReactNode;
}) {
  const tone = {
    proposée: "neutral",
    "en discussion": "violet",
    retenue: "moss",
    refusée: "neutral",
  } as const;

  return (
    <Card hover className="flex h-full flex-col p-5 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <Badge tone="outline">{idea.category}</Badge>
        <Badge tone={tone[idea.status]}>{idea.status}</Badge>
      </div>
      <h3 className="mt-4 text-[18px] font-semibold leading-tight text-ink">{idea.title}</h3>
      {idea.description && <p className="mt-2.5 flex-1 text-[14.5px] leading-relaxed text-muted">{idea.description}</p>}
      <div className="mt-5 flex items-center justify-between gap-4 border-t border-line-2 pt-4">
        <span className="label-mono text-faint">{authorName}</span>
        <div className="flex items-center gap-2">
          {children}
          {onVote && (
            <button
              type="button"
              onClick={onVote}
              disabled={hasVoted}
              aria-pressed={hasVoted}
              aria-label={hasVoted ? "Vote déjà enregistré" : "Voter pour cette proposition"}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] font-medium transition-all duration-200",
                hasVoted
                  ? "cursor-not-allowed border-brand bg-brand-soft text-brand-ink"
                  : "border-line bg-surface text-muted hover:border-ink/25 hover:text-ink",
              )}
            >
              <Icon name="trend" className="h-4 w-4" />
              {idea.votes.length}
              <span className="sr-only">voter pour cette idée</span>
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ==================================================================
   CARTE RÈGLE
================================================================== */

export function RuleCard({
  n,
  title,
  text,
  status,
  source,
  children,
}: {
  n: string;
  title: string;
  text: string;
  status: string;
  source?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-4 p-6 md:flex-row md:items-start md:gap-8">
      <span className="label-mono shrink-0 pt-1.5 text-brand-ink">{n}</span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h3 className="text-[18px] font-semibold leading-tight text-ink">{title}</h3>
          <Badge tone={status === "adoptée" ? "moss" : status === "en discussion" ? "violet" : "neutral"}>
            {status}
          </Badge>
        </div>
        <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{text}</p>
        {source && <p className="label-mono mt-3.5 text-faint">{source}</p>}
      </div>
      {children && <div className="flex shrink-0 items-center gap-2">{children}</div>}
    </Card>
  );
}

/* ==================================================================
   CARTE « POURQUOI » (landing)
================================================================== */

export function WhyCard({
  title,
  text,
  icon,
  index,
}: {
  title: string;
  text: string;
  icon: "book" | "spark" | "share" | "trend";
  index: number;
}) {
  return (
    <Card hover className="group relative flex h-full flex-col overflow-hidden p-6 md:p-7">
      <div className="flex items-center justify-between">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-surface-2 text-ink transition-colors duration-300 group-hover:border-brand/30 group-hover:bg-brand-soft group-hover:text-brand-ink">
          <Icon name={icon} />
        </span>
        <span className="label-mono text-faint">0{index + 1}</span>
      </div>
      <h3 className="mt-6 text-[17px] font-semibold tracking-[-0.01em] text-ink">{title}</h3>
      <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{text}</p>
    </Card>
  );
}
