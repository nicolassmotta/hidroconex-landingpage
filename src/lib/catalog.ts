import { catalogData as staticCatalogData } from "@/data/catalog";
import { getCategoryMeta } from "@/data/categories";

export interface CatalogItem {
  id: string;
  categoryId: string;
  mainCategory: string;
  subCategory: string;
  model: string;
  importPath?: string;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

const productImages = import.meta.glob("/src/assets/Products/**/*.png", {
  eager: true,
  import: "default",
}) as Record<string, string>;

function cleanText(value?: string) {
  if (!value) return "";
  if (!/[ÃÂ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(value, (character) => character.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return decoded.includes("�") ? value : decoded;
  } catch {
    return value;
  }
}

function normalizeCatalogItem(product: CatalogItem): CatalogItem {
  const category = getCategoryMeta(product.categoryId);

  return {
    ...product,
    mainCategory: category?.mainCategory || cleanText(product.mainCategory),
    subCategory: category?.subCategory || cleanText(product.subCategory),
    model: cleanText(product.model),
    description: cleanText(product.description),
  };
}

function resolveStaticImage(importPath?: string): string {
  if (!importPath) return "";

  const key = importPath.replace(/^\./, "");
  let url = productImages[key];

  if (!url) {
    url = productImages[key.normalize("NFC")];
  }

  if (!url) {
    url = productImages[key.normalize("NFD")];
  }

  if (!url) {
    const filename = key.split("/").pop();
    if (filename) {
      const foundKey = Object.keys(productImages).find((imageKey) =>
        imageKey.endsWith(`/${filename}`),
      );
      if (foundKey) {
        url = productImages[foundKey];
      }
    }
  }

  return url ?? "";
}

export function resolveCatalogImage(product: Pick<CatalogItem, "imageUrl" | "importPath">): string {
  if (product.imageUrl) return product.imageUrl;
  return resolveStaticImage(product.importPath) || "/placeholder.svg";
}

export async function fetchCatalog(): Promise<CatalogItem[]> {
  try {
    const response = await fetch("/api/catalog", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Catalog API unavailable");
    }

    const data = await response.json();
    if (Array.isArray(data.products)) {
      return data.products.map(normalizeCatalogItem);
    }
  } catch {
    // The static catalog keeps the public site useful while the API is offline.
  }

  return staticCatalogData.map((product) => ({
    ...product,
    imageUrl: "",
  })).map(normalizeCatalogItem);
}

export function productSearchText(product: CatalogItem) {
  return [
    product.model,
    product.description,
    product.mainCategory,
    product.subCategory,
    product.categoryId,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}
