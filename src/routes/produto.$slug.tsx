import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PublicLayout } from "@/components/PublicLayout";
import { QuoteDialog } from "@/components/QuoteDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "@/components/ProductCard";
import { useProduct, useProducts, useBrands } from "@/lib/catalog";
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_TONE,
} from "@/lib/site";
import { useCompany } from "@/lib/site-content";
import { getProductSeo } from "@/lib/seo.functions";
import { buildSeoHead, DEFAULT_SITE_URL } from "@/lib/seo-meta";
import { useEffect, useState } from "react";
import { track } from "@/lib/analytics";
import { ExternalLink, MessageCircle, ChevronRight } from "lucide-react";
import placeholder from "@/assets/product-placeholder.jpg";

export const Route = createFileRoute("/produto/$slug")({
  loader: async ({ params }) => {
    try {
      const seo = await getProductSeo({ data: { slug: params.slug } });
      return { seo };
    } catch {
      return { seo: null };
    }
  },
  head: ({ params, loaderData }) => {
    const seo = loaderData?.seo;
    if (!seo) {
      return {
        meta: [
          { title: "Produto — NL Foto e Vídeo" },
          {
            name: "description",
            content:
              "Detalhes do produto e solicitação de orçamento na NL Foto e Vídeo.",
          },
          { property: "og:type", content: "product" },
        ],
        links: [
          {
            rel: "canonical",
            href: `${DEFAULT_SITE_URL}/produto/${params.slug}`,
          },
        ],
      };
    }
    return buildSeoHead(seo);
  },
  component: ProductPage,
});


function asArray(v: unknown): any[] {
  return Array.isArray(v) ? v : [];
}

function ProductPage() {
  const { slug } = Route.useParams();
  const company = useCompany();
  const { data: product, isLoading } = useProduct(slug);
  const { data: brands } = useBrands();
  const brand = brands?.find((b) => b.id === product?.brand_id);
  const { data: related } = useProducts({ brandSlug: brand?.slug });

  const gallery = product ? asArray(product.gallery_json) : [];
  const images = [product?.main_image_url, ...gallery].filter(Boolean) as string[];
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (!product) return;
    track("product_view", {
      product_id: product.id,
      brand_id: product.brand_id ?? null,
      category_id: product.category_id ?? null,
      content_name: product.name,
      content_category: brand?.name ?? null,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id, brand?.name]);



  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container-page py-32 text-center text-muted-foreground">
          Carregando...
        </div>
      </PublicLayout>
    );
  }
  if (!product) throw notFound();

  const specs = asArray(product.specifications_json);
  const useCases = asArray(product.use_cases_json);
  const tags = asArray(product.tags_json);

  return (
    <PublicLayout>
      <div className="container-page py-8">
        {/* Breadcrumb */}
        <nav className="mb-6 flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Início</Link>
          <ChevronRight className="h-3.5 w-3.5" />
          <Link to="/catalogo" className="hover:text-foreground">Catálogo</Link>
          {brand && (
            <>
              <ChevronRight className="h-3.5 w-3.5" />
              <Link
                to="/marca/$slug"
                params={{ slug: brand.slug }}
                className="hover:text-foreground"
              >
                {brand.name}
              </Link>
            </>
          )}
          <ChevronRight className="h-3.5 w-3.5" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
              <img
                src={images[active] || placeholder}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 flex gap-3">
                {images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActive(i)}
                    className={`h-20 w-20 overflow-hidden rounded-lg border-2 ${
                      active === i ? "border-primary" : "border-border"
                    }`}
                  >
                    <img src={img} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            {product.model && (
              <p className="eyebrow text-muted-foreground">{product.model}</p>
            )}
            <h1 className="display-lg mt-2 text-3xl md:text-4xl">{product.name}</h1>
            <div className="mt-4 flex items-center gap-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  AVAILABILITY_TONE[product.availability_status]
                }`}
              >
                {AVAILABILITY_LABELS[product.availability_status]}
              </span>
              {product.sku && (
                <span className="text-xs text-muted-foreground">SKU: {product.sku}</span>
              )}
            </div>

            {product.short_description && (
              <p className="mt-5 text-lg text-muted-foreground">
                {product.short_description}
              </p>
            )}

            <div className="mt-6 rounded-xl border border-border bg-surface p-5">
              <p className="text-sm text-muted-foreground">Preço</p>
              <p className="text-2xl font-bold">Sob consulta</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Solicite um orçamento personalizado com a melhor condição.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <QuoteDialog
                  productId={product.id}
                  productName={product.name}
                  brandName={brand?.name}
                  trigger={
                    <Button size="lg" className="gap-2">
                      <MessageCircle className="h-4 w-4" /> Solicitar orçamento
                    </Button>
                  }
                />
                <Button asChild size="lg" variant="outline" className="gap-2">
                  <a
                    href={company.whatsappLink(
                      `Olá! Tenho interesse no ${product.name}. Pode me passar mais informações?`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() =>
                      track("whatsapp_click", {
                        product_id: product.id,
                        brand_id: product.brand_id ?? null,
                        content_name: product.name,
                        metadata: { origin: "product_page" },
                      })
                    }
                  >
                    <MessageCircle className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              </div>
            </div>

            {tags.length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {tags.map((t, i) => (
                  <Badge key={i} variant="secondary">{String(t)}</Badge>
                ))}
              </div>
            )}

            {product.official_product_url && (
              <a
                href={product.official_product_url}
                target="_blank"
                rel="noreferrer"
                className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Ver página oficial <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        </div>

        {/* Description + specs */}
        <div className="mt-16 grid gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            {product.full_description && (
              <div>
                <h2 className="text-xl font-bold">Sobre o produto</h2>
                <p className="mt-3 whitespace-pre-line leading-relaxed text-muted-foreground">
                  {product.full_description}
                </p>
              </div>
            )}
            {useCases.length > 0 && (
              <div>
                <h2 className="text-xl font-bold">Indicado para</h2>
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {useCases.map((u, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {String(u)}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {specs.length > 0 && (
            <div>
              <h2 className="text-xl font-bold">Especificações</h2>
              <dl className="mt-3 divide-y divide-border rounded-xl border border-border">
                {specs.map((s: any, i: number) => (
                  <div key={i} className="flex justify-between gap-4 px-4 py-3 text-sm">
                    <dt className="text-muted-foreground">{s.label ?? s.key ?? s.name}</dt>
                    <dd className="text-right font-medium">{s.value ?? s.val}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Related */}
        {(related ?? []).filter((r) => r.id !== product.id).length > 0 && (
          <section className="mt-20">
            <h2 className="display-lg mb-6 text-2xl">Você também pode gostar</h2>
            <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
              {(related ?? [])
                .filter((r) => r.id !== product.id)
                .slice(0, 4)
                .map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
            </div>
          </section>
        )}
      </div>
    </PublicLayout>
  );
}
