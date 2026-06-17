import { AlignLeft, ImageOff } from "lucide-react";
import { CatalogItem } from "@/lib/catalog";
import { productHasDescription, productHasImage } from "@/hooks/useAdminCatalogFilters";
import { cn } from "@/lib/utils";

/** Small amber flags highlighting catalog entries that still need attention. */
export function StatusBadges({
  product,
  className,
}: {
  product: CatalogItem;
  className?: string;
}) {
  const noImage = !productHasImage(product);
  const noDescription = !productHasDescription(product);

  if (!noImage && !noDescription) return null;

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {noImage && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          <ImageOff className="w-3 h-3" />
          Sem foto
        </span>
      )}
      {noDescription && (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
          <AlignLeft className="w-3 h-3" />
          Sem descrição
        </span>
      )}
    </div>
  );
}
