import { CategoryShowcase } from "@/components/CategoryShowcase";
import sonyCameras from "@/assets/sony-cameras.jpg";

export function SonyShowcase() {
  return (
    <CategoryShowcase
      eyebrow="Linha Sony Alpha"
      title="Câmeras Sony Alpha"
      imageSrc={sonyCameras}
      categorySlugs={["sony-fullframe", "sony-apsc"]}
      brandLabel="Sony"
      brandSlug="sony"
      ctaLabel="Ver linha Sony"
      ctaTo="brand"
    />
  );
}
