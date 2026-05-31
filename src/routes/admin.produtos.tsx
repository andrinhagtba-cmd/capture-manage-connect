import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrands, useCategories } from "@/lib/catalog";
import { AVAILABILITY_LABELS } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Upload, Search } from "lucide-react";
import { toast } from "sonner";
import placeholder from "@/assets/product-placeholder.jpg";

export const Route = createFileRoute("/admin/produtos")({
  component: ProdutosAdmin,
});

const AVAIL = ["disponivel", "sob_consulta", "encomenda", "indisponivel"];

const empty = {
  id: "",
  name: "",
  slug: "",
  brand_id: "",
  category_id: "",
  model: "",
  sku: "",
  short_description: "",
  full_description: "",
  main_image_url: "",
  official_product_url: "",
  availability_status: "sob_consulta",
  internal_price: "",
  is_featured: false,
  is_active: true,
};

function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function ProdutosAdmin() {
  const qc = useQueryClient();
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...empty });
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: products } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const brandName = (id: string | null) =>
    brands?.find((b) => b.id === id)?.name ?? "—";
  const catsForBrand = (categories ?? []).filter(
    (c) => c.brand_id === form.brand_id,
  );

  const filtered = (products ?? []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  function openNew() {
    setForm({ ...empty });
    setOpen(true);
  }
  function openEdit(p: any) {
    setForm({
      ...empty,
      ...p,
      internal_price: p.internal_price ?? "",
      category_id: p.category_id ?? "",
      brand_id: p.brand_id ?? "",
    });
    setOpen(true);
  }

  async function save() {
    if (!form.name.trim()) return toast.error("Informe o nome do produto.");
    const payload: any = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      brand_id: form.brand_id || null,
      category_id: form.category_id || null,
      model: form.model || null,
      sku: form.sku || null,
      short_description: form.short_description || null,
      full_description: form.full_description || null,
      main_image_url: form.main_image_url || null,
      official_product_url: form.official_product_url || null,
      availability_status: form.availability_status,
      internal_price: form.internal_price ? Number(form.internal_price) : null,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };
    try {
      if (form.id) {
        const { error } = await supabase
          .from("products")
          .update(payload)
          .eq("id", form.id);
        if (error) throw error;
        toast.success("Produto atualizado.");
      } else {
        const { error } = await supabase.from("products").insert(payload);
        if (error) throw error;
        toast.success("Produto criado.");
      }
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (err: any) {
      toast.error(err?.message ?? "Erro ao salvar.");
    }
  }

  async function remove(id: string) {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Produto excluído.");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  }

  async function toggle(id: string, field: "is_active" | "is_featured", val: boolean) {
    const { error } = await supabase
      .from("products")
      .update({ [field]: val })
      .eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (rows.length === 0) {
      toast.error("Arquivo vazio ou inválido.");
      return;
    }
    const brandMap = new Map((brands ?? []).map((b) => [b.slug, b.id]));
    const catMap = new Map((categories ?? []).map((c) => [c.slug, c.id]));
    const report: any[] = [];
    let imported = 0;
    let failed = 0;
    for (const row of rows) {
      if (!row.name) {
        failed++;
        report.push({ row, error: "Sem nome" });
        continue;
      }
      const payload = {
        name: row.name,
        slug: row.slug || slugify(row.name),
        brand_id: row.brand_slug ? brandMap.get(row.brand_slug) ?? null : null,
        category_id: row.category_slug ? catMap.get(row.category_slug) ?? null : null,
        model: row.model || null,
        sku: row.sku || null,
        short_description: row.short_description || null,
        main_image_url: row.main_image_url || null,
        availability_status: AVAIL.includes(row.availability_status)
          ? row.availability_status
          : "sob_consulta",
        is_active: true,
      };
      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        failed++;
        report.push({ row: row.name, error: error.message });
      } else {
        imported++;
      }
    }
    await supabase.from("import_batches").insert({
      source_name: file.name,
      total_rows: rows.length,
      imported_rows: imported,
      failed_rows: failed,
      report_json: report,
      status: failed === 0 ? "concluido" : "parcial",
    });
    toast.success(`Importação: ${imported} ok, ${failed} falhas.`);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Produtos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerencie o catálogo, destaques e importações.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleImport}
          />
          <Button variant="outline" className="gap-2" onClick={() => fileRef.current?.click()}>
            <Upload className="h-4 w-4" /> Importar CSV
          </Button>
          <Button className="gap-2" onClick={openNew}>
            <Plus className="h-4 w-4" /> Novo produto
          </Button>
        </div>
      </div>

      <div className="relative mt-5 max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Buscar produto..."
          className="pl-9"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <p className="mt-2 text-xs text-muted-foreground">
        CSV com colunas: name, slug, brand_slug, category_slug, model, sku,
        short_description, main_image_url, availability_status.
      </p>

      <div className="mt-5 overflow-x-auto rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead>Marca</TableHead>
              <TableHead>Disponibilidade</TableHead>
              <TableHead>Destaque</TableHead>
              <TableHead>Ativo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p: any) => (
              <TableRow key={p.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <img
                      src={p.main_image_url || placeholder}
                      alt=""
                      className="h-10 w-10 rounded object-cover"
                    />
                    <div>
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.model}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>{brandName(p.brand_id)}</TableCell>
                <TableCell>
                  <Badge variant="secondary">
                    {AVAILABILITY_LABELS[p.availability_status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Switch
                    checked={p.is_featured}
                    onCheckedChange={(v) => toggle(p.id, "is_featured", v)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(v) => toggle(p.id, "is_active", v)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => remove(p.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Form dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nome *" className="sm:col-span-2">
              <Input
                value={form.name}
                onChange={(e) =>
                  setForm({
                    ...form,
                    name: e.target.value,
                    slug: form.id ? form.slug : slugify(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Slug">
              <Input
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
              />
            </Field>
            <Field label="Modelo">
              <Input
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
              />
            </Field>
            <Field label="Marca">
              <Select
                value={form.brand_id}
                onValueChange={(v) => setForm({ ...form, brand_id: v, category_id: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {(brands ?? []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Categoria">
              <Select
                value={form.category_id}
                onValueChange={(v) => setForm({ ...form, category_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {catsForBrand.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="SKU">
              <Input
                value={form.sku}
                onChange={(e) => setForm({ ...form, sku: e.target.value })}
              />
            </Field>
            <Field label="Disponibilidade">
              <Select
                value={form.availability_status}
                onValueChange={(v) => setForm({ ...form, availability_status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAIL.map((a) => (
                    <SelectItem key={a} value={a}>
                      {AVAILABILITY_LABELS[a]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Imagem principal (URL)" className="sm:col-span-2">
              <Input
                value={form.main_image_url}
                onChange={(e) => setForm({ ...form, main_image_url: e.target.value })}
              />
            </Field>
            <Field label="Link oficial (URL)" className="sm:col-span-2">
              <Input
                value={form.official_product_url}
                onChange={(e) =>
                  setForm({ ...form, official_product_url: e.target.value })
                }
              />
            </Field>
            <Field label="Descrição curta" className="sm:col-span-2">
              <Textarea
                rows={2}
                value={form.short_description}
                onChange={(e) =>
                  setForm({ ...form, short_description: e.target.value })
                }
              />
            </Field>
            <Field label="Descrição completa" className="sm:col-span-2">
              <Textarea
                rows={4}
                value={form.full_description}
                onChange={(e) =>
                  setForm({ ...form, full_description: e.target.value })
                }
              />
            </Field>
            <Field label="Preço interno (R$)">
              <Input
                type="number"
                value={form.internal_price}
                onChange={(e) =>
                  setForm({ ...form, internal_price: e.target.value })
                }
              />
            </Field>
            <div className="flex items-end gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => setForm({ ...form, is_featured: v })}
                />
                Destaque
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                />
                Ativo
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1.5 ${className ?? ""}`}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim());
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (cells[i] ?? "").trim();
    });
    return obj;
  });
}
