import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { ProductCard } from "@/components/ProductCard";
import { DronesShowcase } from "@/components/DronesShowcase";
import { CanonShowcase } from "@/components/CanonShowcase";
import { SonyShowcase } from "@/components/SonyShowcase";
import { GoProShowcase } from "@/components/GoProShowcase";
import { PremiumShowcase } from "@/components/PremiumShowcase";
import { QuoteDialog } from "@/components/QuoteDialog";
import { HeroSlider } from "@/components/HeroSlider";
import { Button } from "@/components/ui/button";
import { useBrands, useProducts } from "@/lib/catalog";
import { useHomeSections, type HomeSection } from "@/lib/site-content";
import { BRAND_THEME } from "@/lib/site";
import { ShieldCheck, Award, Headphones, Truck, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import { useCallback, useEffect, useState } from "react";
const BRAND_FALLBACK: Record<string, string> = {};



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

// Default section order/content used when the DB has no rows yet.
const DEFAULT_SECTIONS: Pick<HomeSection, "section_key" | "eyebrow" | "title" | "subtitle" | "is_active" | "order_index">[] = [
  { section_key: "brands", eyebrow: null, title: "Marcas", subtitle: null, is_active: true, order_index: 1 },
  { section_key: "premium", eyebrow: "Destaque premium", title: "Produto Premium em Destaque", subtitle: null, is_active: true, order_index: 2 },
  { section_key: "features", eyebrow: null, title: "Por que comprar conosco", subtitle: null, is_active: true, order_index: 2 },
  { section_key: "drones", eyebrow: null, title: "Drones", subtitle: null, is_active: true, order_index: 3 },
  { section_key: "canon", eyebrow: null, title: "Canon", subtitle: null, is_active: true, order_index: 4 },
  { section_key: "sony", eyebrow: null, title: "Sony", subtitle: null, is_active: true, order_index: 5 },
  { section_key: "gopro", eyebrow: null, title: "GoPro", subtitle: null, is_active: true, order_index: 6 },
  { section_key: "featured", eyebrow: "Seleção da casa", title: "Produtos em destaque", subtitle: null, is_active: true, order_index: 7 },
  { section_key: "cta", eyebrow: "Atendimento personalizado", title: "Não encontrou o que procura?", subtitle: "Nossa equipe monta um orçamento personalizado para o seu projeto, com as melhores condições e equipamentos das principais marcas do mundo.", is_active: true, order_index: 8 },
];

function Home() {
  const { data: brands } = useBrands();
  const { data: featured } = useProducts({ featured: true });
  const { data: dbSections } = useHomeSections();

  const sections = (dbSections && dbSections.length > 0 ? dbSections : DEFAULT_SECTIONS)
    .filter((s) => s.is_active)
    .sort((a, b) => a.order_index - b.order_index);





  const renderSection = (s: { section_key: string; eyebrow: string | null; title: string | null; subtitle: string | null }) => {
    switch (s.section_key) {
      case "premium":
        return <PremiumShowcase key="premium" />;
      case "brands":
        return <BrandsCarousel key="brands" brands={brands ?? []} />;
      case "features":
        return (
          <section key="features" className="container-page mt-20">
            {s.title && (
              <div className="mb-8">
                {s.eyebrow && <p className="eyebrow text-primary">{s.eyebrow}</p>}
                <h2 className="display-lg mt-2 text-3xl md:text-4xl">{s.title}</h2>
              </div>
            )}
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
        );
      case "drones":
        return <DronesShowcase key="drones" />;
      case "canon":
        return <CanonShowcase key="canon" />;
      case "sony":
        return <SonyShowcase key="sony" />;
      case "gopro":
        return <GoProShowcase key="gopro" />;
      case "featured":
        return (
          <section key="featured" className="container-page mt-24">
            <div className="mb-8 flex items-end justify-between">
              <div>
                {s.eyebrow && <p className="eyebrow text-primary">{s.eyebrow}</p>}
                <h2 className="display-lg mt-2 text-3xl md:text-4xl">{s.title ?? "Produtos em destaque"}</h2>
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
        );
      case "cta":
        return (
          <section key="cta" className="container-page mt-24">
            <div className="group relative overflow-hidden rounded-[2rem] bg-ink px-8 py-20 text-center text-background md:px-16">
              <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-pulse" />
              <div
                className="pointer-events-none absolute -bottom-28 -right-20 h-80 w-80 rounded-full bg-primary/20 blur-3xl animate-pulse"
                style={{ animationDuration: "5s", animationDelay: "1s" }}
              />
              <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(110deg,transparent_30%,hsl(0_0%_100%/0.06)_50%,transparent_70%)] bg-[length:200%_100%] animate-[shimmer_4s_linear_infinite]" />
              <div className="pointer-events-none absolute inset-0 opacity-[0.04] [background-image:linear-gradient(to_right,currentColor_1px,transparent_1px),linear-gradient(to_bottom,currentColor_1px,transparent_1px)] [background-size:42px_42px]" />
              <div className="pointer-events-none absolute inset-0 rounded-[2rem] ring-1 ring-inset ring-background/10 transition-all duration-700 group-hover:ring-primary/40" />

              <div className="relative z-10">
                <span className="inline-flex items-center gap-2 rounded-full border border-background/15 bg-background/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-background/70 backdrop-blur-sm animate-fade-in">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                  </span>
                  {s.eyebrow ?? "Atendimento personalizado"}
                </span>
                <h2 className="display-lg mt-6 text-3xl md:text-5xl animate-fade-in">
                  {s.title ?? "Não encontrou o que procura?"}
                </h2>
                <p className="mx-auto mt-5 max-w-xl text-background/75 md:text-lg animate-fade-in">
                  {s.subtitle ??
                    "Nossa equipe monta um orçamento personalizado para o seu projeto, com as melhores condições e equipamentos das principais marcas do mundo."}
                </p>
                <div className="mt-10 flex justify-center animate-fade-in">
                  <QuoteDialog
                    trigger={
                      <Button
                        size="lg"
                        variant="secondary"
                        className="group/btn relative overflow-hidden shadow-xl transition-transform duration-300 hover:scale-[1.03]"
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          Falar com um especialista
                          <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                        </span>
                      </Button>
                    }
                  />
                </div>
              </div>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <PublicLayout>
      {/* Hero — vira slider automático quando há mais de um banner ativo na home */}
      <HeroSlider />

      {sections.map((s) => renderSection(s))}
    </PublicLayout>
  );
}
