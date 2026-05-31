import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  AVAIL_OPTIONS,
  asArray,
  slugify,
  saveProductRelations,
  uploadToMedia,
  type AdminBrand,
  type AdminCategory,
  type AdminProduct,
} from "@/lib/products-admin";
import { AVAILABILITY_LABELS, AVAILABILITY_TONE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, X, Upload, Loader2, GripVertical, Search, MessageCircle, Star } from "lucide-react";
import { toast } from "sonner";
import placeholder from "@/assets/product-placeholder.jpg";

type Spec = { name: string; value: string };

type FormState = {
  id: string;
  name: string;
  slug: string;
  brand_id: string;
  category_id: string;
  model: string;
  sku: string;
  availability_status: string;
  is_active: boolean;
  is_featured: boolean;
  main_image_url: string;
  video_url: string;
  thumbnail_url: string;
  gallery: string[];
  short_description: string;
  full_description: string;
  specs: Spec[];
  tags: string[];
  use_cases: string[];
  order_index: string;
  seo_title: string;
  seo_description: string;
  seo_image_url: string;
  official_product_url: string;
  internal_price: string;
  internal_notes: string;
  related: { related_product_id: string; relation_type: string }[];
};

function emptyForm(brandId?: string): FormState {
  return {
    id: "",
    name: "",
    slug: "",
    brand_id: brandId ?? "",
    category_id: "",
    model: "",
    sku: "",
    availability_status: "sob_consulta",
    is_active: true,
    is_featured: false,
    main_image_url: "",
    video_url: "",
    thumbnail_url: "",
    gallery: [],
    short_description: "",
    full_description: "",
    specs: [],
    tags: [],
    use_cases: [],
    order_index: "0",
    seo_title: "",
    seo_description: "",
    seo_image_url: "",
    official_product_url: "",
    internal_price: "",
    internal_notes: "",
    related: [],
  };
}

function fromProduct(p: AdminProduct): FormState {
  const specs = asArray(p.specifications_json).map((s: any) => ({
    name: s.name ?? s.label ?? s.key ?? "",
    value: s.value ?? s.val ?? "",
  }));
  return {
    id: p.id,
    name: p.name ?? "",
    slug: p.slug ?? "",
    brand_id: p.brand_id ?? "",
    category_id: p.category_id ?? "",
    model: p.model ?? "",
    sku: p.sku ?? "",
    availability_status: p.availability_status ?? "sob_consulta",
    is_active: p.is_active,
    is_featured: p.is_featured,
    main_image_url: p.main_image_url ?? "",
    video_url: p.video_url ?? "",
    thumbnail_url: p.thumbnail_url ?? "",
    gallery: asArray(p.gallery_json).map(String),
    short_description: p.short_description ?? "",
    full_description: p.full_description ?? "",
    specs,
    tags: asArray(p.tags_json).map(String),
    use_cases: asArray(p.use_cases_json).map(String),
    order_index: String(p.order_index ?? 0),
    seo_title: p.seo_title ?? "",
    seo_description: p.seo_description ?? "",
    seo_image_url: p.seo_image_url ?? "",
    official_product_url: p.official_product_url ?? "",
    internal_price: p.internal_price != null ? String(p.internal_price) : "",
    internal_notes: p.internal_notes ?? "",
    related: [],
  };
}

export function ProductForm({
  open,
  onOpenChange,
  product,
  defaultBrandId,
  brands,
  categories,
  allProducts,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  product: AdminProduct | null;
  defaultBrandId?: string;
  brands: AdminBrand[];
  categories: AdminCategory[];
  allProducts: AdminProduct[];
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<FormState>(emptyForm(defaultBrandId));
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("basico");
  const [relatedSearch, setRelatedSearch] = useState("");
  const mainFileRef = useRef<HTMLInputElement>(null);
  const galleryFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setTab("basico");
    setRelatedSearch("");
    if (product) {
      setForm(fromProduct(product));
      // load relations
      supabase
        .from("product_related")
        .select("related_product_id, relation_type, order_index")
        .eq("product_id", product.id)
        .order("order_index")
        .then(({ data }) => {
          setForm((f) => ({
            ...f,
            related: (data ?? []).map((r) => ({
              related_product_id: r.related_product_id,
              relation_type: r.relation_type,
            })),
          }));
        });
    } else {
      setForm(emptyForm(defaultBrandId));
    }
  }, [open, product, defaultBrandId]);

  const set = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }));

  const brandCats = useMemo(
    () => categories.filter((c) => c.brand_id === form.brand_id),
    [categories, form.brand_id],
  );

  const relatedCandidates = useMemo(() => {
    const term = relatedSearch.toLowerCase();
    const chosen = new Set(form.related.map((r) => r.related_product_id));
    return allProducts
      .filter(
        (p) =>
          p.id !== form.id &&
          !chosen.has(p.id) &&
          (!form.brand_id || p.brand_id === form.brand_id) &&
          (term === "" ||
            p.name.toLowerCase().includes(term) ||
            (p.sku ?? "").toLowerCase().includes(term)),
      )
      .slice(0, 8);
  }, [allProducts, relatedSearch, form.related, form.id, form.brand_id]);

  function validate(): string | null {
    if (!form.name.trim()) return "Informe o nome do produto.";
    if (!form.brand_id) return "Selecione a marca (obrigatório).";
    if (!form.category_id) return "Selecione a categoria (obrigatório).";
    const slug = form.slug.trim() || slugify(form.name);
    const dupSlug = allProducts.find(
      (p) => p.id !== form.id && p.brand_id === form.brand_id && p.slug === slug,
    );
    if (dupSlug) return "Já existe um produto com este slug nesta marca.";
    if (form.sku.trim()) {
      const dupSku = allProducts.find(
        (p) =>
          p.id !== form.id &&
          p.brand_id === form.brand_id &&
          (p.sku ?? "").toLowerCase() === form.sku.trim().toLowerCase(),
      );
      if (dupSku) return "Já existe um produto com este SKU nesta marca.";
    }
    const cat = categories.find((c) => c.id === form.category_id);
    if (cat && cat.brand_id && cat.brand_id !== form.brand_id)
      return "A categoria selecionada não pertence a esta marca.";
    return null;
  }

  async function save() {
    const err = validate();
    if (err) {
      toast.error(err);
      return;
    }
    setSaving(true);
    const payload: any = {
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      brand_id: form.brand_id,
      category_id: form.category_id,
      model: form.model || null,
      sku: form.sku || null,
      short_description: form.short_description || null,
      full_description: form.full_description || null,
      main_image_url: form.main_image_url || null,
      video_url: form.video_url || null,
      thumbnail_url: form.thumbnail_url || null,
      gallery_json: form.gallery.filter(Boolean),
      specifications_json: form.specs.filter((s) => s.name.trim()),
      tags_json: form.tags.filter(Boolean),
      use_cases_json: form.use_cases.filter(Boolean),
      official_product_url: form.official_product_url || null,
      availability_status: form.availability_status,
      internal_price: form.internal_price ? Number(form.internal_price) : null,
      internal_notes: form.internal_notes || null,
      seo_title: form.seo_title || null,
      seo_description: form.seo_description || null,
      seo_image_url: form.seo_image_url || null,
      order_index: Number(form.order_index) || 0,
      is_featured: form.is_featured,
      is_active: form.is_active,
    };
    try {
      let id = form.id;
      if (id) {
        const { error } = await supabase.from("products").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("products")
          .insert(payload)
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      }
      await saveProductRelations(id, form.related);
      toast.success(form.id ? "Produto atualizado." : "Produto criado.");
      onOpenChange(false);
      qc.invalidateQueries({ queryKey: ["admin-products"] });
      qc.invalidateQueries({ queryKey: ["products"] });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function handleUpload(
    file: File | undefined,
    kind: "main" | "gallery",
  ) {
    if (!file) return;
    try {
      const url = await uploadToMedia(file);
      if (kind === "main") set({ main_image_url: url });
      else set({ gallery: [...form.gallery, url] });
      toast.success("Imagem enviada.");
    } catch (e: any) {
      toast.error(e?.message ?? "Falha no upload.");
    }
  }

  const productName = (id: string) =>
    allProducts.find((p) => p.id === id)?.name ?? "Produto";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="border-b border-border px-6 py-4">
          <DialogTitle>{form.id ? "Editar produto" : "Novo produto"}</DialogTitle>
        </DialogHeader>

        <div className="flex min-h-0 flex-1">
          <Tabs value={tab} onValueChange={setTab} className="flex min-w-0 flex-1 flex-col">
            <div className="border-b border-border px-4">
              <TabsList className="h-auto flex-wrap justify-start gap-1 bg-transparent p-2">
                <TabsTrigger value="basico">Básico</TabsTrigger>
                <TabsTrigger value="midia">Mídia</TabsTrigger>
                <TabsTrigger value="descricoes">Descrições</TabsTrigger>
                <TabsTrigger value="specs">Especificações</TabsTrigger>
                <TabsTrigger value="organizacao">Organização</TabsTrigger>
                <TabsTrigger value="seo">SEO</TabsTrigger>
                <TabsTrigger value="links">Links e observações</TabsTrigger>
              </TabsList>
            </div>

            <div className="max-h-[64vh] overflow-y-auto px-6 py-6">

            {/* TAB 1 — Básico */}
            <TabsContent value="basico" className="mt-0 grid gap-4 sm:grid-cols-2">
              <Field label="Nome *" className="sm:col-span-2">
                <Input
                  value={form.name}
                  onChange={(e) =>
                    set({
                      name: e.target.value,
                      slug: form.id ? form.slug : slugify(e.target.value),
                    })
                  }
                />
              </Field>
              <Field label="Slug (automático)">
                <Input value={form.slug} onChange={(e) => set({ slug: e.target.value })} />
              </Field>
              <Field label="Modelo">
                <Input value={form.model} onChange={(e) => set({ model: e.target.value })} />
              </Field>
              <Field label="Marca *">
                <Select
                  value={form.brand_id}
                  onValueChange={(v) => set({ brand_id: v, category_id: "" })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Categoria *">
                <Select
                  value={form.category_id}
                  onValueChange={(v) => set({ category_id: v })}
                  disabled={!form.brand_id}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={form.brand_id ? "Selecione" : "Escolha a marca antes"}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {brandCats.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <Field label="SKU">
                <Input value={form.sku} onChange={(e) => set({ sku: e.target.value })} />
              </Field>
              <Field label="Disponibilidade">
                <Select
                  value={form.availability_status}
                  onValueChange={(v) => set({ availability_status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAIL_OPTIONS.map((a) => (
                      <SelectItem key={a} value={a}>
                        {AVAILABILITY_LABELS[a]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
              <div className="flex items-center gap-6 sm:col-span-2">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.is_active}
                    onCheckedChange={(v) => set({ is_active: v })}
                  />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={form.is_featured}
                    onCheckedChange={(v) => set({ is_featured: v })}
                  />
                  Destaque
                </label>
              </div>
            </TabsContent>

            {/* TAB 2 — Mídia */}
            <TabsContent value="midia" className="mt-0 space-y-5">
              <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                <div className="overflow-hidden rounded-xl border border-border bg-surface">
                  <img
                    src={form.main_image_url || placeholder}
                    alt=""
                    className="aspect-square w-full object-contain p-2"
                  />
                </div>
                <div className="space-y-3">
                  <Field label="Imagem principal (URL)">
                    <Input
                      value={form.main_image_url}
                      onChange={(e) => set({ main_image_url: e.target.value })}
                    />
                  </Field>
                  <input
                    ref={mainFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0], "main")}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => mainFileRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" /> Enviar imagem
                  </Button>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label className="text-sm">Galeria de imagens</Label>
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleUpload(e.target.files?.[0], "gallery")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => galleryFileRef.current?.click()}
                  >
                    <Plus className="h-4 w-4" /> Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {form.gallery.map((url, i) => (
                    <div
                      key={i}
                      className="group relative h-20 w-20 overflow-hidden rounded-lg border border-border"
                    >
                      <img src={url} alt="" className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          set({ gallery: form.gallery.filter((_, idx) => idx !== i) })
                        }
                        className="absolute right-1 top-1 rounded bg-background/90 p-0.5 opacity-0 transition group-hover:opacity-100"
                      >
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </button>
                    </div>
                  ))}
                  <Input
                    placeholder="Colar URL e Enter"
                    className="h-20 w-44"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = (e.target as HTMLInputElement).value.trim();
                        if (v) set({ gallery: [...form.gallery, v] });
                        (e.target as HTMLInputElement).value = "";
                      }
                    }}
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Vídeo do produto (URL)">
                  <Input
                    value={form.video_url}
                    onChange={(e) => set({ video_url: e.target.value })}
                  />
                </Field>
                <Field label="Thumbnail do vídeo (URL)">
                  <Input
                    value={form.thumbnail_url}
                    onChange={(e) => set({ thumbnail_url: e.target.value })}
                  />
                </Field>
              </div>
            </TabsContent>

            {/* TAB 3 — Descrições */}
            <TabsContent value="descricoes" className="mt-0 space-y-4">
              <Field label="Descrição curta (texto do card)">
                <Textarea
                  rows={2}
                  value={form.short_description}
                  onChange={(e) => set({ short_description: e.target.value })}
                />
              </Field>
              <Field label="Descrição completa (página do produto)">
                <Textarea
                  rows={6}
                  value={form.full_description}
                  onChange={(e) => set({ full_description: e.target.value })}
                />
              </Field>
              <ChipEditor
                label="Benefícios / Indicado para"
                items={form.use_cases}
                onChange={(use_cases) => set({ use_cases })}
                placeholder="Ex.: Ideal para viagens"
              />
            </TabsContent>

            {/* TAB 4 — Especificações */}
            <TabsContent value="specs" className="mt-0 space-y-3">
              <p className="text-sm text-muted-foreground">
                Editor dinâmico de especificações técnicas (salvo em JSON).
              </p>
              {form.specs.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    placeholder="Nome (ex.: Sensor)"
                    value={s.name}
                    onChange={(e) => {
                      const specs = [...form.specs];
                      specs[i] = { ...specs[i], name: e.target.value };
                      set({ specs });
                    }}
                  />
                  <Input
                    placeholder='Valor (ex.: 1/1.3")'
                    value={s.value}
                    onChange={(e) => {
                      const specs = [...form.specs];
                      specs[i] = { ...specs[i], value: e.target.value };
                      set({ specs });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => set({ specs: form.specs.filter((_, idx) => idx !== i) })}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => set({ specs: [...form.specs, { name: "", value: "" }] })}
              >
                <Plus className="h-4 w-4" /> Adicionar especificação
              </Button>
            </TabsContent>

            {/* TAB 5 — Comercial */}
            <TabsContent value="organizacao" className="mt-0 space-y-5">
              <ChipEditor
                label="Tags"
                items={form.tags}
                onChange={(tags) => set({ tags })}
                placeholder="Ex.: lançamento"
              />
              <Field label="Ordem de exibição">
                <Input
                  type="number"
                  className="w-32"
                  value={form.order_index}
                  onChange={(e) => set({ order_index: e.target.value })}
                />
              </Field>
              <label className="flex items-center gap-2 text-sm">
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(v) => set({ is_featured: v })}
                />
                Produto recomendado / destaque
              </label>

              <div>
                <Label className="text-sm">Produtos relacionados</Label>
                <p className="mb-2 text-xs text-muted-foreground">
                  Sugestões da mesma marca. Busque e adicione.
                </p>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    placeholder="Buscar produto da marca..."
                    value={relatedSearch}
                    onChange={(e) => setRelatedSearch(e.target.value)}
                  />
                </div>
                {relatedSearch && relatedCandidates.length > 0 && (
                  <div className="mt-1 rounded-lg border border-border">
                    {relatedCandidates.map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted"
                        onClick={() => {
                          set({
                            related: [
                              ...form.related,
                              { related_product_id: p.id, relation_type: "related" },
                            ],
                          });
                          setRelatedSearch("");
                        }}
                      >
                        {p.name}
                        <Plus className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                )}
                <div className="mt-3 space-y-2">
                  {form.related.map((r, i) => (
                    <div
                      key={r.related_product_id}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                      <span className="flex-1">{productName(r.related_product_id)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() =>
                          set({ related: form.related.filter((_, idx) => idx !== i) })
                        }
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* TAB 6 — SEO */}
            <TabsContent value="seo" className="mt-0 space-y-4">
              <Field label="SEO title">
                <Input
                  value={form.seo_title}
                  onChange={(e) => set({ seo_title: e.target.value })}
                />
              </Field>
              <Field label="SEO description">
                <Textarea
                  rows={3}
                  value={form.seo_description}
                  onChange={(e) => set({ seo_description: e.target.value })}
                />
              </Field>
              <Field label="SEO image (URL)">
                <Input
                  value={form.seo_image_url}
                  onChange={(e) => set({ seo_image_url: e.target.value })}
                />
              </Field>
              <div className="rounded-xl border border-border bg-surface p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Preview SEO
                </p>
                <p className="mt-1 truncate text-sm text-[#1a0dab]">
                  {form.seo_title || form.name || "Título do produto"}
                </p>
                <p className="truncate text-xs text-[#006621]">
                  /produto/{form.slug || slugify(form.name) || "slug"}
                </p>
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {form.seo_description || form.short_description || "Descrição do produto."}
                </p>
              </div>
            </TabsContent>

            {/* TAB 7 — Links e origem */}
            <TabsContent value="links" className="mt-0 space-y-4">
              <Field label="Link oficial do fabricante (URL)">
                <Input
                  value={form.official_product_url}
                  onChange={(e) => set({ official_product_url: e.target.value })}
                />
              </Field>
              <Field label="Preço interno (privado, R$)">
                <Input
                  type="number"
                  value={form.internal_price}
                  onChange={(e) => set({ internal_price: e.target.value })}
                />
              </Field>
              <Field label="Observações internas">
                <Textarea
                  rows={4}
                  value={form.internal_notes}
                  onChange={(e) => set({ internal_notes: e.target.value })}
                />
              </Field>
            </TabsContent>
            </div>
          </Tabs>

          {/* Live preview */}
          <aside className="hidden w-[300px] shrink-0 overflow-y-auto border-l border-border bg-surface/50 p-5 lg:block">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Pré-visualização
            </p>
            <ProductPreview
              imageUrl={form.main_image_url}
              name={form.name}
              brandName={brands.find((b) => b.id === form.brand_id)?.name}
              categoryName={categories.find((c) => c.id === form.category_id)?.name}
              availability={form.availability_status}
              isActive={form.is_active}
              isFeatured={form.is_featured}
            />
          </aside>
        </div>


        <DialogFooter className="border-t border-border px-6 py-4">
          {form.is_featured && <Badge variant="secondary">Destaque</Badge>}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={save} disabled={saving} className="gap-2">
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}

function ChipEditor({
  label,
  items,
  onChange,
  placeholder,
}: {
  label: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [value, setValue] = useState("");
  return (
    <div>
      <Label className="text-sm">{label}</Label>
      <div className="mt-1.5 flex flex-wrap gap-2">
        {items.map((it, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-sm"
          >
            {it}
            <button
              type="button"
              onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <Input
        className="mt-2"
        placeholder={placeholder ?? "Adicionar e Enter"}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const v = value.trim();
            if (v) onChange([...items, v]);
            setValue("");
          }
        }}
      />
    </div>
  );
}

function ProductPreview({
  imageUrl,
  name,
  brandName,
  categoryName,
  availability,
  isActive,
  isFeatured,
}: {
  imageUrl: string;
  name: string;
  brandName?: string;
  categoryName?: string;
  availability: string;
  isActive: boolean;
  isFeatured: boolean;
}) {
  return (
    <div className="sticky top-0 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="relative aspect-square bg-surface p-4">
        <img
          src={imageUrl || placeholder}
          alt={name || "Produto"}
          className="h-full w-full object-contain"
        />
        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
            AVAILABILITY_TONE[availability] ?? "bg-muted text-muted-foreground"
          }`}
        >
          {AVAILABILITY_LABELS[availability] ?? "Sob consulta"}
        </span>
        {isFeatured && (
          <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Star className="h-3 w-3 fill-white" /> Destaque
          </span>
        )}
      </div>

      <div className="space-y-2 border-t border-border p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {brandName ?? "Marca"} · {categoryName ?? "Categoria"}
        </p>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug">
          {name || "Nome do produto"}
        </h3>
        <div className="flex items-center gap-2 pt-1">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              isActive ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"
            }`}
          >
            {isActive ? "Ativo" : "Inativo"}
          </span>
          <span className="text-[11px] text-muted-foreground">Consultar preço</span>
        </div>
        <Button className="mt-2 w-full gap-2" size="sm" type="button" disabled>
          <MessageCircle className="h-4 w-4" /> Solicitar orçamento
        </Button>
      </div>
    </div>
  );
}

