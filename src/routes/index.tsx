import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { track } from "@/lib/analytics";
import { PublicLayout } from "@/components/PublicLayout";
import { ProductCard } from "@/components/ProductCard";
import { DronesShowcase } from "@/components/DronesShowcase";
import { CanonShowcase } from "@/components/CanonShowcase";
import { SonyShowcase } from "@/components/SonyShowcase";
import { GoProShowcase } from "@/components/GoProShowcase";
import { QuoteDialog } from "@/components/QuoteDialog";
import { GridGlowBackground } from "@/components/ui/grid-glow-background";
import { Button } from "@/components/ui/button";
import { useBrands, useProducts } from "@/lib/catalog";
import { useActiveHero, useHomeSections, type HomeSection } from "@/lib/site-content";
import { BRAND_THEME, COMPANY_NAME } from "@/lib/site";
import { ShieldCheck, Award, Headphones, Truck, ArrowRight } from "lucide-react";
import heroHome from "@/assets/hero-home.jpg";
import brandCanon from "@/assets/brand-canon.jpg";
import brandDji from "@/assets/brand-dji.jpg";
import brandSony from "@/assets/brand-sony.jpg";
import brandGopro from "@/assets/brand-gopro.jpg";

const BRAND_IMAGES: Record<string, string> = {
  canon: brandCanon,
  dji: brandDji,
  sony: brandSony,
  gopro: brandGopro,
};

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
  const { data: hero } = useActiveHero("home");
  const { data: dbSections } = useHomeSections();

  const sections = (dbSections && dbSections.length > 0 ? dbSections : DEFAULT_SECTIONS)
    .filter((s) => s.is_active)
    .sort((a, b) => a.order_index - b.order_index);

  const heroEyebrow = hero?.eyebrow ?? `${COMPANY_NAME} · Brasília-DF`;
  const heroTitle = hero?.title ?? "Equipamentos profissionais de";
  const heroHighlight = hero?.highlight ?? "foto e vídeo";
  const heroSubtitle =
    hero?.subtitle ??
    "Curadoria oficial das marcas Canon, DJI, Sony e GoPro. Conte com mais de 20 anos de expertise para escolher o equipamento certo.";
  const heroBadge = hero?.badge_text ?? "Revendedor autorizado de todas as linhas das marcas";
  const heroImage = hero?.desktop_image_url || heroHome;
  const heroOverlay = hero?.overlay_opacity ?? 0.7;
  const primaryLabel = hero?.primary_button_label ?? "Ver catálogo";
  const primaryUrl = hero?.primary_button_url ?? "/catalogo";
  const secondaryLabel = hero?.secondary_button_label ?? "Solicitar orçamento";
  const secondaryUrl = hero?.secondary_button_url ?? "";

  useEffect(() => {
    if (hero?.id)
      track("banner_view", { banner_id: hero.id, content_name: hero.title ?? "Hero home" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hero?.id]);

  const onBannerClick = () =>
    track("banner_click", { banner_id: hero?.id ?? null, content_name: hero?.title ?? "Hero home" });



  const renderSection = (s: { section_key: string; eyebrow: string | null; title: string | null; subtitle: string | null }) => {
    switch (s.section_key) {
      case "brands":
        return (
          <section key="brands" className="container-page -mt-12 relative z-10">
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {(brands ?? []).map((b) => {
                const theme = BRAND_THEME[b.slug];
                const image = BRAND_IMAGES[b.slug];
                return (
                  <Link
                    key={b.id}
                    to="/marca/$slug"
                    params={{ slug: b.slug }}
                    className="hover-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden gradient-dark">
                      {image && (
                        <img
                          src={image}
                          alt={`Produtos ${b.name}`}
                          loading="lazy"
                          width={800}
                          height={600}
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                        {b.name}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <span
                        className="inline-block h-1.5 w-12 rounded-full"
                        style={{ background: theme?.color ?? "#888" }}
                      />
                      <h3 className="mt-4 text-2xl font-bold tracking-tight">{b.name}</h3>
                      <p className="mt-2 flex-1 text-sm text-muted-foreground">{theme?.blurb}</p>
                      <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                        Explorar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
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
                      <LiquidMetalButton className="group/btn h-12 px-8 text-base shadow-xl">
                        Falar com um especialista
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                      </LiquidMetalButton>
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
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink">
        <div className="absolute inset-0">
          {hero?.media_type === "video" && hero.video_url ? (
            <video
              src={hero.video_url}
              autoPlay
              muted
              loop
              playsInline
              poster={heroImage}
              className="h-full w-full object-cover"
            />
          ) : (
            <img src={heroImage} alt="" className="h-full w-full object-cover" />
          )}
          {/* Vertical gradient on mobile for legibility, horizontal on desktop */}
          <div
            className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40 md:bg-gradient-to-r md:from-ink md:via-ink/70 md:to-ink/30"
            style={{ opacity: heroOverlay }}
          />
          <GridGlowBackground className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen opacity-70" />
        </div>
        <div className="container-page relative flex min-h-[88vh] flex-col justify-center py-24 sm:py-32 md:py-48">
          <div className="max-w-2xl animate-fade-up">
            <p className="eyebrow mb-3 text-background/70 sm:mb-4">{heroEyebrow}</p>
            <h1 className="display-hero text-[2.5rem] leading-[1.05] text-background sm:text-5xl md:text-6xl">
              {heroTitle}{" "}
              {heroHighlight && <span className="text-primary">{heroHighlight}</span>}
            </h1>
            <p className="mt-5 max-w-xl text-base text-background/80 sm:mt-6 sm:text-lg">{heroSubtitle}</p>
            {heroBadge && (
              <div className="mt-5 inline-flex items-start gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-2.5 backdrop-blur-md sm:mt-6 sm:items-center sm:rounded-full">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
                <span className="text-sm font-semibold leading-snug text-background">{heroBadge}</span>
              </div>
            )}
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
              {primaryLabel && (
                <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
                  <a href={primaryUrl} onClick={onBannerClick}>
                    {primaryLabel} <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {secondaryLabel &&
                (secondaryUrl ? (
                  <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                    <a href={secondaryUrl} onClick={onBannerClick}>{secondaryLabel}</a>
                  </Button>
                ) : (
                  <QuoteDialog
                    trigger={
                      <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                        {secondaryLabel}
                      </Button>
                    }
                  />
                ))}
            </div>
          </div>
        </div>
      </section>

      {sections.map((s) => renderSection(s))}
    </PublicLayout>
  );
}
