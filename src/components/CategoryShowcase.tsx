import { useState } from "react";
import { Link } from "@tanstack/react-router";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Heart, Star, Truck, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuoteDialog } from "@/components/QuoteDialog";
import { useCategoryProducts, useCategoriesProducts, type Product } from "@/lib/catalog";
import { useCompany } from "@/lib/site-content";
import { useAutoplayVideoRef } from "@/hooks/use-autoplay-video";
import placeholder from "@/assets/product-placeholder.jpg";

function StarRating() {
  return (
    <div className="flex items-center gap-0.5 text-primary">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-current" />
      ))}
    </div>
  );
}

function ShowcaseCard({ product, brandLabel }: { product: Product; brandLabel: string }) {
  const [fav, setFav] = useState(false);
  const company = useCompany();
  const waMsg = `Olá! Tenho interesse no ${product.name}. Pode me passar disponibilidade e condições?`;



  return (
    <div className="hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="relative">
        <button
          type="button"
          aria-label="Favoritar"
          onClick={() => setFav((v) => !v)}
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-border bg-background/90 text-muted-foreground backdrop-blur transition-colors hover:text-primary"
        >
          <Heart className={`h-4 w-4 ${fav ? "fill-primary text-primary" : ""}`} />
        </button>
        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          className="block aspect-square overflow-hidden bg-surface p-5"
        >
          <img
            src={product.main_image_url || placeholder}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-contain transition-transform duration-500 hover:scale-105"
          />
        </Link>
        <div className="px-4 pb-4">
          <Button asChild variant="outline" className="w-full rounded-full">
            <Link to="/produto/$slug" params={{ slug: product.slug }}>
              Ver detalhes
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 border-t border-border/70 p-4">
        <StarRating />
        <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-snug text-foreground">
          {product.name}
        </h3>
        <p className="text-sm font-semibold text-foreground">Consulte disponibilidade</p>

        <div className="mt-1 flex flex-col gap-2">
          <QuoteDialog
            productId={product.id}
            productName={product.name}
            brandName={brandLabel}
            trigger={
              <Button className="w-full rounded-full" size="sm">
                Solicitar orçamento
              </Button>
            }
          />
          <a href={company.whatsappLink(waMsg)} target="_blank" rel="noopener noreferrer">
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2 rounded-full border-emerald-500/40 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800"
            >
              <MessageCircle className="h-4 w-4" /> Falar no WhatsApp
            </Button>
          </a>
        </div>

        <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
          <Truck className="h-4 w-4" /> Frete Grátis
        </div>
      </div>
    </div>
  );
}

export type CategoryShowcaseProps = {
  /** Eyebrow label shown above the title */
  eyebrow?: string;
  /** Big section title */
  title: string;
  /** Optional supporting paragraph below the title */
  subtitle?: string | null;
  /** Path to the hero video (in /public). Optional when using imageSrc. */
  videoSrc?: string;
  /** Background image (imported asset URL). Used when no videoSrc is set. */
  imageSrc?: string;
  /** Category slug to fetch products from */
  categorySlug?: string;
  /** Multiple category slugs (union) to fetch products from */
  categorySlugs?: string[];
  /** Explicit list of products to display (overrides category fetching) */
  products?: Product[];
  /** Brand label used in quote dialogs (e.g. "DJI") */
  brandLabel?: string;
  /** Brand slug used in the "Mostrar todos" link */
  brandSlug?: string;
  /** Label for the floating button */
  ctaLabel?: string;
  /** Where the floating CTA should lead */
  ctaTo?: "catalog" | "brand";
  /** Custom href for the floating CTA (overrides ctaTo) */
  ctaHref?: string;
};

export function CategoryShowcase({
  eyebrow = "Vitrine premium",
  title,
  subtitle,
  videoSrc,
  imageSrc,
  categorySlug,
  categorySlugs,
  products: productsProp,
  brandLabel = "DJI",
  brandSlug = "dji",
  ctaLabel = "Mostrar Todos",
  ctaTo = "catalog",
  ctaHref,
}: CategoryShowcaseProps) {
  const videoRef = useAutoplayVideoRef();
  const single = useCategoryProducts(categorySlug ?? "");
  const multi = useCategoriesProducts(categorySlugs ?? []);
  const products = productsProp ?? (categorySlugs?.length ? multi.data : single.data);
  const [emblaRef, emblaApi] = useEmblaCarousel(
    { align: "start", loop: false, slidesToScroll: 1 },
    [Autoplay({ delay: 5000, stopOnInteraction: true, stopOnMouseEnter: true })],
  );

  const items: Product[] = products ?? [];
  if (items.length === 0) return null;

  return (
    <section className="container-page mt-24">
      <div className="mb-6">
        <p className="eyebrow text-primary">{eyebrow}</p>
        <h2 className="display-lg mt-1 text-3xl md:text-4xl">{title}</h2>
        {subtitle && (
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">{subtitle}</p>
        )}
      </div>


      <div className="relative">
        <div className="relative overflow-hidden rounded-[2rem] shadow-xl">
          {videoSrc ? (
            <video
              ref={videoRef}
              className="h-[260px] w-full object-cover sm:h-[360px] md:h-[460px]"
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <img
              className="h-[260px] w-full object-cover sm:h-[360px] md:h-[460px]"
              src={imageSrc}
              alt={title}
              loading="lazy"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-ink/40 via-transparent to-transparent" />
          <div className="absolute left-4 top-4 md:left-8 md:top-8">
            <Button
              asChild
              size="sm"
              className="rounded-full bg-background px-4 text-xs text-foreground shadow-lg hover:bg-background/90 sm:px-6 sm:text-sm md:h-11 md:px-7 md:text-base"
            >
              {ctaHref ? (
                <a href={ctaHref}>{ctaLabel}</a>
              ) : ctaTo === "brand" ? (
                <Link to="/marca/$slug" params={{ slug: brandSlug }}>
                  {ctaLabel}
                </Link>
              ) : (
                <Link to="/catalogo" search={{ marca: brandSlug }}>
                  {ctaLabel}
                </Link>
              )}
            </Button>
          </div>
        </div>


        <div className="relative z-10 -mt-16 px-1 sm:-mt-20 md:px-10">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-4">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="min-w-0 shrink-0 grow-0 basis-[80%] sm:basis-[48%] lg:basis-[calc(25%-12px)]"
                >
                  <ShowcaseCard product={p} brandLabel={brandLabel} />
                </div>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Anterior"
            onClick={() => emblaApi?.scrollPrev()}
            className="absolute -left-1 top-[42%] z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-md transition-colors hover:bg-surface md:-left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo"
            onClick={() => emblaApi?.scrollNext()}
            className="absolute -right-1 top-[42%] z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-border bg-background text-foreground shadow-md transition-colors hover:bg-surface md:-right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
