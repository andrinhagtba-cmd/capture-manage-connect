import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { QuoteDialog } from "@/components/QuoteDialog";
import { Button } from "@/components/ui/button";
import { useCompany, useSitePage } from "@/lib/site-content";
import {
  MapPin,
  Phone,
  Instagram,
  Clock,
  MessageCircle,
  Mail,
  Facebook,
  Youtube,
  Navigation,
} from "lucide-react";

export const Route = createFileRoute("/contato")({
  head: () => ({
    meta: [
      { title: "Contato — NL Foto e Vídeo" },
      {
        name: "description",
        content:
          "Fale com a NL Foto e Vídeo em Brasília. WhatsApp, endereço na Feira dos Importados e horário de atendimento.",
      },
      { property: "og:title", content: "Contato — NL Foto e Vídeo" },
      { property: "og:description", content: "Entre em contato com a nossa equipe." },
    ],
    links: [{ rel: "canonical", href: "/contato" }],
  }),
  component: Contato,
});

function Contato() {
  const { data: page } = useSitePage("contato");
  const company = useCompany();

  const mapEmbed = company.googleMapsEmbed.trim();
  const mapIsIframe = mapEmbed.includes("<iframe");
  const mapSrc = mapEmbed && !mapIsIframe
    ? mapEmbed
    : "https://www.google.com/maps?q=Feira+dos+Importados+de+Bras%C3%ADlia&output=embed";

  return (
    <PublicLayout>
      <section className="border-b border-border bg-surface">
        <div className="container-page py-14">
          <p className="eyebrow text-primary">{page?.eyebrow ?? "Contato"}</p>
          <h1 className="display-lg mt-2 text-3xl md:text-4xl">
            {page?.heading ?? "Fale com a gente"}
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            {page?.subheading ??
              `Tire dúvidas, peça um orçamento ou agende uma visita à ${company.name}.`}
          </p>
        </div>
      </section>

      <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
        <div className="space-y-5">
          <ContactItem icon={Phone} title="WhatsApp / Telefone">
            <a
              href={company.whatsappLink()}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {company.whatsappDisplay}
            </a>
          </ContactItem>

          {company.email && (
            <ContactItem icon={Mail} title="E-mail">
              <a href={`mailto:${company.email}`} className="text-primary hover:underline">
                {company.email}
              </a>
            </ContactItem>
          )}

          <ContactItem icon={MapPin} title="Endereço">
            {company.address}
            {company.storeLocation ? ` · ${company.storeLocation}` : ""}
          </ContactItem>

          <ContactItem icon={Clock} title="Horário de atendimento">
            {company.openingHours}
          </ContactItem>

          {(company.instagramUrl || company.facebookUrl || company.youtubeUrl || company.tiktokUrl) && (
            <ContactItem icon={Instagram} title="Redes sociais">
              <span className="flex flex-wrap items-center gap-4">
                {company.instagramUrl && (
                  <a href={company.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Instagram className="h-4 w-4" /> {company.instagramHandle}
                  </a>
                )}
                {company.facebookUrl && (
                  <a href={company.facebookUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Facebook className="h-4 w-4" /> Facebook
                  </a>
                )}
                {company.youtubeUrl && (
                  <a href={company.youtubeUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-primary hover:underline">
                    <Youtube className="h-4 w-4" /> YouTube
                  </a>
                )}
                {company.tiktokUrl && (
                  <a href={company.tiktokUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                    TikTok
                  </a>
                )}
              </span>
            </ContactItem>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="gap-2">
              <a
                href={company.whatsappLink(
                  `Olá! Gostaria de falar com a equipe da ${company.name}.`,
                )}
                target="_blank"
                rel="noreferrer"
              >
                <MessageCircle className="h-4 w-4" /> Chamar no WhatsApp
              </a>
            </Button>
            <QuoteDialog
              trigger={<Button size="lg" variant="outline">Solicitar orçamento</Button>}
            />
            {company.directionsUrl && (
              <Button asChild size="lg" variant="ghost" className="gap-2">
                <a href={company.directionsUrl} target="_blank" rel="noreferrer">
                  <Navigation className="h-4 w-4" /> Como chegar
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          {mapIsIframe ? (
            <div
              className="h-full min-h-[360px] w-full [&>iframe]:h-full [&>iframe]:min-h-[360px] [&>iframe]:w-full"
              dangerouslySetInnerHTML={{ __html: mapEmbed }}
            />
          ) : (
            <iframe
              title={`Mapa ${company.name}`}
              src={mapSrc}
              className="h-full min-h-[360px] w-full"
              loading="lazy"
            />
          )}
        </div>
      </div>
    </PublicLayout>
  );
}

function ContactItem({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4 rounded-xl border border-border bg-card p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}
