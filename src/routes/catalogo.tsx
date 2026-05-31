import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { z } from "zod";
import { PublicLayout } from "@/components/PublicLayout";
import { ProductCard } from "@/components/ProductCard";
import { useBrands, useCategories, useProducts } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import {
  AVAILABILITY_LABELS,
  BRAND_THEME,
} from "@/lib/site";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

const searchSchema = z.object({
  marca: z.string().optional(),
  cat: z.string().optional(),
  disp: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/catalogo")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Catálogo — NL Foto e Vídeo" },
      {
        name: "description",
        content:
          "Catálogo completo de câmeras, drones, lentes e acessórios Canon, DJI, Sony e GoPro. Solicite seu orçamento.",
      },
      { property: "og:title", content: "Catálogo — NL Foto e Vídeo" },
      { property: "og:description", content: "Câmeras, drones e acessórios profissionais." },
    ],
    links: [{ rel: "canonical", href: "/catalogo" }],
  }),
  component: Catalogo,
});

const AVAIL_KEYS = ["disponivel", "sob_consulta", "encomenda"];

function Catalogo() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/catalogo" });
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: products } = useProducts();

  const setParam = (key: string, value?: string) =>
    navigate({
      search: (prev: z.infer<typeof searchSchema>) => ({
        ...prev,
        [key]: value || undefined,
      }),
    });

  const brandBySlug = useMemo(
    () => new Map((brands ?? []).map((b) => [b.slug, b])),
    [brands],
  );
  const brandIdToSlug = useMemo(
    () => new Map((brands ?? []).map((b) => [b.id, b.slug])),
    [brands],
  );

  const activeBrand = search.marca ? brandBySlug.get(search.marca) : undefined;
  const brandCats = (categories ?? []).filter(
    (c) => activeBrand && c.brand_id === activeBrand.id,
  );

  const filtered = (products ?? []).filter((p) => {
    if (search.marca && brandIdToSlug.get(p.brand_id ?? "") !== search.marca)
      return false;
    if (search.cat && p.category_id !== search.cat) return false;
    if (search.disp && p.availability_status !== search.disp) return false;
    if (search.q) {
      const q = search.q.toLowerCase();
      const hay = `${p.name} ${p.model ?? ""} ${p.short_description ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const hasFilters = search.marca || search.cat || search.disp || search.q;

  // Internal search (debounced so we log a query, not each keystroke).
  useEffect(() => {
    const q = search.q?.trim();
    if (!q) return;
    const t = setTimeout(() => {
      track("search_performed", { search_term: q, results_count: filtered.length });
    }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.q]);

  // Category access (when a category filter is selected).
  useEffect(() => {
    if (!search.cat) return;
    track("category_view", {
      category_id: search.cat,
      brand_id: activeBrand?.id ?? null,
      content_name: brandCats.find((c) => c.id === search.cat)?.name ?? null,
      content_category: activeBrand?.name ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search.cat]);



  return (
    <PublicLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-12">
          <p className="eyebrow text-primary">Catálogo</p>
          <h1 className="display-lg mt-2 text-3xl md:text-4xl">
            {activeBrand ? activeBrand.name : "Todos os produtos"}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Preços sob consulta. Selecione um produto e solicite um orçamento
            personalizado com a nossa equipe.
          </p>
        </div>
      </section>

      <div className="container-page grid gap-8 py-10 lg:grid-cols-[260px_1fr]">
        {/* Sidebar filters */}
        <aside className="space-y-7">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar produto..."
              className="pl-9"
              defaultValue={search.q}
              onChange={(e) => setParam("q", e.target.value)}
            />
          </div>

          <FilterGroup title="Marca">
            <FilterPill
              active={!search.marca}
              onClick={() => navigate({ search: {} })}
            >
              Todas
            </FilterPill>
            {(brands ?? []).map((b) => (
              <FilterPill
                key={b.id}
                active={search.marca === b.slug}
                onClick={() =>
                  navigate({ search: { marca: b.slug } })
                }
                dot={BRAND_THEME[b.slug]?.color}
              >
                {b.name}
              </FilterPill>
            ))}
          </FilterGroup>

          {activeBrand && brandCats.length > 0 && (
            <FilterGroup title="Categoria">
              <FilterPill active={!search.cat} onClick={() => setParam("cat")}>
                Todas
              </FilterPill>
              {brandCats.map((c) => (
                <FilterPill
                  key={c.id}
                  active={search.cat === c.id}
                  onClick={() => setParam("cat", c.id)}
                >
                  {c.name}
                </FilterPill>
              ))}
            </FilterGroup>
          )}

          <FilterGroup title="Disponibilidade">
            <FilterPill active={!search.disp} onClick={() => setParam("disp")}>
              Todas
            </FilterPill>
            {AVAIL_KEYS.map((k) => (
              <FilterPill
                key={k}
                active={search.disp === k}
                onClick={() => setParam("disp", k)}
              >
                {AVAILABILITY_LABELS[k]}
              </FilterPill>
            ))}
          </FilterGroup>

          {hasFilters && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-1"
              onClick={() => navigate({ search: {} })}
            >
              <X className="h-4 w-4" /> Limpar filtros
            </Button>
          )}
        </aside>

        {/* Results */}
        <div>
          <p className="mb-5 text-sm text-muted-foreground">
            {filtered.length} produto{filtered.length !== 1 ? "s" : ""} encontrado
            {filtered.length !== 1 ? "s" : ""}
          </p>
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-20 text-center">
              <p className="text-muted-foreground">
                Nenhum produto encontrado com esses filtros.
              </p>
              <Button asChild variant="link">
                <Link to="/catalogo">Ver todos os produtos</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function FilterGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  children,
  dot,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  dot?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card text-foreground/80 hover:border-primary/40"
      }`}
    >
      {dot && (
        <span className="h-2 w-2 rounded-full" style={{ background: dot }} />
      )}
      {children}
    </button>
  );
}
