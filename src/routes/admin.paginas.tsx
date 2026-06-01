import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSitePages, type SitePage } from "@/lib/site-content";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, ExternalLink, FileText, Eye } from "lucide-react";
import { AdminPageHero } from "@/components/admin/ui";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/paginas")({
  head: () => ({
    meta: [
      { title: "Páginas do Site — NL Foto e Vídeo" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PaginasAdmin,
});

function PaginasAdmin() {
  const qc = useQueryClient();
  const { data: pages, isLoading } = useSitePages();

  function invalidate() {
    qc.invalidateQueries({ queryKey: ["site_pages"] });
  }

  async function update(id: string, patch: Partial<SitePage>) {
    const { error } = await supabase.from("site_pages").update(patch).eq("id", id);
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
        eyebrow="Conteúdo do Site"
        title="Páginas do Site"
        subtitle="Edite conteúdos, SEO, banners e seções das páginas públicas."
        icon={FileText}
        breadcrumb={[{ label: "Admin", to: "/admin" }, { label: "Páginas do Site" }]}
        metrics={[
          { label: "Páginas", value: pages?.length ?? 0, icon: FileText },
          { label: "Publicadas", value: (pages ?? []).filter((p) => p.is_published).length, icon: Eye, tone: "success" },
        ]}
      />

      <div className="space-y-4">
        {(pages ?? []).map((p) => (
          <PageCard key={p.id} page={p} onUpdate={update} />
        ))}
        {(pages ?? []).length === 0 && (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Nenhuma página configurada.
          </p>
        )}
      </div>
    </div>
  );
}

function PageCard({
  page,
  onUpdate,
}: {
  page: SitePage;
  onUpdate: (id: string, patch: Partial<SitePage>) => void;
}) {
  const [bodyText, setBodyText] = useState((page.body_json ?? []).join("\n\n"));

  function saveBody() {
    const paragraphs = bodyText
      .split(/\n{2,}/)
      .map((s) => s.trim())
      .filter(Boolean);
    onUpdate(page.id, { body_json: paragraphs });
  }

  return (
    <div className="rounded-xl border border-border bg-background p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold">{page.label}</h2>
          {page.slug && (
            <a
              href={page.slug}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
            >
              {page.slug} <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={page.is_published}
            onCheckedChange={(v) => onUpdate(page.id, { is_published: v })}
          />
          <Label className="text-sm">{page.is_published ? "Publicada" : "Rascunho"}</Label>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Chapéu (eyebrow)">
          <Input
            defaultValue={page.eyebrow ?? ""}
            onBlur={(e) =>
              e.target.value !== (page.eyebrow ?? "") &&
              onUpdate(page.id, { eyebrow: e.target.value })
            }
          />
        </Field>
        <Field label="Título (heading)">
          <Input
            defaultValue={page.heading ?? ""}
            onBlur={(e) =>
              e.target.value !== (page.heading ?? "") &&
              onUpdate(page.id, { heading: e.target.value })
            }
          />
        </Field>
        <div className="sm:col-span-2">
          <Field label="Subtítulo">
            <Textarea
              defaultValue={page.subheading ?? ""}
              rows={2}
              onBlur={(e) =>
                e.target.value !== (page.subheading ?? "") &&
                onUpdate(page.id, { subheading: e.target.value })
              }
            />
          </Field>
        </div>
        <div className="sm:col-span-2">
          <Field label="Parágrafos de conteúdo (separe por linha em branco)">
            <Textarea
              value={bodyText}
              rows={5}
              onChange={(e) => setBodyText(e.target.value)}
              onBlur={saveBody}
            />
          </Field>
        </div>
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="mb-3 text-sm font-semibold text-muted-foreground">SEO</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Título SEO (meta title)">
            <Input
              defaultValue={page.meta_title ?? ""}
              onBlur={(e) =>
                e.target.value !== (page.meta_title ?? "") &&
                onUpdate(page.id, { meta_title: e.target.value })
              }
            />
          </Field>
          <Field label="Imagem de compartilhamento (URL)">
            <Input
              defaultValue={page.meta_image_url ?? ""}
              onBlur={(e) =>
                e.target.value !== (page.meta_image_url ?? "") &&
                onUpdate(page.id, { meta_image_url: e.target.value })
              }
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descrição SEO (meta description)">
              <Textarea
                defaultValue={page.meta_description ?? ""}
                rows={2}
                onBlur={(e) =>
                  e.target.value !== (page.meta_description ?? "") &&
                  onUpdate(page.id, { meta_description: e.target.value })
                }
              />
            </Field>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Switch
            checked={page.noindex}
            onCheckedChange={(v) => onUpdate(page.id, { noindex: v })}
          />
          <Label className="text-sm">Ocultar dos buscadores (noindex)</Label>
        </div>
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
