import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Package,
  MessageSquareQuote,
  Users,
  Eye,
  TrendingUp,
  MousePointerClick,
  Smartphone,
  Sparkles,
  Trophy,
  Info,
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
const PIE_COLORS = [CHART.c1, CHART.c3, CHART.c2, CHART.c4, CHART.c5];

function fmt(n: number) {
  return new Intl.NumberFormat("pt-BR").format(n);
}
function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
}

function Dashboard() {
  const [period, setPeriod] = useState<DashboardPeriod>("30d");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard", period],
    queryFn: () => fetchDashboard(period),
  });

  const kpis = data?.kpis;
  const cards = [
    { label: "Visitantes únicos", value: kpis?.visitors ?? 0, icon: Users, to: undefined },
    { label: "Visualizações de página", value: kpis?.pageViews ?? 0, icon: Eye, to: undefined },
    { label: "Views de produtos", value: kpis?.productViews ?? 0, icon: Package, to: "/admin/produtos" },
    { label: "Cliques no WhatsApp", value: kpis?.whatsapp ?? 0, icon: MousePointerClick, to: undefined },
    { label: "Orçamentos", value: kpis?.quotes ?? 0, icon: MessageSquareQuote, to: "/admin/orcamentos" },
    { label: "Taxa de conversão", value: `${kpis?.conversion ?? 0}%`, icon: TrendingUp, to: undefined },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Desempenho da NL Foto e Vídeo — {PERIOD_LABELS[period].toLowerCase()}.
          </p>
        </div>
        <div className="flex rounded-lg border border-border bg-card p-1">
          {(["7d", "30d", "90d"] as DashboardPeriod[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "7d" ? "7 dias" : p === "30d" ? "30 dias" : "90 dias"}
            </button>
          ))}
        </div>
      </div>

      {data?.isSample && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-semibold text-foreground">Dados de exemplo (preview)</p>
            <p className="text-muted-foreground">
              Ainda não há acessos registrados. Os números abaixo são apenas demonstrativos.
              Assim que o site começar a receber visitas, suas métricas reais aparecerão aqui automaticamente.
            </p>
          </div>
        </div>
      )}

      {/* KPI cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const inner = (
            <>
              <div className="flex items-center justify-between">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="mt-3 text-2xl font-bold">
                {isLoading ? "—" : typeof c.value === "number" ? fmt(c.value) : c.value}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{c.label}</p>
            </>
          );
          return c.to ? (
            <Link key={c.label} to={c.to} className="hover-lift rounded-xl border border-border bg-card p-4">
              {inner}
            </Link>
          ) : (
            <div key={c.label} className="rounded-xl border border-border bg-card p-4">
              {inner}
            </div>
          );
        })}
      </div>

      {/* Trend + funnel */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Acessos e orçamentos</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.trend ?? []} margin={{ left: -20, right: 8, top: 4 }}>
                <defs>
                  <linearGradient id="gViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.c1} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={CHART.c1} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gQuotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={CHART.c2} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={CHART.c2} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" minTickGap={24} />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip
                  labelFormatter={shortDate}
                  contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }}
                />
                <Area type="monotone" dataKey="views" name="Acessos" stroke={CHART.c1} fill="url(#gViews)" strokeWidth={2} />
                <Area type="monotone" dataKey="quotes" name="Orçamentos" stroke={CHART.c2} fill="url(#gQuotes)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-4 font-semibold">Funil de conversão</h2>
          <div className="space-y-3">
            {(data?.funnel ?? []).map((step, i) => {
              const max = data?.funnel?.[0]?.value || 1;
              const pct = Math.round((step.value / max) * 100);
              return (
                <div key={step.label}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{step.label}</span>
                    <span className="font-semibold">{fmt(step.value)}</span>
                  </div>
                  <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full transition-all"
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
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <RankCard title="Produtos mais acessados" icon={Eye} items={data?.topViewed ?? []} unit="views" />
        <RankCard title="Produtos mais pedidos" icon={Trophy} items={data?.topRequested ?? []} unit="pedidos" />
      </div>

      {/* Brand performance + devices/sources */}
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2">
          <h2 className="mb-4 font-semibold">Desempenho por marca</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data?.brands ?? []} margin={{ left: -20, right: 8, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="views" name="Acessos" fill={CHART.c1} radius={[4, 4, 0, 0]} />
                <Bar dataKey="quotes" name="Orçamentos" fill={CHART.c2} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="mb-2 flex items-center gap-2 font-semibold">
            <Smartphone className="h-4 w-4 text-primary" /> Dispositivos
          </h2>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data?.devices ?? []}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={42}
                  outerRadius={64}
                  paddingAngle={2}
                >
                  {(data?.devices ?? []).map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid var(--border)", background: "var(--card)", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <h3 className="mb-2 mt-2 text-sm font-semibold text-muted-foreground">Origem do tráfego</h3>
          <ul className="space-y-1.5">
            {(data?.sources ?? []).map((s, i) => (
              <li key={s.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {s.name}
                </span>
                <span className="font-medium">{fmt(s.value)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recent leads */}
      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-4 w-4 text-primary" /> Leads recentes
          </h2>
          <Link to="/admin/leads" className="text-sm text-primary hover:underline">
            Ver todos
          </Link>
        </div>
        {(data?.recentLeads ?? []).length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Nenhum lead ainda.</p>
        ) : (
          <ul className="divide-y divide-border">
            {(data?.recentLeads ?? []).map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{l.name}</p>
                  <p className="truncate text-sm text-muted-foreground">
                    {l.phone || l.email || "—"}
                    {l.source ? ` · ${l.source}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                    {l.status}
                  </span>
                  <span className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(l.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function RankCard({
  title,
  icon: Icon,
  items,
  unit,
}: {
  title: string;
  icon: typeof Eye;
  items: RankItem[];
  unit: string;
}) {
  const max = items[0]?.value || 1;
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2 font-semibold">
        <Icon className="h-4 w-4 text-primary" /> {title}
      </h2>
      {items.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Sem dados ainda.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={it.id} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-sm font-bold text-muted-foreground">
                {i + 1}
              </span>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-muted">
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
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round((it.value / max) * 100)}%` }}
                  />
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold">
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
