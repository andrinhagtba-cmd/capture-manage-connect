import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  parseCsv,
  slugify,
  AVAIL_OPTIONS,
  CSV_COLUMNS,
  type AdminBrand,
  type AdminCategory,
} from "@/lib/products-admin";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Upload, Loader2, CheckCircle2, AlertTriangle, Tag } from "lucide-react";
import { toast } from "sonner";

type Parsed = {
  rows: Record<string, string>[];
  toCreate: number;
  duplicates: string[];
  newCategories: string[];
  errors: { row: string; error: string }[];
  fileName: string;
};

export function CsvImportDialog({
  open,
  onOpenChange,
  brands,
  categories,
  forcedBrandId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brands: AdminBrand[];
  categories: AdminCategory[];
  forcedBrandId?: string;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);
  const [importing, setImporting] = useState(false);

  const forcedBrand = brands.find((b) => b.id === forcedBrandId);

  function reset() {
    setParsed(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const rows = parseCsv(text);
    if (!rows.length) {
      toast.error("Arquivo vazio ou inválido.");
      return;
    }
    const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
    const existingSlugs = new Set(
      (
        await supabase.from("products").select("slug, brand_id")
      ).data?.map((p: any) => `${p.brand_id}:${p.slug}`) ?? [],
    );
    const catSlugs = new Set(categories.map((c) => `${c.brand_id}:${c.slug}`));
    const newCategories = new Set<string>();
    const duplicates: string[] = [];
    const errors: { row: string; error: string }[] = [];
    let toCreate = 0;

    for (const row of rows) {
      if (!row.name) {
        errors.push({ row: row.slug || "(sem nome)", error: "Sem nome" });
        continue;
      }
      const brand = forcedBrand ?? brandBySlug.get(row.brand_slug);
      if (!brand) {
        errors.push({ row: row.name, error: "Marca não encontrada" });
        continue;
      }
      const slug = row.slug || slugify(row.name);
      if (existingSlugs.has(`${brand.id}:${slug}`)) {
        duplicates.push(row.name);
        continue;
      }
      if (row.category_slug && !catSlugs.has(`${brand.id}:${row.category_slug}`)) {
        newCategories.add(`${brand.name} → ${row.category_slug}`);
      }
      toCreate++;
    }

    setParsed({
      rows,
      toCreate,
      duplicates,
      newCategories: [...newCategories],
      errors,
      fileName: file.name,
    });
  }

  async function confirmImport() {
    if (!parsed) return;
    setImporting(true);
    const brandBySlug = new Map(brands.map((b) => [b.slug, b]));
    // mutable category map
    const catMap = new Map(categories.map((c) => [`${c.brand_id}:${c.slug}`, c.id]));
    const existing =
      (await supabase.from("products").select("slug, brand_id")).data ?? [];
    const existingSlugs = new Set(
      existing.map((p: any) => `${p.brand_id}:${p.slug}`),
    );

    let imported = 0;
    let failed = 0;
    const report: any[] = [];

    for (const row of parsed.rows) {
      if (!row.name) {
        failed++;
        continue;
      }
      const brand = forcedBrand ?? brandBySlug.get(row.brand_slug);
      if (!brand) {
        failed++;
        report.push({ row: row.name, error: "Marca não encontrada" });
        continue;
      }
      const slug = row.slug || slugify(row.name);
      if (existingSlugs.has(`${brand.id}:${slug}`)) {
        report.push({ row: row.name, error: "Duplicado (ignorado)" });
        continue;
      }

      // resolve / create category
      let categoryId: string | null = null;
      if (row.category_slug) {
        const key = `${brand.id}:${row.category_slug}`;
        if (catMap.has(key)) {
          categoryId = catMap.get(key)!;
        } else {
          const { data: newCat } = await supabase
            .from("categories")
            .insert({
              name: row.category_slug.replace(/-/g, " "),
              slug: row.category_slug,
              brand_id: brand.id,
              is_active: true,
            })
            .select("id")
            .single();
          if (newCat) {
            categoryId = newCat.id;
            catMap.set(key, newCat.id);
          }
        }
      }

      const splitList = (v?: string) =>
        (v ?? "")
          .split(/[;|]/)
          .map((s) => s.trim())
          .filter(Boolean);

      let specs: any[] = [];
      if (row.specifications_json) {
        try {
          const p = JSON.parse(row.specifications_json);
          if (Array.isArray(p)) specs = p;
        } catch {
          /* ignore */
        }
      }

      const payload: any = {
        name: row.name,
        slug,
        brand_id: brand.id,
        category_id: categoryId,
        model: row.model || null,
        sku: row.sku || null,
        short_description: row.short_description || null,
        full_description: row.full_description || null,
        main_image_url: row.main_image_url || null,
        gallery_json: splitList(row.gallery_urls),
        video_url: row.video_url || null,
        availability_status: AVAIL_OPTIONS.includes(row.availability_status as any)
          ? row.availability_status
          : "sob_consulta",
        is_featured: ["1", "true", "sim", "yes"].includes(
          (row.is_featured ?? "").toLowerCase(),
        ),
        is_active: row.is_active
          ? ["1", "true", "sim", "yes"].includes(row.is_active.toLowerCase())
          : true,
        tags_json: splitList(row.tags),
        use_cases_json: splitList(row.use_cases),
        specifications_json: specs,
        official_product_url: row.official_product_url || null,
      };

      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        failed++;
        report.push({ row: row.name, error: error.message });
      } else {
        imported++;
        existingSlugs.add(`${brand.id}:${slug}`);
      }
    }

    await supabase.from("import_batches").insert({
      source_name: parsed.fileName,
      total_rows: parsed.rows.length,
      imported_rows: imported,
      failed_rows: failed,
      report_json: report,
      status: failed === 0 ? "concluido" : "parcial",
    });

    toast.success(`Importação: ${imported} criados, ${failed} falhas.`);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["admin-categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    setImporting(false);
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            Importar CSV{forcedBrand ? ` — ${forcedBrand.name}` : ""}
          </DialogTitle>
          <DialogDescription>
            {forcedBrand
              ? `Todos os produtos serão associados à marca ${forcedBrand.name}.`
              : "Inclua a coluna brand_slug para definir a marca de cada produto."}
          </DialogDescription>
        </DialogHeader>

        {!parsed ? (
          <div className="space-y-3">
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={onFile}
            />
            <button
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border py-10 text-sm text-muted-foreground transition hover:border-primary/50"
            >
              <Upload className="h-6 w-6" />
              Clique para selecionar o arquivo CSV
            </button>
            <p className="text-xs text-muted-foreground">
              Colunas aceitas: {CSV_COLUMNS.join(", ")}. Listas (gallery_urls, tags,
              use_cases) separadas por <code>;</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Stat label="Total de linhas" value={parsed.rows.length} />
              <Stat label="Serão criados" value={parsed.toCreate} tone="ok" />
              <Stat label="Duplicados" value={parsed.duplicates.length} tone="warn" />
              <Stat
                label="Categorias novas"
                value={parsed.newCategories.length}
                tone="info"
              />
            </div>
            {parsed.newCategories.length > 0 && (
              <div className="rounded-lg border border-border bg-surface p-3 text-xs">
                <p className="mb-1 flex items-center gap-1 font-medium">
                  <Tag className="h-3.5 w-3.5" /> Categorias que serão criadas
                </p>
                {parsed.newCategories.map((c) => (
                  <span key={c} className="mr-2">
                    {c}
                  </span>
                ))}
              </div>
            )}
            {parsed.errors.length > 0 && (
              <div className="max-h-32 overflow-y-auto rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-xs">
                <p className="mb-1 flex items-center gap-1 font-medium text-destructive">
                  <AlertTriangle className="h-3.5 w-3.5" /> Erros ({parsed.errors.length})
                </p>
                {parsed.errors.map((e, i) => (
                  <p key={i}>
                    {e.row}: {e.error}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {parsed && (
            <Button variant="outline" onClick={reset} disabled={importing}>
              Trocar arquivo
            </Button>
          )}
          <Button
            onClick={confirmImport}
            disabled={!parsed || importing || parsed.toCreate === 0}
            className="gap-2"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Confirmar importação
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "info";
}) {
  const toneClass =
    tone === "ok"
      ? "text-emerald-600"
      : tone === "warn"
        ? "text-amber-600"
        : tone === "info"
          ? "text-sky-600"
          : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${toneClass}`}>{value}</p>
    </div>
  );
}
