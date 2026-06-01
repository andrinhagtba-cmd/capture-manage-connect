import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  useAdminBrands,
  useAdminCategories,
  useAdminProducts,
} from "@/lib/products-admin";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { Button } from "@/components/ui/button";
import { Tags, ExternalLink, ArrowRight, Package, Loader2, Boxes, Star, ImageOff } from "lucide-react";
import { AdminPageHero } from "@/components/admin/ui";

export const Route = createFileRoute("/admin/produtos/")({
  component: ProdutosAdmin,
});

function ProdutosAdmin() {
  const { data: brands = [], isLoading: lb } = useAdminBrands();
  const { data: categories = [] } = useAdminCategories();
  const { data: products = [], isLoading: lp } = useAdminProducts();
  const [catsOpen, setCatsOpen] = useState(false);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category_id) m[p.category_id] = (m[p.category_id] ?? 0) + 1;
    });
    return m;
  }, [products]);

  const stats = useMemo(
    () => ({
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      featured: products.filter((p) => p.is_featured).length,
      noImage: products.filter((p) => !p.main_image_url).length,
      noCat: products.filter((p) => !p.category_id).length,
    }),
    [products],
  );

  const brandStats = useMemo(
    () =>
      brands.map((b) => {
        const list = products.filter((p) => p.brand_id === b.id);
        return {
          brand: b,
          total: list.length,
          categories: categories.filter((c) => c.brand_id === b.id).length,
          active: list.filter((p) => p.is_active).length,
          featured: list.filter((p) => p.is_featured).length,
        };
      }),
    [brands, products, categories],
  );

  return (
    <div className="space-y-6">
      <AdminPageHero
        eyebrow="Catálogo"
        title="Catálogo de Produtos"
        subtitle="Organize produtos por marca, categoria, mídia, disponibilidade e destaque."
        icon={Package}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Produtos" }]}
        metrics={[
          { label: "Total de produtos", value: stats.total, icon: Package },
          { label: "Ativos", value: stats.active, icon: Boxes, tone: "success" },
          { label: "Em destaque", value: stats.featured, icon: Star, tone: "warning" },
          { label: "Sem imagem", value: stats.noImage, icon: ImageOff, tone: stats.noImage > 0 ? "primary" : "default" },
        ]}
        actions={
          <>
            <Button variant="secondary" className="gap-2 rounded-xl" onClick={() => setCatsOpen(true)}>
              <Tags className="h-4 w-4" /> Categorias
            </Button>
            <Button asChild variant="outline" className="gap-2 rounded-xl border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white">
              <Link to="/catalogo" target="_blank">
                Ver catálogo <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          </>
        }
      />

      {/* Level 1 — Brand cards */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Marcas
        </h2>
        {lb ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {brandStats.map(({ brand, total, categories: cats, active, featured }) => (
              <Link
                key={brand.id}
                to="/admin/produtos/$brand"
                params={{ brand: brand.slug }}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
              >
                <div className="flex h-28 items-center justify-center border-b border-border bg-surface p-6">
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="max-h-12 max-w-[70%] object-contain transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <span className="text-2xl font-bold">{brand.name}</span>
                  )}
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{brand.name}</h3>
                    {!brand.is_active && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                        Inativa
                      </span>
                    )}
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                    <Mini label="Produtos" value={total} />
                    <Mini label="Categorias" value={cats} />
                    <Mini label="Ativos" value={active} />
                    <Mini label="Destaques" value={featured} />
                  </div>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Gerenciar {brand.name}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </div>
              </Link>
            ))}
            {!brandStats.length && (
              <div className="col-span-full flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border py-16 text-center text-muted-foreground">
                <Package className="h-8 w-8" />
                Nenhuma marca cadastrada ainda.
              </div>
            )}
          </div>
        )}
      </div>

      <CategoriesManager
        open={catsOpen}
        onOpenChange={setCatsOpen}
        brands={brands}
        categories={categories}
        counts={catCounts}
      />
    </div>
  );
}



function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-surface px-2.5 py-1.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  );
}
