import { Edit3 } from "lucide-react";
import { getCategoryMeta } from "@/data/categories";
import { CatalogItem, resolveCatalogImage } from "@/lib/catalog";
import { formatDate } from "@/hooks/useAdminCatalogFilters";
import { cn } from "@/lib/utils";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { StatusBadges } from "./StatusBadges";

interface AdminProductCardProps {
  product: CatalogItem;
  isEditing: boolean;
  isSelected: boolean;
  busy: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminProductCard({
  product,
  isEditing,
  isSelected,
  busy,
  onToggleSelect,
  onEdit,
  onDelete,
}: AdminProductCardProps) {
  const category = getCategoryMeta(product.categoryId);

  return (
    <article
      className={cn(
        "rounded-lg bg-card border shadow-card overflow-hidden flex flex-col transition-shadow",
        isEditing ? "border-primary ring-2 ring-primary/40" : "border-border",
      )}
    >
      <div className="relative h-44 bg-white p-4 flex items-center justify-center border-b border-border">
        <label className="absolute top-3 left-3 z-10 flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            className="w-4 h-4 accent-primary cursor-pointer"
            aria-label={`Selecionar ${product.model}`}
          />
        </label>

        {isEditing && (
          <span className="absolute top-3 right-3 z-10 rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
            Editando
          </span>
        )}

        <img
          src={resolveCatalogImage(product)}
          alt={product.model}
          loading="lazy"
          decoding="async"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <div className="p-5 flex flex-col flex-1">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">
          {category?.title || product.subCategory}
        </span>
        <h3 className="text-lg font-bold text-foreground mt-1 mb-2 leading-snug">
          {product.model}
        </h3>

        <p className="text-sm text-muted-foreground line-clamp-2">
          {product.description || `${product.mainCategory} • ${product.subCategory}`}
        </p>

        <StatusBadges product={product} className="mt-3" />

        <div className="mt-auto pt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs text-muted-foreground">Atualizado {formatDate(product.updatedAt)}</span>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2.5 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Editar
            </button>
            <ConfirmDeleteButton
              onConfirm={onDelete}
              ariaLabel={`Remover ${product.model}`}
              disabled={busy}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
