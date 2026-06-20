import { CategoryShowcase } from "@/components/CategoryShowcase";

const goproPoster = "/videos/gopro-hero13-poster.jpg";

export function GoProShowcase() {
  return (
    <CategoryShowcase
      eyebrow="Linha GoPro"
      title="Câmeras de Ação GoPro"
      videoSrc="/videos/gopro-hero13.mp4"
      imageSrc={goproPoster}
      categorySlug="gopro-acao"
      brandLabel="GoPro"
      brandSlug="gopro"
      ctaLabel="Ver linha GoPro"
      ctaTo="brand"
    />
  );
}
