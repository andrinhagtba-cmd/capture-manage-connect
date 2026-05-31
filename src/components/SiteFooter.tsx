import { Link } from "@tanstack/react-router";
import { Camera, Instagram, MapPin, Phone, Clock } from "lucide-react";
import {
  COMPANY_NAME,
  COMPANY_TAGLINE,
  WHATSAPP_DISPLAY,
  ADDRESS,
  INSTAGRAM_URL,
  whatsappUrl,
} from "@/lib/site";
import { useBrands } from "@/lib/catalog";

export function SiteFooter() {
  const { data: brands } = useBrands();
  return (
    <footer className="mt-24 border-t border-border bg-surface-dark text-background">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-ink">
              <Camera className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold">NL Foto e Vídeo</span>
          </div>
          <p className="max-w-xs text-sm text-background/70">{COMPANY_TAGLINE}</p>
          <a
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-sm text-background/80 hover:text-background"
          >
            <Instagram className="h-4 w-4" /> @nlfotoevideo
          </a>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/60">
            Marcas
          </h4>
          <ul className="space-y-2 text-sm">
            {(brands ?? []).map((b) => (
              <li key={b.id}>
                <Link
                  to="/marca/$slug"
                  params={{ slug: b.slug }}
                  className="text-background/80 hover:text-background"
                >
                  {b.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/60">
            Navegação
          </h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link to="/catalogo" className="text-background/80 hover:text-background">
                Catálogo
              </Link>
            </li>
            <li>
              <Link to="/sobre" className="text-background/80 hover:text-background">
                Sobre nós
              </Link>
            </li>
            <li>
              <Link to="/contato" className="text-background/80 hover:text-background">
                Contato
              </Link>
            </li>
            <li>
              <Link to="/login" className="text-background/80 hover:text-background">
                Área administrativa
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/60">
            Contato
          </h4>
          <ul className="space-y-3 text-sm text-background/80">
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {ADDRESS}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0" />
              <a href={whatsappUrl()} target="_blank" rel="noreferrer">
                {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0" /> Seg a Sáb · 9h às 18h
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 py-5 text-center text-xs text-background/50">
        © {new Date().getFullYear()} {COMPANY_NAME}. Todos os direitos reservados.
      </div>
    </footer>
  );
}
