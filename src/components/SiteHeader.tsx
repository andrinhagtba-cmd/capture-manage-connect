import { useState, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBrands, useCategories } from "@/lib/catalog";
import { COMPANY_NAME, BRAND_THEME } from "@/lib/site";
import { useCompanySettings, useNavigationItems } from "@/lib/site-content";
import { QuoteDialog } from "@/components/QuoteDialog";
import logoNlFull from "@/assets/logo-nl-full.png";
import menuEquipment from "@/assets/menu-equipment.jpg";

export function SiteHeader() {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const { data: company } = useCompanySettings();
  const { data: navItems } = useNavigationItems("header");
  const companyName = company?.company_name || COMPANY_NAME;
  const customNav = (navItems ?? []).filter((n) => n.is_active);
  const [openBrand, setOpenBrand] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openMenu = (brandId: string) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpenBrand(brandId);
  };
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpenBrand(null), 150);
  };

  const catsFor = (brandId: string) =>
    (categories ?? []).filter((c) => c.brand_id === brandId);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-20 items-center justify-between gap-4 sm:h-24">
        <Link to="/" className="group flex items-center">
          <img
            src={logoNlFull}
            alt={companyName}
            width={1000}
            height={276}
            className="h-14 w-auto object-contain transition-transform duration-300 group-hover:scale-[1.03] sm:h-16 lg:h-20"
          />
        </Link>

        {/* Desktop nav with mega menu */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          onMouseLeave={scheduleClose}
        >
          <Link
            to="/catalogo"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Catálogo
          </Link>
          {(brands ?? []).map((brand) => (
            <div
              key={brand.id}
              className="static"
              onMouseEnter={() => openMenu(brand.id)}
            >
              <Link
                to="/marca/$slug"
                params={{ slug: brand.slug }}
                className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
              >
                {brand.name}
              </Link>
            </div>
          ))}
          <Link
            to="/sobre"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Sobre
          </Link>
          <Link
            to="/contato"
            className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
          >
            Contato
          </Link>
          {customNav.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target={item.opens_new_tab ? "_blank" : undefined}
              rel={item.opens_new_tab ? "noreferrer" : undefined}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          <QuoteDialog
            trigger={<Button size="sm">Solicitar orçamento</Button>}
          />
        </div>

        {/* Mobile menu */}
        <div className="lg:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] max-w-sm overflow-y-auto p-0">
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <span className="font-bold">{companyName}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <div className="relative aspect-video w-full overflow-hidden">
                <img
                  src={menuEquipment}
                  alt="Equipamentos profissionais Canon, Sony, DJI e GoPro"
                  loading="lazy"
                  width={1280}
                  height={720}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary">Linha completa</p>
                  <p className="text-sm font-bold text-foreground">Canon · Sony · DJI · GoPro</p>
                </div>
              </div>
              <div className="flex flex-col p-3">
                <MobileLink to="/catalogo" onNav={() => setMobileOpen(false)}>
                  Catálogo completo
                </MobileLink>
                <p className="px-3 pb-1 pt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Marcas
                </p>
                {(brands ?? []).map((b) => (
                  <Link
                    key={b.id}
                    to="/marca/$slug"
                    params={{ slug: b.slug }}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between rounded-lg px-3 py-3 text-base font-medium hover:bg-accent"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          background: BRAND_THEME[b.slug]?.color ?? "#888",
                        }}
                      />
                      {b.name}
                    </span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </Link>
                ))}
                <MobileLink to="/sobre" onNav={() => setMobileOpen(false)}>
                  Sobre
                </MobileLink>
                <MobileLink to="/contato" onNav={() => setMobileOpen(false)}>
                  Contato
                </MobileLink>
                <div className="px-3 pt-4">
                  <QuoteDialog
                    trigger={
                      <Button size="lg" className="w-full">
                        Solicitar orçamento
                      </Button>
                    }
                  />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {/* Mega menu panel */}
      {openBrand && (
        <div
          className="absolute inset-x-0 top-16 hidden border-b border-border bg-background shadow-lg lg:block"
          onMouseEnter={() => openMenu(openBrand)}
          onMouseLeave={scheduleClose}
        >
          <div className="container-page grid grid-cols-4 gap-6 py-7">
            {catsFor(openBrand).slice(0, 12).map((cat) => (
              <Link
                key={cat.id}
                to="/catalogo"
                search={{ marca: brands?.find((b) => b.id === openBrand)?.slug }}
                onClick={() => setOpenBrand(null)}
                className="text-sm text-foreground/75 transition-colors hover:text-primary"
              >
                {cat.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}

function MobileLink({
  to,
  children,
  onNav,
}: {
  to: string;
  children: React.ReactNode;
  onNav: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onNav}
      className="rounded-lg px-3 py-3 text-base font-medium hover:bg-accent"
    >
      {children}
    </Link>
  );
}
