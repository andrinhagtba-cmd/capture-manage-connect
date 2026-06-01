import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHeroBanners, type HeroBanner } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, GalleryHorizontalEnd, Eye, Film } from "lucide-react";
import { AdminPageHero, MediaUploadField, EmptyStatePremium } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners")({
  component: BannersAdmin,
});

function BannersAdmin() {
  const qc = useQueryClient();
  const { data: banners, isLoading } = useHeroBanners();

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["hero_banners"] });
  }

  async function add() {
    const { error } = await supabase.from("hero_banners").insert({
      location: "home",
      title: "Novo banner",
      media_type: "image",
      order_index: banners?.length ?? 0,
    });
    if (error) return toast.error(error.message);
    toast.success("Banner criado");
    invalidate();
  }

  async function update(id: string, patch: Partial<HeroBanner>) {
    const { error } = await supabase.from("hero_banners").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  }

  async function remove(id: string) {
    const { error } = await supabase.from("hero_banners").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Banner removido");
    invalidate();
  }

  async function move(item: HeroBanner, dir: -1 | 1) {
    const list = banners ?? [];
    const idx = list.findIndex((i) => i.id === item.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("hero_banners").update({ order_index: swap.order_index }).eq("id", item.id),
      supabase.from("hero_banners").update({ order_index: item.order_index }).eq("id", swap.id),
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
    <div className="mx-auto max-w-4xl space-y-6">
      <AdminPageHero
        eyebrow="Conteúdo do Site"
        title="Banners e Heros"
        subtitle="Controle os banners principais, vídeos e chamadas visuais de cada página do site."
        icon={GalleryHorizontalEnd}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Banners e Heros" }]}
        metrics={[
          { label: "Banners", value: banners?.length ?? 0, icon: GalleryHorizontalEnd },
          { label: "Ativos", value: (banners ?? []).filter((b) => b.is_active).length, icon: Eye, tone: "success" },
          { label: "Com vídeo", value: (banners ?? []).filter((b) => b.media_type === "video").length, icon: Film, tone: "info" },
        ]}
        actions={
          <Button onClick={add} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Novo banner
          </Button>
        }
      />

      <div className="space-y-4">
        {(banners ?? []).map((b, idx) => (
          <div key={b.id} className="rounded-xl border border-border bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Switch checked={b.is_active} onCheckedChange={(v) => update(b.id, { is_active: v })} />
                <Label className="text-sm">{b.is_active ? "Ativo" : "Inativo"}</Label>
              </div>
              <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(b, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" disabled={idx === (banners?.length ?? 0) - 1} onClick={() => move(b, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Local">
                <Select value={b.location} onValueChange={(v) => update(b.id, { location: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Home</SelectItem>
                    <SelectItem value="canon">Marca: Canon</SelectItem>
                    <SelectItem value="dji">Marca: DJI</SelectItem>
                    <SelectItem value="sony">Marca: Sony</SelectItem>
                    <SelectItem value="gopro">Marca: GoPro</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Tipo de mídia">
                <Select value={b.media_type} onValueChange={(v) => update(b.id, { media_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">Imagem</SelectItem>
                    <SelectItem value="video">Vídeo</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
              <Field label="Chapéu (eyebrow)">
                <Input defaultValue={b.eyebrow ?? ""} onBlur={(e) => e.target.value !== (b.eyebrow ?? "") && update(b.id, { eyebrow: e.target.value })} />
              </Field>
              <Field label="Selo / badge">
                <Input defaultValue={b.badge_text ?? ""} onBlur={(e) => e.target.value !== (b.badge_text ?? "") && update(b.id, { badge_text: e.target.value })} />
              </Field>
              <Field label="Título">
                <Input defaultValue={b.title ?? ""} onBlur={(e) => e.target.value !== (b.title ?? "") && update(b.id, { title: e.target.value })} />
              </Field>
              <Field label="Destaque (em cor)">
                <Input defaultValue={b.highlight ?? ""} onBlur={(e) => e.target.value !== (b.highlight ?? "") && update(b.id, { highlight: e.target.value })} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Subtítulo">
                  <Textarea defaultValue={b.subtitle ?? ""} rows={2} onBlur={(e) => e.target.value !== (b.subtitle ?? "") && update(b.id, { subtitle: e.target.value })} />
                </Field>
              </div>
              <MediaUploadField
                label="Imagem desktop"
                value={b.desktop_image_url}
                folder="banners"
                onChange={(url) => update(b.id, { desktop_image_url: url })}
              />
              <MediaUploadField
                label="Imagem mobile"
                value={b.mobile_image_url}
                folder="banners"
                onChange={(url) => update(b.id, { mobile_image_url: url })}
              />
              {b.media_type === "video" && (
                <div className="sm:col-span-2">
                  <MediaUploadField
                    label="Vídeo do banner"
                    value={b.video_url}
                    folder="videos"
                    kind="video"
                    accept="video/*"
                    onChange={(url) => update(b.id, { video_url: url })}
                  />
                </div>
              )}
              <Field label="Botão principal — texto">
                <Input defaultValue={b.primary_button_label ?? ""} onBlur={(e) => e.target.value !== (b.primary_button_label ?? "") && update(b.id, { primary_button_label: e.target.value })} />
              </Field>
              <Field label="Botão principal — link">
                <Input defaultValue={b.primary_button_url ?? ""} onBlur={(e) => e.target.value !== (b.primary_button_url ?? "") && update(b.id, { primary_button_url: e.target.value })} />
              </Field>
              <Field label="Botão secundário — texto">
                <Input defaultValue={b.secondary_button_label ?? ""} onBlur={(e) => e.target.value !== (b.secondary_button_label ?? "") && update(b.id, { secondary_button_label: e.target.value })} />
              </Field>
              <Field label="Botão secundário — link (vazio = orçamento)">
                <Input defaultValue={b.secondary_button_url ?? ""} onBlur={(e) => e.target.value !== (b.secondary_button_url ?? "") && update(b.id, { secondary_button_url: e.target.value })} />
              </Field>
            </div>

            {b.desktop_image_url && (
              <img src={b.desktop_image_url} alt="" className="mt-4 h-32 w-full rounded-lg object-cover" />
            )}
          </div>
        ))}
        {(banners ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum banner ainda. Clique em "Banner" para criar.
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
