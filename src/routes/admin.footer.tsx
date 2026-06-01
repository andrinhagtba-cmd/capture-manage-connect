import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  useFooterSettings,
  useFooterGroups,
  useFooterLinks,
  type FooterSettings,
  type FooterLinkGroup,
  type FooterLink,
} from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Plus, Trash2, PanelBottom, Link as LinkIcon } from "lucide-react";
import { AdminPageHero } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/footer")({
  component: FooterAdmin,
});

const TOGGLES: { key: keyof FooterSettings; label: string }[] = [
  { key: "show_company_address", label: "Mostrar endereço" },
  { key: "show_opening_hours", label: "Mostrar horário" },
  { key: "show_whatsapp", label: "Mostrar WhatsApp" },
  { key: "show_email", label: "Mostrar e-mail" },
  { key: "show_social_links", label: "Mostrar redes sociais" },
];

function FooterAdmin() {
  const qc = useQueryClient();
  const { data: settings, isLoading } = useFooterSettings();
  const { data: groups } = useFooterGroups();
  const { data: links } = useFooterLinks();
  const [form, setForm] = useState<Partial<FooterSettings>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (settings) setForm(settings);
  }, [settings]);

  const set = <K extends keyof FooterSettings>(key: K, v: FooterSettings[K]) =>
    setForm((f) => ({ ...f, [key]: v }));

  async function saveSettings() {
    setSaving(true);
    const { updated_at: _u, settings_json: _s, id: _id, ...rest } = form;
    const payload = rest;
    let error;
    if (settings?.id) {
      ({ error } = await supabase.from("footer_settings").update(payload).eq("id", settings.id));
    } else {
      ({ error } = await supabase.from("footer_settings").insert(payload));
    }
    setSaving(false);
    if (error) return toast.error("Erro: " + error.message);
    toast.success("Rodapé salvo!");
    qc.invalidateQueries({ queryKey: ["footer_settings"] });
  }

  async function addGroup() {
    const { error } = await supabase
      .from("footer_link_groups")
      .insert({ title: "Novo grupo", order_index: (groups?.length ?? 0) });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["footer_link_groups"] });
  }

  async function updateGroup(id: string, patch: Partial<FooterLinkGroup>) {
    const { error } = await supabase.from("footer_link_groups").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["footer_link_groups"] });
  }

  async function deleteGroup(id: string) {
    const { error } = await supabase.from("footer_link_groups").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["footer_link_groups"] });
    qc.invalidateQueries({ queryKey: ["footer_links"] });
  }

  async function addLink(groupId: string) {
    const count = (links ?? []).filter((l) => l.group_id === groupId).length;
    const { error } = await supabase
      .from("footer_links")
      .insert({ group_id: groupId, label: "Novo link", url: "/", order_index: count });
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["footer_links"] });
  }

  async function updateLink(id: string, patch: Partial<FooterLink>) {
    const { error } = await supabase.from("footer_links").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["footer_links"] });
  }

  async function deleteLink(id: string) {
    const { error } = await supabase.from("footer_links").delete().eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["footer_links"] });
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
        title="Footer"
        subtitle="Configure o rodapé global sincronizado com os dados da empresa."
        icon={PanelBottom}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Footer" }]}
        metrics={[
          { label: "Grupos de links", value: groups?.length ?? 0, icon: PanelBottom },
          { label: "Links", value: links?.length ?? 0, icon: LinkIcon, tone: "info" },
        ]}
      />

      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Geral
        </h2>
        <div className="space-y-1.5">
          <Label>Logo do footer (URL)</Label>
          <Input value={(form.logo_url as string) ?? ""} onChange={(e) => set("logo_url", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label>Descrição curta</Label>
          <Textarea
            rows={3}
            value={(form.description as string) ?? ""}
            onChange={(e) => set("description", e.target.value)}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Selo de garantia</Label>
            <Input value={(form.warranty_badge_text as string) ?? ""} onChange={(e) => set("warranty_badge_text", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Selo de procedência</Label>
            <Input value={(form.provenance_badge_text as string) ?? ""} onChange={(e) => set("provenance_badge_text", e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Texto de copyright (use {"{year}"} para o ano)</Label>
          <Input value={(form.copyright_text as string) ?? ""} onChange={(e) => set("copyright_text", e.target.value)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {TOGGLES.map((t) => (
            <div key={t.key} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label className="cursor-pointer">{t.label}</Label>
              <Switch
                checked={Boolean(form[t.key])}
                onCheckedChange={(v) => set(t.key, v as never)}
              />
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Colunas de links
          </h2>
          <Button size="sm" variant="outline" onClick={addGroup} className="gap-2">
            <Plus className="h-4 w-4" /> Coluna
          </Button>
        </div>

        {(groups ?? []).map((g) => (
          <div key={g.id} className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Input
                className="font-semibold"
                defaultValue={g.title}
                onBlur={(e) => e.target.value !== g.title && updateGroup(g.id, { title: e.target.value })}
              />
              <div className="flex items-center gap-2 shrink-0">
                <Switch checked={g.is_active} onCheckedChange={(v) => updateGroup(g.id, { is_active: v })} />
                <Button size="icon" variant="ghost" onClick={() => deleteGroup(g.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              {(links ?? [])
                .filter((l) => l.group_id === g.id)
                .map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Input
                      placeholder="Rótulo"
                      defaultValue={l.label}
                      onBlur={(e) => e.target.value !== l.label && updateLink(l.id, { label: e.target.value })}
                    />
                    <Input
                      placeholder="URL"
                      defaultValue={l.url}
                      onBlur={(e) => e.target.value !== l.url && updateLink(l.id, { url: e.target.value })}
                    />
                    <Switch checked={l.is_active} onCheckedChange={(v) => updateLink(l.id, { is_active: v })} />
                    <Button size="icon" variant="ghost" onClick={() => deleteLink(l.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              <Button size="sm" variant="ghost" onClick={() => addLink(g.id)} className="gap-2">
                <Plus className="h-4 w-4" /> Link
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
