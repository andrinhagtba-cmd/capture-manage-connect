import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/* ----------------------------------------------------------------- Page Hero */

export type HeroMetric = {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "info";
};

export type Crumb = { label: string; to?: string };

const METRIC_TONE: Record<NonNullable<HeroMetric["tone"]>, string> = {
  default: "text-white",
  primary: "text-[#ff6b6e]",
  success: "text-emerald-300",
  warning: "text-amber-300",
  info: "text-sky-300",
};

function fmtValue(v: string | number) {
  return typeof v === "number" ? new Intl.NumberFormat("pt-BR").format(v) : v;
}

export function AdminPageHero({
  eyebrow,
  title,
  subtitle,
  icon: Icon,
  breadcrumb,
  actions,
  metrics,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  breadcrumb?: Crumb[];
  actions?: ReactNode;
  metrics?: HeroMetric[];
}) {
  return (
    <div className="animate-fade-up relative overflow-hidden rounded-[24px] bg-[#0B0B0F] p-6 text-white shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] md:p-8">
      {/* glows */}
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
          backgroundSize: "44px 44px",
        }}
      />

      <div className="relative">
        {breadcrumb && breadcrumb.length > 0 && (
          <nav className="mb-4 flex flex-wrap items-center gap-1 text-xs text-white/50">
            {breadcrumb.map((c, i) => (
              <span key={i} className="flex items-center gap-1">
                {c.to ? (
                  <Link to={c.to} className="transition-colors hover:text-white">
                    {c.label}
                  </Link>
                ) : (
                  <span className="text-white/80">{c.label}</span>
                )}
                {i < breadcrumb.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </nav>
        )}

        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-start gap-4">
            {Icon && (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[#7a0f12] shadow-lg shadow-primary/30">
                <Icon className="h-7 w-7" />
              </span>
            )}
            <div>
              {eyebrow && (
                <p className="eyebrow text-primary/90">{eyebrow}</p>
              )}
              <h1 className="display-lg mt-1 text-2xl md:text-3xl">{title}</h1>
              {subtitle && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/60">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {actions && (
            <div className="flex flex-wrap items-center gap-2">{actions}</div>
          )}
        </div>

        {metrics && metrics.length > 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {metrics.map((m) => (
              <div
                key={m.label}
                className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
              >
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-medium uppercase tracking-wide text-white/45">
                    {m.label}
                  </p>
                  {m.icon && <m.icon className="h-4 w-4 text-white/35" />}
                </div>
                <p
                  className={cn(
                    "mt-1 text-2xl font-bold tracking-tight",
                    METRIC_TONE[m.tone ?? "default"],
                  )}
                >
                  {fmtValue(m.value)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- Metric Card */

const CARD_TONE: Record<string, string> = {
  default: "text-foreground",
  primary: "text-primary",
  success: "text-emerald-600",
  warning: "text-amber-600",
  info: "text-sky-600",
};
const CARD_TONE_BG: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  primary: "bg-primary/10 text-primary",
  success: "bg-emerald-500/10 text-emerald-600",
  warning: "bg-amber-500/10 text-amber-600",
  info: "bg-sky-500/10 text-sky-600",
};

export function MetricCard({
  label,
  value,
  icon: Icon,
  tone = "default",
  hint,
  to,
}: {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  tone?: "default" | "primary" | "success" | "warning" | "info";
  hint?: string;
  to?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl",
              CARD_TONE_BG[tone],
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </span>
        )}
      </div>
      <p className={cn("mt-3 text-2xl font-bold tracking-tight", CARD_TONE[tone])}>
        {fmtValue(value)}
      </p>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
    </>
  );

  const className =
    "rounded-[20px] border border-border/70 bg-card p-5 shadow-sm transition-all";

  return to ? (
    <Link to={to} className={cn(className, "hover-lift block")}>
      {inner}
    </Link>
  ) : (
    <div className={className}>{inner}</div>
  );
}

/* --------------------------------------------------------------- Premium Card */

export function PremiumCard({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-border/70 bg-card shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function FormSectionCard({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <PremiumCard className={cn("p-5 md:p-6", className)}>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          {Icon && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="h-[18px] w-[18px]" />
            </span>
          )}
          <div>
            <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
        {action}
      </div>
      {children}
    </PremiumCard>
  );
}

/* ---------------------------------------------------------------- Status Badge */

const STATUS_STYLE: Record<string, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-emerald-500/12 text-emerald-600 ring-emerald-500/20",
  warning: "bg-amber-500/12 text-amber-600 ring-amber-500/20",
  danger: "bg-primary/12 text-primary ring-primary/20",
  info: "bg-sky-500/12 text-sky-600 ring-sky-500/20",
  neutral: "bg-foreground/8 text-foreground ring-border",
};

export function StatusBadge({
  children,
  tone = "default",
  dot = true,
}: {
  children: ReactNode;
  tone?: "default" | "success" | "warning" | "danger" | "info" | "neutral";
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset",
        STATUS_STYLE[tone],
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}
      {children}
    </span>
  );
}

/* ----------------------------------------------------------------- Empty State */

export function EmptyStatePremium({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-[20px] border border-dashed border-border bg-card/50 px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </span>
      <h3 className="mt-4 text-base font-semibold tracking-tight">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
