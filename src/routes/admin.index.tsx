import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import {
  fetchDashboard,
  PERIOD_LABELS,
  type DashboardPeriod,
  type RankItem,
} from "@/lib/dashboard-data";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  RadialBarChart,
  RadialBar,
} from "recharts";
import {
  Package,
  MessageSquareQuote,
  Users,
  Eye,
  TrendingUp,
  TrendingDown,
  MousePointerClick,
  Smartphone,
  Sparkles,
  Trophy,
  Info,
  Activity,
  Tag,
  Layers,
  ArrowUpRight,
  Inbox,
  type LucideIcon,
} from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const CHART = {
  c1: "var(--chart-1)",
  c2: "var(--chart-2)",
  c3: "var(--chart-3)",
  c4: "var(--chart-4)",
  c5: "var(--chart-5)",
};
const PIE_COLORS = [CHART.c1, CHART.c2, CHART.c3, CHART.c4, CHART.c5];

const CARD = "rounded-2xl border border-border/70 bg-card shadow-sm";
const TOOLTIP_STYLE = {
  borderRadius: 14,
  border: "1px solid var(--border)",
  background: "var(--card)",
  boxShadow: "0 12px 32px -12px rgba(0,0,0,0.25)",
  fontSize: 12,
  padding: "8px 12px",
} as const;

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}
function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

/* ---------------------------------------------------------------- shared UI */

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
  action,
}: {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-[18px] w-[18px]" />
        </span>
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </span>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

/* ----------------------------------------------------------------- component */

function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard", period],
    queryFn: () => fetchDashboard(period),
  });

  const kpis = data?.kpis;
  const cards: {
    label: string;
    value: number | string;
    icon: LucideIcon;
    to?: string;
    accent: string;
  }[] = [
    { label: "Visitantes únicos", value: kpis?.visitors ?? 0, icon: Users, accent: CHART.c1 },
    { label: "Visualizações de página", value: kpis?.pageViews ?? 0, icon: Eye, accent: CHART.c3 },
    { label: "Views de produtos", value: kpis?.productViews ?? 0, icon: Package, to: "/admin/produtos", accent: CHART.c5 },
    { label: "Cliques no WhatsApp", value: kpis?.whatsapp ?? 0, icon: MousePointerClick, accent: CHART.c2 },
    { label: "Orçamentos", value: kpis?.quotes ?? 0, icon: MessageSquareQuote, to: "/admin/orcamentos", accent: CHART.c1 },
    { label: "Taxa de conversão", value: `${kpis?.conversion ?? 0}%`, icon: TrendingUp, accent: CHART.c3 },
  ];

  return (
    <div className="animate-fade-up space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-primary">Central executiva</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Desempenho da NL Foto e Vídeo · {PERIOD_LABELS[period].toLowerCase()}.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-xl border border-border bg-card p-1 shadow-sm">
          {(["7d", "30d", "90d"] as DashboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
                period === p
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {data?.isSample && (
        <div className="flex items-start gap-3 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Dados de exemplo (preview)</p>
            <p className="text-muted-foreground">
              Ainda não há acessos registrados. Os números abaixo são apenas demonstrativos. Assim
              que o site começar a receber visitas, suas métricas reais aparecerão aqui automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const inner = (
            <div className="relative overflow-hidden">
              <span
                className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-[0.07]"
                style={{ background: c.accent }}
              />
              <span
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `color-mix(in oklab, ${c.accent} 12%, transparent)`, color: c.accent }}
              >
                <c.icon className="h-5 w-5" />
              </span>
              {isLoading ? (
                <div className="mt-4 h-7 w-16 animate-pulse rounded-md bg-muted" />
              ) : (
                <p className="mt-4 text-2xl font-bold tracking-tight">
                  {typeof c.value === "number" ? fmt(c.value) : c.value}
                </p>
              )}
              <p className="mt-1 text-xs font-medium text-muted-foreground">{c.label}</p>
            </div>
          );
          return c.to ? (
            <Link
              key={c.label}
              to={c.to}
              className={`${CARD} hover-lift group p-5`}
            >
              {inner}
              <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                Ver detalhes <ArrowUpRight className="h-3 w-3" />
              </span>
            </Link>
          ) : (
            <div key={c.label} className={`${CARD} p-5`}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Trend + funnel */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${CARD} p-5 lg:col-span-2`}>
          <SectionHeading
            icon={Activity}
            title="Acessos e orçamentos"
            subtitle="Evolução diária do período"
            action={
              <div className="hidden items-center gap-4 sm:flex">
                <Legend color={CHART.c1} label="Acessos" />
                <Legend color={CHART.c2} label="Orçamentos" />
              </div>
            }
          />
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trend ?? []} margin={{ left: -18, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.c1} stopOpacity={0.32} />
                    <stop offset="100%" stopColor={CHART.c1} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gQuotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.c2} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={CHART.c2} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} minTickGap={28} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                <Tooltip labelFormatter={shortDate} contentStyle={TOOLTIP_STYLE} cursor={{ stroke: "var(--border)" }} />
                <Area type="monotone" dataKey="views" name="Acessos" stroke={CHART.c1} fill="url(#gViews)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
                <Area type="monotone" dataKey="quotes" name="Orçamentos" stroke={CHART.c2} fill="url(#gQuotes)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${CARD} p-5`}>
          <SectionHeading icon={Layers} title="Funil de conversão" subtitle="Da visita ao orçamento" />
          <div className="space-y-4">
            {(data?.funnel ?? []).map((step, i) => {
              const max = data?.funnel?.[0]?.value || 1;
              const pct = Math.round((step.value / max) * 100);
              const prev = i > 0 ? data?.funnel?.[i - 1]?.value ?? 0 : step.value;
              const drop = i > 0 && prev > 0 ? Math.round((step.value / prev) * 100) : 100;
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="flex items-center gap-2 font-semibold">
                      {fmt(step.value)}
                      {i > 0 && (
                        <span className="flex items-center gap-0.5 text-[11px] font-medium text-muted-foreground">
                          {drop >= 60 ? (
                            <TrendingUp className="h-3 w-3 text-primary" />
                          ) : (
                            <TrendingDown className="h-3 w-3" />
                          )}
                          {drop}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Top products */}
      <div className="grid gap-4 lg:grid-cols-2">
        <RankCard title="Produtos mais acessados" subtitle="Por visualizações" icon={Eye} items={data?.topViewed ?? []} unit="views" loading={isLoading} />
        <RankCard title="Produtos mais pedidos" subtitle="Por orçamentos" icon={Trophy} items={data?.topRequested ?? []} unit="pedidos" loading={isLoading} />
      </div>

      {/* Brands + Categories */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${CARD} p-5`}>
          <SectionHeading
            icon={Tag}
            title="Desempenho por marca"
            subtitle="Acessos x orçamentos"
            action={
              <div className="hidden items-center gap-4 sm:flex">
                <Legend color={CHART.c1} label="Acessos" />
                <Legend color={CHART.c2} label="Orçamentos" />
              </div>
            }
          />
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.brands ?? []} margin={{ left: -18, right: 8, top: 4 }} barGap={4}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                <Bar dataKey="views" name="Acessos" fill={CHART.c1} radius={[6, 6, 0, 0]} maxBarSize={26} />
                <Bar dataKey="quotes" name="Orçamentos" fill={CHART.c2} radius={[6, 6, 0, 0]} maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={`${CARD} p-5`}>
          <SectionHeading icon={Layers} title="Categorias em destaque" subtitle="Acessos por categoria" />
          {(data?.categories ?? []).length === 0 ? (
            <EmptyState icon={Layers} label="Sem dados de categorias ainda." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data?.categories ?? []}
                  layout="vertical"
                  margin={{ left: 8, right: 16, top: 4 }}
                >
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} width={88} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
                  <Bar dataKey="views" name="Acessos" radius={[0, 6, 6, 0]} maxBarSize={20}>
                    {(data?.categories ?? []).map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {/* Devices + Sources */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`${CARD} p-5`}>
          <SectionHeading icon={Smartphone} title="Dispositivos" subtitle="Distribuição de acessos" />
          <div className="flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart
                  innerRadius="40%"
                  outerRadius="100%"
                  data={(data?.devices ?? []).map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background dataKey="value" cornerRadius={8} />
                  <Tooltip contentStyle={TOOLTIP_STYLE} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2">
              {(data?.devices ?? []).map((d, i) => {
                const total = (data?.devices ?? []).reduce((s, x) => s + x.value, 0) || 1;
                return (
                  <li key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      {d.name}
                    </span>
                    <span className="font-semibold">
                      {Math.round((d.value / total) * 100)}%
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className={`${CARD} p-5`}>
          <SectionHeading icon={TrendingUp} title="Origem do tráfego" subtitle="Principais canais" />
          {(data?.sources ?? []).length === 0 ? (
            <EmptyState icon={Inbox} label="Sem origens registradas ainda." />
          ) : (
            <ul className="space-y-3">
              {(data?.sources ?? []).map((s, i) => {
                const max = data?.sources?.[0]?.value || 1;
                return (
                  <li key={s.name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-2 capitalize">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                        {s.name}
                      </span>
                      <span className="font-semibold">{fmt(s.value)}</span>
                    </div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${Math.round((s.value / max) * 100)}%`, background: PIE_COLORS[i % PIE_COLORS.length] }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* Recent leads */}
      <div className={`${CARD} overflow-hidden`}>
        <div className="flex items-center justify-between p-5 pb-4">
          <SectionHeading icon={Sparkles} title="Leads recentes" subtitle="Últimos contatos recebidos" />
          <Link
            to="/admin/leads"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Ver todos <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {(data?.recentLeads ?? []).length === 0 ? (
          <EmptyState icon={Users} label="Nenhum lead ainda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-y border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-5 py-2.5 font-semibold">Contato</th>
                  <th className="px-5 py-2.5 font-semibold">Origem</th>
                  <th className="px-5 py-2.5 font-semibold">Status</th>
                  <th className="px-5 py-2.5 text-right font-semibold">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(data?.recentLeads ?? []).map((l) => (
                  <tr key={l.id} className="transition-colors hover:bg-muted/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {l.name?.charAt(0)?.toUpperCase() || "?"}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-medium">{l.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {l.phone || l.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 capitalize text-muted-foreground">{l.source || "—"}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={l.status} />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-xs text-muted-foreground">
                      {new Date(l.created_at).toLocaleDateString("pt-BR")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ helpers */

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}

const STATUS_STYLES: Record<string, string> = {
  novo: "bg-primary/10 text-primary ring-primary/20",
  em_contato: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  contatado: "bg-amber-500/10 text-amber-600 ring-amber-500/20",
  qualificado: "bg-blue-500/10 text-blue-600 ring-blue-500/20",
  convertido: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  ganho: "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20",
  perdido: "bg-muted text-muted-foreground ring-border",
};

function StatusBadge({ status }: { status: string }) {
  const key = status?.toLowerCase().replace(/\s+/g, "_") ?? "";
  const cls = STATUS_STYLES[key] ?? "bg-muted text-muted-foreground ring-border";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ring-1 ring-inset ${cls}`}
    >
      {status?.replace(/_/g, " ") || "—"}
    </span>
  );
}

function RankCard({
  title,
  subtitle,
  icon,
  items,
  unit,
  loading,
}: {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  items: RankItem[];
  unit: string;
  loading?: boolean;
}) {
  const max = items[0]?.value || 1;
  const medal = ["bg-amber-400 text-amber-950", "bg-zinc-300 text-zinc-800", "bg-orange-400 text-orange-950"];
  return (
    <div className={`${CARD} p-5`}>
      <SectionHeading icon={icon} title={title} subtitle={subtitle} />
      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <li key={i} className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-muted" />
              <div className="h-3 flex-1 animate-pulse rounded bg-muted" />
            </li>
          ))}
        </ul>
      ) : items.length === 0 ? (
        <EmptyState icon={Package} label="Sem dados ainda." />
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i < 3 ? medal[i] : "bg-muted text-muted-foreground"
                }`}
              >
                {i + 1}
              </span>
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                {it.image ? (
                  <img src={it.image} alt={it.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{it.name}</p>
                {it.brand && <p className="truncate text-xs text-muted-foreground">{it.brand}</p>}
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-700"
                    style={{ width: `${Math.round((it.value / max) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-right text-sm font-semibold">
                {fmt(it.value)}
                <span className="ml-1 text-xs font-normal text-muted-foreground">{unit}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
