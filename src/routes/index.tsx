import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { ProductCard } from "@/components/ProductCard";
import { DronesShowcase } from "@/components/DronesShowcase";
import { CanonShowcase } from "@/components/CanonShowcase";
import { QuoteDialog } from "@/components/QuoteDialog";
import { Button } from "@/components/ui/button";
import { useBrands, useProducts } from "@/lib/catalog";
import { BRAND_THEME, COMPANY_NAME } from "@/lib/site";
import { ShieldCheck, Award, Headphones, Truck, ArrowRight } from "lucide-react";
import heroHome from "@/assets/hero-home.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "NL Foto e Vídeo — Canon, DJI, Sony e GoPro em Brasília" },
      {
        name: "description",
        content:
          "Revendedor oficial e curadoria premium de equipamentos Canon, DJI, Sony e GoPro. Foto e vídeo profissional há mais de 20 anos na Feira dos Importados de Brasília.",
      },
      { property: "og:title", content: "NL Foto e Vídeo — Foto e Vídeo profissional" },
      {
        property: "og:description",
        content: "Catálogo premium Canon, DJI, Sony e GoPro com orçamento personalizado.",
      },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const FEATURES = [
  { icon: Award, title: "20+ anos de experiência", desc: "Referência em foto e vídeo na capital." },
  { icon: ShieldCheck, title: "Produtos oficiais", desc: "Curadoria das melhores marcas do mercado." },
  { icon: Headphones, title: "Atendimento especialista", desc: "Consultoria para escolher o equipamento ideal." },
  { icon: Truck, title: "Pronta entrega", desc: "Estoque selecionado e encomendas sob consulta." },
];

function Home() {
  const { data: brands } = useBrands();
  const { data: featured } = useProducts({ featured: true });

  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroHome} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/70 to-ink/30" />
        </div>
        <div className="container-page relative py-28 md:py-40">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow mb-4 text-background/70">{COMPANY_NAME} · Brasília-DF</p>
            <h1 className="display-hero text-4xl text-background sm:text-5xl md:text-6xl">
              Equipamentos profissionais de{" "}
              <span className="text-primary">foto e vídeo</span> que você confia.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-background/80">
              Curadoria oficial das marcas Canon, DJI, Sony e GoPro. Conte com mais de
              20 anos de expertise para escolher o equipamento certo.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild size="lg" className="gap-2">
                <Link to="/catalogo">
                  Ver catálogo <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <QuoteDialog
                trigger={
                  <Button size="lg" variant="secondary">
                    Solicitar orçamento
                  </Button>
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Brands */}
      <section className="container-page -mt-12 relative z-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {(brands ?? []).map((b) => {
            const theme = BRAND_THEME[b.slug];
            return (
              <Link
                key={b.id}
                to="/marca/$slug"
                params={{ slug: b.slug }}
                className="hover-lift group rounded-2xl border border-border bg-card p-6 shadow-sm"
              >
                <span
                  className="inline-block h-1.5 w-12 rounded-full"
                  style={{ background: theme?.color ?? "#888" }}
                />
                <h3 className="mt-4 text-2xl font-bold tracking-tight">{b.name}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{theme?.blurb}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Explorar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Features */}
      <section className="container-page mt-20">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-xl border border-border bg-surface p-6">
              <f.icon className="h-7 w-7 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Drones premium showcase */}
      <DronesShowcase />



      {/* Featured products */}
      <section className="container-page mt-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="eyebrow text-primary">Seleção da casa</p>
            <h2 className="display-lg mt-2 text-3xl md:text-4xl">Produtos em destaque</h2>
          </div>
          <Button asChild variant="outline" className="hidden sm:flex">
            <Link to="/catalogo">Ver tudo</Link>
          </Button>
        </div>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          {(featured ?? []).slice(0, 8).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container-page mt-24">
        <div className="overflow-hidden rounded-3xl bg-ink px-8 py-16 text-center text-background md:px-16">
          <h2 className="display-lg text-3xl md:text-4xl">
            Não encontrou o que procura?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-background/75">
            Nossa equipe monta um orçamento personalizado para o seu projeto, com as
            melhores condições e equipamentos das principais marcas do mundo.
          </p>
          <div className="mt-8 flex justify-center">
            <QuoteDialog
              trigger={<Button size="lg" variant="secondary">Falar com um especialista</Button>}
            />
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
