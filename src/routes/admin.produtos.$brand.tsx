import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAdminBrands,
  useAdminCategories,
  useAdminProducts,
  type AdminProduct,
} from "@/lib/products-admin";
import { ProductForm } from "@/components/admin/ProductForm";
import { CsvImportDialog } from "@/components/admin/CsvImportDialog";
import { CategoriesManager } from "@/components/admin/CategoriesManager";
import { AdminProductCard } from "@/components/admin/AdminProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Upload,
  Tags,
  ArrowLeft,
  Pencil,
  Search,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produtos/$brand")({
  component: BrandProductsAdmin,
});

function BrandProductsAdmin() {
  const { brand: brandSlug } = useParams({ from: "/admin/produtos/$brand" });
  const qc = useQueryClient();
  const { data: brands = [], isLoading: lb } = useAdminBrands();
  const { data: categories = [] } = useAdminCategories();
  const { data: products = [], isLoading: lp } = useAdminProducts();

  const brand = brands.find((b) => b.slug === brandSlug);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const brandCats = useMemo(
    () => categories.filter((c) => c.brand_id === brand?.id),
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

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return brandProducts.filter((p) => {
      if (catFilter && p.category_id !== catFilter) return false;
      if (
        t &&
        !p.name.toLowerCase().includes(t) &&
        !(p.model ?? "").toLowerCase().includes(t) &&
        !(p.sku ?? "").toLowerCase().includes(t)
      )
        return false;
      return true;
    });
  }, [brandProducts, search, catFilter]);

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
  function toggleSel(id: string, v: boolean) {
    setSelected((s) => {
      const n = new Set(s);
      v ? n.add(id) : n.delete(id);
      return n;
    });
  }

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="gap-1 -ml-2">
        <Link to="/admin/produtos">
          <ArrowLeft className="h-4 w-4" /> Todos os produtos
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
            <Upload className="h-4 w-4" /> Importar CSV {brand.name}
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

      {/* Categories chips */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Categorias {brand.name}
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Chip active={catFilter === null} onClick={() => setCatFilter(null)}>
            Todas ({brandProducts.length})
          </Chip>
          {brandCats.map((c) => (
            <Chip key={c.id} active={catFilter === c.id} onClick={() => setCatFilter(c.id)}>
              {c.name} ({catCounts[c.id] ?? 0})
            </Chip>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Buscar produto desta marca..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Products grid */}
      {lp ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Nenhum produto {brand.name} encontrado.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {filtered.map((p) => (
            <AdminProductCard
              key={p.id}
              product={p}
              brandName={brand.name}
              categoryName={catById.get(p.category_id ?? "")?.name ?? "Sem categoria"}
              selected={selected.has(p.id)}
              onSelect={(v) => toggleSel(p.id, v)}
              onEdit={() => openEdit(p)}
              onDuplicate={() => duplicate(p)}
              onDelete={() => remove(p.id)}
            />
          ))}
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

function Chip({
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
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary/50"
      }`}
    >
      {children}
    </button>
  );
}
