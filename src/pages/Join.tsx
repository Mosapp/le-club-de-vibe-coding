import { useEffect, useMemo, useRef, useState } from "react";
import { JOIN } from "@/config/content";
import { MediaSlot } from "@/components/media";
import { Logo } from "@/components/layout";
import { Badge, Button, Chip, Field, Icon, Input, PasswordInput, ProgressBar, Textarea } from "@/components/ui";
import { navigate } from "@/lib/router";
import { ApiError, useClub } from "@/lib/store";
import { cn } from "@/utils/cn";

type Form = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  level: string;
  motivations: string[];
  goal: string;
  engagement: string;
};

const EMPTY: Form = { email: "", password: "", firstName: "", lastName: "", level: "", motivations: [], goal: "", engagement: "" };

export default function Join() {
  const { signUp, pending, me } = useClub();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [dir, setDir] = useState<"forward" | "back">("forward");
  // si un membre est déjà connecté en arrivant ici, on l'envoie directement
  // dans son espace (sans court-circuiter l'écran de bienvenue à l'inscription)
  const alreadyMember = useRef(!!me);

  useEffect(() => {
    if (alreadyMember.current && me) navigate("/app", { replace: true });
  }, [me]);

  const steps = JOIN.steps;
  const current = steps[step];

  const validate = (index: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (index === 0) {
      if (!form.email.trim() || !form.email.includes("@")) e.email = "Entre une adresse email valide.";
      if (form.password.length < 6) e.password = "Le mot de passe doit contenir au moins 6 caractères.";
      if (!form.firstName.trim()) e.firstName = "Ton prénom est obligatoire.";
      else if (form.firstName.trim().length < 2) e.firstName = "Ton prénom est un peu court.";
      if (!form.lastName.trim()) e.lastName = "Ton nom est obligatoire.";
    }
    if (index === 1 && !form.level) e.level = "Choisis ton niveau pour qu'on s'adapte.";
    if (index === 2 && form.motivations.length === 0) e.motivations = "Sélectionne au moins une raison.";
    if (index === 3 && form.goal.trim().length < 4) e.goal = "Écris ton objectif, même en quelques mots.";
    if (index === 4 && !form.engagement) e.engagement = "Dis-nous à quel rythme tu comptes venir.";
    return e;
  };

  const next = async () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setServerError(null);

    if (step < steps.length - 1) {
      setDir("forward");
      setStep(step + 1);
      return;
    }
    try {
      await signUp({
        email: form.email.trim(),
        password: form.password,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        level: form.level,
        motivations: form.motivations,
        goal: form.goal.trim(),
        engagement: form.engagement,
      });
      setDone(true);
    } catch (err) {
      setServerError(err instanceof ApiError ? err.message : "Une erreur est survenue. Réessaie dans un instant.");
    }
  };

  const back = () => {
    if (step === 0) {
      navigate("/");
      return;
    }
    setDir("back");
    setErrors({});
    setStep(step - 1);
  };

  const set = <K extends keyof Form>(key: K, value: Form[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const toggleMotivation = (m: string) =>
    set("motivations", form.motivations.includes(m) ? form.motivations.filter((x) => x !== m) : [...form.motivations, m]);

  const completion = useMemo(() => Math.round(((step + (done ? 1 : 0)) / steps.length) * 100), [step, done, steps.length]);

  /* -------------------------- ÉCRAN DE SUCCÈS -------------------------- */
  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper px-5 py-16">
        <div className="anim-pop w-full max-w-lg text-center">
          <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-brand/25 bg-brand-soft">
            <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" aria-hidden="true">
              <path
                className="check-path"
                d="M5 13l4 4L19 7"
                stroke="#0d47a1"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h1 className="mt-8 text-[clamp(1.9rem,5.6vw,2.8rem)] font-semibold leading-[1.05] text-ink">
            {JOIN.done.title}
          </h1>
          <p className="mx-auto mt-5 max-w-sm text-[16px] leading-relaxed text-muted">{JOIN.done.text}</p>
          <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
            <Button size="lg" iconRight="arrowRight" onClick={() => navigate("/app")}>
              {JOIN.done.cta}
            </Button>
            <Button size="lg" variant="secondary" onClick={() => navigate("/app/profil")}>
              Compléter mon profil
            </Button>
          </div>
          <p className="label-mono mt-8 text-faint">Ton profil reste modifiable à tout moment.</p>
        </div>
      </div>
    );
  }

  /* ------------------------------ FORMULAIRE ------------------------------ */
  return (
    <div className="grid min-h-screen lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
      {/* panneau visuel */}
      <aside className="relative hidden overflow-hidden bg-ink lg:block">
        <MediaSlot slot="COMMUNITY_MEDIA_03" ratio="3/4" rounded="rounded-none" className="h-full" />
        <div aria-hidden="true" className="absolute inset-0 bg-ink/45" />
        <div className="absolute inset-0 flex flex-col justify-between p-10">
          <Logo dark />
          <div className="max-w-sm">
            <p className="text-[26px] font-semibold leading-[1.15] text-white">
              Cinq questions, <span className="accent-serif text-brand">et c'est parti.</span>
            </p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-white/60">
              Aucune compétence à prouver, aucun CV à envoyer. On veut juste savoir ce que tu as envie de construire.
            </p>
          </div>
        </div>
      </aside>

      {/* formulaire */}
      <main className="flex flex-col px-5 py-8 md:px-10 lg:px-16 lg:py-12">
        <div className="flex items-center justify-between lg:hidden">
          <Logo />
          <button
            type="button"
            onClick={back}
            className="label-mono inline-flex items-center gap-1.5 text-muted hover:text-ink"
          >
            <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
            Retour
          </button>
        </div>

        <div className="mx-auto flex w-full max-w-xl flex-1 flex-col">
          {/* en-tête + progression */}
          <div className="mt-10 lg:mt-6">
            <div className="flex items-end justify-between gap-6">
              <div>
                <Badge tone="brand">{JOIN.title}</Badge>
                <p className="mt-4 hidden text-[14.5px] text-muted lg:block">{JOIN.intro}</p>
              </div>
              <span className="label-mono shrink-0 text-faint">
                <span className="text-ink">{String(step + 1).padStart(2, "0")}</span> / {String(steps.length).padStart(2, "0")}
              </span>
            </div>
            <ProgressBar value={done ? 100 : Math.max(completion, 6)} className="mt-5" />
            <ol className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
              {steps.map((s, i) => (
                <li key={s.id} className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-full border text-[9px] font-medium transition-colors duration-300",
                      i < step
                        ? "border-moss bg-moss text-white"
                        : i === step
                          ? "border-ink bg-ink text-white"
                          : "border-line bg-surface text-faint",
                    )}
                  >
                    {i < step ? <Icon name="check" className="h-2.5 w-2.5" /> : i + 1}
                  </span>
                  <span className={cn("label-mono transition-colors", i === step ? "text-ink" : "text-faint")}>
                    {s.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>

          {/* étape courante */}
          <div key={step} className={cn("anim-fade mt-10 flex-1", dir === "back" && "anim-pop")}>
            <h1 className="text-[clamp(1.6rem,4.4vw,2.3rem)] font-semibold leading-[1.08] text-ink">{current.title}</h1>
            <p className="mt-3 text-[15px] leading-relaxed text-muted">{current.subtitle}</p>

            <div className="mt-9 space-y-7">
              {step === 0 && (
                <>
                  <Field label="Email" required error={errors.email}>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={(e) => set("email", e.target.value)}
                      placeholder="toi@example.com"
                      invalid={!!errors.email}
                      autoComplete="email"
                    />
                  </Field>
                  <Field label="Mot de passe" required error={errors.password}>
                    <PasswordInput
                      value={form.password}
                      onChange={(e) => set("password", e.target.value)}
                      placeholder="6 caractères minimum"
                      invalid={!!errors.password}
                      autoComplete="new-password"
                    />
                  </Field>
                  <Field label="Prénom" required error={errors.firstName}>
                    <Input
                      value={form.firstName}
                      onChange={(e) => set("firstName", e.target.value)}
                      placeholder="Camille"
                      invalid={!!errors.firstName}
                      autoFocus
                    />
                  </Field>
                  <Field label="Nom" required error={errors.lastName}>
                    <Input
                      value={form.lastName}
                      onChange={(e) => set("lastName", e.target.value)}
                      placeholder="Diop"
                      invalid={!!errors.lastName}
                    />
                  </Field>
                </>
              )}

              {step === 1 && (
                <Field label="Ton niveau" required error={errors.level}>
                  <div className="flex flex-wrap gap-2.5">
                    {JOIN.levels.map((lvl) => (
                      <Chip key={lvl} active={form.level === lvl} onClick={() => set("level", lvl)}>
                        {lvl}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}

              {step === 2 && (
                <Field label="Pourquoi rejoindre ?" required error={errors.motivations}>
                  <div className="flex flex-wrap gap-2.5">
                    {JOIN.motivations.map((m) => (
                      <Chip key={m} active={form.motivations.includes(m)} onClick={() => toggleMotivation(m)}>
                        {m}
                      </Chip>
                    ))}
                  </div>
                </Field>
              )}

              {step === 3 && (
                <Field
                  label="Ton objectif"
                  required
                  error={errors.goal}
                  hint="Ex. : mettre en ligne une appli pour gérer mes répétitions de groupe."
                >
                  <Textarea
                    value={form.goal}
                    onChange={(e) => set("goal", e.target.value)}
                    placeholder="D'ici quelques mois, j'aimerais…"
                    invalid={!!errors.goal}
                    maxLength={320}
                  />
                </Field>
              )}

              {step === 4 && (
                <Field label="Ton niveau d'engagement" required error={errors.engagement}>
                  <div className="grid gap-3">
                    {JOIN.engagements.map((eng) => (
                      <button
                        key={eng.value}
                        type="button"
                        onClick={() => set("engagement", eng.value)}
                        className={cn(
                          "flex items-start gap-4 rounded-xl border p-4 text-left transition-all duration-200",
                          form.engagement === eng.value
                            ? "border-ink bg-surface shadow-[0_10px_28px_-22px_rgba(23,23,23,0.5)]"
                            : "border-line bg-surface hover:border-ink/25",
                        )}
                      >
                        <span
                          className={cn(
                            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                            form.engagement === eng.value ? "border-brand bg-brand text-white" : "border-line",
                          )}
                        >
                          {form.engagement === eng.value && <Icon name="check" className="h-3 w-3" />}
                        </span>
                        <span>
                          <span className="block text-[15px] font-medium text-ink">{eng.value}</span>
                          <span className="mt-1 block text-[13.5px] leading-snug text-muted">{eng.hint}</span>
                        </span>
                      </button>
                    ))}
                  </div>
                </Field>
              )}
            </div>

            {serverError && (
              <p className="mt-7 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-[14px] text-red-700">
                <Icon name="close" className="h-4 w-4" />
                {serverError}
              </p>
            )}
          </div>

          {/* navigation */}
          <div className="sticky bottom-0 -mx-5 mt-10 flex items-center justify-between gap-4 border-t border-line bg-paper/90 px-5 py-5 backdrop-blur-md md:-mx-10 md:px-10 lg:-mx-16 lg:px-16">
            <Button variant="ghost" iconRight="arrowRight" className="[&>svg]:rotate-180" onClick={back}>
              {step === 0 ? "Accueil" : "Précédent"}
            </Button>
            <Button
              iconRight="arrowRight"
              onClick={next}
              loading={pending.signUp}
              size="lg"
            >
              {step === steps.length - 1 ? "Rejoindre le club" : "Continuer"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
