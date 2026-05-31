import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useAdminBrands,
  useAdminCategories,
  useAdminProducts,
  slugify,
  type AdminProduct,
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Upload,
  Tags,
  ExternalLink,
  Search,
  LayoutGrid,
  Rows3,
  Table as TableIcon,
  ArrowRight,
  Star,
  ImageOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/produtos")({
  component: ProdutosAdmin,
});

type ViewMode = "cards" | "compact" | "table";

function ProdutosAdmin() {
  const qc = useQueryClient();
  const { data: brands = [] } = useAdminBrands();
  const { data: categories = [] } = useAdminCategories();
  const { data: products = [], isLoading } = useAdminProducts();

  const [search, setSearch] = useState("");
  const [fBrand, setFBrand] = useState("all");
  const [fCat, setFCat] = useState("all");
  const [fAvail, setFAvail] = useState("all");
  const [fFeatured, setFFeatured] = useState("all");
  const [fStatus, setFStatus] = useState("all");
  const [view, setView] = useState<ViewMode>("cards");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);
  const [catsOpen, setCatsOpen] = useState(false);

  const brandById = useMemo(() => new Map(brands.map((b) => [b.id, b])), [brands]);
  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);

  const catCounts = useMemo(() => {
    const m: Record<string, number> = {};
    products.forEach((p) => {
      if (p.category_id) m[p.category_id] = (m[p.category_id] ?? 0) + 1;
    });
    return m;
  }, [products]);

  const stats = useMemo(() => {
    return {
      total: products.length,
      active: products.filter((p) => p.is_active).length,
      featured: products.filter((p) => p.is_featured).length,
      noImage: products.filter((p) => !p.main_image_url).length,
      noCat: products.filter((p) => !p.category_id).length,
      onRequest: products.filter((p) => p.availability_status === "sob_consulta").length,
    };
  }, [products]);

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

  const filtered = useMemo(() => {
    const t = search.toLowerCase();
    return products.filter((p) => {
      if (
        t &&
        !p.name.toLowerCase().includes(t) &&
        !(p.model ?? "").toLowerCase().includes(t) &&
        !(p.sku ?? "").toLowerCase().includes(t) &&
        !(p.slug ?? "").toLowerCase().includes(t)
      )
        return false;
      if (fBrand !== "all" && p.brand_id !== fBrand) return false;
      if (fCat !== "all" && p.category_id !== fCat) return false;
      if (fAvail !== "all" && p.availability_status !== fAvail) return false;
      if (fFeatured !== "all" && p.is_featured !== (fFeatured === "yes")) return false;
      if (fStatus !== "all" && p.is_active !== (fStatus === "active")) return false;
      return true;
    });
  }, [products, search, fBrand, fCat, fAvail, fFeatured, fStatus]);

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
    const base = `${p.name} (cópia)`;
    const payload = {
      ...rest,
      name: base,
      slug: `${p.slug}-copia-${Math.random().toString(36).slice(2, 6)}`,
      is_active: false,
    };
    const { error } = await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Produto duplicado (inativo).");
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

  async function bulk(patch: Partial<AdminProduct>) {
    const ids = [...selected];
    if (!ids.length) return;
    const { error } = await supabase.from("products").update(patch as any).in("id", ids);
    if (error) return toast.error(error.message);
    toast.success("Produtos atualizados.");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }
  async function bulkDelete() {
    const ids = [...selected];
    if (!ids.length) return;
    if (!confirm(`Excluir ${ids.length} produto(s)?`)) return;
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) return toast.error(error.message);
    toast.success("Produtos excluídos.");
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }
  function exportCsv() {
    const rows = filtered.filter((p) => selected.size === 0 || selected.has(p.id));
    const header = ["name", "slug", "brand_slug", "category_slug", "model", "sku", "availability_status", "is_featured", "is_active"];
    const lines = [header.join(",")];
    rows.forEach((p) => {
      const b = brandById.get(p.brand_id ?? "")?.slug ?? "";
      const c = catById.get(p.category_id ?? "")?.slug ?? "";
      lines.push(
        [p.name, p.slug, b, c, p.model ?? "", p.sku ?? "", p.availability_status, p.is_featured, p.is_active]
          .map((v) => `"${String(v).replace(/"/g, '""')}"`)
          .join(","),
      );
    });
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "produtos.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o catálogo por marca, categoria e disponibilidade.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setCsvOpen(true)}>
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setCatsOpen(true)}>
            <Tags className="h-4 w-4" /> Gerenciar categorias
          </Button>
          <Button asChild variant="ghost" className="gap-2">
            <Link to="/catalogo" target="_blank">
              Ver catálogo público <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Dashboard */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Ativos" value={stats.active} tone="ok" />
        <StatCard label="Em destaque" value={stats.featured} tone="amber" />
        <StatCard label="Sem imagem" value={stats.noImage} tone="warn" />
        <StatCard label="Sem categoria" value={stats.noCat} tone="warn" />
        <StatCard label="Sob consulta" value={stats.onRequest} tone="info" />
      </div>

      {/* Brand cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {brandStats.map(({ brand, total, categories: cats, active, featured }) => (
          <div
            key={brand.id}
            className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm"
          >
            <div className="flex h-10 items-center">
              {brand.logo_url ? (
                <img src={brand.logo_url} alt={brand.name} className="h-8 object-contain" />
              ) : (
                <span className="text-lg font-bold">{brand.name}</span>
              )}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <Mini label="Produtos" value={total} />
              <Mini label="Categorias" value={cats} />
              <Mini label="Ativos" value={active} />
              <Mini label="Destaques" value={featured} />
            </div>
            <Button asChild className="mt-4 w-full gap-1" variant="outline">
              <Link to="/admin/produtos/$brand" params={{ brand: brand.slug }}>
                Gerenciar {brand.name} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nome, modelo, SKU ou slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <FilterSelect value={fBrand} onChange={setFBrand} placeholder="Marca"
            options={[{ v: "all", l: "Todas as marcas" }, ...brands.map((b) => ({ v: b.id, l: b.name }))]} />
          <FilterSelect value={fCat} onChange={setFCat} placeholder="Categoria"
            options={[{ v: "all", l: "Todas as categorias" }, ...categories.filter((c) => fBrand === "all" || c.brand_id === fBrand).map((c) => ({ v: c.id, l: c.name }))]} />
          <FilterSelect value={fAvail} onChange={setFAvail} placeholder="Disponibilidade"
            options={[{ v: "all", l: "Toda disponibilidade" }, ...Object.entries(AVAILABILITY_LABELS).map(([v, l]) => ({ v, l }))]} />
          <FilterSelect value={fFeatured} onChange={setFFeatured} placeholder="Destaque"
            options={[{ v: "all", l: "Destaque: todos" }, { v: "yes", l: "Em destaque" }, { v: "no", l: "Sem destaque" }]} />
          <FilterSelect value={fStatus} onChange={setFStatus} placeholder="Status"
            options={[{ v: "all", l: "Status: todos" }, { v: "active", l: "Ativos" }, { v: "inactive", l: "Inativos" }]} />
          <div className="ml-auto flex rounded-lg border border-border p-0.5">
            <ViewBtn active={view === "cards"} onClick={() => setView("cards")}><LayoutGrid className="h-4 w-4" /></ViewBtn>
            <ViewBtn active={view === "compact"} onClick={() => setView("compact")}><Rows3 className="h-4 w-4" /></ViewBtn>
            <ViewBtn active={view === "table"} onClick={() => setView("table")}><TableIcon className="h-4 w-4" /></ViewBtn>
          </div>
        </div>
      </div>

      {/* Bulk toolbar */}
      {selected.size > 0 && (
        <div className="sticky top-2 z-20 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-background p-3 shadow-md">
          <span className="text-sm font-medium">{selected.size} selecionado(s)</span>
          <Button size="sm" variant="outline" onClick={() => bulk({ is_active: true })}>Ativar</Button>
          <Button size="sm" variant="outline" onClick={() => bulk({ is_active: false })}>Desativar</Button>
          <Button size="sm" variant="outline" onClick={() => bulk({ is_featured: true })}>Destacar</Button>
          <Button size="sm" variant="outline" onClick={() => bulk({ is_featured: false })}>Remover destaque</Button>
          <Button size="sm" variant="outline" onClick={exportCsv}>Exportar CSV</Button>
          <Button size="sm" variant="destructive" onClick={bulkDelete}>Excluir</Button>
          <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Limpar</Button>
        </div>
      )}

      {/* Products */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          Nenhum produto encontrado.
        </p>
      ) : view === "table" ? (
        <ProductTable
          products={filtered}
          brandById={brandById}
          catById={catById}
          selected={selected}
          onSelect={toggleSel}
          onEdit={openEdit}
          onDelete={remove}
        />
      ) : (
        <div
          className={
            view === "compact"
              ? "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5"
              : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
          }
        >
          {filtered.map((p) => (
            <AdminProductCard
              key={p.id}
              product={p}
              brandName={brandById.get(p.brand_id ?? "")?.name ?? "Sem marca"}
              categoryName={catById.get(p.category_id ?? "")?.name ?? "Sem categoria"}
              selected={selected.has(p.id)}
              onSelect={(v) => toggleSel(p.id, v)}
              onEdit={() => openEdit(p)}
              onDuplicate={() => duplicate(p)}
              onDelete={() => remove(p.id)}
              compact={view === "compact"}
            />
          ))}
        </div>
      )}

      <ProductForm
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        brands={brands}
        categories={categories}
        allProducts={products}
      />
      <CsvImportDialog
        open={csvOpen}
        onOpenChange={setCsvOpen}
        brands={brands}
        categories={categories}
      />
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

function StatCard({ label, value, tone }: { label: string; value: number; tone?: string }) {
  const c =
    tone === "ok" ? "text-emerald-600" :
    tone === "amber" ? "text-amber-600" :
    tone === "warn" ? (value > 0 ? "text-destructive" : "text-foreground") :
    tone === "info" ? "text-sky-600" : "text-foreground";
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${c}`}>{value}</p>
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

function FilterSelect({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: { v: string; l: string }[];
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-auto min-w-[150px]">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.v} value={o.v}>
            {o.l}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ViewBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-md ${active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
    >
      {children}
    </button>
  );
}

function ProductTable({
  products,
  brandById,
  catById,
  selected,
  onSelect,
  onEdit,
  onDelete,
}: {
  products: AdminProduct[];
  brandById: Map<string, any>;
  catById: Map<string, any>;
  selected: Set<string>;
  onSelect: (id: string, v: boolean) => void;
  onEdit: (p: AdminProduct) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full text-sm">
        <thead className="border-b border-border text-left text-muted-foreground">
          <tr>
            <th className="p-3"></th>
            <th className="p-3">Produto</th>
            <th className="p-3">Marca</th>
            <th className="p-3">Categoria</th>
            <th className="p-3">Status</th>
            <th className="p-3 text-right">Ações</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b border-border last:border-0">
              <td className="p-3">
                <input
                  type="checkbox"
                  checked={selected.has(p.id)}
                  onChange={(e) => onSelect(p.id, e.target.checked)}
                />
              </td>
              <td className="p-3 font-medium">
                {p.name}
                {p.is_featured && <Star className="ml-1 inline h-3 w-3 fill-amber-500 text-amber-500" />}
                {!p.main_image_url && <ImageOff className="ml-1 inline h-3 w-3 text-destructive" />}
              </td>
              <td className="p-3">{brandById.get(p.brand_id ?? "")?.name ?? "—"}</td>
              <td className="p-3">{catById.get(p.category_id ?? "")?.name ?? "—"}</td>
              <td className="p-3">
                <Badge variant={p.is_active ? "secondary" : "outline"}>
                  {p.is_active ? "Ativo" : "Inativo"}
                </Badge>
              </td>
              <td className="p-3 text-right">
                <Button size="sm" variant="ghost" onClick={() => onEdit(p)}>Editar</Button>
                <Button size="sm" variant="ghost" onClick={() => onDelete(p.id)}>Excluir</Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
