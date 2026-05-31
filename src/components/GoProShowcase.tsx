import { CategoryShowcase } from "@/components/CategoryShowcase";
import goproPremium from "@/assets/gopro-premium.jpg";

export function GoProShowcase() {
  return (
    <CategoryShowcase
      eyebrow="Linha GoPro"
      title="Câmeras de Ação GoPro"
      imageSrc={goproPremium}
      categorySlug="gopro-acao"
      brandLabel="GoPro"
      brandSlug="gopro"
      ctaLabel="Ver linha GoPro"
      ctaTo="brand"
    />
  );
}
