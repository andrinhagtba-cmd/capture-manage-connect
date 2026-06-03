import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePremiumShowcase } from "@/lib/site-content";
import { useAdminProducts } from "@/lib/products-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { AdminPageHero, MediaUploadField } from "@/components/admin/ui";
import {
  Loader2,
  Star,
  Save,
  Search,
  Plus,
  X,
  ArrowUp,
  ArrowDown,
  Eye,
  ImageOff,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/premium")({
  component: PremiumAdmin,
});

type FormState = {
  eyebrow: string;
  title: string;
  subtitle: string;
  background_image_url: string;
  background_video_url: string;
  cta_label: string;
  cta_url: string;
  product_ids: string[];
  is_active: boolean;
};

const EMPTY: FormState = {
  eyebrow: "Destaque premium",
  title: "Produto Premium em Destaque",
  subtitle: "",
  background_image_url: "",
  background_video_url: "",
  cta_label: "Ver detalhes",
  cta_url: "",
  product_ids: [],
  is_active: true,
};

function PremiumAdmin() {
  const qc = useQueryClient();
  const { data: config, isLoading } = usePremiumShowcase();
  const { data: products = [] } = useAdminProducts();

  const [form, setForm] = useState<FormState>(EMPTY);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        eyebrow: config.eyebrow ?? "",
        title: config.title ?? "",
        subtitle: config.subtitle ?? "",
        background_image_url: config.background_image_url ?? "",
        background_video_url: config.background_video_url ?? "",
        cta_label: config.cta_label ?? "",
        cta_url: config.cta_url ?? "",
        product_ids: config.product_ids ?? [],
        is_active: config.is_active,
      });
    }
  }, [config]);

  const productById = useMemo(
    () => Object.fromEntries(products.map((p) => [p.id, p])),
    [products],
  );

  const selected = form.product_ids
    .map((id) => productById[id])
    .filter(Boolean);

  const available = products
    .filter((p) => !form.product_ids.includes(p.id))
    .filter((p) =>
      search.trim()
        ? p.name.toLowerCase().includes(search.trim().toLowerCase())
        : true,
    )
    .slice(0, 30);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addProduct(id: string) {
    set("product_ids", [...form.product_ids, id]);
  }
  function removeProduct(id: string) {
    set("product_ids", form.product_ids.filter((x) => x !== id));
  }
  function moveProduct(id: string, dir: -1 | 1) {
    const arr = [...form.product_ids];
    const idx = arr.indexOf(id);
    const swap = idx + dir;
    if (swap < 0 || swap >= arr.length) return;
    [arr[idx], arr[swap]] = [arr[swap], arr[idx]];
    set("product_ids", arr);
  }

  async function save() {
    setSaving(true);
    const payload = {
      eyebrow: form.eyebrow || null,
      title: form.title || null,
      subtitle: form.subtitle || null,
      background_image_url: form.background_image_url || null,
      background_video_url: form.background_video_url || null,
      cta_label: form.cta_label || null,
      cta_url: form.cta_url || null,
      product_ids: form.product_ids,
      is_active: form.is_active,
    };
    const { error } = config
      ? await supabase.from("premium_showcase").update(payload).eq("id", config.id)
      : await supabase.from("premium_showcase").insert(payload);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Seção premium atualizada");
    qc.invalidateQueries({ queryKey: ["premium_showcase"] });
  }

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
        eyebrow="Conteúdo do Site"
        title="Produto Premium destaque"
        subtitle="Configure a vitrine premium da home: textos, fundo, produtos em destaque e chamada para ação."
        icon={Star}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Produto Premium destaque" }]}
        metrics={[
          { label: "Produtos selecionados", value: selected.length, icon: Star },
          { label: "Status", value: form.is_active ? "Ativa" : "Inativa", icon: Eye, tone: form.is_active ? "success" : "default" },
        ]}
        actions={
          <Button onClick={save} disabled={saving} className="gap-2 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        }
      />

      <div className="rounded-xl border border-border bg-background p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Seção ativa</h3>
            <p className="text-sm text-muted-foreground">Exibir a vitrine premium na página inicial.</p>
          </div>
          <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
        </div>
      </div>

      {/* Texts */}
      <div className="rounded-xl border border-border bg-background p-5">
        <h3 className="mb-4 font-semibold">Textos</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-sm">Chapéu (eyebrow)</Label>
            <Input value={form.eyebrow} onChange={(e) => set("eyebrow", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Título</Label>
            <Input value={form.title} onChange={(e) => set("title", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm">Subtítulo</Label>
            <Textarea rows={2} value={form.subtitle} onChange={(e) => set("subtitle", e.target.value)} />
          </div>
        </div>
      </div>

      {/* Background + CTA */}
      <div className="rounded-xl border border-border bg-background p-5">
        <h3 className="mb-4 font-semibold">Fundo e chamada</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <MediaUploadField
            label="Imagem de fundo"
            value={form.background_image_url}
            onChange={(url) => set("background_image_url", url)}
            folder="premium"
            hint="Usada quando não houver vídeo. JPG, PNG, WEBP"
          />
          <MediaUploadField
            label="Vídeo de fundo (opcional)"
            value={form.background_video_url}
            onChange={(url) => set("background_video_url", url)}
            folder="premium"
            kind="video"
            hint="Tem prioridade sobre a imagem. MP4, WEBM"
          />
          <div className="space-y-1.5">
            <Label className="text-sm">Texto do botão</Label>
            <Input value={form.cta_label} onChange={(e) => set("cta_label", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-sm">Link do botão (opcional)</Label>
            <Input
              value={form.cta_url}
              onChange={(e) => set("cta_url", e.target.value)}
              placeholder="/produto/dji-flycart-100"
            />
            <p className="text-xs text-muted-foreground">Vazio = leva ao catálogo.</p>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="rounded-xl border border-border bg-background p-5">
        <h3 className="mb-1 font-semibold">Produtos em destaque</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Escolha quais produtos aparecem na vitrine. A ordem abaixo define a ordem na home.
        </p>

        {/* Selected */}
        {selected.length > 0 ? (
          <div className="mb-5 space-y-2">
            {selected.map((p, idx) => (
              <div key={p.id} className="flex items-center gap-3 rounded-lg border border-border bg-surface p-2.5">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-background">
                  {p.main_image_url ? (
                    <img src={p.main_image_url} alt={p.name} className="h-full w-full object-contain" />
                  ) : (
                    <ImageOff className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <span className="flex-1 truncate text-sm font-medium">{p.name}</span>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => moveProduct(p.id, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={idx === selected.length - 1} onClick={() => moveProduct(p.id, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-destructive" onClick={() => removeProduct(p.id)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-5 rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Nenhum produto selecionado.
          </p>
        )}

        {/* Add */}
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar produto para adicionar…"
            className="pl-9"
          />
        </div>
        <div className="max-h-64 space-y-1.5 overflow-y-auto">
          {available.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => addProduct(p.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-border bg-card p-2 text-left transition-colors hover:border-primary/50 hover:bg-surface"
            >
              <div className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md bg-surface">
                {p.main_image_url ? (
                  <img src={p.main_image_url} alt={p.name} className="h-full w-full object-contain" />
                ) : (
                  <ImageOff className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <span className="flex-1 truncate text-sm">{p.name}</span>
              {!p.is_active && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">Inativo</span>
              )}
              <Plus className="h-4 w-4 text-primary" />
            </button>
          ))}
          {available.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">Nenhum produto encontrado.</p>
          )}
        </div>
      </div>

      {/* Save bar (always reachable at the bottom too) */}
      <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
        <p className="text-sm text-muted-foreground">
          {selected.length} produto(s) selecionado(s)
        </p>
        <Button onClick={save} disabled={saving} className="gap-2 rounded-xl">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
