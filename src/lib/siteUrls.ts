import type { CatalogCategory } from "@/data/categories";
import type { CatalogItem } from "@/lib/catalog";

export const SITE_URL = "https://hidroconexluvas.com.br";

export function normalizeSlug(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function absoluteUrl(path = "/") {
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("data:")) return path;

  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${normalizedPath}`;
}

export function categoryPath(category: Pick<CatalogCategory, "slug">) {
  return `/catalogo/${category.slug}`;
}

export function productSlug(product: Pick<CatalogItem, "id">) {
  return normalizeSlug(product.id);
}

export function productPath(product: Pick<CatalogItem, "id">) {
  return `/produto/${productSlug(product)}`;
}

