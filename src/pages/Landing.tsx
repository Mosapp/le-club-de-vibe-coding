import {
  CHALLENGES_SECTION,
  COMMUNITY,
  CTA,
  HERO,
  PRINCIPLES,
  PROJECTS_SECTION,
  SESSIONS_SECTION,
  VIBE_CODING,
  WHATSAPP_GROUP_URL,
  WHY_JOIN,
} from "@/config/content";
import { ChallengeCard, ProjectCard, WhyCard } from "@/components/cards";
import { MediaSlot } from "@/components/media";
import { Footer } from "@/components/layout";
import { Badge, Button, Card, Eyebrow, Icon, Note, SectionHeading } from "@/components/ui";
import { navigate } from "@/lib/router";
import { Reveal, RevealMask } from "@/lib/motion";
import { useClub } from "@/lib/store";
import { useEffect, useRef, useState } from "react";

/* ==================================================================
   HERO — la force vient de la composition, pas des effets.
================================================================== */

function useTypewriter(text: string, speed = 38, startDelay = 600) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    let interval: number | undefined;
    const delay = window.setTimeout(() => {
      let index = 0;
      interval = window.setInterval(() => {
        index += 1;
        setDisplayed(text.slice(0, index));
        if (index >= text.length) {
          setDone(true);
          if (interval) window.clearInterval(interval);
        }
      }, speed);
    }, startDelay);
    return () => {
      window.clearTimeout(delay);
      if (interval) window.clearInterval(interval);
    };
  }, [speed, startDelay, text]);

  return { displayed, done };
}

function MainframeNavbar() {
  const [open, setOpen] = useState(false);
  const links = ["Labs", "Studio", "Openings", "Shop"];

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-10 flex items-center justify-between px-5 py-4 text-white sm:px-8 sm:py-5">
        <a href="#top" className="flex items-center gap-3" style={{ fontFamily: "var(--font-heading)" }}>
          <span className="text-[21px] tracking-tight sm:text-[26px]">Mainframe®</span>
          <span className="select-none text-[25px] leading-none tracking-[-0.02em] sm:text-[30px]">✳︎</span>
        </a>
        <nav className="hidden items-center text-[23px] md:flex">
          {links.map((link, index) => (
            <span key={link}>
              <a href={`#${link.toLowerCase()}`} className="transition-opacity hover:opacity-60">{link}</a>
              {index < links.length - 1 ? ", " : ""}
            </span>
          ))}
        </nav>
        <a href="mailto:hello@mainframe.co" className="hidden text-[23px] underline underline-offset-2 transition-opacity hover:opacity-60 md:block">Get in touch</a>
        <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((value) => !value)} className="flex flex-col gap-[5px] md:hidden">
          <span className={`h-[2px] w-6 bg-white transition duration-300 ${open ? "translate-y-[7px] rotate-45" : ""}`} />
          <span className={`h-[2px] w-6 bg-white transition duration-300 ${open ? "opacity-0" : ""}`} />
          <span className={`h-[2px] w-6 bg-white transition duration-300 ${open ? "-translate-y-[7px] -rotate-45" : ""}`} />
        </button>
      </header>
      <div className={`fixed inset-0 z-[9] flex flex-col justify-center gap-8 bg-black/90 px-8 backdrop-blur-md transition-opacity duration-300 md:hidden ${open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}>
        {links.map((link) => <a key={link} href={`#${link.toLowerCase()}`} onClick={() => setOpen(false)} className="text-[32px] font-medium text-white">{link}</a>)}
        <a href="mailto:hello@mainframe.co" onClick={() => setOpen(false)} className="text-[32px] font-medium text-white underline underline-offset-4">Get in touch</a>
      </div>
    </>
  );
}

function CopyIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 12 12" className="h-3 w-3 fill-none stroke-current" strokeWidth="1.1">
      <rect x="3.5" y="1.5" width="6.5" height="7" rx="0.7" />
      <path d="M2.5 4.5H2a.5.5 0 0 0-.5.5v4.5a.5.5 0 0 0 .5.5h4.5a.5.5 0 0 0 .5-.5V9" />
    </svg>
  );
}

function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const targetTimeRef = useRef(0);
  const seekingRef = useRef(false);
  const previousXRef = useRef<number | null>(null);
  const [actionsVisible, setActionsVisible] = useState(false);
  const { displayed, done } = useTypewriter("Glad you stopped in. Good taste tends to find us. Now, what are we building?");

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const seek = () => {
      if (seekingRef.current || !video.duration) return;
      seekingRef.current = true;
      video.currentTime = targetTimeRef.current;
    };
    const onSeeked = () => {
      seekingRef.current = false;
      if (Math.abs(video.currentTime - targetTimeRef.current) > 0.01) seek();
    };
    const onMouseMove = (event: MouseEvent) => {
      if (previousXRef.current === null || !video.duration) {
        previousXRef.current = event.clientX;
        return;
      }
      const delta = event.clientX - previousXRef.current;
      previousXRef.current = event.clientX;
      targetTimeRef.current = Math.max(0, Math.min(video.duration, targetTimeRef.current + (delta / window.innerWidth) * 0.8 * video.duration));
      seek();
    };
    video.addEventListener("seeked", onSeeked);
    window.addEventListener("mousemove", onMouseMove);
    return () => {
      video.removeEventListener("seeked", onSeeked);
      window.removeEventListener("mousemove", onMouseMove);
    };
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => setActionsVisible(true), 400);
    return () => window.clearTimeout(timeout);
  }, []);

  const copyEmail = () => void navigator.clipboard?.writeText("hello@mainframe.co");
  const actions = ["Pitch us an idea", "Come work here", "Send a brief hello", "See how we operate"];

  return (
    <section id="top" className="relative z-[1] flex h-screen min-h-[620px] flex-col justify-end overflow-hidden bg-black pb-12 text-white md:justify-center md:pb-0">
      <video ref={videoRef} className="fixed inset-0 z-0 h-full w-full object-cover" style={{ objectPosition: "70% center" }} muted playsInline preload="auto" src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260826_041744_63efcd78-bf7d-4039-99e2-2461e8a61903.mp4" />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-[1] bg-black/20" />
      <MainframeNavbar />
      <div className="relative z-[2] max-w-xl px-5 sm:px-8 md:px-10">
        <p className="pointer-events-none mb-5 select-none text-[clamp(18px,4vw,26px)] font-normal leading-[1.3] text-white blur-[4px] sm:mb-6">Hey there, meet A.R.I.A,<br />Mainframe&apos;s Adaptive Response Interface Agent</p>
        <p className="mb-5 min-h-[54px] text-[clamp(18px,4vw,26px)] font-normal leading-[1.35] sm:mb-6">{displayed}{!done && <span className="ml-[2px] inline-block h-[1.1em] w-[2px] animate-[blink_1s_step-end_infinite] bg-white align-middle" />}</p>
        <div className="flex flex-wrap gap-y-1 transition duration-400 ease-out" style={{ opacity: actionsVisible ? 1 : 0, transform: actionsVisible ? "translateY(0)" : "translateY(8px)" }}>
          {actions.map((action) => <a key={action} href="#contact" className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center whitespace-nowrap rounded-full border border-black/10 bg-white px-4 py-[0.3em] text-[13px] text-black transition-colors duration-200 hover:bg-black hover:text-white sm:px-5 sm:text-[15px]">{action}</a>)}
          <button type="button" onClick={copyEmail} className="mx-[0.2em] mb-[0.4em] inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full border border-white bg-transparent px-4 py-[0.3em] text-[13px] text-white transition-colors duration-200 hover:bg-white hover:text-black sm:gap-3 sm:px-5 sm:text-[15px]"><span>Reach us: <span className="underline underline-offset-1">hello@mainframe.co</span></span><CopyIcon /></button>
        </div>
      </div>
    </section>
  );
}

function LegacyHero() {
  const { me } = useClub();
  return (
    <section className="relative overflow-hidden pt-[104px] pb-14 md:pt-[132px] md:pb-20 lg:pb-28">
      {/* aplat discret pour asseoir la composition */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[520px] bg-gradient-to-b from-white to-transparent"
      />
      <div className="container-x relative grid items-center gap-12 lg:grid-cols-12 lg:gap-14">
        {/* -------- gauche -------- */}
        <div className="lg:col-span-6">
          <Reveal>
            <span className="label-mono inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 py-2 text-muted">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inset-0 rounded-full bg-brand" />
              </span>
              {HERO.badge}
            </span>
          </Reveal>

          <Reveal delay={70}>
            <h1 className="mt-7 text-[clamp(2.05rem,7.4vw,4.5rem)] font-semibold leading-[0.96] tracking-[-0.035em] text-ink">
              {HERO.titleLines[0]}
              <br />
              AVEC <span className="accent-serif text-brand">{HERO.titleAccent.toLowerCase()}</span>
            </h1>
          </Reveal>

          <Reveal delay={140}>
            <p className="mt-7 max-w-md text-[16px] leading-relaxed text-muted md:text-[17px]">{HERO.subtitle}</p>
          </Reveal>

          <Reveal delay={210}>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button size="lg" iconRight="arrowRight" onClick={() => navigate(me ? "/app" : "/join")}>
                {me ? "Mon espace" : HERO.primaryCta}
              </Button>
              <Button size="lg" variant="secondary" onClick={() => navigate(HERO.secondaryHref)}>
                {HERO.secondaryCta}
              </Button>
            </div>
            <a
              href={WHATSAPP_GROUP_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-brand-ink underline decoration-brand/40 underline-offset-4 transition-colors hover:text-brand"
            >
              Rejoindre le groupe WhatsApp
              <Icon name="arrowUpRight" className="h-4 w-4" />
            </a>
          </Reveal>

          <Reveal delay={280}>
            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-line pt-6">
              <span className="label-mono text-faint">Ce que tu y trouves</span>
              {["Sessions de travail", "Défis courts", "Mur des créations"].map((item) => (
                <span key={item} className="inline-flex items-center gap-1.5 text-[13.5px] text-muted">
                  <Icon name="check" className="h-4 w-4 text-brand" />
                  {item}
                </span>
              ))}
            </div>
          </Reveal>
        </div>

        {/* -------- droite : LE visuel fort -------- */}
        <div className="lg:col-span-6">
          <Reveal delay={110} className="relative">
            <div className="group relative">
              {/* cadre décalé, façon éditorial */}
              <div
                aria-hidden="true"
                className="absolute -bottom-4 -right-4 h-full w-full rounded-lg border border-line bg-surface"
              />
              <div className="relative overflow-hidden rounded-lg border border-line">
                <MediaSlot slot={HERO.mediaSlot} priority rounded="rounded-none" zoomOnHover />
                {/* léger voile pour la lisibilité du badge */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/22 via-transparent to-transparent"
                />
              </div>

              {/* carte flottante : contenu réel du club */}
              <div className="absolute -bottom-6 left-4 w-[calc(100%-2rem)] max-w-[290px] rounded-xl border border-line bg-surface/95 p-4 shadow-[0_18px_45px_-28px_rgba(23,23,23,0.5)] backdrop-blur-sm sm:left-6">
                <div className="flex items-center justify-between">
                  <span className="label-mono text-brand-ink">{CHALLENGES_SECTION.programme[0].code}</span>
                  <Badge tone="outline">{CHALLENGES_SECTION.programme[0].status}</Badge>
                </div>
                <p className="mt-2.5 text-[14.5px] font-medium leading-snug text-ink">
                  {CHALLENGES_SECTION.programme[0].title}
                </p>
                <div className="mt-3 flex items-center gap-4 text-[12.5px] text-muted">
                  <span>{CHALLENGES_SECTION.programme[0].difficulty}</span>
                  <span className="h-3 w-px bg-line" />
                  <span>{CHALLENGES_SECTION.programme[0].duration}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>

      {/* bandeau de principes */}
      <div className="container-x relative mt-20 lg:mt-28">
        <div className="grid gap-3 border-t border-line pt-7 sm:grid-cols-2 lg:grid-cols-3">
          {PRINCIPLES.map((p, i) => (
            <Reveal key={p} delay={i * 50}>
              <span className="flex items-center gap-2.5 text-[14px] text-muted">
                <span className="h-1 w-1 rounded-full bg-violet" />
                {p}
              </span>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   C'EST QUOI LE VIBE CODING ? (section sombre, premium)
================================================================== */

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const palette = ["#E95D2C", "#B0CEE2", "#ffffff", "#45586C"];
    let width = 0;
    let height = 0;
    let frame = 0;
    let particles: { x: number; y: number; vx: number; vy: number; size: number; color: string }[] = [];
    const pointer = { x: 0.5, y: 0.5, active: false };

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      if (!rect) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const count = Math.min(440, Math.max(180, Math.floor((width * height) / 7200)));
      particles = Array.from({ length: count }, (_, index) => {
        const angle = index * 2.39996;
        const radius = Math.random() ** 0.65;
        return {
          x: width * (0.5 + Math.cos(angle) * radius * 0.47),
          y: height * (0.49 + Math.sin(angle) * radius * 0.42),
          vx: (Math.random() - 0.5) * 0.12,
          vy: (Math.random() - 0.5) * 0.12,
          size: Math.random() * 1.6 + 0.35,
          color: palette[index % palette.length],
        };
      });
    };

    const movePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = (event.clientX - rect.left) / rect.width;
      pointer.y = (event.clientY - rect.top) / rect.height;
      pointer.active = true;
    };
    const leave = () => {
      pointer.active = false;
    };

    const draw = (time: number) => {
      context.clearRect(0, 0, width, height);
      const centerX = width * 0.52;
      const centerY = height * 0.48;
      const pulse = Math.sin(time * 0.001) * 0.6;
      particles.forEach((particle) => {
        if (!reduceMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;
          if (particle.x < -20) particle.x = width + 20;
          if (particle.x > width + 20) particle.x = -20;
          if (particle.y < -20) particle.y = height + 20;
          if (particle.y > height + 20) particle.y = -20;
        }
        const dx = centerX - particle.x;
        const dy = centerY - particle.y;
        const distance = Math.hypot(dx, dy) || 1;
        const rocketBias = Math.max(0, 1 - distance / (Math.min(width, height) * 0.52));
        if (pointer.active) {
          const px = pointer.x * width - particle.x;
          const py = pointer.y * height - particle.y;
          const pointerDistance = Math.hypot(px, py) || 1;
          if (pointerDistance < 170) {
            particle.x -= (px / pointerDistance) * (1 - pointerDistance / 170) * 0.7;
            particle.y -= (py / pointerDistance) * (1 - pointerDistance / 170) * 0.7;
          }
        }
        context.globalAlpha = 0.22 + rocketBias * 0.7;
        context.fillStyle = particle.color;
        context.beginPath();
        context.arc(particle.x, particle.y, particle.size + rocketBias * 0.7 + pulse * 0.05, 0, Math.PI * 2);
        context.fill();
      });
      context.globalAlpha = 0.14;
      context.strokeStyle = "#B0CEE2";
      context.lineWidth = 1;
      for (let i = 0; i < particles.length; i += 3) {
        const first = particles[i];
        const second = particles[(i + 11) % particles.length];
        if (Math.hypot(first.x - second.x, first.y - second.y) < 86) {
          context.beginPath();
          context.moveTo(first.x, first.y);
          context.lineTo(second.x, second.y);
          context.stroke();
        }
      }
      context.globalAlpha = 1;
      frame = window.requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", movePointer);
    canvas.addEventListener("pointerleave", leave);
    frame = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", movePointer);
      canvas.removeEventListener("pointerleave", leave);
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-auto absolute inset-0 h-full w-full opacity-90" />;
}

function VibeCodingSection() {
  return (
    <section id="vibe-coding" className="relative overflow-hidden bg-[#101c24] py-20 text-white md:py-28">
      <ParticleField />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(69,88,108,0.2),transparent_52%)]" />
      <div className="container-x relative z-10">
        <div className="grid gap-14 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <Reveal>
              <Eyebrow className="mb-5">{VIBE_CODING.eyebrow}</Eyebrow>
            </Reveal>
            <Reveal delay={60}>
              <h2 className="text-[clamp(1.95rem,5vw,3.05rem)] font-semibold leading-[1.02]">
                {VIBE_CODING.title}
                <br />
                <span className="text-white/40">{VIBE_CODING.titleLine2}</span>
              </h2>
            </Reveal>
            <Reveal delay={120}>
              <p className="mt-6 max-w-md text-[15.5px] leading-relaxed text-white/60">{VIBE_CODING.intro}</p>
            </Reveal>
            <Reveal delay={180} className="mt-9">
              <div className="overflow-hidden rounded-lg border border-white/20 bg-white/[0.06] shadow-[0_24px_80px_-40px_rgba(176,206,226,0.5)] backdrop-blur-md">
                <MediaSlot slot={VIBE_CODING.mediaSlot} rounded="rounded-none" />
              </div>
              <p className="label-mono mt-3 text-white/35">
                Emplacement VIBE_CODING_MEDIA — image ou vidéo remplaçable
              </p>
            </Reveal>
          </div>

          <div className="lg:col-span-7">
            <ol className="grid gap-px overflow-hidden rounded-lg border border-white/20 bg-white/[0.12] shadow-[0_24px_80px_-40px_rgba(176,206,226,0.45)] backdrop-blur-xl sm:grid-cols-2">
              {VIBE_CODING.steps.map((step, i) => (
                <Reveal as="li" key={step.n} delay={i * 70} className="bg-[#1a2730]/65 backdrop-blur-md">
                  <div className="group h-full p-6 transition-colors duration-300 hover:bg-white/[0.09] md:p-8">
                    <span className="label-mono text-brand">{step.n}</span>
                    <h3 className="mt-5 text-[20px] font-semibold leading-tight text-white">{step.title}</h3>
                    <p className="mt-3 text-[14.5px] leading-relaxed text-white/55">{step.text}</p>
                  </div>
                </Reveal>
              ))}
            </ol>
            <Reveal delay={280}>
              <div className="mt-8 flex flex-col gap-4 rounded-lg border border-white/20 bg-white/[0.08] p-6 shadow-[0_20px_70px_-40px_rgba(176,206,226,0.55)] backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between md:p-7">
                <p className="max-w-sm text-[15px] leading-relaxed text-white/70">
                  Tu ne sais pas coder ? C'est exactement pour ça que le club existe.
                </p>
                <Button variant="secondary" size="sm" iconRight="arrowRight" onClick={() => navigate("/join")}>
                  Rejoindre le club
                </Button>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   POURQUOI REJOINDRE
================================================================== */

function WhyJoinSection() {
  return (
    <section id="le-club" className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading eyebrow={WHY_JOIN.eyebrow} title={WHY_JOIN.title} />
          </Reveal>
          <Reveal delay={90}>
            <p className="max-w-xs text-[14.5px] leading-relaxed text-muted">
              Quatre verbes. C'est ce que le club te propose de faire, dès ta première session.
            </p>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {WHY_JOIN.cards.map((card, i) => (
            <Reveal key={card.key} delay={i * 70}>
              <WhyCard title={card.title} text={card.text} icon={card.icon as "book"} index={i} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   COMMUNAUTÉ — grande composition visuelle
================================================================== */

function CommunitySection() {
  return (
    <section id="communaute" className="border-y border-line bg-surface py-20 md:py-28">
      <div className="container-x">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-end">
          <Reveal className="lg:col-span-7">
            <SectionHeading eyebrow={COMMUNITY.eyebrow} title={COMMUNITY.title} text={COMMUNITY.intro} />
          </Reveal>
          <Reveal delay={90} className="lg:col-span-5 lg:pb-2">
            <Note>{COMMUNITY.emptyNote}</Note>
          </Reveal>
        </div>

        {/* collage */}
        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12">
          <RevealMask className="lg:col-span-8">
            <div className="group overflow-hidden rounded-lg border border-line">
              <MediaSlot slot={COMMUNITY.mediaMain} rounded="rounded-none" zoomOnHover />
            </div>
          </RevealMask>
          <RevealMask delay={120} className="lg:col-span-4">
            <div className="group h-full overflow-hidden rounded-lg border border-line">
              <MediaSlot slot={COMMUNITY.mediaPortrait} ratio="3/4" rounded="rounded-none" zoomOnHover />
            </div>
          </RevealMask>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <Reveal className="lg:col-span-5">
            <div className="group overflow-hidden rounded-lg border border-line">
              <MediaSlot slot={COMMUNITY.mediaSecondary} rounded="rounded-none" zoomOnHover />
            </div>
          </Reveal>
          <Reveal delay={90} className="lg:col-span-7">
            <Card className="h-full p-6 md:p-8">
              <h3 className="text-[20px] font-semibold leading-tight text-ink">Ce qui se passe concrètement</h3>
              <ul className="mt-6 space-y-4">
                {COMMUNITY.pillars.map((p) => (
                  <li key={p} className="flex items-start gap-3.5 border-b border-line-2 pb-4 last:border-0 last:pb-0">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand-ink">
                      <Icon name="check" className="h-3.5 w-3.5" />
                    </span>
                    <span className="text-[15px] leading-relaxed text-muted">{p}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   PROJETS
================================================================== */

function ProjectsSection() {
  return (
    <section id="projets" className="py-20 md:py-28">
      <div className="container-x">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading eyebrow={PROJECTS_SECTION.eyebrow} title={PROJECTS_SECTION.title} text={PROJECTS_SECTION.intro} />
          </Reveal>
          <Reveal delay={80}>
            <Button variant="secondary" iconRight="arrowRight" onClick={() => navigate("/app/projets")}>
              Voir le mur des créations
            </Button>
          </Reveal>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
          {PROJECTS_SECTION.items.map((item, i) => (
            <Reveal key={item.slot} delay={i * 70}>
              <ProjectCard
                title={item.title}
                description={item.text}
                tech={item.tech}
                slot={item.slot}
                onClick={() => navigate("/app/projets")}
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   DÉFIS
================================================================== */

function ChallengesSection() {
  return (
    <section id="defis" className="border-y border-line bg-surface py-20 md:py-28">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <Reveal>
            <SectionHeading eyebrow={CHALLENGES_SECTION.eyebrow} title={CHALLENGES_SECTION.title} text={CHALLENGES_SECTION.intro} />
          </Reveal>
          <Reveal delay={90} className="mt-9">
            <div className="group overflow-hidden rounded-lg border border-line">
              <MediaSlot slot={CHALLENGES_SECTION.mediaSlot} rounded="rounded-none" zoomOnHover />
            </div>
          </Reveal>
          <Reveal delay={140}>
            <p className="label-mono mt-3 text-faint">Emplacement CHALLENGE_MEDIA</p>
          </Reveal>
        </div>

        <div className="grid gap-4 self-start lg:col-span-7">
          {CHALLENGES_SECTION.programme.map((c, i) => (
            <Reveal key={c.code} delay={i * 90}>
              <ChallengeCard
                challenge={{
                  id: c.code,
                  code: c.code,
                  title: c.title,
                  description: c.text,
                  difficulty: c.difficulty,
                  duration: c.duration,
                  tech: c.tech,
                  participants: [],
                  status: c.status,
                  createdAt: "",
                }}
                participating={false}
                compact
              />
            </Reveal>
          ))}
          <Reveal delay={180}>
            <Card className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="max-w-sm text-[14.5px] leading-relaxed text-muted">
                Les défis sont ouverts par l'équipe du club. Le nombre de participants affiché dans ton espace est
                toujours le nombre réel.
              </p>
              <Button size="sm" variant="secondary" iconRight="arrowRight" onClick={() => navigate("/app/defis")}>
                Tous les défis
              </Button>
            </Card>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* ==================================================================
   SESSIONS
================================================================== */

function SessionsSection() {
  return (
    <section id="sessions" className="py-20 md:py-28">
      <div className="container-x">
        <Reveal>
          <SectionHeading eyebrow={SESSIONS_SECTION.eyebrow} title={SESSIONS_SECTION.title} text={SESSIONS_SECTION.intro} />
        </Reveal>

        <div className="mt-12 grid gap-4 lg:mt-16 lg:grid-cols-12">
          <Reveal className="lg:col-span-7">
            <Card className="h-full p-6 md:p-9">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <span className="label-mono text-violet">{SESSIONS_SECTION.format.name}</span>
                <Badge tone="outline">{SESSIONS_SECTION.format.when}</Badge>
              </div>
              <h3 className="mt-5 text-[clamp(1.5rem,3.4vw,2.1rem)] font-semibold leading-tight text-ink">
                {SESSIONS_SECTION.format.what}
              </h3>
              <dl className="mt-8 grid gap-6 sm:grid-cols-2">
                <div>
                  <dt className="label-mono text-faint">Quand</dt>
                  <dd className="mt-2 text-[15px] text-ink">{SESSIONS_SECTION.format.when}</dd>
                </div>
                <div>
                  <dt className="label-mono text-faint">Durée</dt>
                  <dd className="mt-2 text-[15px] text-ink">{SESSIONS_SECTION.format.time}</dd>
                </div>
              </dl>
              <ul className="mt-8 space-y-3 border-t border-line-2 pt-6">
                {SESSIONS_SECTION.format.details.map((d) => (
                  <li key={d} className="flex items-start gap-3 text-[14.5px] leading-relaxed text-muted">
                    <Icon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                    {d}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button iconRight="arrowRight" onClick={() => navigate("/app/sessions")}>
                  Voir les sessions
                </Button>
                <Button variant="secondary" onClick={() => navigate("/app/idees")}>
                  Proposer un sujet
                </Button>
              </div>
            </Card>
          </Reveal>

          <Reveal delay={100} className="lg:col-span-5">
            <div className="group h-full overflow-hidden rounded-lg border border-line">
              <MediaSlot slot={SESSIONS_SECTION.mediaSlot} ratio="3/4" rounded="rounded-none" zoomOnHover />
            </div>
          </Reveal>
        </div>

        <Reveal delay={60} className="mt-4">
          <Note>{SESSIONS_SECTION.empty}</Note>
        </Reveal>
      </div>
    </section>
  );
}

/* ==================================================================
   CTA FINAL
================================================================== */

function CtaSection() {
  return (
    <section className="pb-20 md:pb-28">
      <div className="container-x">
        <Reveal>
          <div className="paper-grain relative overflow-hidden rounded-lg border border-ink/12 bg-surface px-6 py-16 text-center md:px-16 md:py-24">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-brand-soft/70 blur-2xl"
            />
            <div className="relative">
              <Eyebrow className="mb-6 justify-center">Prêt·e ?</Eyebrow>
              <h2 className="mx-auto max-w-3xl text-[clamp(1.9rem,5.4vw,3.4rem)] font-semibold leading-[1.02] text-ink">
                {CTA.title}
              </h2>
              <p className="mx-auto mt-6 max-w-xl text-[16px] leading-relaxed text-muted">{CTA.text}</p>
              <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Button size="lg" iconRight="arrowRight" onClick={() => navigate("/join")}>
                  {CTA.primary}
                </Button>
                <Button size="lg" variant="secondary" onClick={() => navigate(CTA.secondaryHref)}>
                  {CTA.secondary}
                </Button>
              </div>
              <p className="label-mono mt-7 text-faint">{CTA.note}</p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ==================================================================
   PAGE
================================================================== */

export default function Landing() {
  return (
    <div className="min-h-screen bg-paper">
      <main>
        <Hero />
        <VibeCodingSection />
        <WhyJoinSection />
        <CommunitySection />
        <ProjectsSection />
        <ChallengesSection />
        <SessionsSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  );
}
