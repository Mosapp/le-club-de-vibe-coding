import { useEffect, useMemo, useRef, useState } from "react";
import { IdeaCard, RuleCard } from "@/components/cards";
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
import { Reveal } from "@/lib/motion";
import { navigate } from "@/lib/router";
import { ApiError, formatDate, useClub, type Idea } from "@/lib/store";
import { PageHeader } from "@/pages/member/Shell";

/* ==================================================================
   BOÎTE À IDÉES
================================================================== */

export function IdeasPage() {
  const { data, me, createIdea, voteIdea, toast } = useClub();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "session" as Idea["category"] });
  const [error, setError] = useState<string | null>(null);
  const knownIdeaIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    const currentIds = new Set(data.ideas.map((idea) => idea.id));
    if (!knownIdeaIds.current) {
      knownIdeaIds.current = currentIds;
      return;
    }
    const newIdea = data.ideas.find((idea) => !knownIdeaIds.current?.has(idea.id) && idea.authorId !== me?.id);
    if (newIdea) {
      toast({
        title: "Nouvelle proposition dans la communauté.",
        description: newIdea.title,
        tone: "info",
      });
    }
    knownIdeaIds.current = currentIds;
  }, [data.ideas, me?.id, toast]);

  const ideas = useMemo(
    () => [...data.ideas].sort((a, b) => b.votes.length - a.votes.length || b.createdAt.localeCompare(a.createdAt)),
    [data.ideas],
  );

  const author = (id: string) => {
    const m = data.members.find((x) => x.id === id);
    return m ? `${m.firstName} ${m.lastName}` : "Membre du club";
  };

  const submit = () => {
    setError(null);
    try {
      createIdea({ title: form.title.trim(), description: form.description.trim(), category: form.category });
      setForm({ title: "", description: "", category: "session" });
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Impossible d'enregistrer ton idée.");
    }
  };

  return (
    <div className="space-y-8">
      <Reveal>
        <PageHeader
          title="Boîte à idées."
          subtitle="Sujets de session, idées de défi, règles à ajouter : tout peut venir des membres. On vote, on discute, on décide."
          action={
            <Button icon="plus" onClick={() => setOpen(true)}>
              Proposer une idée
            </Button>
          }
        />
      </Reveal>

      <Reveal>
        <Note>
          <strong className="font-medium text-ink">Un seul vote par idée et par membre.</strong> Après ton vote, il ne
          peut plus être modifié. Les idées les plus votées sont examinées par le bureau du club.
        </Note>
      </Reveal>

      {ideas.length === 0 ? (
        <EmptyState
          icon="idea"
          title={EMPTY_STATES.ideas.title}
          text={EMPTY_STATES.ideas.text}
          action={
            <Button icon="plus" onClick={() => setOpen(true)}>
              Proposer une idée
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea, i) => (
            <Reveal key={idea.id} delay={Math.min(i, 6) * 55}>
              <IdeaCard
                idea={idea}
                authorName={author(idea.authorId)}
                hasVoted={!!me && idea.votes.includes(me.id)}
                onVote={() => voteIdea(idea.id)}
              >
                <span className="label-mono text-faint">{formatDate(idea.createdAt)}</span>
              </IdeaCard>
            </Reveal>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Proposer une idée"
        description="Courte, claire, concrète. Le club en discute à la prochaine session."
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button icon="plus" onClick={submit}>
              Envoyer
            </Button>
          </>
        }
      >
        <div className="space-y-6">
          <Field label="Titre" required>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Une session sur les APIs publiques"
            />
          </Field>
          <Field label="Détails" hint="Optionnel, mais ça aide à comprendre.">
            <Textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="On pourrait…"
            />
          </Field>
          <Field label="Catégorie">
            <Select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Idea["category"] })}
            >
              <option value="session">Sujet de session</option>
              <option value="défi">Idée de défi</option>
              <option value="règle">Proposition de règle</option>
              <option value="autre">Autre</option>
            </Select>
          </Field>
          {error && (
            <p className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
              <Icon name="close" className="h-4 w-4" />
              {error}
            </p>
          )}
        </div>
      </Modal>
    </div>
  );
}

/* ==================================================================
   RÈGLEMENT
================================================================== */

export function RulesPage() {
  const { data, me } = useClub();
  const adopted = data.rules.filter((r) => r.status === "adoptée").length;

  return (
    <div className="space-y-8">
      <Reveal>
        <PageHeader
          title="Le règlement du club."
          subtitle="Court, lisible, et vivant : chaque membre peut proposer une évolution via la boîte à idées."
          action={
            <Badge tone="moss">
              {adopted} règle{adopted > 1 ? "s" : ""} adoptée{adopted > 1 ? "s" : ""}
            </Badge>
          }
        />
      </Reveal>

      {data.rules.length === 0 ? (
        <EmptyState icon="shield" title="Aucune règle enregistrée." text="Le règlement sera publié ici." />
      ) : (
        <div className="space-y-4">
          {data.rules.map((rule, i) => (
            <Reveal key={rule.id} delay={Math.min(i, 6) * 55}>
              <RuleCard
                n={rule.n}
                title={rule.title}
                text={rule.text}
                status={rule.status}
                source={`${rule.source} · mise à jour ${formatDate(rule.updatedAt)}`}
              />
            </Reveal>
          ))}
        </div>
      )}

      <Reveal>
        <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between md:p-8">
          <div className="max-w-md">
            <h3 className="text-[18px] font-semibold text-ink">Proposer une évolution</h3>
            <p className="mt-2 text-[14.5px] leading-relaxed text-muted">
              Choisis la catégorie « Proposition de règle » dans la boîte à idées. Les membres votent, le bureau du club
              tranche ensuite.
            </p>
          </div>
          <Button variant="secondary" iconRight="arrowRight" onClick={() => navigate(me ? "/app/idees" : "/login")}>
            {me ? "Aller à la boîte à idées" : "Se connecter pour proposer"}
          </Button>
        </Card>
      </Reveal>
    </div>
  );
}
