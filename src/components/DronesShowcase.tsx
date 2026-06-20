import { CategoryShowcase } from "@/components/CategoryShowcase";

const dronesPoster = "/videos/drones-com-camera-poster.jpg";

export function DronesShowcase() {
  return (
    <CategoryShowcase
      title="Drones com Câmera"
      videoSrc="/videos/drones-com-camera.mp4"
      imageSrc={dronesPoster}
      categorySlug="dji-drones"
      brandLabel="DJI"
      brandSlug="dji"
    />
  );
}
