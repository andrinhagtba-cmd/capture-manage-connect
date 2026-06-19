import { useEffect, useMemo, useState } from "react";
import { track } from "@/lib/analytics";
import { QuoteDialog } from "@/components/QuoteDialog";
import { GridGlowBackground } from "@/components/ui/grid-glow-background";
import { Button } from "@/components/ui/button";
import { useHeroBanners, type HeroBanner } from "@/lib/site-content";
import { useAutoplayVideoRef } from "@/hooks/use-autoplay-video";
import { COMPANY_NAME } from "@/lib/site";
import { ShieldCheck, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import heroHome from "@/assets/hero-home.jpg";

/** Tempo (ms) que cada banner fica visível antes de trocar. */
const SLIDE_INTERVAL = 6000;

export function HeroSlider() {
  const { data: banners } = useHeroBanners("home");

  // Apenas banners ativos da home, na ordem definida no admin.
  const slides = useMemo(
    () =>
      (banners ?? [])
        .filter((b) => b.is_active)
        .sort((a, b) => a.order_index - b.order_index),
    [banners],
  );

  const [index, setIndex] = useState(0);

  // Garante que o índice continue válido se a lista mudar.
  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [slides.length, index]);

  // Auto-rotação somente quando há mais de um banner.
  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, SLIDE_INTERVAL);
    return () => clearInterval(id);
  }, [slides.length]);

  const current = slides[index];

  // Rastreia visualização do banner exibido.
  useEffect(() => {
    if (current?.id)
      track("banner_view", { banner_id: current.id, content_name: current.title ?? "Hero home" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const go = (dir: -1 | 1) =>
    setIndex((i) => (i + dir + slides.length) % slides.length);

  return (
    <section className="relative overflow-hidden bg-ink">
      {/* Camadas de mídia — uma por slide, com transição de opacidade */}
      <div className="absolute inset-0">
        {(slides.length > 0 ? slides : [null]).map((b, i) => (
          <HeroMedia key={b?.id ?? "default"} banner={b} active={i === index} />
        ))}
        <GridGlowBackground className="pointer-events-none absolute inset-0 h-full w-full mix-blend-screen opacity-70" />
      </div>

      <HeroContent banner={current} />

      {/* Controles do slider — só quando há mais de um banner */}
      {slides.length > 1 && (
        <>
          <button
            type="button"
            aria-label="Banner anterior"
            onClick={() => go(-1)}
            className="absolute left-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-background/20 bg-ink/40 p-2 text-background backdrop-blur-md transition hover:bg-ink/70 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Próximo banner"
            onClick={() => go(1)}
            className="absolute right-3 top-1/2 z-20 -translate-y-1/2 rounded-full border border-background/20 bg-ink/40 p-2 text-background backdrop-blur-md transition hover:bg-ink/70 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Ir para o banner ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index ? "w-8 bg-primary" : "w-2 bg-background/40 hover:bg-background/70"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function HeroMedia({ banner, active }: { banner: HeroBanner | null; active: boolean }) {
  const image = banner?.desktop_image_url || heroHome;
  const overlay = banner?.overlay_opacity ?? 0.7;
  return (
    <div
      className={`absolute inset-0 transition-opacity duration-1000 ${active ? "opacity-100" : "opacity-0"}`}
    >
      {banner?.media_type === "video" && banner.video_url ? (
        <video
          src={banner.video_url}
          autoPlay
          muted
          loop
          playsInline
          poster={image}
          className="h-full w-full object-cover"
        />
      ) : (
        <img src={image} alt="" className="h-full w-full object-cover" />
      )}
      <div
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/80 to-ink/40 md:bg-gradient-to-r md:from-ink md:via-ink/70 md:to-ink/30"
        style={{ opacity: overlay }}
      />
    </div>
  );
}

function HeroContent({ banner }: { banner: HeroBanner | null }) {
  const eyebrow = banner?.eyebrow ?? `${COMPANY_NAME} · Brasília-DF`;
  const title = banner?.title ?? "Equipamentos profissionais de";
  const highlight = banner?.highlight ?? "foto e vídeo";
  const subtitle =
    banner?.subtitle ??
    "Curadoria oficial das marcas Canon, DJI, Sony e GoPro. Conte com mais de 20 anos de expertise para escolher o equipamento certo.";
  const badge = banner?.badge_text ?? "Revendedor autorizado de todas as linhas das marcas";
  const primaryLabel = banner?.primary_button_label ?? "Ver catálogo";
  const primaryUrl = banner?.primary_button_url ?? "/catalogo";
  const secondaryLabel = banner?.secondary_button_label ?? "Solicitar orçamento";
  const secondaryUrl = banner?.secondary_button_url ?? "";

  const onBannerClick = () =>
    track("banner_click", { banner_id: banner?.id ?? null, content_name: banner?.title ?? "Hero home" });

  return (
    <div className="container-page relative flex min-h-[88vh] flex-col justify-center py-24 sm:py-32 md:py-48">
      <div key={banner?.id ?? "default"} className="max-w-2xl animate-fade-up">
        <p className="eyebrow mb-3 text-background/70 sm:mb-4">{eyebrow}</p>
        <h1 className="display-hero text-[2.5rem] leading-[1.05] text-background sm:text-5xl md:text-6xl">
          {title}{" "}
          {highlight && <span className="text-primary">{highlight}</span>}
        </h1>
        <p className="mt-5 max-w-xl text-base text-background/80 sm:mt-6 sm:text-lg">{subtitle}</p>
        {badge && (
          <div className="mt-5 inline-flex items-start gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-2.5 backdrop-blur-md sm:mt-6 sm:items-center sm:rounded-full">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary sm:mt-0" />
            <span className="text-sm font-semibold leading-snug text-background">{badge}</span>
          </div>
        )}
        <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
          {primaryLabel && (
            <Button asChild size="lg" className="w-full gap-2 sm:w-auto">
              <a href={primaryUrl} onClick={onBannerClick}>
                {primaryLabel} <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          )}
          {secondaryLabel &&
            (secondaryUrl ? (
              <Button asChild size="lg" variant="secondary" className="w-full sm:w-auto">
                <a href={secondaryUrl} onClick={onBannerClick}>{secondaryLabel}</a>
              </Button>
            ) : (
              <QuoteDialog
                trigger={
                  <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                    {secondaryLabel}
                  </Button>
                }
              />
            ))}
        </div>
      </div>
    </div>
  );
}
