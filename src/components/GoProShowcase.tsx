import { CategoryShowcase } from "@/components/CategoryShowcase";

export function GoProShowcase() {
  return (
    <CategoryShowcase
      eyebrow="Linha GoPro"
      title="Câmeras de Ação GoPro"
      videoSrc="/videos/gopro-cameras.mp4"
      categorySlug="gopro-acao"
      brandLabel="GoPro"
      brandSlug="gopro"
      ctaLabel="Ver linha GoPro"
      ctaTo="brand"
    />
  );
}
