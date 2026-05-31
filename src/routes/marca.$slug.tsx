import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicLayout } from "@/components/PublicLayout";
import { ProductCard } from "@/components/ProductCard";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { QuoteDialog } from "@/components/QuoteDialog";
import { Button } from "@/components/ui/button";
import { useBrands, useCategories, useProducts } from "@/lib/catalog";
import { useActiveHero, useBrandPageSettings } from "@/lib/site-content";
import { track } from "@/lib/analytics";
import { BRAND_THEME } from "@/lib/site";
import { ArrowRight, ExternalLink } from "lucide-react";
import heroCanon from "@/assets/hero-canon.jpg";
import heroDji from "@/assets/hero-dji.jpg";
import heroSony from "@/assets/hero-sony.jpg";
import heroGopro from "@/assets/hero-gopro.jpg";
import canonCameras from "@/assets/canon-cameras.jpg";
import canonLentes from "@/assets/canon-lentes.jpg";
import canonImpressoras from "@/assets/canon-impressoras.jpg";

import sonyCameras from "@/assets/sony-cameras.jpg";
import goproAcao from "@/assets/gopro-acao.jpg";
import gopro360 from "@/assets/gopro-360.jpg";
import goproCriadores from "@/assets/gopro-criadores.jpg";

const HEROES: Record<string, string> = {
  canon: heroCanon,
  dji: heroDji,
  sony: heroSony,
  gopro: heroGopro,
};

const GOPRO_LINES: { title: string; desc: string; cat: string; image: string }[] = [
  {
    title: "Câmeras de Ação",
    desc: "Linha HERO: estabilização, resistência à água e vídeo em alta resolução para qualquer aventura.",
    cat: "gopro-acao",
    image: goproAcao,
  },
  {
    title: "Câmeras 360°",
    desc: "MAX e linha 360: capture tudo ao redor e reenquadre o melhor ângulo depois.",
    cat: "gopro-360",
    image: gopro360,
  },
  {
    title: "Câmeras para Criadores",
    desc: "Soluções pensadas para vlogs e produção de conteúdo com áudio e enquadramento profissionais.",
    cat: "gopro-criadores",
    image: goproCriadores,
  },
];


export const Route = createFileRoute("/marca/$slug")({
  head: ({ params }) => {
    const name = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
    return {
      meta: [
        { title: `${name} — NL Foto e Vídeo` },
        {
          name: "description",
          content: `Linha ${name} oficial na NL Foto e Vídeo. Câmeras, lentes e acessórios com orçamento personalizado.`,
        },
        { property: "og:title", content: `${name} — NL Foto e Vídeo` },
        {
          property: "og:description",
          content: `Produtos ${name} com curadoria especializada.`,
        },
      ],
      links: [{ rel: "canonical", href: `/marca/${params.slug}` }],
    };
  },
  component: BrandPage,
});

function BrandPage() {
  const { slug } = Route.useParams();
  const { data: brands, isLoading } = useBrands();
  const { data: categories } = useCategories();
  const { data: products } = useProducts({ brandSlug: slug });
  const { data: hero } = useActiveHero(slug);
  const { data: pageSettings } = useBrandPageSettings(slug);

  const brand = brands?.find((b) => b.slug === slug);
  const theme = BRAND_THEME[slug];

  if (!isLoading && !brand) throw notFound();

  const brandCats = (categories ?? []).filter((c) => c.brand_id === brand?.id);

  // Hero content: DB hero override → brand page settings → hardcoded fallback.
  const heroTitle = hero?.title ?? pageSettings?.intro_title ?? brand?.name ?? slug;
  const heroSubtitle =
    hero?.subtitle ?? pageSettings?.intro_text ?? brand?.description ?? theme?.blurb ?? "";
  const heroImage = hero?.desktop_image_url || HEROES[slug];
  const heroVideo = hero?.media_type === "video" ? hero.video_url : null;
  const useGoproDefaultVideo = !hero && slug === "gopro";
  const heroOverlay = hero?.overlay_opacity ?? null;

  const primaryLabel = hero?.primary_button_label ?? pageSettings?.primary_button_label ?? "Solicitar orçamento";
  const primaryUrl = hero?.primary_button_url ?? pageSettings?.primary_button_url ?? "";
  const secondaryLabel =
    hero?.secondary_button_label ?? pageSettings?.secondary_button_label ?? (brand?.official_site_url ? "Site oficial" : "");
  const secondaryUrl =
    hero?.secondary_button_url ?? pageSettings?.secondary_button_url ?? brand?.official_site_url ?? "";

  const showCategories = pageSettings?.show_categories ?? true;
  const showProducts = pageSettings?.show_products ?? true;

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          {heroVideo ? (
            <video
              className="h-full w-full object-cover"
              src={heroVideo}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              poster={heroImage}
            />
          ) : useGoproDefaultVideo ? (
            <video
              className="h-full w-full object-cover"
              src="/videos/gopro-mission1.mp4"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <img src={heroImage} alt="" className="h-full w-full object-cover" />
          )}
          <div
            className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/75 to-ink/40"
            style={heroOverlay !== null ? { opacity: heroOverlay } : undefined}
          />
        </div>
        <div className="container-page relative py-24 md:py-32">
          <div className="max-w-2xl animate-fade-up">
            <span
              className="inline-block h-1.5 w-14 rounded-full"
              style={{ background: theme?.color ?? "#fff" }}
            />
            {(hero?.eyebrow ?? pageSettings?.intro_eyebrow) && (
              <p className="eyebrow mt-5 text-background/70">
                {hero?.eyebrow ?? pageSettings?.intro_eyebrow}
              </p>
            )}
            <h1 className="display-hero mt-3 text-4xl text-background md:text-6xl">
              {heroTitle}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-background/80">{heroSubtitle}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              {primaryLabel &&
                (primaryUrl ? (
                  <Button asChild size="lg">
                    <a href={primaryUrl}>{primaryLabel}</a>
                  </Button>
                ) : (
                  <QuoteDialog
                    brandName={brand?.name}
                    trigger={<Button size="lg">{primaryLabel}</Button>}
                  />
                ))}
              {secondaryLabel && secondaryUrl && (
                <Button asChild size="lg" variant="secondary" className="gap-2">
                  <a href={secondaryUrl} target="_blank" rel="noreferrer">
                    {secondaryLabel} <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {slug === "gopro" && (
        <section className="container-page -mt-12 relative z-10">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {GOPRO_LINES.map((line) => (
              <Link
                key={line.cat}
                to="/catalogo"
                search={{ marca: "gopro" }}
                className="hover-lift group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div className="relative aspect-[16/10] overflow-hidden gradient-dark">
                  <img
                    src={line.image}
                    alt={line.title}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <span className="absolute left-5 top-5 inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-md">
                    GoPro
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <span
                    className="inline-block h-1.5 w-12 rounded-full"
                    style={{ background: BRAND_THEME["gopro"]?.color ?? "#0096d6" }}
                  />
                  <h3 className="mt-4 text-xl font-bold tracking-tight">{line.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{line.desc}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Explorar linha{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {slug === "dji" && (
        <>
          <CategoryShowcase
            title="Drones com Câmera"
            videoSrc="/videos/drones-com-camera.mp4"
            categorySlug="dji-drones"
            brandLabel="DJI"
            brandSlug="dji"
          />
          <CategoryShowcase
            title="Estabilizadores"
            videoSrc="/videos/estabilizadores.mp4"
            categorySlug="dji-estabilizadores"
            brandLabel="DJI"
            brandSlug="dji"
          />
          <CategoryShowcase
            title="Câmeras e Microfones"
            videoSrc="/videos/cameras-e-microfones.mp4"
            categorySlug="dji-cameras"
            brandLabel="DJI"
            brandSlug="dji"
          />
        </>
      )}

      {slug === "canon" && (
        <>
          <CategoryShowcase
            eyebrow="Linha Canon"
            title="Câmeras"
            imageSrc={canonCameras}
            categorySlug="canon-cameras"
            brandLabel="Canon"
            brandSlug="canon"
          />
          <CategoryShowcase
            eyebrow="Linha Canon"
            title="Lentes e outros"
            imageSrc={canonLentes}
            categorySlug="canon-lentes-outros"
            brandLabel="Canon"
            brandSlug="canon"
          />
          <CategoryShowcase
            eyebrow="Linha Canon"
            title="Impressoras e Multifuncionais"
            imageSrc={canonImpressoras}
            categorySlug="canon-impressoras"
            brandLabel="Canon"
            brandSlug="canon"
          />
        </>
      )}
      {slug === "sony" && (
        <>
          <CategoryShowcase
            eyebrow="Linha Sony Alpha"
            title="Câmeras de Lentes Intercambiáveis"
            imageSrc={sonyCameras}
            categorySlugs={["sony-fullframe", "sony-apsc"]}
            brandLabel="Sony"
            brandSlug="sony"
          />
          <CategoryShowcase
            eyebrow="Linha Sony Alpha"
            title="Câmeras Mirrorless Full-Frame de Montagem E"
            imageSrc={heroSony}
            categorySlug="sony-fullframe"
            brandLabel="Sony"
            brandSlug="sony"
          />
          <CategoryShowcase
            eyebrow="Linha Sony Alpha"
            title="Câmeras APS-C Mirrorless de Montagem E"
            imageSrc={sonyCameras}
            categorySlug="sony-apsc"
            brandLabel="Sony"
            brandSlug="sony"
          />
        </>
      )}

      {slug === "gopro" && (
        <>
          <CategoryShowcase
            eyebrow="Linha GoPro"
            title="Câmeras de Ação"
            videoSrc="/videos/gopro-cameras.mp4"
            categorySlug="gopro-acao"
            brandLabel="GoPro"
            brandSlug="gopro"
          />
          <CategoryShowcase
            eyebrow="Linha GoPro"
            title="Câmeras 360°"
            imageSrc={gopro360}
            categorySlug="gopro-360"
            brandLabel="GoPro"
            brandSlug="gopro"
          />
          <CategoryShowcase
            eyebrow="Linha GoPro"
            title="Câmeras para Criadores"
            imageSrc={goproCriadores}
            categorySlug="gopro-criadores"
            brandLabel="GoPro"
            brandSlug="gopro"
          />
        </>
      )}



      {showCategories && brandCats.length > 0 && (
        <section className="container-page mt-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Categorias {brand?.name}
          </h2>
          <div className="flex flex-wrap gap-2">
            {brandCats.map((c) => (
              <Link
                key={c.id}
                to="/catalogo"
                search={{ marca: slug, cat: c.id }}
                className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition-colors hover:border-primary/50"
              >
                {c.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {showProducts && (
        <section className="container-page mt-12">
          <div className="mb-8 flex items-end justify-between">
            <h2 className="display-lg text-2xl md:text-3xl">Produtos {brand?.name}</h2>
            <Button asChild variant="outline" className="gap-1">
              <Link to="/catalogo" search={{ marca: slug }}>
                Ver no catálogo <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {(products ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
              Em breve novos produtos {brand?.name}. Fale conosco para encomendas.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {(products ?? []).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      )}
    </PublicLayout>
  );
}
