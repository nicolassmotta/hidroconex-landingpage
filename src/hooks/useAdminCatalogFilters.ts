import { useMemo, useState } from "react";
import { catalogCategories } from "@/data/categories";
import {
  CatalogItem,
  normalizeSearchText,
  productSearchText,
  resolveCatalogImage,
} from "@/lib/catalog";

export type MainGroup = "todos" | "tanques" | "reservatorios";
export type SortKey = "recentes" | "az" | "categoria";

/** A product counts as "with photo" when it resolves to a real image (not the placeholder). */
export function productHasImage(product: CatalogItem): boolean {
  return resolveCatalogImage(product) !== "/placeholder.svg";
}

export function productHasDescription(product: CatalogItem): boolean {
  return Boolean(product.description && product.description.trim());
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

const groupOf = (categoryId: string) =>
  catalogCategories.find((category) => category.id === categoryId)?.group;

export function useAdminCatalogFilters(products: CatalogItem[]) {
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState<MainGroup>("todos");
  const [categoryId, setCategoryId] = useState("todas");
  const [sort, setSort] = useState<SortKey>("recentes");
  const [onlyNoImage, setOnlyNoImage] = useState(false);
  const [onlyNoDescription, setOnlyNoDescription] = useState(false);

  /** Sub-category chips shown for the currently selected main group. */
  const visibleCategories = useMemo(
    () => catalogCategories.filter((category) => group === "todos" || category.group === group),
    [group],
  );

  const filtered = useMemo(() => {
    const term = normalizeSearchText(search.trim());

    const list = products.filter((product) => {
      const matchesGroup = group === "todos" || groupOf(product.categoryId) === group;
      const matchesCategory = categoryId === "todas" || product.categoryId === categoryId;
      const matchesSearch = !term || productSearchText(product).includes(term);
      const matchesNoImage = !onlyNoImage || !productHasImage(product);
      const matchesNoDescription = !onlyNoDescription || !productHasDescription(product);

      return matchesGroup && matchesCategory && matchesSearch && matchesNoImage && matchesNoDescription;
    });

    const sorted = [...list];
    if (sort === "az") {
      sorted.sort((a, b) => a.model.localeCompare(b.model, "pt-BR"));
    } else if (sort === "categoria") {
      sorted.sort((a, b) =>
        `${a.mainCategory}${a.subCategory}${a.model}`.localeCompare(
          `${b.mainCategory}${b.subCategory}${b.model}`,
          "pt-BR",
        ),
      );
    } else {
      sorted.sort(
        (a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime(),
      );
    }

    return sorted;
  }, [products, search, group, categoryId, sort, onlyNoImage, onlyNoDescription]);

  const categoryCounts = useMemo(
    () =>
      products.reduce<Record<string, number>>((accumulator, product) => {
        accumulator[product.categoryId] = (accumulator[product.categoryId] || 0) + 1;
        return accumulator;
      }, {}),
    [products],
  );

  const incompleteCount = useMemo(
    () => products.filter((product) => !productHasImage(product) || !productHasDescription(product)).length,
    [products],
  );

  const hasActiveFilters =
    Boolean(search.trim()) ||
    group !== "todos" ||
    categoryId !== "todas" ||
    onlyNoImage ||
    onlyNoDescription;

  function changeGroup(next: MainGroup) {
    setGroup(next);
    if (next !== "todos" && groupOf(categoryId) !== next) {
      setCategoryId("todas");
    }
  }

  function resetFilters() {
    setSearch("");
    setGroup("todos");
    setCategoryId("todas");
    setOnlyNoImage(false);
    setOnlyNoDescription(false);
  }

  return {
    state: { search, group, categoryId, sort, onlyNoImage, onlyNoDescription },
    setSearch,
    setGroup: changeGroup,
    setCategoryId,
    setSort,
    setOnlyNoImage,
    setOnlyNoDescription,
    resetFilters,
    hasActiveFilters,
    visibleCategories,
    filtered,
    categoryCounts,
    incompleteCount,
  };
}
