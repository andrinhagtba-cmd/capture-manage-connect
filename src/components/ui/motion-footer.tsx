import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Link } from "@tanstack/react-router";
import { Camera, Instagram, MapPin, Phone, Clock, ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMPANY_NAME,
  COMPANY_TAGLINE,
  WHATSAPP_DISPLAY,
  ADDRESS,
  INSTAGRAM_URL,
  whatsappUrl,
} from "@/lib/site";
import { useBrands } from "@/lib/catalog";
import logoNlLight from "@/assets/logo-nl-light.png";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// -------------------------------------------------------------------------
// Scoped, theme-adaptive styles (forced dark scope for a premium look)
// -------------------------------------------------------------------------
const STYLES = `
.cinematic-footer-wrapper {
  -webkit-font-smoothing: antialiased;
  --cf-fg: oklch(0.99 0 0);
  --cf-bg: oklch(0.14 0.005 286);
  --cf-primary: oklch(0.6 0.22 27);
  --cf-secondary: oklch(0.45 0.18 27);
  --cf-accent: oklch(0.58 0.22 27);

  --pill-bg-1: color-mix(in oklch, var(--cf-fg) 6%, transparent);
  --pill-bg-2: color-mix(in oklch, var(--cf-fg) 2%, transparent);
  --pill-shadow: color-mix(in oklch, black 50%, transparent);
  --pill-highlight: color-mix(in oklch, var(--cf-fg) 12%, transparent);
  --pill-inset-shadow: color-mix(in oklch, black 60%, transparent);
  --pill-border: color-mix(in oklch, var(--cf-fg) 12%, transparent);

  --pill-bg-1-hover: color-mix(in oklch, var(--cf-fg) 12%, transparent);
  --pill-bg-2-hover: color-mix(in oklch, var(--cf-fg) 4%, transparent);
  --pill-border-hover: color-mix(in oklch, var(--cf-primary) 60%, transparent);
  --pill-shadow-hover: color-mix(in oklch, black 70%, transparent);
  --pill-highlight-hover: color-mix(in oklch, var(--cf-fg) 24%, transparent);
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  100% { transform: translate(-50%, -50%) scale(1.15); opacity: 0.9; }
}
@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}
.animate-footer-breathe { animation: footer-breathe 8s ease-in-out infinite alternate; }
.animate-footer-scroll-marquee { animation: footer-scroll-marquee 40s linear infinite; }

.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, color-mix(in oklch, var(--cf-fg) 4%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in oklch, var(--cf-fg) 4%, transparent) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}
.footer-aurora {
  background: radial-gradient(circle at 50% 50%,
    color-mix(in oklch, var(--cf-primary) 22%, transparent) 0%,
    color-mix(in oklch, var(--cf-secondary) 18%, transparent) 40%,
    transparent 70%);
}
.footer-glass-pill {
  background: linear-gradient(145deg, var(--pill-bg-1) 0%, var(--pill-bg-2) 100%);
  box-shadow: 0 10px 30px -10px var(--pill-shadow), inset 0 1px 1px var(--pill-highlight), inset 0 -1px 2px var(--pill-inset-shadow);
  border: 1px solid var(--pill-border);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.footer-glass-pill:hover {
  background: linear-gradient(145deg, var(--pill-bg-1-hover) 0%, var(--pill-bg-2-hover) 100%);
  border-color: var(--pill-border-hover);
  box-shadow: 0 20px 40px -10px var(--pill-shadow-hover), inset 0 1px 1px var(--pill-highlight-hover);
}
.footer-giant-bg-text {
  font-size: 26vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px color-mix(in oklch, var(--cf-fg) 6%, transparent);
  background: linear-gradient(180deg, color-mix(in oklch, var(--cf-fg) 10%, transparent) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}
.footer-text-glow {
  background: linear-gradient(180deg, var(--cf-fg) 0%, color-mix(in oklch, var(--cf-fg) 40%, transparent) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 20px color-mix(in oklch, var(--cf-fg) 15%, transparent));
}
`;

// -------------------------------------------------------------------------
// Magnetic button primitive
// -------------------------------------------------------------------------
type MagneticProps = React.HTMLAttributes<HTMLElement> & {
  as?: React.ElementType;
  href?: string;
  target?: string;
  rel?: string;
};

const MagneticButton = React.forwardRef<HTMLElement, MagneticProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement | null>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(element, {
            x: x * 0.4,
            y: y * 0.4,
            scale: 1.05,
            ease: "power2.out",
            duration: 0.4,
          });
        };
        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0,
            y: 0,
            scale: 1,
            ease: "elastic.out(1, 0.3)",
            duration: 1.2,
          });
        };
        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);
        return () => {
          element.removeEventListener("mousemove", handleMouseMove);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          localRef.current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef)
            (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  },
);
MagneticButton.displayName = "MagneticButton";

// -------------------------------------------------------------------------
// Marquee
// -------------------------------------------------------------------------
const MARQUEE_ITEMS = [
  "Revenda Oficial",
  "Canon · DJI · Sony · GoPro",
  "Atendimento Especialista",
  "20+ Anos de Experiência",
  "Brasília-DF",
];

const MarqueeRow = () => (
  <div className="flex shrink-0 items-center gap-6 px-3">
    {MARQUEE_ITEMS.map((item) => (
      <React.Fragment key={item}>
        <span className="whitespace-nowrap text-sm font-medium uppercase tracking-[0.2em] text-[var(--cf-fg)]/60">
          {item}
        </span>
        <span className="text-[var(--cf-primary)]">✦</span>
      </React.Fragment>
    ))}
  </div>
);

// -------------------------------------------------------------------------
// Main footer
// -------------------------------------------------------------------------
export function CinematicFooter() {
  const { data: brands } = useBrands();
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const giantTextRef = useRef<HTMLDivElement | null>(null);
  const headingRef = useRef<HTMLDivElement | null>(null);
  const linksRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh",
          scale: 1,
          opacity: 1,
          ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 90%",
            end: "bottom bottom",
            scrub: 1,
          },
        },
      );

      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.15,
          ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 60%",
            end: "center bottom",
            scrub: 1,
          },
        },
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <>
      <style>{STYLES}</style>
      <footer
        ref={wrapperRef}
        className="cinematic-footer-wrapper relative overflow-hidden bg-[var(--cf-bg)] text-[var(--cf-fg)]"
      >
        {/* Background layers */}
        <div className="footer-bg-grid pointer-events-none absolute inset-0" />
        <div className="footer-aurora animate-footer-breathe pointer-events-none absolute left-1/2 top-1/2 h-[80vh] w-[80vh] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl" />

        {/* Marquee */}
        <div className="relative z-10 flex overflow-hidden border-b border-[var(--cf-fg)]/10 py-5">
          <div className="animate-footer-scroll-marquee flex shrink-0">
            <MarqueeRow />
            <MarqueeRow />
            <MarqueeRow />
            <MarqueeRow />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 mx-auto w-full max-w-6xl px-6 pt-16 md:pt-24">
          <div ref={headingRef} className="flex flex-col items-center text-center">
            <div className="flex items-center gap-3">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 p-2 ring-1 ring-white/10 backdrop-blur">
                <img
                  src={logoNlLight}
                  alt="NL Foto e Vídeo"
                  width={512}
                  height={512}
                  className="h-full w-full object-contain"
                />
              </span>
              <span className="text-2xl font-extrabold tracking-tight">{COMPANY_NAME}</span>
            </div>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--cf-fg)]/60 md:text-base">
              {COMPANY_TAGLINE}
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <MagneticButton
                as="a"
                href={whatsappUrl("Olá! Gostaria de um orçamento.")}
                target="_blank"
                rel="noreferrer"
                className="footer-glass-pill flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--cf-fg)]"
              >
                <Phone className="h-4 w-4" /> Falar no WhatsApp
              </MagneticButton>
              <MagneticButton
                as="a"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noreferrer"
                className="footer-glass-pill flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-[var(--cf-fg)]"
              >
                <Instagram className="h-4 w-4" /> @nlfotoevideo
              </MagneticButton>
            </div>
          </div>

          {/* Link columns */}
          <div
            ref={linksRef}
            className="mt-16 grid gap-10 text-center sm:grid-cols-2 sm:text-left md:grid-cols-4"
          >
            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cf-fg)]/40">
                Marcas
              </h4>
              <ul className="space-y-2 text-sm">
                {(brands ?? []).map((b) => (
                  <li key={b.id}>
                    <Link
                      to="/marca/$slug"
                      params={{ slug: b.slug }}
                      className="text-[var(--cf-fg)]/70 transition-colors hover:text-[var(--cf-fg)]"
                    >
                      {b.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cf-fg)]/40">
                Navegação
              </h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link to="/catalogo" className="text-[var(--cf-fg)]/70 transition-colors hover:text-[var(--cf-fg)]">
                    Catálogo
                  </Link>
                </li>
                <li>
                  <Link to="/sobre" className="text-[var(--cf-fg)]/70 transition-colors hover:text-[var(--cf-fg)]">
                    Sobre nós
                  </Link>
                </li>
                <li>
                  <Link to="/contato" className="text-[var(--cf-fg)]/70 transition-colors hover:text-[var(--cf-fg)]">
                    Contato
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="text-[var(--cf-fg)]/70 transition-colors hover:text-[var(--cf-fg)]">
                    Área administrativa
                  </Link>
                </li>
              </ul>
            </div>

            <div className="sm:col-span-2">
              <h4 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--cf-fg)]/40">
                Contato
              </h4>
              <ul className="mx-auto inline-flex flex-col gap-3 text-sm text-[var(--cf-fg)]/70 sm:mx-0">
                <li className="flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--cf-primary)]" /> {ADDRESS}
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="h-4 w-4 shrink-0 text-[var(--cf-primary)]" />
                  <a href={whatsappUrl()} target="_blank" rel="noreferrer" className="hover:text-[var(--cf-fg)]">
                    {WHATSAPP_DISPLAY}
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Clock className="h-4 w-4 shrink-0 text-[var(--cf-primary)]" /> Seg a Sáb · 9h às 18h
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Giant background text */}
        <div className="relative z-10 mt-16 flex items-end justify-center overflow-hidden">
          <div
            ref={giantTextRef}
            className="footer-giant-bg-text select-none whitespace-nowrap"
            aria-hidden
          >
            NL FOTO
          </div>
        </div>

        {/* Bottom bar */}
        <div className="relative z-10 flex flex-col items-center justify-between gap-4 border-t border-[var(--cf-fg)]/10 px-6 py-6 text-center sm:flex-row sm:text-left">
          <p className="text-xs text-[var(--cf-fg)]/50">
            © {new Date().getFullYear()} {COMPANY_NAME}. Todos os direitos reservados.
          </p>
          <MagneticButton
            onClick={scrollToTop}
            className="footer-glass-pill flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold text-[var(--cf-fg)]"
          >
            Voltar ao topo <ArrowUp className="h-4 w-4" />
          </MagneticButton>
        </div>
      </footer>
    </>
  );
}

export default CinematicFooter;
