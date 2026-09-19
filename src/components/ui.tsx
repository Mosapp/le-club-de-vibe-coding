import {
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { cn } from "@/utils/cn";

/* ==================================================================
   ICONES — un seul jeu, trait fin, aucune icône « gaming »
================================================================== */

export type IconName =
  | "arrowRight"
  | "arrowUpRight"
  | "book"
  | "spark"
  | "share"
  | "trend"
  | "check"
  | "plus"
  | "close"
  | "menu"
  | "chevronDown"
  | "search"
  | "play"
  | "user"
  | "code"
  | "calendar"
  | "idea"
  | "shield"
  | "image"
  | "video"
  | "trash"
  | "edit"
  | "logout"
  | "users"
  | "clock"
  | "target"
  | "layers"
  | "download"
  | "reset";

const PATHS: Record<IconName, ReactNode> = {
  arrowRight: <path d="M4 12h16m-6-6 6 6-6 6" />,
  arrowUpRight: <path d="M7 17 17 7m0 0h-8m8 0v8" />,
  book: <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5zM19 18v3H6.5" />,
  spark: <path d="M12 3.5l1.9 5 5.1 1.9-5.1 1.9-1.9 5-1.9-5L5 10.4l5.1-1.9zM19 3v3M20.5 4.5h-3" />,
  share: <path d="M12 15V3m0 0L8 7m4-4 4 4M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4" />,
  trend: <path d="M4 17l5-5 3 3 7-7m0 0h-5m5 0v5" />,
  check: <path d="M5 13l4 4L19 7" />,
  plus: <path d="M12 5v14M5 12h14" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  search: <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Zm5.5-1.5L21 21" />,
  play: <path d="M8 5.5v13l11-6.5z" />,
  user: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-8 8a8 8 0 0 1 16 0" />,
  code: <path d="m9 8-5 4 5 4m6-8 5 4-5 4M13.5 4l-3 16" />,
  calendar: <path d="M4 8h16M8 4v3m8-3v3M5 8a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V9a1 1 0 0 0-1-1" />,
  idea: <path d="M9 18h6m-5 3h4M12 3a6 6 0 0 1 3.6 10.8c-.4.3-.6.7-.6 1.2H9c0-.5-.2-.9-.6-1.2A6 6 0 0 1 12 3Z" />,
  shield: <path d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6zM9.5 12l1.8 1.8 3.4-3.6" />,
  image: <path d="M4 6a1 1 0 0 1 1-1h14a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1zm0 10 4.5-4.5 3 3L15 12l5 5m-4.5-9.5h.01" />,
  video: <path d="M4 7h10a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1Zm11 4 6-3v8l-6-3z" />,
  trash: <path d="M5 7h14M10 7V5h4v2m-7 0 1 12h8l1-12" />,
  edit: <path d="M4 20h4L20 8l-4-4L4 16zM14 6l4 4" />,
  logout: <path d="M9 5H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h3m4-12 5 7-5 7m5-7H9" />,
  users: <path d="M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7.5.5a3 3 0 1 0 0-6M3 20a6 6 0 0 1 12 0m1-4.5c2.6.5 5 2.2 5 4.5" />,
  clock: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-13v5l3.5 2" />,
  target: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0-3.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" />,
  layers: <path d="m12 4 8 4-8 4-8-4zm8 8-8 4-8-4m16 4-8 4-8-4" />,
  download: <path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" />,
  reset: <path d="M4 12a8 8 0 1 0 2.6-5.9M4 4v4h4" />,
};

export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("h-5 w-5", className)}
    >
      {PATHS[name]}
    </svg>
  );
}

/* ==================================================================
   BOUTONS
================================================================== */

type ButtonVariant = "primary" | "secondary" | "dark" | "ghost" | "link" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: "sm" | "md" | "lg";
  icon?: IconName;
  iconRight?: IconName;
  loading?: boolean;
  full?: boolean;
}

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-brand text-white border border-brand hover:bg-[#12568f] hover:border-[#12568f] shadow-[0_1px_2px_rgba(23,23,23,0.06)] hover:shadow-[0_8px_20px_-8px_rgba(23,105,170,0.42)]",
  secondary: "bg-surface text-ink border border-line hover:border-ink/25 hover:bg-white",
  dark: "bg-ink text-white border border-ink hover:bg-ink-2",
  ghost: "bg-transparent text-ink border border-transparent hover:bg-ink/5",
  link: "bg-transparent text-brand-ink border-transparent hover:text-brand underline-offset-4 hover:underline px-0",
  danger: "bg-surface text-ink border border-line hover:border-red-300 hover:text-red-600",
};

const SIZES = {
  sm: "h-9 px-3.5 text-[13px] gap-1.5",
  md: "h-11 px-5 text-[14px] gap-2",
  lg: "h-13 px-6 text-[15px] gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  icon,
  iconRight,
  loading,
  full,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        "group inline-flex items-center justify-center rounded-xl font-medium tracking-[-0.01em]",
        "transition-all duration-200 ease-out will-change-transform",
        "hover:-translate-y-0.5 active:translate-y-0 active:duration-75",
        "disabled:pointer-events-none disabled:opacity-45",
        VARIANTS[variant],
        SIZES[size],
        full && "w-full",
        className,
      )}
    >
      {loading ? (
        <span className="h-4 w-4 shrink-0 rounded-full border-[1.5px] border-current border-t-transparent spin" />
      ) : (
        icon && <Icon name={icon} className="h-[1.05em] w-[1.05em]" />
      )}
      <span className={cn(variant === "primary" && "relative top-px")}>{children}</span>
      {iconRight && !loading && (
        <Icon
          name={iconRight}
          className="h-[1.05em] w-[1.05em] transition-transform duration-200 group-hover:translate-x-0.5"
        />
      )}
    </button>
  );
}

/* ==================================================================
   BADGES / CHIPS
================================================================== */

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: "neutral" | "brand" | "violet" | "moss" | "deep" | "outline";
  className?: string;
}) {
  const tones = {
    neutral: "bg-ink/5 text-muted",
    brand: "bg-brand-soft text-brand-ink",
    violet: "bg-violet-soft text-violet",
    moss: "bg-[#eaf2ec] text-moss",
    deep: "bg-[#e8eff4] text-deep",
    outline: "border border-line text-muted bg-surface",
  } as const;
  return (
    <span className={cn("label-mono inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5", tones[tone], className)}>
      {children}
    </span>
  );
}

export function Chip({
  active,
  children,
  onClick,
  className,
}: {
  active?: boolean;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200",
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-surface text-muted hover:border-ink/25 hover:text-ink",
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ==================================================================
   CARTES & TITRES DE SECTION
================================================================== */

export function Card({
  children,
  className,
  hover = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  as?: "div" | "article" | "li" | "section";
}) {
  return (
    <Tag
      className={cn(
        "rounded-card border border-line bg-surface",
        hover && "transition-all duration-300 ease-out hover:-translate-y-1 hover:border-ink/15 hover:shadow-[0_18px_40px_-24px_rgba(23,23,23,0.25)]",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="h-px w-6 bg-brand" />
      <span className="label-mono text-muted">{children}</span>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  title2,
  text,
  align = "left",
  dark = false,
  className,
}: {
  eyebrow?: string;
  title: string;
  title2?: string;
  text?: string;
  align?: "left" | "center";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && <Eyebrow className={cn("mb-5", align === "center" && "justify-center")}>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          "text-[clamp(1.9rem,5.2vw,3.1rem)] font-semibold leading-[1.02]",
          dark ? "text-white" : "text-ink",
        )}
      >
        {title}
        {title2 && (
          <>
            <br />
            <span className={dark ? "text-white/45" : "text-faint"}>{title2}</span>
          </>
        )}
      </h2>
      {text && (
        <p className={cn("mt-5 text-[15px] leading-relaxed md:text-base", dark ? "text-white/60" : "text-muted")}>
          {text}
        </p>
      )}
    </div>
  );
}

/* ==================================================================
   FORMULAIRES
================================================================== */

interface FieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

export function Field({ label, error, hint, required, children }: FieldProps) {
  return (
    <label className="block">
      <span className="label-mono mb-2.5 block text-muted">
        {label}
        {required && <span className="ml-1 text-brand">*</span>}
      </span>
      {children}
      {hint && !error && <span className="mt-2 block text-[13px] text-faint">{hint}</span>}
      {error && (
        <span className="anim-fade mt-2 flex items-center gap-1.5 text-[13px] text-red-600">
          <span className="inline-block h-1 w-1 rounded-full bg-red-500" />
          {error}
        </span>
      )}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl border bg-surface px-4 text-[15px] text-ink placeholder:text-faint transition-colors duration-200 focus:outline-none";

export function Input({ invalid, className, ...rest }: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...rest}
      className={cn(
        inputBase,
        "h-12",
        invalid ? "border-red-300 focus:border-red-400" : "border-line focus:border-ink/40",
        className,
      )}
    />
  );
}

export function Textarea({
  invalid,
  className,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...rest}
      className={cn(
        inputBase,
        "min-h-28 resize-y py-3 leading-relaxed",
        invalid ? "border-red-300 focus:border-red-400" : "border-line focus:border-ink/40",
        className,
      )}
    />
  );
}

export function Select({
  className,
  invalid,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <div className="relative">
      <select
        {...rest}
        className={cn(
          inputBase,
          "h-12 appearance-none pr-10",
          invalid ? "border-red-300" : "border-line focus:border-ink/40",
          className,
        )}
      >
        {children}
      </select>
      <Icon name="chevronDown" className="pointer-events-none absolute right-3.5 top-3.5 h-5 w-5 text-faint" />
    </div>
  );
}

/* ==================================================================
   PROGRESSION / ÉTATS
================================================================== */

export function ProgressBar({ value, tone = "brand", className }: { value: number; tone?: "brand" | "violet" | "ink"; className?: string }) {
  const tones = { brand: "bg-brand", violet: "bg-violet", ink: "bg-ink" } as const;
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-ink/8", className)}>
      <div
        className={cn("anim-bar h-full rounded-full transition-[width] duration-700 ease-out", tones[tone])}
        style={{ width: `${Math.max(2, Math.min(100, value))}%` }}
      />
    </div>
  );
}

export function Loader({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-14 text-muted">
      <span className="h-4 w-4 rounded-full border-[1.5px] border-current border-t-transparent spin" />
      <span className="text-[14px]">{label ?? "Chargement…"}</span>
    </div>
  );
}

export function EmptyState({
  icon = "layers",
  title,
  text,
  action,
  className,
}: {
  icon?: IconName;
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("rounded-card border border-dashed border-line bg-surface-2 px-6 py-14 text-center", className)}>
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-xl border border-line bg-surface text-muted">
        <Icon name={icon} />
      </div>
      <h3 className="text-[17px] font-semibold text-ink">{title}</h3>
      {text && <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">{text}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function Stat({
  label,
  value,
  hint,
  tone = "ink",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: "ink" | "brand" | "violet" | "moss";
}) {
  const tones = { ink: "text-ink", brand: "text-brand-ink", violet: "text-violet", moss: "text-moss" } as const;
  return (
    <div className="rounded-card border border-line bg-surface p-5">
      <div className="label-mono text-faint">{label}</div>
      <div className={cn("mt-3 text-[28px] font-semibold leading-none tracking-tight", tones[tone])}>{value}</div>
      {hint && <div className="mt-2 text-[13px] text-muted">{hint}</div>}
    </div>
  );
}

/* ==================================================================
   MODAL
================================================================== */

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="anim-fade absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={cn(
          "anim-pop relative w-full overflow-hidden rounded-t-2xl border border-line bg-surface shadow-[0_30px_80px_-30px_rgba(23,23,23,0.4)] outline-none sm:rounded-2xl",
          widths[size],
        )}
      >
        <div className="flex items-start justify-between gap-6 border-b border-line-2 px-6 py-5">
          <div>
            <h3 className="text-[19px] font-semibold text-ink">{title}</h3>
            {description && <p className="mt-1.5 text-[14px] leading-relaxed text-muted">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="rounded-lg p-1.5 text-faint transition-colors hover:bg-ink/5 hover:text-ink"
          >
            <Icon name="close" />
          </button>
        </div>
        <div className="max-h-[65vh] overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-3 border-t border-line-2 px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

/* ==================================================================
   TOASTS
================================================================== */

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: { id: string; title: string; description?: string; tone: string }[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[90] flex flex-col items-center gap-2.5 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:items-end"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          className="anim-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border border-line bg-surface px-4 py-3.5 shadow-[0_18px_40px_-20px_rgba(23,23,23,0.35)]"
        >
          <span
            className={cn(
              "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white",
              t.tone === "success" ? "bg-moss" : t.tone === "error" ? "bg-red-500" : "bg-ink",
            )}
          >
            <Icon name="check" className={cn("h-3.5 w-3.5", t.tone !== "success" && "opacity-0")} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium leading-snug text-ink">{t.title}</p>
            {t.description && <p className="mt-0.5 text-[13px] leading-snug text-muted">{t.description}</p>}
          </div>
          <button
            type="button"
            onClick={() => onDismiss(t.id)}
            aria-label="Fermer la notification"
            className="rounded-md p-1 text-faint transition-colors hover:text-ink"
          >
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

/* ==================================================================
   BLOC « ASTUCE / NOTE »
================================================================== */

export function Note({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "brand" }) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3.5 text-[13.5px] leading-relaxed",
        tone === "brand" ? "border-brand/25 bg-brand-soft/60 text-brand-ink" : "border-line bg-surface-2 text-muted",
      )}
    >
      {children}
    </div>
  );
}
