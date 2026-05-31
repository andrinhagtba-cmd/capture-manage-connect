import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAdminBrands,
  useAdminCategories,
  useAdminProducts,
  type AdminProduct,
  type AdminCategory,
} from "@/lib/products-admin";
import { AVAILABILITY_LABELS } from "@/lib/site";
import { ProductForm } from "@/components/admin/ProductForm";
import { CsvImportDialog } from "@/components/admin/CsvImportDialog";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { AdminProductCard } from "@/components/admin/AdminProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Upload,
  Tags,
  ArrowLeft,
  Pencil,
  Search,
  Loader2,
  LayoutGrid,
  Table as TableIcon,
  ArrowRight,
  Layers,
  FolderOpen,
  Star,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";
import placeholder from "@/assets/product-placeholder.jpg";

export const Route = createFileRoute("/admin/produtos/$brand")({
  component: BrandProductsAdmin,
});

type ViewMode = "cards" | "table";
// null = categories stage; "all" / "none" / categoryId = products stage
type CatScope = string | null;

function BrandProductsAdmin() {
  const { brand: brandSlug } = useParams({ from: "/admin/produtos/$brand" });
  const qc = useQueryClient();
  const { data: brands = [], isLoading: lb } = useAdminBrands();
  const { data: categories = [] } = useAdminCategories();
  const { data: products = [], isLoading: lp } = useAdminProducts();

  const brand = brands.find((b) => b.slug === brandSlug);
  const [scope, setScope] = useState<CatScope>(null);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("cards");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  const brandCats = useMemo(
    () =>
      categories
        .filter((c) => c.brand_id === brand?.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories, brand],
  );
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const brandProducts = useMemo(
    () => products.filter((p) => p.brand_id === brand?.id),
    [products, brand],
  );
  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    brandProducts.forEach((p) => {
      if (p.category_id) m[p.category_id] = (m[p.category_id] ?? 0) + 1;
    });
    return m;
  }, [brandProducts]);
  // Representative image per category: use a product image from that category
  // so cards never look empty when the category has no own image_url.
  const catImages = useMemo(() => {
    const m: Record<string, string> = {};
    brandProducts.forEach((p) => {
      if (p.category_id && p.main_image_url && !m[p.category_id]) {
        m[p.category_id] = p.main_image_url;
      }
    });
    return m;
  }, [brandProducts]);
  const uncategorized = useMemo(
    () => brandProducts.filter((p) => !p.category_id).length,
    [brandProducts],
  );

  // Products for the current scope — always restricted to this brand.
  const scoped = useMemo(() => {
    if (scope === null) return [];
    let list = brandProducts;
    if (scope === "none") list = list.filter((p) => !p.category_id);
    else if (scope !== "all") list = list.filter((p) => p.category_id === scope);
    const t = search.toLowerCase();
    if (t) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(t) ||
          (p.model ?? "").toLowerCase().includes(t) ||
          (p.sku ?? "").toLowerCase().includes(t),
      );
    }
    return list;
  }, [scope, brandProducts, search]);

  if (lb) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!brand) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">Marca não encontrada.</p>
        <Button asChild variant="outline">
          <Link to="/admin/produtos">Voltar</Link>
        </Button>
      </div>
    );
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(p: AdminProduct) {
    setEditing(p);
    setFormOpen(true);
  }
  async function duplicate(p: AdminProduct) {
    const { id, ...rest } = p as any;
    const { error } = await supabase.from("products").insert({
      ...rest,
      name: `${p.name} (cópia)`,
      slug: `${p.slug}-copia-${Math.random().toString(36).slice(2, 6)}`,
      is_active: false,
    });
    if (error) return toast.error(error.message);
    toast.success("Produto duplicado.");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }
  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído.");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  const scopeLabel =
    scope === "all"
      ? "Todos os produtos"
      : scope === "none"
        ? "Sem categoria"
        : catById.get(scope ?? "")?.name ?? "";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2 gap-1">
        <Link to="/admin/produtos">
          <ArrowLeft className="h-4 w-4" /> Todas as marcas
        </Link>
      </Button>

      {/* Brand header */}
      <div className="flex flex-wrap items-center gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex h-14 items-center">
          {brand.logo_url ? (
            <img src={brand.logo_url} alt={brand.name} className="h-12 object-contain" />
          ) : (
            <span className="text-2xl font-bold">{brand.name}</span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          {brand.description && (
            <p className="line-clamp-1 text-sm text-muted-foreground">{brand.description}</p>
          )}
          <p className="mt-1 text-sm text-muted-foreground">
            {brandProducts.length} produtos · {brandCats.length} categorias
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo produto {brand.name}
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setCsvOpen(true)}>
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setCatsOpen(true)}>
            <Tags className="h-4 w-4" /> Categorias
          </Button>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/admin/marcas">
              <Pencil className="h-4 w-4" /> Editar página
            </Link>
          </Button>
        </div>
      </div>

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button
          onClick={() => setScope(null)}
          className={scope === null ? "font-semibold text-foreground" : "hover:text-foreground"}
        >
          Categorias
        </button>
        {scope !== null && (
          <>
            <span>/</span>
            <span className="font-semibold text-foreground">{scopeLabel}</span>
          </>
        )}
      </div>

      {scope === null ? (
        /* ===== Level 2 — Categories ===== */
        lp ? (
          <Loading />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <BigScopeCard
              icon={<Layers className="h-5 w-5" />}
              title="Todos os produtos"
              subtitle={`${brandProducts.length} produtos de ${brand.name}`}
              onClick={() => {
                setSearch("");
                setScope("all");
              }}
              accent
            />
            {brandCats.map((c) => (
              <CategoryCard
                key={c.id}
                category={c}
                count={catCounts[c.id] ?? 0}
                fallbackImage={catImages[c.id]}
                onClick={() => {
                  setSearch("");
                  setScope(c.id);
                }}
              />
            ))}
            {uncategorized > 0 && (
              <BigScopeCard
                icon={<FolderOpen className="h-5 w-5" />}
                title="Sem categoria"
                subtitle={`${uncategorized} produto(s) a organizar`}
                onClick={() => {
                  setSearch("");
                  setScope("none");
                }}
              />
            )}
            <button
              onClick={() => setCatsOpen(true)}
              className="flex min-h-[150px] flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground"
            >
              <Tags className="h-6 w-6" />
              <span className="text-sm font-medium">Nova categoria</span>
            </button>
          </div>
        )
      ) : (
        /* ===== Level 3 — Products ===== */
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" className="gap-1" onClick={() => setScope(null)}>
              <ArrowLeft className="h-4 w-4" /> Categorias
            </Button>
            <h2 className="text-lg font-bold">{scopeLabel}</h2>
            <Badge variant="secondary">{scoped.length}</Badge>
            <div className="relative ml-auto min-w-[220px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Buscar nesta marca..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex rounded-lg border border-border p-0.5">
              <ViewBtn active={view === "cards"} onClick={() => setView("cards")}>
                <LayoutGrid className="h-4 w-4" />
              </ViewBtn>
              <ViewBtn active={view === "table"} onClick={() => setView("table")}>
                <TableIcon className="h-4 w-4" />
              </ViewBtn>
            </div>
          </div>

          {lp ? (
            <Loading />
          ) : scoped.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
              <p>Nenhum produto nesta seleção.</p>
              <Button onClick={openNew} className="gap-2">
                <Plus className="h-4 w-4" /> Adicionar produto
              </Button>
            </div>
          ) : view === "cards" ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {scoped.map((p) => (
                <AdminProductCard
                  key={p.id}
                  product={p}
                  brandName={brand.name}
                  categoryName={catById.get(p.category_id ?? "")?.name ?? "Sem categoria"}
                  selected={false}
                  onSelect={() => {}}
                  onEdit={() => openEdit(p)}
                  onDuplicate={() => duplicate(p)}
                  onDelete={() => remove(p.id)}
                />
              ))}
            </div>
          ) : (
            <ProductTable
              products={scoped}
              catById={catById}
              onEdit={openEdit}
              onDelete={remove}
            />
          )}
        </div>
      )}

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        defaultBrandId={brand.id}
        brands={brands}
        categories={categories}
        allProducts={products}
      />
      <CsvImportDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        brands={brands}
        categories={categories}
        forcedBrandId={brand.id}
      />
      <CategoriesManager
        open={catsOpen}
        onOpenChange={setCatsOpen}
        brands={brands}
        categories={categories}
        counts={catCounts}
        lockedBrandId={brand.id}
      />
    </div>
  );
}

function Loading() {
  return (
    <div className="flex h-40 items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}

function CategoryCard({
  category,
  count,
  fallbackImage,
  onClick,
}: {
  category: AdminCategory;
  count: number;
  fallbackImage?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
    >
      <div className="relative aspect-[16/9] overflow-hidden bg-surface">
        <img
          src={category.image_url || fallbackImage || placeholder}
          alt={category.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {!category.is_active && (
          <span className="absolute right-2 top-2 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold">
            Inativa
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold leading-snug">{category.name}</h3>
        {category.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {category.description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-xs text-muted-foreground">{count} produto(s)</span>
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            Ver produtos
            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </button>
  );
}

function BigScopeCard({
  icon,
  title,
  subtitle,
  onClick,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`group flex min-h-[150px] flex-col justify-between rounded-2xl border p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        accent
          ? "border-primary/30 bg-primary/5"
          : "border-border bg-card"
      }`}
    >
      <span
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
          accent ? "bg-primary text-primary-foreground" : "bg-surface text-foreground"
        }`}
      >
        {icon}
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
          Abrir
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </button>
  );
}

function ViewBtn({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md ${
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
      }`}
    >
      {children}
    </button>
  );
}

function ProductTable({
  products,
  catById,
  onEdit,
  onDelete,
}: {
  products: AdminProduct[];
  catById: Map<string, any>;
  onEdit: (p: AdminProduct) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-muted-foreground">
          <tr>
            <th className="p-3">Produto</th>
            <th className="p-3">Categoria</th>
            <th className="p-3">Disponibilidade</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="p-3 font-medium">
                {p.name}
                {p.is_featured && (
                  <Star className="ml-1 inline h-3 w-3 fill-amber-500 text-amber-500" />
                )}
                {!p.main_image_url && (
                  <ImageOff className="ml-1 inline h-3 w-3 text-destructive" />
                )}
              </td>
              <td className="p-3">{catById.get(p.category_id ?? "")?.name ?? "—"}</td>
              <td className="p-3">
                {AVAILABILITY_LABELS[p.availability_status] ?? p.availability_status}
              </td>
              <td className="p-3">
                <Badge variant={p.is_active ? "secondary" : "outline"}>
                  {p.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              <td className="p-3 text-right">
                <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>
                  Editar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
