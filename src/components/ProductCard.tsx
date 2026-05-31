import { Link } from "@tanstack/react-router";
import { AVAILABILITY_LABELS, AVAILABILITY_TONE } from "@/lib/site";
import type { Product } from "@/lib/catalog";
import { track } from "@/lib/analytics";
import { ArrowUpRight } from "lucide-react";
import placeholder from "@/assets/product-placeholder.jpg";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      onClick={() =>
        track("product_card_click", {
          product_id: product.id,
          brand_id: product.brand_id ?? null,
          content_name: product.name,
        })
      }
      className="group hover-lift flex h-full flex-col overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm transition-shadow hover:shadow-lg"
    >
      <div className="relative aspect-square overflow-hidden bg-surface p-3 sm:p-4">
        <img
          src={product.main_image_url || placeholder}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-contain transition-transform duration-700 group-hover:scale-105"
        />
        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-[10px] font-semibold sm:text-[11px] ${
            AVAILABILITY_TONE[product.availability_status] ??
            "bg-muted text-muted-foreground"
          }`}
        >
          {AVAILABILITY_LABELS[product.availability_status] ?? "Sob consulta"}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-border/70 p-3 sm:p-4">
        {product.model && (
          <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground sm:text-xs">
            {product.model}
          </p>
        )}
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[13px] font-semibold leading-snug tracking-tight text-foreground sm:text-sm">
          {product.name}
        </h3>
        {product.short_description && (
          <p className="line-clamp-2 hidden text-sm text-muted-foreground sm:block">
            {product.short_description}
          </p>
        )}
        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-[11px] font-medium text-muted-foreground sm:text-xs">
            Consultar preço
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary sm:text-xs">
            Ver
            <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
