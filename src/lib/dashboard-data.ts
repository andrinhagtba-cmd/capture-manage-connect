// Dashboard analytics aggregation for the admin panel.
// Reads from `analytics_events`, `products`, `brands`, `quote_requests` and
// `leads`, then aggregates client-side for the period selected.
//
// NOTE: When there are no real analytics events yet, the dashboard falls back
// to SAMPLE/PREVIEW data (see `buildSampleDashboard`). This is clearly flagged
// via `data.isSample === true` so the UI can show a "dados de exemplo" banner.
// Replace with real metrics automatically once the site starts collecting events.

import { supabase } from "@/integrations/supabase/client";

export type DashboardPeriod = "7d" | "30d" | "90d";

export const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

export const PERIOD_LABELS: Record<DashboardPeriod, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  "90d": "Últimos 90 dias",
};

export type TimePoint = { date: string; views: number; quotes: number };
export type RankItem = {
  id: string;
  name: string;
  image: string | null;
  brand: string | null;
  value: number;
};
export type BrandPerf = { id: string; name: string; views: number; quotes: number };
export type CategoryPerf = { id: string; name: string; views: number; quotes: number };
export type FunnelStep = { label: string; value: number };
export type DeviceSlice = { name: string; value: number };
export type SourceSlice = { name: string; value: number };
export type LeadRow = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  source: string | null;
  status: string;
  created_at: string;
};

export type DashboardData = {
  isSample: boolean;
  kpis: {
    visitors: number;
    pageViews: number;
    productViews: number;
    quotes: number;
    leads: number;
    whatsapp: number;
    conversion: number; // %
  };
  trend: TimePoint[];
  topViewed: RankItem[];
  topRequested: RankItem[];
  brands: BrandPerf[];
  categories: CategoryPerf[];
  funnel: FunnelStep[];
  devices: DeviceSlice[];
  sources: SourceSlice[];
  recentLeads: LeadRow[];
};

type EventRow = {
  event_name: string;
  product_id: string | null;
  brand_id: string | null;
  visitor_id: string | null;
  device_type: string | null;
  source: string | null;
  created_at: string;
};

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

function emptyTrend(days: number): TimePoint[] {
  const out: TimePoint[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    out.push({ date: dayKey(d), views: 0, quotes: 0 });
  }
  return out;
}

export async function fetchDashboard(period: DashboardPeriod): Promise<DashboardData> {
  const days = PERIOD_DAYS[period];
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceIso = since.toISOString();

  const [eventsRes, productsRes, brandsRes, categoriesRes, quotesRes, leadsRes] = await Promise.all([
    supabase
      .from("analytics_events")
      .select("event_name, product_id, brand_id, visitor_id, device_type, source, created_at")
      .gte("created_at", sinceIso)
      .order("created_at", { ascending: false })
      .limit(5000),
    supabase.from("products").select("id, name, main_image_url, brand_id, category_id"),
    supabase.from("brands").select("id, name"),
    supabase.from("categories").select("id, name"),
    supabase
      .from("quote_requests")
      .select("id, product_id, created_at")
      .gte("created_at", sinceIso),
    supabase
      .from("leads")
      .select("id, name, phone, email, source, status, created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const events = (eventsRes.data ?? []) as EventRow[];
  const products = productsRes.data ?? [];
  const brands = brandsRes.data ?? [];
  const categories = categoriesRes.data ?? [];
  const quotes = quotesRes.data ?? [];
  const leads = (leadsRes.data ?? []) as LeadRow[];

  // No real data → return sample preview.
  if (events.length === 0 && quotes.length === 0) {
    return buildSampleDashboard(period, products, brands, categories, leads);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const brandMap = new Map(brands.map((b) => [b.id, b]));

  // KPIs
  const visitors = new Set(events.map((e) => e.visitor_id).filter(Boolean)).size;
  const pageViews = events.filter((e) => e.event_name === "page_view").length;
  const productViews = events.filter((e) => e.event_name === "product_view").length;
  const whatsapp = events.filter((e) => e.event_name === "whatsapp_click").length;
  const quoteCount = quotes.length;
  const conversion = visitors > 0 ? (quoteCount / visitors) * 100 : 0;

  // Trend
  const trendMap = new Map(emptyTrend(days).map((t) => [t.date, { ...t }]));
  for (const e of events) {
    if (e.event_name !== "page_view" && e.event_name !== "product_view") continue;
    const k = e.created_at.slice(0, 10);
    const slot = trendMap.get(k);
    if (slot) slot.views += 1;
  }
  for (const q of quotes) {
    const k = q.created_at.slice(0, 10);
    const slot = trendMap.get(k);
    if (slot) slot.quotes += 1;
  }
  const trend = Array.from(trendMap.values());

  // Top viewed products
  const viewCounts = new Map<string, number>();
  for (const e of events) {
    if (e.event_name === "product_view" && e.product_id) {
      viewCounts.set(e.product_id, (viewCounts.get(e.product_id) ?? 0) + 1);
    }
  }
  const topViewed = rankProducts(viewCounts, productMap, brandMap);

  // Top requested (quotes)
  const reqCounts = new Map<string, number>();
  for (const q of quotes) {
    if (q.product_id) reqCounts.set(q.product_id, (reqCounts.get(q.product_id) ?? 0) + 1);
  }
  const topRequested = rankProducts(reqCounts, productMap, brandMap);

  // Brand performance
  const brandStats = new Map<string, BrandPerf>();
  const ensureBrand = (id: string) => {
    if (!brandStats.has(id))
      brandStats.set(id, { id, name: brandMap.get(id)?.name ?? "—", views: 0, quotes: 0 });
    return brandStats.get(id)!;
  };
  for (const e of events) {
    const bId = e.brand_id ?? (e.product_id ? productMap.get(e.product_id)?.brand_id ?? null : null);
    if (bId && (e.event_name === "product_view" || e.event_name === "brand_view"))
      ensureBrand(bId).views += 1;
  }
  for (const q of quotes) {
    const bId = q.product_id ? productMap.get(q.product_id)?.brand_id ?? null : null;
    if (bId) ensureBrand(bId).quotes += 1;
  }
  const brandPerf = Array.from(brandStats.values())
    .sort((a, b) => b.views + b.quotes - (a.views + a.quotes))
    .slice(0, 6);

  // Category performance
  const catStats = new Map<string, CategoryPerf>();
  const ensureCat = (id: string) => {
    if (!catStats.has(id))
      catStats.set(id, { id, name: categoryMap.get(id)?.name ?? "—", views: 0, quotes: 0 });
    return catStats.get(id)!;
  };
  for (const e of events) {
    const cId = e.product_id ? productMap.get(e.product_id)?.category_id ?? null : null;
    if (cId && e.event_name === "product_view") ensureCat(cId).views += 1;
  }
  for (const q of quotes) {
    const cId = q.product_id ? productMap.get(q.product_id)?.category_id ?? null : null;
    if (cId) ensureCat(cId).quotes += 1;
  }
  const categoryPerf = Array.from(catStats.values())
    .sort((a, b) => b.views + b.quotes - (a.views + a.quotes))
    .slice(0, 6);

  // Funnel
  const quoteStarted = events.filter((e) => e.event_name === "quote_request_started").length;
  const funnel: FunnelStep[] = [
    { label: "Visitas", value: pageViews },
    { label: "Visualizações de produto", value: productViews },
    { label: "Orçamentos iniciados", value: quoteStarted || quoteCount },
    { label: "Orçamentos enviados", value: quoteCount },
  ];

  // Devices
  const deviceCounts = new Map<string, number>();
  for (const e of events) {
    const d = e.device_type ?? "desconhecido";
    deviceCounts.set(d, (deviceCounts.get(d) ?? 0) + 1);
  }
  const devices = Array.from(deviceCounts.entries()).map(([name, value]) => ({
    name: name === "desktop" ? "Desktop" : name === "mobile" ? "Mobile" : name === "tablet" ? "Tablet" : "Outro",
    value,
  }));

  // Sources
  const sourceCounts = new Map<string, number>();
  for (const e of events) {
    const s = e.source || "Direto";
    sourceCounts.set(s, (sourceCounts.get(s) ?? 0) + 1);
  }
  const sources = Array.from(sourceCounts.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  return {
    isSample: false,
    kpis: {
      visitors,
      pageViews,
      productViews,
      quotes: quoteCount,
      leads: leads.length,
      whatsapp,
      conversion: Math.round(conversion * 10) / 10,
    },
    trend,
    topViewed,
    topRequested,
    brands: brandPerf,
    categories: categoryPerf,
    funnel,
    devices,
    sources,
    recentLeads: leads,
  };
}

function rankProducts(
  counts: Map<string, number>,
  productMap: Map<string, { id: string; name: string; main_image_url: string | null; brand_id: string | null }>,
  brandMap: Map<string, { id: string; name: string }>,
): RankItem[] {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id, value]) => {
      const p = productMap.get(id);
      return {
        id,
        name: p?.name ?? "Produto removido",
        image: p?.main_image_url ?? null,
        brand: p?.brand_id ? brandMap.get(p.brand_id)?.name ?? null : null,
        value,
      };
    });
}

// ---------------------------------------------------------------- SAMPLE ----
// Temporary preview data shown until the site collects real analytics events.
function buildSampleDashboard(
  period: DashboardPeriod,
  products: { id: string; name: string; main_image_url: string | null; brand_id: string | null }[],
  brands: { id: string; name: string }[],
  leads: LeadRow[],
): DashboardData {
  const days = PERIOD_DAYS[period];
  const brandMap = new Map(brands.map((b) => [b.id, b]));
  const trend = emptyTrend(days).map((t, i) => {
    const wave = Math.sin(i / 3) * 18 + 42 + (i / days) * 30;
    return {
      date: t.date,
      views: Math.max(8, Math.round(wave + Math.random() * 12)),
      quotes: Math.max(0, Math.round(wave / 12 + Math.random() * 2)),
    };
  });
  const pageViews = trend.reduce((s, t) => s + t.views, 0);
  const quotes = trend.reduce((s, t) => s + t.quotes, 0);

  const sampleProducts = (products.length ? products : []).slice(0, 6);
  const mkRank = (mult: number): RankItem[] =>
    (sampleProducts.length
      ? sampleProducts
      : Array.from({ length: 5 }, (_, i) => ({
          id: `sample-${i}`,
          name: `Produto exemplo ${i + 1}`,
          main_image_url: null,
          brand_id: null,
        }))
    ).map((p, i) => ({
      id: p.id,
      name: p.name,
      image: p.main_image_url,
      brand: p.brand_id ? brandMap.get(p.brand_id)?.name ?? null : null,
      value: Math.round((6 - i) * mult + Math.random() * 5),
    }));

  const sampleBrands: BrandPerf[] = (brands.length
    ? brands
    : ["DJI", "Canon", "Sony", "GoPro"].map((n, i) => ({ id: `b${i}`, name: n }))
  )
    .slice(0, 6)
    .map((b, i) => ({
      id: b.id,
      name: b.name,
      views: Math.round((6 - i) * 60 + Math.random() * 40),
      quotes: Math.round((6 - i) * 6 + Math.random() * 6),
    }));

  return {
    isSample: true,
    kpis: {
      visitors: Math.round(pageViews * 0.62),
      pageViews,
      productViews: Math.round(pageViews * 0.4),
      quotes,
      leads: leads.length || 12,
      whatsapp: Math.round(quotes * 1.6),
      conversion: Math.round((quotes / Math.max(1, pageViews * 0.62)) * 1000) / 10,
    },
    trend,
    topViewed: mkRank(14),
    topRequested: mkRank(4),
    brands: sampleBrands,
    funnel: [
      { label: "Visitas", value: pageViews },
      { label: "Visualizações de produto", value: Math.round(pageViews * 0.4) },
      { label: "Orçamentos iniciados", value: Math.round(quotes * 1.5) },
      { label: "Orçamentos enviados", value: quotes },
    ],
    devices: [
      { name: "Mobile", value: Math.round(pageViews * 0.58) },
      { name: "Desktop", value: Math.round(pageViews * 0.36) },
      { name: "Tablet", value: Math.round(pageViews * 0.06) },
    ],
    sources: [
      { name: "Direto", value: Math.round(pageViews * 0.34) },
      { name: "google", value: Math.round(pageViews * 0.28) },
      { name: "instagram", value: Math.round(pageViews * 0.22) },
      { name: "facebook", value: Math.round(pageViews * 0.1) },
      { name: "whatsapp", value: Math.round(pageViews * 0.06) },
    ],
    recentLeads: leads,
  };
}
