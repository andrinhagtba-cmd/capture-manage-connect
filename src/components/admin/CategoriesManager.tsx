import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { slugify, type AdminBrand, type AdminCategory } from "@/lib/products-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function CategoriesManager({
  open,
  onOpenChange,
  brands,
  categories,
  counts,
  lockedBrandId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  brands: AdminBrand[];
  categories: AdminCategory[];
  counts: Record<string, number>;
  lockedBrandId?: string;
}) {
  const qc = useQueryClient();
  const [name, setName] = useState("");
  const [brandId, setBrandId] = useState(lockedBrandId ?? "");

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["admin-categories"] });

  async function add() {
    if (!name.trim()) return toast.error("Informe o nome.");
    if (!brandId) return toast.error("Selecione a marca.");
    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slugify(name),
      brand_id: brandId,
      is_active: true,
    });
    if (error) return toast.error(error.message);
    toast.success("Categoria criada.");
    setName("");
    invalidate();
  }

  async function update(id: string, patch: Partial<AdminCategory>) {
    const { error } = await supabase.from("categories").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  }

  async function remove(id: string) {
    if (!confirm("Excluir esta categoria?")) return;
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) return toast.error(error.message);
    invalidate();
  }

  const visible = lockedBrandId
    ? categories.filter((c) => c.brand_id === lockedBrandId)
    : categories;
  const brandName = (id: string | null) =>
    brands.find((b) => b.id === id)?.name ?? "—";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Gerenciar categorias</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border bg-surface p-3">
          <div className="flex-1 space-y-1">
            <Label className="text-xs">Nova categoria</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome" />
          </div>
          {!lockedBrandId && (
            <div className="w-40 space-y-1">
              <Label className="text-xs">Marca</Label>
              <Select value={brandId} onValueChange={setBrandId}>
                <SelectTrigger>
                  <SelectValue placeholder="Marca" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button onClick={add} className="gap-1">
            <Plus className="h-4 w-4" /> Adicionar
          </Button>
        </div>

        <div className="mt-3 space-y-2">
          {visible.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2"
            >
              <Input
                defaultValue={c.name}
                className="h-8 flex-1"
                onBlur={(e) =>
                  e.target.value !== c.name && update(c.id, { name: e.target.value })
                }
              />
              {!lockedBrandId && (
                <span className="text-xs text-muted-foreground">{brandName(c.brand_id)}</span>
              )}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {counts[c.id] ?? 0} prod.
              </span>
              <Switch
                checked={c.is_active}
                onCheckedChange={(v) => update(c.id, { is_active: v })}
              />
              <Button variant="ghost" size="icon" onClick={() => remove(c.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
          {visible.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              Nenhuma categoria ainda.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
