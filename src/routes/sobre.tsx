import { createFileRoute } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { QuoteDialog } from "@/components/QuoteDialog";
import { Button } from "@/components/ui/button";
import { COMPANY_NAME } from "@/lib/site";
import { Award, Users, Camera, Heart } from "lucide-react";
import heroHome from "@/assets/hero-home.jpg";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — NL Foto e Vídeo" },
      {
        name: "description",
        content:
          "Há mais de 20 anos, a NL Foto e Vídeo é referência em equipamentos profissionais de foto e vídeo na Feira dos Importados de Brasília.",
      },
      { property: "og:title", content: "Sobre — NL Foto e Vídeo" },
      { property: "og:description", content: "Mais de 20 anos de história em foto e vídeo." },
    ],
    links: [{ rel: "canonical", href: "/sobre" }],
  }),
  component: Sobre,
});

const STATS = [
  { icon: Award, value: "20+", label: "Anos de mercado" },
  { icon: Users, value: "10k+", label: "Clientes atendidos" },
  { icon: Camera, value: "4", label: "Marcas premium" },
  { icon: Heart, value: "100%", label: "Foco no cliente" },
];

function Sobre() {
  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroHome} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-ink/80" />
        </div>
        <div className="container-page relative py-24 text-center md:py-32">
          <p className="eyebrow text-background/70">Nossa história</p>
          <h1 className="display-hero mx-auto mt-4 max-w-3xl text-4xl text-background md:text-5xl">
            Paixão por imagem há mais de 20 anos
          </h1>
        </div>
      </section>

      <section className="container-page py-16">
        <div className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-muted-foreground">
          <p>
            A <strong className="text-foreground">{COMPANY_NAME}</strong> nasceu na
            tradicional Feira dos Importados de Brasília e se tornou referência para
            fotógrafos, videomakers e criadores de conteúdo de todo o Distrito Federal.
          </p>
          <p>
            Trabalhamos com curadoria das principais marcas do mundo —{" "}
            <strong className="text-foreground">Canon, DJI, Sony e GoPro</strong> —
            oferecendo equipamentos oficiais, atendimento especializado e as melhores
            condições do mercado.
          </p>
          <p>
            Nossa missão é simples: entregar o equipamento certo para cada projeto, com a
            confiança de quem entende do assunto há mais de duas décadas.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-border bg-surface p-8 text-center"
            >
              <s.icon className="mx-auto h-8 w-8 text-primary" />
              <p className="mt-4 text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 rounded-3xl bg-ink px-8 py-14 text-center text-background">
          <h2 className="display-lg text-2xl md:text-3xl">
            Vamos encontrar o equipamento ideal para você
          </h2>
          <div className="mt-7 flex justify-center">
            <QuoteDialog
              trigger={<Button size="lg" variant="secondary">Solicitar orçamento</Button>}
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
