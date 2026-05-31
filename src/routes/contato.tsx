import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { QuoteDialog } from "@/components/QuoteDialog";
import { Button } from "@/components/ui/button";
import {
  WHATSAPP_DISPLAY,
  ADDRESS,
  INSTAGRAM_URL,
  whatsappUrl,
} from "@/lib/site";
import { useSitePage } from "@/lib/site-content";
import { MapPin, Phone, Instagram, Clock, MessageCircle } from "lucide-react";

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
              "Tire dúvidas, peça um orçamento ou agende uma visita à nossa loja na Feira dos Importados de Brasília."}
          </p>
        </div>
      </section>


      <div className="container-page grid gap-10 py-14 lg:grid-cols-2">
        <div className="space-y-5">
          <ContactItem icon={Phone} title="WhatsApp / Telefone">
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              {WHATSAPP_DISPLAY}
            </a>
          </ContactItem>
          <ContactItem icon={MapPin} title="Endereço">
            {ADDRESS}
          </ContactItem>
          <ContactItem icon={Clock} title="Horário de atendimento">
            Segunda a Sábado · 9h às 18h
          </ContactItem>
          <ContactItem icon={Instagram} title="Instagram">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noreferrer"
              className="text-primary hover:underline"
            >
              @nlfotoevideo
            </a>
          </ContactItem>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="gap-2">
              <a
                href={whatsappUrl(
                  "Olá! Gostaria de falar com a equipe da NL Foto e Vídeo.",
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
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border">
          <iframe
            title="Mapa NL Foto e Vídeo"
            src="https://www.google.com/maps?q=Feira+dos+Importados+de+Bras%C3%ADlia&output=embed"
            className="h-full min-h-[360px] w-full"
            loading="lazy"
          />
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
