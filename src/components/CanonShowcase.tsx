import { CategoryShowcase } from "@/components/CategoryShowcase";
import canonCameras from "@/assets/canon-cameras.jpg";

export function CanonShowcase() {
  return (
    <CategoryShowcase
      eyebrow="Linha Canon"
      title="Câmeras Canon EOS"
      imageSrc={canonCameras}
      categorySlug="canon-cameras"
      brandLabel="Canon"
      brandSlug="canon"
      ctaLabel="Ver linha Canon"
      ctaTo="brand"
    />
  );
}
