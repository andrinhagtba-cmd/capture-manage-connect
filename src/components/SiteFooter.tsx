import { Link } from "@tanstack/react-router";
import { Camera, Instagram, MapPin, Phone, Clock, Mail, Facebook, Youtube } from "lucide-react";
import { useBrands } from "@/lib/catalog";
import {
  useCompany,
  useFooterSettings,
  useFooterGroups,
  useFooterLinks,
} from "@/lib/site-content";

export function SiteFooter() {
  const { data: brands } = useBrands();
  const company = useCompany();
  const { data: footer } = useFooterSettings();
  const { data: groups } = useFooterGroups();
  const { data: links } = useFooterLinks();

  const companyName = company.name;
  const tagline = footer?.description || company.tagline;
  const address = company.address;
  const phone = company.whatsappDisplay;
  const openingHours = company.openingHours;
  const waHref = company.whatsappLink();

  const activeGroups = (groups ?? []).filter((g) => g.is_active);
  const linksFor = (groupId: string) =>
    (links ?? []).filter((l) => l.is_active && l.group_id === groupId);


  return (
    <footer className="mt-24 border-t border-border bg-surface-dark text-background">
      <div className="container-page grid gap-10 py-14 md:grid-cols-4">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-ink">
              {footer?.logo_url || company?.logo_url ? (
                <img
                  src={(footer?.logo_url || company?.logo_url) as string}
                  alt={companyName}
                  className="h-7 w-7 object-contain"
                />
              ) : (
                <Camera className="h-5 w-5" />
              )}
            </span>
            <span className="text-lg font-bold">{companyName}</span>
          </div>
          <p className="max-w-xs text-sm text-background/70">{tagline}</p>
          {footer?.show_social_links !== false && (
            <a
              href={instagram}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-background/80 hover:text-background"
            >
              <Instagram className="h-4 w-4" /> @nlfotoevideo
            </a>
          )}
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

        {activeGroups.length > 0 ? (
          activeGroups.slice(0, 1).map((group) => (
            <div key={group.id}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/60">
                {group.title}
              </h4>
              <ul className="space-y-2 text-sm">
                {linksFor(group.id).map((link) => (
                  <li key={link.id}>
                    <a
                      href={link.url}
                      className="text-background/80 hover:text-background"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))
        ) : (
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
        )}

        <div>
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-background/60">
            Contato
          </h4>
          <ul className="space-y-3 text-sm text-background/80">
            {footer?.show_company_address !== false && (
              <li className="flex items-start gap-2">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {address}
              </li>
            )}
            {footer?.show_whatsapp !== false && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0" />
                <a href={waHref} target="_blank" rel="noreferrer">
                  {phone}
                </a>
              </li>
            )}
            {footer?.show_opening_hours !== false && (
              <li className="flex items-center gap-2">
                <Clock className="h-4 w-4 shrink-0" /> {openingHours}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10 py-5 text-center text-xs text-background/50">
        {footer?.copyright_text ||
          `© ${new Date().getFullYear()} ${companyName}. Todos os direitos reservados.`}
      </div>
    </footer>
  );
}
