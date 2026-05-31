import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Facebook, BarChart3, Megaphone, Tag, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/marketing")({
  component: Marketing,
});

type Integrations = Record<string, any>;
type Secrets = { id?: string; meta_capi_access_token: string | null; ga4_api_secret: string | null };

function Marketing() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["marketing-integrations"],
    queryFn: async () => {
      const [intg, sec] = await Promise.all([
        supabase.from("marketing_integrations").select("*").limit(1).maybeSingle(),
        supabase.from("marketing_secrets").select("*").limit(1).maybeSingle(),
      ]);
      return { integrations: intg.data as Integrations | null, secrets: sec.data as Secrets | null };
    },
  });

  const [form, setForm] = useState<Integrations>({});
  const [secrets, setSecrets] = useState<Secrets>({ meta_capi_access_token: "", ga4_api_secret: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.integrations) setForm(data.integrations);
    if (data?.secrets) setSecrets({ ...data.secrets });
  }, [data]);

  const set = (k: string, v: unknown) => setForm((f) => ({ ...f, [k]: v }));

  async function save() {
    setSaving(true);
    try {
      const { id, ...rest } = form;
      const table = supabase.from("marketing_integrations") as any;
      const { error: err } = id
        ? await table.update(rest).eq("id", id)
        : await table.insert(rest);
      if (err) throw err;

      // Secrets (separate, staff-only table)
      const secPayload = {
        meta_capi_access_token: secrets.meta_capi_access_token || null,
        ga4_api_secret: secrets.ga4_api_secret || null,
      };
      if (secrets.id) {
        await supabase.from("marketing_secrets").update(secPayload).eq("id", secrets.id);
      } else {
        const { data: ins } = await supabase.from("marketing_secrets").insert(secPayload).select("id").maybeSingle();
        if (ins?.id) setSecrets((s) => ({ ...s, id: ins.id }));
      }

      toast.success("Configurações de marketing salvas.");
      qc.invalidateQueries({ queryKey: ["marketing-integrations"] });
      qc.invalidateQueries({ queryKey: ["public-marketing-config"] });
    } catch (e: any) {
      toast.error(e.message ?? "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing e Rastreamento</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure pixels, conversões e consentimento LGPD do site.
          </p>
        </div>
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>

      <Tabs defaultValue="meta" className="mt-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="meta" className="gap-1.5"><Facebook className="h-4 w-4" /> Meta</TabsTrigger>
          <TabsTrigger value="ga4" className="gap-1.5"><BarChart3 className="h-4 w-4" /> GA4</TabsTrigger>
          <TabsTrigger value="ads" className="gap-1.5"><Megaphone className="h-4 w-4" /> Google Ads</TabsTrigger>
          <TabsTrigger value="gtm" className="gap-1.5"><Tag className="h-4 w-4" /> GTM</TabsTrigger>
          <TabsTrigger value="lgpd" className="gap-1.5"><ShieldCheck className="h-4 w-4" /> Consentimento</TabsTrigger>
        </TabsList>

        {/* META PIXEL */}
        <TabsContent value="meta">
          <Section title="Meta Pixel & Conversions API" desc="Rastreamento do Facebook e Instagram.">
            <Toggle label="Ativar Meta Pixel" checked={!!form.meta_pixel_enabled} onChange={(v) => set("meta_pixel_enabled", v)} />
            <Field label="Pixel ID" value={form.meta_pixel_id} onChange={(v) => set("meta_pixel_id", v)} placeholder="123456789012345" />
            <Toggle label="Enviar eventos do site (ViewContent, Lead...)" checked={!!form.meta_events_enabled} onChange={(v) => set("meta_events_enabled", v)} />
            <hr className="border-border" />
            <Toggle label="Ativar Conversions API (servidor)" checked={!!form.meta_capi_enabled} onChange={(v) => set("meta_capi_enabled", v)} />
            <Field
              label="CAPI Access Token"
              type="password"
              value={secrets.meta_capi_access_token ?? ""}
              onChange={(v) => setSecrets((s) => ({ ...s, meta_capi_access_token: v }))}
              placeholder="Token secreto (armazenado com segurança)"
            />
            <Field label="Test Event Code" value={form.meta_test_event_code} onChange={(v) => set("meta_test_event_code", v)} placeholder="TEST12345" />
          </Section>
        </TabsContent>

        {/* GA4 */}
        <TabsContent value="ga4">
          <Section title="Google Analytics 4" desc="Métricas de tráfego e comportamento.">
            <Toggle label="Ativar GA4" checked={!!form.ga4_enabled} onChange={(v) => set("ga4_enabled", v)} />
            <Field label="Measurement ID" value={form.ga4_measurement_id} onChange={(v) => set("ga4_measurement_id", v)} placeholder="G-XXXXXXXXXX" />
            <Toggle label="Enviar eventos customizados" checked={!!form.ga4_custom_events_enabled} onChange={(v) => set("ga4_custom_events_enabled", v)} />
            <Field
              label="API Secret (Measurement Protocol)"
              type="password"
              value={secrets.ga4_api_secret ?? ""}
              onChange={(v) => setSecrets((s) => ({ ...s, ga4_api_secret: v }))}
              placeholder="Secreto — opcional para eventos via servidor"
            />
          </Section>
        </TabsContent>

        {/* GOOGLE ADS */}
        <TabsContent value="ads">
          <Section title="Google Ads" desc="Conversões e remarketing.">
            <Toggle label="Ativar Google Ads" checked={!!form.google_ads_enabled} onChange={(v) => set("google_ads_enabled", v)} />
            <Field label="Conversion ID" value={form.google_ads_conversion_id} onChange={(v) => set("google_ads_conversion_id", v)} placeholder="AW-123456789" />
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Rótulo — Orçamento" value={form.google_ads_quote_label} onChange={(v) => set("google_ads_quote_label", v)} placeholder="abc123" />
              <Field label="Rótulo — WhatsApp" value={form.google_ads_whatsapp_label} onChange={(v) => set("google_ads_whatsapp_label", v)} placeholder="def456" />
              <Field label="Rótulo — Lead" value={form.google_ads_lead_label} onChange={(v) => set("google_ads_lead_label", v)} placeholder="ghi789" />
            </div>
            <Toggle label="Ativar remarketing" checked={!!form.google_ads_remarketing_enabled} onChange={(v) => set("google_ads_remarketing_enabled", v)} />
          </Section>
        </TabsContent>

        {/* GTM */}
        <TabsContent value="gtm">
          <Section title="Google Tag Manager" desc="Gerencie todas as tags em um só lugar.">
            <Toggle label="Ativar GTM" checked={!!form.gtm_enabled} onChange={(v) => set("gtm_enabled", v)} />
            <Field label="Container ID" value={form.gtm_container_id} onChange={(v) => set("gtm_container_id", v)} placeholder="GTM-XXXXXXX" />
          </Section>
        </TabsContent>

        {/* LGPD */}
        <TabsContent value="lgpd">
          <Section title="Consentimento e LGPD" desc="Banner de cookies e regras de consentimento.">
            <Toggle label="Exibir banner de cookies" checked={!!form.cookie_banner_enabled} onChange={(v) => set("cookie_banner_enabled", v)} />
            <div>
              <Label className="mb-1.5 block text-sm">Texto do banner</Label>
              <Textarea
                rows={3}
                value={form.cookie_banner_text ?? ""}
                onChange={(e) => set("cookie_banner_text", e.target.value)}
              />
            </div>
            <Field label="URL da Política de Privacidade" value={form.privacy_policy_url} onChange={(v) => set("privacy_policy_url", v)} placeholder="/politica-de-privacidade" />
            <hr className="border-border" />
            <Toggle label="Exigir consentimento para Analytics" checked={!!form.require_analytics_consent} onChange={(v) => set("require_analytics_consent", v)} />
            <Toggle label="Exigir consentimento para Marketing (pixels)" checked={!!form.require_marketing_consent} onChange={(v) => set("require_marketing_consent", v)} />
          </Section>
        </TabsContent>
      </Tabs>

      <div className="mt-6 flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-6">
      <h2 className="font-semibold">{title}</h2>
      <p className="mb-5 mt-0.5 text-sm text-muted-foreground">{desc}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | null | undefined;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <Label className="mb-1.5 block text-sm">{label}</Label>
      <Input type={type} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface px-4 py-3">
      <span className="text-sm font-medium">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
