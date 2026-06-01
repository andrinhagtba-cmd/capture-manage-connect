import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useBrandPageSettingsList, type BrandPageSettings } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
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

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["brand_page_settings"] });
  }

  async function update(id: string, patch: Partial<BrandPageSettings>) {
    const { error } = await supabase.from("brand_page_settings").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
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
        eyebrow="Catálogo"
        title="Páginas de Marca"
        subtitle="Gerencie a identidade, textos, botões e SEO das páginas dedicadas de Canon, DJI, Sony e GoPro."
        icon={Tag}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Páginas de Marca" }]}
        metrics={[
          { label: "Marcas", value: pages?.length ?? 0, icon: Tag },
          { label: "Ativas", value: (pages ?? []).filter((p) => p.is_active).length, icon: Eye, tone: "success" },
        ]}
      />

      <div className="space-y-4">
        {(pages ?? []).map((p) => (
          <div key={p.id} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">{BRAND_NAMES[p.brand_slug] ?? p.brand_slug}</h2>
              <div className="flex items-center gap-2">
                <Switch checked={p.is_published} onCheckedChange={(v) => update(p.id, { is_published: v })} />
                <Label className="text-sm">{p.is_published ? "Publicada" : "Rascunho"}</Label>
              </div>
            </div>

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
