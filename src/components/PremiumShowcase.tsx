import { CategoryShowcase } from "@/components/CategoryShowcase";
import { usePremiumShowcase } from "@/lib/site-content";
import { useProductsByIds } from "@/lib/catalog";
import premiumBg from "@/assets/premium-showcase.jpg";

/**
 * "Produto Premium em Destaque" — a premium showcase (same visual language as
 * the category showcases) driven by an editable config row and a hand-picked
 * list of products. Configured in the admin under "Produto Premium destaque".
 */
export function PremiumShowcase() {
  const { data: config } = usePremiumShowcase();
  const ids = config?.product_ids ?? [];
  const { data: products } = useProductsByIds(ids);

  if (!config || !config.is_active) return null;
  if (!products || products.length === 0) return null;

  return (
    <CategoryShowcase
      eyebrow={config.eyebrow ?? "Destaque premium"}
      title={config.title ?? "Produto Premium em Destaque"}
      subtitle={config.subtitle}
      imageSrc={config.background_image_url || premiumBg}
      videoSrc={config.background_video_url || undefined}
      products={products}
      brandLabel="Curadoria premium"
      ctaLabel={config.cta_label ?? "Ver detalhes"}
      ctaHref={config.cta_url || undefined}
      ctaTo="catalog"
    />
  );
}
