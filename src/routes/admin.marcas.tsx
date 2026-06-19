import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrands, type Brand } from "@/lib/catalog";
import { useBrandPageSettingsList, useHeroBanners, type BrandPageSettings } from "@/lib/site-content";
import { slugify } from "@/lib/products-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Tag, Eye, Plus, ImageIcon, ArrowUp, ArrowDown } from "lucide-react";
import { AdminPageHero, MediaUploadField } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/marcas")({
  component: MarcasAdmin,
});

const BRAND_NAMES: Record<string, string> = {
  canon: "Canon",
  dji: "DJI",
  sony: "Sony",
  gopro: "GoPro",
};

function MarcasAdmin() {
  const qc = useQueryClient();
  const { data: pages, isLoading } = useBrandPageSettingsList();
  const { data: brands } = useBrands();
  const { data: heroBanners } = useHeroBanners();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["brand_page_settings"] });
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
    qc.invalidateQueries({ queryKey: ["brands"] });
    qc.invalidateQueries({ queryKey: ["hero_banners"] });
  }

  // Cria ou atualiza o banner (hero) usado no topo da página da marca.
  // A imagem do banner da marca fica em hero_banners com location = slug.
  async function setBrandHeroImage(
    slug: string,
    field: "desktop_image_url" | "mobile_image_url",
    url: string,
  ) {
    const existing = (heroBanners ?? []).find((b) => b.location === slug);
    if (existing) {
      const patch =
        field === "desktop_image_url"
          ? { desktop_image_url: url }
          : { mobile_image_url: url };
      const { error } = await supabase
        .from("hero_banners")
        .update(patch)
        .eq("id", existing.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("hero_banners").insert({
        location: slug,
        title: BRAND_NAMES[slug] ?? slug,
        media_type: "image",
        is_active: true,
        order_index: 0,
        desktop_image_url: field === "desktop_image_url" ? url : null,
        mobile_image_url: field === "mobile_image_url" ? url : null,
      });
      if (error) return toast.error(error.message);
    }
    toast.success("Imagem do banner atualizada");
    invalidate();
  }

  async function updateBrandCardImage(slug: string, url: string) {
    const brand = brands?.find((b) => b.slug === slug);
    if (!brand) return;
    const { error } = await supabase.from("brands").update({ card_image_url: url }).eq("id", brand.id);
    if (error) return toast.error(error.message);
    toast.success("Imagem do card atualizada");
    invalidate();
  }

  async function createBrand() {
    const trimmed = name.trim();
    if (!trimmed) return toast.error("Informe o nome da marca.");
    const slug = slugify(trimmed);
    if (!slug) return toast.error("Nome inválido para gerar o endereço (slug).");

    setSaving(true);
    try {
      const maxSort = Math.max(0, ...(pages ?? []).map(() => 0));
      const { error: brandErr } = await supabase.from("brands").insert({
        name: trimmed,
        slug,
        description: description.trim() || null,
        sort_order: maxSort,
      });
      if (brandErr) {
        if (brandErr.code === "23505") throw new Error("Já existe uma marca com esse nome/endereço.");
        throw brandErr;
      }

      // Cria a página de marca correspondente (ignora se já existir).
      await supabase.from("brand_page_settings").insert({
        brand_slug: slug,
        intro_title: trimmed,
        intro_text: description.trim() || null,
        is_published: false,
      });

      toast.success(`Marca "${trimmed}" criada.`);
      setName("");
      setDescription("");
      setCreateOpen(false);
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Não foi possível criar a marca.");
    } finally {
      setSaving(false);
    }
  }

  async function update(id: string, patch: Partial<BrandPageSettings>) {
    const { error } = await supabase.from("brand_page_settings").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  }

  async function moveBrand(slug: string, dir: -1 | 1) {
    if (!brands) return;
    const sorted = [...brands].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex((b) => b.slug === slug);
    if (idx < 0) return;
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const current = sorted[idx];
    const swap = sorted[swapIdx];
    const { error: err1 } = await supabase.from("brands").update({ sort_order: swap.sort_order }).eq("id", current.id);
    const { error: err2 } = await supabase.from("brands").update({ sort_order: current.sort_order }).eq("id", swap.id);
    if (err1 || err2) return toast.error((err1 || err2)?.message);
    toast.success("Ordem atualizada");
    invalidate();
  }

  const brandMap = new Map(brands?.map((b) => [b.slug, b]) ?? []);
  const orderedPages = (pages ?? [])
    .map((p) => ({ ...p, _sortOrder: brandMap.get(p.brand_slug)?.sort_order ?? 0 }))
    .sort((a, b) => a._sortOrder - b._sortOrder);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHero
        eyebrow="Catálogo"
        title="Páginas de Marca"
        subtitle="Gerencie a identidade, textos, botões e SEO das páginas dedicadas de Canon, DJI, Sony e GoPro."
        icon={Tag}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Páginas de Marca" }]}
        metrics={[
          { label: "Marcas", value: pages?.length ?? 0, icon: Tag },
          { label: "Publicadas", value: (pages ?? []).filter((p) => p.is_published).length, icon: Eye, tone: "success" },
        ]}
      />

      <div className="flex justify-end">
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Nova marca
        </Button>
      </div>

      <div className="space-y-4">

        {orderedPages.map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{BRAND_NAMES[p.brand_slug] ?? p.brand_slug}</h2>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveBrand(p.brand_slug, -1)} title="Subir">
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => moveBrand(p.brand_slug, 1)} title="Descer">
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Switch checked={p.is_published} onCheckedChange={(v) => update(p.id, { is_published: v })} />
                <Label className="text-sm">{p.is_published ? "Publicada" : "Rascunho"}</Label>
              </div>
            </div>

            {(() => {
              const banner = (heroBanners ?? []).find((b) => b.location === p.brand_slug);
              return (
                <div className="mb-4 rounded-lg border border-border/70 bg-surface/40 p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Imagem do banner (topo da página)</p>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <MediaUploadField
                      label="Imagem desktop"
                      value={banner?.desktop_image_url}
                      folder="banners"
                      onChange={(url) => setBrandHeroImage(p.brand_slug, "desktop_image_url", url)}
                    />
                    <MediaUploadField
                      label="Imagem mobile (opcional)"
                      value={banner?.mobile_image_url}
                      folder="banners"
                      onChange={(url) => setBrandHeroImage(p.brand_slug, "mobile_image_url", url)}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Para textos, botões e vídeo do banner, use a página de Banners e Heros.
                  </p>
                </div>
              );
            })()}


            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Chapéu (eyebrow)">
                <Input defaultValue={p.intro_eyebrow ?? ""} onBlur={(e) => e.target.value !== (p.intro_eyebrow ?? "") && update(p.id, { intro_eyebrow: e.target.value })} />
              </Field>
              <Field label="Título da introdução">
                <Input defaultValue={p.intro_title ?? ""} onBlur={(e) => e.target.value !== (p.intro_title ?? "") && update(p.id, { intro_title: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Texto institucional">
                  <Textarea defaultValue={p.intro_text ?? ""} rows={3} onBlur={(e) => e.target.value !== (p.intro_text ?? "") && update(p.id, { intro_text: e.target.value })} />
                </Field>
              </div>
              <Field label="Botão principal — texto">
                <Input defaultValue={p.primary_button_label ?? ""} onBlur={(e) => e.target.value !== (p.primary_button_label ?? "") && update(p.id, { primary_button_label: e.target.value })} />
              </Field>
              <Field label="Botão principal — link (vazio = orçamento)">
                <Input defaultValue={p.primary_button_url ?? ""} onBlur={(e) => e.target.value !== (p.primary_button_url ?? "") && update(p.id, { primary_button_url: e.target.value })} />
              </Field>
              <Field label="Botão secundário — texto">
                <Input defaultValue={p.secondary_button_label ?? ""} onBlur={(e) => e.target.value !== (p.secondary_button_label ?? "") && update(p.id, { secondary_button_label: e.target.value })} />
              </Field>
              <Field label="Botão secundário — link">
                <Input defaultValue={p.secondary_button_url ?? ""} onBlur={(e) => e.target.value !== (p.secondary_button_url ?? "") && update(p.id, { secondary_button_url: e.target.value })} />
              </Field>
              <Field label="SEO — título">
                <Input defaultValue={p.meta_title ?? ""} onBlur={(e) => e.target.value !== (p.meta_title ?? "") && update(p.id, { meta_title: e.target.value })} />
              </Field>
              <Field label="SEO — descrição">
                <Input defaultValue={p.meta_description ?? ""} onBlur={(e) => e.target.value !== (p.meta_description ?? "") && update(p.id, { meta_description: e.target.value })} />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={p.show_categories} onCheckedChange={(v) => update(p.id, { show_categories: v })} />
                <Label className="text-sm">Mostrar categorias</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={p.show_products} onCheckedChange={(v) => update(p.id, { show_products: v })} />
                <Label className="text-sm">Mostrar produtos</Label>
              </div>
            </div>
          </div>
        ))}
        {(pages ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma página de marca configurada.
          </p>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={(o) => !saving && setCreateOpen(o)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova marca de produto</DialogTitle>
            <DialogDescription>
              Cria a marca no catálogo (disponível ao cadastrar produtos) e sua página dedicada.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Field label="Nome da marca">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Nikon"
                autoFocus
              />
              {name.trim() && (
                <p className="text-xs text-muted-foreground">Endereço: /marca/{slugify(name)}</p>
              )}
            </Field>
            <Field label="Descrição (opcional)">
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Breve descrição da marca"
              />
            </Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={createBrand} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Criar marca
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
