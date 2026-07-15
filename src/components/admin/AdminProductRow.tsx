import { Edit3 } from "lucide-react";
import { getCategoryMeta } from "@/data/categories";
import { CatalogItem, resolveCatalogImage } from "@/lib/catalog";
import { formatDate } from "@/hooks/useAdminCatalogFilters";
import { cn } from "@/lib/utils";
import { ConfirmDeleteButton } from "./ConfirmDeleteButton";
import { StatusBadges } from "./StatusBadges";

interface AdminProductRowProps {
  product: CatalogItem;
  isEditing: boolean;
  isSelected: boolean;
  busy: boolean;
  onToggleSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function AdminProductRow({
  product,
  isEditing,
  isSelected,
  busy,
  onToggleSelect,
  onEdit,
  onDelete,
}: AdminProductRowProps) {
  const category = getCategoryMeta(product.categoryId);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-4 rounded-lg bg-card border p-3 transition-shadow sm:flex-nowrap",
        isEditing ? "border-primary ring-2 ring-primary/40" : "border-border",
      )}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        className="w-4 h-4 accent-primary cursor-pointer shrink-0"
        aria-label={`Selecionar ${product.model}`}
      />

      <div className="w-14 h-14 shrink-0 rounded-md bg-white border border-border p-1 flex items-center justify-center">
        <img
          src={resolveCatalogImage(product)}
          alt={product.model}
          loading="lazy"
          decoding="async"
          className="max-w-full max-h-full object-contain"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-semibold text-foreground truncate">{product.model}</h3>
          {isEditing && (
            <span className="rounded-md bg-primary px-2 py-0.5 text-[11px] font-semibold text-primary-foreground">
              Editando
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-0.5">
          <span className="text-xs font-medium text-primary">
            {category?.title || product.subCategory}
          </span>
          <span className="text-xs text-muted-foreground">· {category?.mainCategory || product.mainCategory}</span>
          <StatusBadges product={product} />
        </div>
      </div>

      <span className="hidden md:block text-xs text-muted-foreground shrink-0">
        {formatDate(product.updatedAt)}
      </span>

      <div className="flex w-full items-center justify-end gap-2 sm:w-auto sm:shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
        >
          <Edit3 className="w-4 h-4" />
          <span className="hidden sm:inline">Editar</span>
        </button>
        <ConfirmDeleteButton
          onConfirm={onDelete}
          ariaLabel={`Remover ${product.model}`}
          disabled={busy}
        />
      </div>
    </div>
  );
}
