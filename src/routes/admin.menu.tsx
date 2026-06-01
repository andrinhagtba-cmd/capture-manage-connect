import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigationItems, type NavigationItem } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, ArrowUp, ArrowDown } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/menu")({
  component: MenuAdmin,
});

function MenuAdmin() {
  const qc = useQueryClient();
  const { data: items, isLoading } = useNavigationItems("header");

  async function add() {
    const { error } = await supabase
      .from("navigation_items")
      .insert({ label: "Novo link", url: "/", menu_area: "header", order_index: items?.length ?? 0 });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["navigation_items", "header"] });
  }

  async function update(id: string, patch: Partial<NavigationItem>) {
    const { error } = await supabase.from("navigation_items").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["navigation_items", "header"] });
  }

  async function remove(id: string) {
    const { error } = await supabase.from("navigation_items").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["navigation_items", "header"] });
  }

  async function move(item: NavigationItem, dir: -1 | 1) {
    const list = items ?? [];
    const idx = list.findIndex((i) => i.id === item.id);
    const swap = list[idx + dir];
    if (!swap) return;
    await Promise.all([
      supabase.from("navigation_items").update({ order_index: swap.order_index }).eq("id", item.id),
      supabase.from("navigation_items").update({ order_index: item.order_index }).eq("id", swap.id),
    ]);
    qc.invalidateQueries({ queryKey: ["navigation_items", "header"] });
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
        title="Menu e Navegação"
        subtitle="Controle links, mega menu, marcas e ações principais do cabeçalho."
        icon={MenuIcon}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Menu / Navegação" }]}
        metrics={[
          { label: "Links", value: items?.length ?? 0, icon: MenuIcon },
          { label: "Ativos", value: (items ?? []).filter((i) => i.is_active).length, icon: Eye, tone: "success" },
        ]}
        actions={
          <Button onClick={add} className="gap-2 rounded-xl">
            <Plus className="h-4 w-4" /> Novo link
          </Button>
        }
      />

      <div className="space-y-3">
        {(items ?? []).map((item, idx) => (
          <div key={item.id} className="rounded-xl border border-border bg-background p-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Rótulo</Label>
                <Input
                  defaultValue={item.label}
                  onBlur={(e) => e.target.value !== item.label && update(item.id, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>URL</Label>
                <Input
                  defaultValue={item.url}
                  onBlur={(e) => e.target.value !== item.url && update(item.id, { url: e.target.value })}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={item.is_active} onCheckedChange={(v) => update(item.id, { is_active: v })} />
                <Label className="text-sm">Ativo</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={item.opens_new_tab} onCheckedChange={(v) => update(item.id, { opens_new_tab: v })} />
                <Label className="text-sm">Nova aba</Label>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <Button size="icon" variant="ghost" disabled={idx === 0} onClick={() => move(item, -1)}>
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" disabled={idx === (items?.length ?? 0) - 1} onClick={() => move(item, 1)}>
                  <ArrowDown className="h-4 w-4" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => remove(item.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </div>
        ))}
        {(items ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhum link ainda. Clique em "Link" para adicionar.
          </p>
        )}
      </div>
    </div>
  );
}
