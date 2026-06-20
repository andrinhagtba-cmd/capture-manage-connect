import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import {
  startScrape,
  getScrapeStatus,
  type ScrapedProduct,
} from "@/lib/scrape.functions";
import {
  slugify,
  type AdminBrand,
  type AdminCategory,
} from "@/lib/products-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Link2,
  Loader2,
  CheckCircle2,
  Search,
  ImageOff,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import placeholder from "@/assets/product-placeholder.jpg";

export function LinkImportDialog({
  open,
  onOpenChange,
  brand,
  categories,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brand: AdminBrand;
  categories: AdminCategory[];
}) {
  const qc = useQueryClient();
  const runStart = useServerFn(startScrape);
  const runStatus = useServerFn(getScrapeStatus);

  const [url, setUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [importing, setImporting] = useState(false);
  const [found, setFound] = useState<ScrapedProduct[] | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [dupes, setDupes] = useState<Set<number>>(new Set());
  const [categoryId, setCategoryId] = useState<string>("");
  const cancelRef = useRef(false);

  const brandCats = useMemo(
    () =>
      categories
        .filter((c) => c.brand_id === brand.id)
        .sort((a, b) => a.sort_order - b.sort_order),
    [categories, brand.id],
  );

  function reset() {
    cancelRef.current = true;
    setUrl("");
    setFound(null);
    setErrorMsg(null);
    setSelected(new Set());
    setScraping(false);
    setProgress(null);
    setImporting(false);
  }

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  async function doScrape() {
    if (!url.trim()) {
      toast.error("Cole o link da página de produtos.");
      return;
    }
    cancelRef.current = false;
    setScraping(true);
    setFound(null);
    setErrorMsg(null);
    setProgress("Iniciando a leitura da página…");
    try {
      const start = await runStart({ data: { url: url.trim() } });
      if (!start.ok || !start.jobId) {
        const msg = start.error ?? "Não foi possível ler a página.";
        setErrorMsg(msg);
        toast.error(msg);
        return;
      }

      // Poll até concluir. Até ~4 minutos (120 tentativas x 2s).
      const maxAttempts = 120;
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (cancelRef.current) return;
        await sleep(2000);
        if (cancelRef.current) return;
        setProgress(
          `Lendo a página e extraindo produtos… (${attempt + 1})`,
        );
        const st = await runStatus({ data: { jobId: start.jobId } });
        if (!st.ok) {
          const msg = st.error ?? "Falha ao ler a página.";
          setErrorMsg(msg);
          toast.error(msg);
          return;
        }
        if (st.status === "completed") {
          setFound(st.products);
          setSelected(new Set(st.products.map((_, i) => i)));
          if (st.products.length === 0) {
            toast.error("Nenhum produto encontrado nesta página.");
          } else {
            toast.success(`${st.products.length} produto(s) encontrado(s).`);
          }
          return;
        }
      }
      setErrorMsg(
        "A leitura demorou mais que o esperado. Tente novamente ou use um link mais específico.",
      );
      toast.error("A leitura demorou demais. Tente novamente.");
    } catch (e: any) {
      const raw = String(e?.message ?? "");
      const friendly = /upstream|timeout|timed out|network|failed to fetch|502|504/i.test(
        raw,
      )
        ? "A busca demorou demais ou o serviço ficou indisponível. Tente novamente em instantes ou use um link mais específico (página de um produto)."
        : raw || "Erro ao fazer o scraping.";
      setErrorMsg(friendly);
      toast.error(friendly);
    } finally {
      setScraping(false);
      setProgress(null);
    }
  }

  function toggle(i: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function confirmImport() {
    if (!found) return;
    const chosen = found.filter((_, i) => selected.has(i));
    if (!chosen.length) {
      toast.error("Selecione ao menos um produto.");
      return;
    }
    setImporting(true);

    const existing =
      (await supabase
        .from("products")
        .select("slug, brand_id")
        .eq("brand_id", brand.id)).data ?? [];
    const existingSlugs = new Set(existing.map((p: any) => p.slug));

    let imported = 0;
    let failed = 0;
    let skipped = 0;

    for (const p of chosen) {
      let slug = slugify(p.name);
      if (!slug) {
        failed++;
        continue;
      }
      if (existingSlugs.has(slug)) {
        // make unique
        slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
      }

      const payload: any = {
        name: p.name,
        slug,
        brand_id: brand.id,
        category_id: categoryId || null,
        model: p.model,
        sku: p.sku,
        short_description: p.short_description,
        full_description: p.full_description,
        main_image_url: p.main_image_url,
        gallery_json: p.gallery,
        specifications_json: p.specifications,
        official_product_url: p.product_url,
        internal_notes: p.price ? `Preço no site de origem: ${p.price}` : null,
        availability_status: "sob_consulta",
        is_active: true,
        is_featured: false,
      };

      const { error } = await supabase.from("products").insert(payload);
      if (error) {
        failed++;
      } else {
        imported++;
        existingSlugs.add(slug);
      }
    }

    setImporting(false);
    toast.success(
      `Importação: ${imported} criado(s)${failed ? `, ${failed} falha(s)` : ""}${
        skipped ? `, ${skipped} ignorado(s)` : ""
      }.`,
    );
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    qc.invalidateQueries({ queryKey: ["products"] });
    reset();
    onOpenChange(false);
  }

  const selectedCount = selected.size;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[92vh] gap-0 overflow-hidden p-0 sm:max-w-2xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="h-5 w-5" /> Importar via link — {brand.name}
          </DialogTitle>
          <DialogDescription>
            Cole o link de uma página de produto ou de uma categoria. Buscamos os
            produtos automaticamente e você escolhe quais cadastrar.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-5">
          <div className="flex gap-2">
            <Input
              placeholder="https://loja.exemplo.com/produto..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !scraping) doScrape();
              }}
            />
            <Button onClick={doScrape} disabled={scraping} className="gap-2">
              {scraping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Buscar
            </Button>
          </div>

          {scraping && progress && (
            <div className="flex items-center gap-2 rounded-xl border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
              <span>{progress}</span>
            </div>
          )}

          {errorMsg && !found && (
            <div className="flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {found && found.length > 0 && (
            <>
              <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
                <div>
                  <Label className="text-xs">Categoria para os importados</Label>
                  <Select value={categoryId} onValueChange={setCategoryId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sem categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {brandCats.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedCount} de {found.length} selecionado(s)
                </p>
              </div>

              <div className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
                {found.map((p, i) => (
                  <label
                    key={i}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-2.5 transition-colors ${
                      selected.has(i)
                        ? "border-primary/50 bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(i)}
                      onChange={() => toggle(i)}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-surface">
                      {p.main_image_url ? (
                        <img
                          src={p.main_image_url}
                          alt={p.name}
                          className="h-full w-full object-contain p-1"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = placeholder;
                          }}
                        />
                      ) : (
                        <ImageOff className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      {p.short_description && (
                        <p className="truncate text-xs text-muted-foreground">
                          {p.short_description}
                        </p>
                      )}
                      {p.price && (
                        <p className="text-xs font-semibold text-primary">
                          {p.price}
                        </p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </>
          )}

          {found && found.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center text-muted-foreground">
              <AlertTriangle className="h-6 w-6" />
              Nenhum produto encontrado nessa página.
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={importing}
          >
            Cancelar
          </Button>
          <Button
            onClick={confirmImport}
            disabled={!found || selectedCount === 0 || importing}
            className="gap-2"
          >
            {importing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Cadastrar {selectedCount > 0 ? `(${selectedCount})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
