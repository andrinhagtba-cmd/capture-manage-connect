import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHeroBanners, type HeroBanner } from "@/lib/site-content";
import { useBrands } from "@/lib/catalog";
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
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown, GalleryHorizontalEnd, Eye, Film, ImageOff, Home, Star, Save } from "lucide-react";
import { AdminPageHero, MediaUploadField, EmptyStatePremium } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/banners")({
  component: BannersAdmin,
});

function BannersAdmin() {
  const qc = useQueryClient();
  const { data: banners, isLoading } = useHeroBanners();
  const { data: brands } = useBrands();

  // Localizações disponíveis: Home + cada marca cadastrada (dinâmico).
  const brandLocations = (brands ?? []).map((b) => ({ slug: b.slug, name: b.name }));
  const locationOrder = ["home", ...brandLocations.map((b) => b.slug)];
  const locationLabels: Record<string, string> = {
    home: "Home",
    ...Object.fromEntries(brandLocations.map((b) => [b.slug, `Marca: ${b.name}`])),
  };

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

  const list = banners ?? [];
  // Hero atualmente aplicado na home (primeiro ativo da localização "home").
  const activeHome = list
    .filter((b) => b.location === "home" && b.is_active)
    .sort((a, b) => a.order_index - b.order_index)[0];

  // Agrupa banners por localização para organizar a lista.
  const groups = locationOrder
    .map((loc) => ({ loc, items: list.filter((b) => b.location === loc) }))
    .filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
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

      {/* Hero da Home atual — destaque para localização rápida */}
      <div className="overflow-hidden rounded-[24px] border border-primary/30 bg-primary/5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/10 px-5 py-3 md:px-6">
          <Star className="h-[18px] w-[18px] text-primary" />
          <div>
            <p className="text-sm font-semibold tracking-tight">Hero aplicado na Home agora</p>
            <p className="text-xs text-muted-foreground">
              Esta é a imagem que aparece no topo da página inicial. Edite o card correspondente abaixo.
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:p-6">
          <div className="relative aspect-[16/7] w-full overflow-hidden rounded-2xl border border-border/60 bg-surface md:w-80">
            {activeHome?.desktop_image_url ? (
              <img
                src={activeHome.desktop_image_url}
                alt={activeHome.title ?? "Hero da home"}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <ImageOff className="h-6 w-6" />
                <span className="text-xs">Nenhum hero ativo na home</span>
              </div>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <p className="text-base font-semibold">
              {activeHome?.title?.trim() || "Sem hero ativo"}
            </p>
            {activeHome?.subtitle && (
              <p className="text-sm text-muted-foreground line-clamp-2">{activeHome.subtitle}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {activeHome
                ? `${activeHome.media_type === "video" ? "Vídeo" : "Imagem"} · localização: home`
                : "Ative um banner na localização Home para exibir o hero."}
            </p>
          </div>
        </div>
      </div>


      {list.length === 0 ? (
        <EmptyStatePremium
          icon={GalleryHorizontalEnd}
          title="Nenhum banner ainda"
          description="Crie o primeiro banner para destacar campanhas, marcas e vídeos no topo do site."
          action={
            <Button onClick={add} className="gap-2 rounded-xl">
              <Plus className="h-4 w-4" /> Novo banner
            </Button>
          }
        />
      ) : (
        groups.map((group) => (
          <div key={group.loc} className="space-y-4">
            <div className="flex items-center gap-2 pt-2">
              {group.loc === "home" ? (
                <Home className="h-4 w-4 text-primary" />
              ) : (
                <GalleryHorizontalEnd className="h-4 w-4 text-muted-foreground" />
              )}
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {locationLabels[group.loc] ?? group.loc}
              </h2>
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                {group.items.length}
              </span>
            </div>

            {group.items.map((b) => {
              const idx = list.findIndex((i) => i.id === b.id);
              return (
          <div
            key={b.id}
            className="animate-fade-up overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-sm"
          >
            {/* card header bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 bg-surface/60 px-5 py-3.5 md:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  {b.media_type === "video" ? <Film className="h-[18px] w-[18px]" /> : <GalleryHorizontalEnd className="h-[18px] w-[18px]" />}
                </span>
                <div>
                  <p className="text-sm font-semibold tracking-tight">
                    {b.title?.trim() || "Banner sem título"}
                  </p>
                  <p className="text-xs capitalize text-muted-foreground">
                    {b.location} · {b.media_type === "video" ? "vídeo" : "imagem"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-1.5">
                  <Switch checked={b.is_active} onCheckedChange={(v) => update(b.id, { is_active: v })} />
                  <Label className="text-xs font-medium">{b.is_active ? "Ativo" : "Inativo"}</Label>
                </div>
                <div className="flex items-center gap-1">
                  <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(b, -1)}>
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" disabled={idx === list.length - 1} onClick={() => move(b, 1)}>
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>

            {/* distributed columns: media | content */}
            <div className="grid gap-6 p-5 md:p-6 lg:grid-cols-[minmax(280px,0.85fr)_1.15fr]">
              {/* left column — media */}
              <div className="space-y-4">
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
                  <MediaUploadField
                    label="Vídeo do banner"
                    value={b.video_url}
                    folder="videos"
                    kind="video"
                    accept="video/*"
                    onChange={(url) => update(b.id, { video_url: url })}
                  />
                )}
              </div>

              {/* right column — content */}
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Local">
                    <Select value={b.location} onValueChange={(v) => update(b.id, { location: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="home">Home</SelectItem>
                        {brandLocations.map((bl) => (
                          <SelectItem key={bl.slug} value={bl.slug}>
                            Marca: {bl.name}
                          </SelectItem>
                        ))}
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
                </div>

                <Field label="Subtítulo">
                  <Textarea defaultValue={b.subtitle ?? ""} rows={2} onBlur={(e) => e.target.value !== (b.subtitle ?? "") && update(b.id, { subtitle: e.target.value })} />
                </Field>

                <div className="rounded-2xl border border-border/60 bg-surface/50 p-4">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Botões de ação
                  </p>
                  <div className="grid gap-4 sm:grid-cols-2">
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
                </div>
              </div>
            </div>
          </div>
              );
            })}
          </div>
        ))
      )}

      {/* Barra de salvar — as alterações são aplicadas automaticamente ao sair de cada campo */}
      {list.length > 0 && (
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-xl border border-border bg-background/95 p-4 shadow-lg backdrop-blur">
          <p className="text-sm text-muted-foreground">
            As alterações são salvas automaticamente ao sair de cada campo.
          </p>
          <Button
            onClick={() => {
              (document.activeElement as HTMLElement | null)?.blur();
              invalidate();
              toast.success("Alterações salvas");
            }}
            className="gap-2 rounded-xl"
          >
            <Save className="h-4 w-4" />
            Salvar alterações
          </Button>
        </div>
      )}
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
