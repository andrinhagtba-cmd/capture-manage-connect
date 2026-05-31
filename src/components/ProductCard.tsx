import { Link } from "@tanstack/react-router";
import { Badge } from "@/components/ui/badge";
import { AVAILABILITY_LABELS, AVAILABILITY_TONE } from "@/lib/site";
import type { Product } from "@/lib/catalog";
import placeholder from "@/assets/product-placeholder.jpg";

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/produto/$slug"
      params={{ slug: product.slug }}
      className="group hover-lift block overflow-hidden rounded-xl border border-border bg-card"
    >
      <div className="relative aspect-square overflow-hidden bg-surface">
        <img
          src={product.main_image_url || placeholder}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <span
          className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
            AVAILABILITY_TONE[product.availability_status] ??
            "bg-muted text-muted-foreground"
          }`}
        >
          {AVAILABILITY_LABELS[product.availability_status] ?? "Sob consulta"}
        </span>
      </div>
      <div className="space-y-2 p-4">
        {product.model && (
          <p className="eyebrow text-muted-foreground">{product.model}</p>
        )}
        <h3 className="font-semibold leading-snug tracking-tight text-foreground">
          {product.name}
        </h3>
        {product.short_description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {product.short_description}
          </p>
        )}
        <div className="flex items-center justify-between pt-1">
          <Badge variant="secondary" className="font-medium">
            Consultar preço
          </Badge>
          <span className="text-sm font-medium text-primary group-hover:underline">
            Ver detalhes →
          </span>
        </div>
      </div>
    </Link>
  );
}
