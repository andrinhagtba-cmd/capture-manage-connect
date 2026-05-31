import { AVAILABILITY_LABELS, AVAILABILITY_TONE } from "@/lib/site";
import type { AdminProduct } from "@/lib/products-admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Pencil, Copy, ExternalLink, Trash2, Star } from "lucide-react";
import placeholder from "@/assets/product-placeholder.jpg";

export function AdminProductCard({
  product,
  brandName,
  categoryName,
  selected,
  onSelect,
  onEdit,
  onDuplicate,
  onDelete,
  compact,
}: {
  product: AdminProduct;
  brandName: string;
  categoryName: string;
  selected: boolean;
  onSelect: (v: boolean) => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  compact?: boolean;
}) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute left-3 top-3 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelect(!!v)}
          className="bg-background/90"
        />
      </div>
      <div className="absolute right-3 top-3 z-10 flex gap-1 opacity-0 transition group-hover:opacity-100">
        <IconBtn title="Editar" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </IconBtn>
        <IconBtn title="Duplicar" onClick={onDuplicate}>
          <Copy className="h-3.5 w-3.5" />
        </IconBtn>
        <a
          href={`/produto/${product.slug}`}
          target="_blank"
          rel="noreferrer"
          title="Ver no site"
          className="flex h-7 w-7 items-center justify-center rounded-md bg-background/95 shadow-sm hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
        <IconBtn title="Excluir" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </IconBtn>
      </div>

      <div className={`relative bg-surface ${compact ? "aspect-[4/3]" : "aspect-square"}`}>
        <img
          src={product.main_image_url || placeholder}
          alt={product.name}
          className="h-full w-full object-contain p-3"
        />
        {product.is_featured && (
          <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-white">
            <Star className="h-3 w-3 fill-white" /> Destaque
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 border-t border-border p-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
          {brandName} · {categoryName}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug">{product.name}</h3>
        {!compact && product.model && (
          <p className="text-xs text-muted-foreground">{product.model}</p>
        )}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              AVAILABILITY_TONE[product.availability_status] ?? "bg-muted"
            }`}
          >
            {AVAILABILITY_LABELS[product.availability_status] ?? "Sob consulta"}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
              product.is_active
                ? "bg-emerald-100 text-emerald-800"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {product.is_active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>
    </div>
  );
}

function IconBtn({
  children,
  title,
  onClick,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      title={title}
      onClick={onClick}
      className="h-7 w-7 rounded-md bg-background/95 shadow-sm hover:bg-muted"
    >
      {children}
    </Button>
  );
}
