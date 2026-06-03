import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHomeSections, type HomeSection } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowUp, ArrowDown, Home as HomeIcon, Eye } from "lucide-react";
import { AdminPageHero } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/home")({
  component: HomeAdmin,
});

const SECTION_LABELS: Record<string, string> = {
  brands: "Marcas (grade de cards)",
  premium: "Produto Premium em Destaque",
  features: "Por que comprar (diferenciais)",
  drones: "Vitrine Drones / DJI",
  canon: "Vitrine Canon",
  sony: "Vitrine Sony",
  gopro: "Vitrine GoPro",
  featured: "Produtos em destaque",
  cta: "Chamada final (CTA orçamento)",
};

function HomeAdmin() {
  const qc = useQueryClient();
  const { data: sections, isLoading } = useHomeSections();

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["home_sections"] });
  }

  async function update(id: string, patch: Partial<HomeSection>) {
    const { error } = await supabase.from("home_sections").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  }

  async function move(item: HomeSection, dir: -1 | 1) {
    const list = sections ?? [];
    const idx = list.findIndex((i) => i.id === item.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("home_sections").update({ order_index: swap.order_index }).eq("id", item.id),
      supabase.from("home_sections").update({ order_index: item.order_index }).eq("id", swap.id),
    ]);
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
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminPageHero
        eyebrow="Conteúdo do Site"
        title="Home Page"
        subtitle="Monte a página inicial com seções, vídeos, marcas, produtos em destaque e chamadas premium."
        icon={HomeIcon}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Home Page" }]}
        metrics={[
          { label: "Seções", value: sections?.length ?? 0, icon: HomeIcon },
          { label: "Ativas", value: (sections ?? []).filter((s) => s.is_active).length, icon: Eye, tone: "success" },
        ]}
      />

      <div className="space-y-3">
        {(sections ?? []).map((s, idx) => (
          <div key={s.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch checked={s.is_active} onCheckedChange={(v) => update(s.id, { is_active: v })} />
                <span className="font-semibold">{SECTION_LABELS[s.section_key] ?? s.section_key}</span>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(s, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" disabled={idx === (sections?.length ?? 0) - 1} onClick={() => move(s, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-sm">Chapéu (eyebrow)</Label>
                <Input defaultValue={s.eyebrow ?? ""} onBlur={(e) => e.target.value !== (s.eyebrow ?? "") && update(s.id, { eyebrow: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm">Título</Label>
                <Input defaultValue={s.title ?? ""} onBlur={(e) => e.target.value !== (s.title ?? "") && update(s.id, { title: e.target.value })} />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-sm">Subtítulo</Label>
                <Textarea defaultValue={s.subtitle ?? ""} rows={2} onBlur={(e) => e.target.value !== (s.subtitle ?? "") && update(s.id, { subtitle: e.target.value })} />
              </div>
            </div>
          </div>
        ))}
        {(sections ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma seção configurada.
          </p>
        )}
      </div>
    </div>
  );
}
