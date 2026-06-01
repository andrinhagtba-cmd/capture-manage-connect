import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanySettings, type CompanySettings } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/empresa")({
  component: EmpresaAdmin,
});

type FormState = Partial<CompanySettings>;

const FIELDS_TEXT: { key: keyof CompanySettings; label: string; placeholder?: string }[] = [
  { key: "company_name", label: "Nome da empresa" },
  { key: "slogan", label: "Slogan" },
  { key: "cnpj", label: "CNPJ" },
];

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Textarea rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

function EmpresaAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useCompanySettings();
  const [form, setForm] = useState<FormState>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const set = (key: keyof CompanySettings) => (v: string) =>
    setForm((f) => ({ ...f, [key]: v }));
  const val = (key: keyof CompanySettings) => (form[key] as string) ?? "";

  async function save() {
    if (!val("company_name").trim()) {
      toast.error("Informe o nome da empresa.");
      return;
    }
    setSaving(true);
    const payload = { ...form };
    delete (payload as Record<string, unknown>).updated_at;
    let error;
    if (data?.id) {
      ({ error } = await supabase
        .from("company_settings")
        .update(payload)
        .eq("id", data.id));
    } else {
      ({ error } = await supabase.from("company_settings").insert(payload));
    }
    setSaving(false);
    if (error) {
      toast.error("Erro ao salvar: " + error.message);
      return;
    }
    toast.success("Configurações da empresa salvas!");
    qc.invalidateQueries({ queryKey: ["company_settings"] });
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
        eyebrow="Configurações"
        title="Configurações da Empresa"
        subtitle="Centralize os dados institucionais usados no site, footer, contato e WhatsApp."
        icon={Building2}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Configurações da Empresa" }]}
        actions={
          <Button onClick={save} disabled={saving} className="gap-2 rounded-xl">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </Button>
        }
      />

      <Section title="Identidade">
        {FIELDS_TEXT.map((f) => (
          <Field key={f.key} label={f.label} value={val(f.key)} onChange={set(f.key)} />
        ))}
        <div className="sm:col-span-2">
          <AreaField label="Descrição curta" value={val("short_description")} onChange={set("short_description")} />
        </div>
        <div className="sm:col-span-2">
          <AreaField label="Descrição completa" value={val("full_description")} onChange={set("full_description")} rows={4} />
        </div>
        <div className="sm:col-span-2">
          <AreaField label="História da empresa" value={val("history_text")} onChange={set("history_text")} rows={4} />
        </div>
      </Section>

      <Section title="Endereço e horário">
        <div className="sm:col-span-2">
          <Field label="Endereço completo" value={val("address")} onChange={set("address")} />
        </div>
        <Field label="Bloco / Loja" value={val("store_location")} onChange={set("store_location")} />
        <Field label="CEP" value={val("zip_code")} onChange={set("zip_code")} />
        <Field label="Cidade" value={val("city")} onChange={set("city")} />
        <Field label="Estado" value={val("state")} onChange={set("state")} />
        <div className="sm:col-span-2">
          <Field label="Horário de funcionamento" value={val("opening_hours")} onChange={set("opening_hours")} />
        </div>
      </Section>

      <Section title="Contato e redes sociais">
        <Field label="WhatsApp (apenas números, ex: 556181871104)" value={val("whatsapp")} onChange={set("whatsapp")} />
        <Field label="Telefone secundário" value={val("phone")} onChange={set("phone")} />
        <Field label="E-mail" value={val("email")} onChange={set("email")} type="email" />
        <Field label="Instagram (URL)" value={val("instagram_url")} onChange={set("instagram_url")} />
        <Field label="Facebook (URL)" value={val("facebook_url")} onChange={set("facebook_url")} />
        <Field label="TikTok (URL)" value={val("tiktok_url")} onChange={set("tiktok_url")} />
        <Field label="YouTube (URL)" value={val("youtube_url")} onChange={set("youtube_url")} />
        <Field label="Link 'Como chegar'" value={val("directions_url")} onChange={set("directions_url")} />
        <div className="sm:col-span-2">
          <AreaField label="Google Maps (código embed)" value={val("google_maps_embed")} onChange={set("google_maps_embed")} />
        </div>
      </Section>

      <Section title="Diferenciais">
        <div className="sm:col-span-2">
          <Field label="Texto sobre garantia" value={val("warranty_text")} onChange={set("warranty_text")} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Texto sobre procedência" value={val("provenance_text")} onChange={set("provenance_text")} />
        </div>
        <div className="sm:col-span-2">
          <Field label="Texto sobre equipamentos testados" value={val("testing_text")} onChange={set("testing_text")} />
        </div>
      </Section>

      <Section title="Logos e favicon (URLs)">
        <Field label="Logo principal (URL)" value={val("logo_url")} onChange={set("logo_url")} />
        <Field label="Logo versão clara (URL)" value={val("logo_light_url")} onChange={set("logo_light_url")} />
        <Field label="Logo versão escura (URL)" value={val("logo_dark_url")} onChange={set("logo_dark_url")} />
        <Field label="Favicon (URL)" value={val("favicon_url")} onChange={set("favicon_url")} />
      </Section>

      <Section title="SEO e compartilhamento (padrões globais)">
        <Field
          label="URL pública do site"
          placeholder="https://capture-manage-connect.lovable.app"
          value={val("public_site_url")}
          onChange={set("public_site_url")}
        />
        <Field label="Nome do site (og:site_name)" value={val("site_name")} onChange={set("site_name")} />
        <Field label="Título padrão de compartilhamento" value={val("default_og_title")} onChange={set("default_og_title")} />
        <Field label="Imagem padrão de compartilhamento (URL)" value={val("default_og_image_url")} onChange={set("default_og_image_url")} />
        <Field label="Imagem padrão de produtos (URL)" value={val("default_product_image_url")} onChange={set("default_product_image_url")} />
        <Field label="Imagem padrão de marcas (URL)" value={val("default_brand_image_url")} onChange={set("default_brand_image_url")} />
        <div className="sm:col-span-2">
          <AreaField
            label="Descrição padrão de compartilhamento"
            value={val("default_og_description")}
            onChange={set("default_og_description")}
          />
        </div>
      </Section>


      <div className="flex justify-end">
        <Button onClick={save} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar alterações
        </Button>
      </div>
    </div>
  );
}
