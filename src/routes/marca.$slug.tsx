import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { ProductCard } from "@/components/ProductCard";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { QuoteDialog } from "@/components/QuoteDialog";
import { Button } from "@/components/ui/button";
import { useBrands, useCategories, useProducts } from "@/lib/catalog";
import { BRAND_THEME } from "@/lib/site";
import { ArrowRight, ExternalLink } from "lucide-react";
import heroCanon from "@/assets/hero-canon.jpg";
import heroDji from "@/assets/hero-dji.jpg";
import heroSony from "@/assets/hero-sony.jpg";
import heroGopro from "@/assets/hero-gopro.jpg";
import canonCameras from "@/assets/canon-cameras.jpg";
import canonLentes from "@/assets/canon-lentes.jpg";
import canonImpressoras from "@/assets/canon-impressoras.jpg";
import canonSuprimentos from "@/assets/canon-suprimentos.jpg";

const HEROES: Record<string, string> = {
  canon: heroCanon,
  dji: heroDji,
  sony: heroSony,
  gopro: heroGopro,
};

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

  const brand = brands?.find((b) => b.slug === slug);
  const theme = BRAND_THEME[slug];

  if (!isLoading && !brand) throw notFound();

  const brandCats = (categories ?? []).filter((c) => c.brand_id === brand?.id);

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0">
          <img src={HEROES[slug]} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink/92 via-ink/75 to-ink/40" />
        </div>
        <div className="container-page relative py-24 md:py-32">
          <div className="max-w-2xl animate-fade-up">
            <span
              className="inline-block h-1.5 w-14 rounded-full"
              style={{ background: theme?.color ?? "#fff" }}
            />
            <h1 className="display-hero mt-5 text-4xl text-background md:text-6xl">
              {brand?.name ?? slug}
            </h1>
            <p className="mt-5 max-w-xl text-lg text-background/80">
              {brand?.description || theme?.blurb}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <QuoteDialog
                brandName={brand?.name}
                trigger={<Button size="lg">Solicitar orçamento</Button>}
              />
              {brand?.official_site_url && (
                <Button asChild size="lg" variant="secondary" className="gap-2">
                  <a href={brand.official_site_url} target="_blank" rel="noreferrer">
                    Site oficial <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

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
          <CategoryShowcase
            eyebrow="Linha Canon"
            title="Suprimentos"
            imageSrc={canonSuprimentos}
            categorySlug="canon-suprimentos"
            brandLabel="Canon"
            brandSlug="canon"
          />
        </>
      )}





      {brandCats.length > 0 && (
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
    </PublicLayout>
  );
}
