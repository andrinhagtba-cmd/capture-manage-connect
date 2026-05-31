import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, X, Camera, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useBrands, useCategories } from "@/lib/catalog";
import { COMPANY_NAME, BRAND_THEME } from "@/lib/site";
import { QuoteDialog } from "@/components/QuoteDialog";

export function SiteHeader() {
  const { data: brands } = useBrands();
  const { data: categories } = useCategories();
  const [openBrand, setOpenBrand] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const catsFor = (brandId: string) =>
    (categories ?? []).filter((c) => c.brand_id === brandId);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-background">
            <Camera className="h-5 w-5" />
          </span>
          <span className="text-lg font-bold tracking-tight text-foreground">
            NL <span className="text-primary">Foto e Vídeo</span>
          </span>
        </Link>

        {/* Desktop nav with mega menu */}
        <nav
          className="hidden items-center gap-1 lg:flex"
          onMouseLeave={() => setOpenBrand(null)}
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
              onMouseEnter={() => setOpenBrand(brand.id)}
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
                <span className="font-bold">{COMPANY_NAME}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileOpen(false)}
                  aria-label="Fechar"
                >
                  <X className="h-5 w-5" />
                </Button>
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
          onMouseEnter={() => setOpenBrand(openBrand)}
          onMouseLeave={() => setOpenBrand(null)}
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
