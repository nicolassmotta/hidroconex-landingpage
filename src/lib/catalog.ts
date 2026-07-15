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

interface FetchCatalogOptions {
  fallbackToStatic?: boolean;
}

export interface AppConfig {
  imageLimitMb: number;
}

const configuredImageLimitMb = Number(import.meta.env.VITE_IMAGE_LIMIT_MB);

/**
 * Mirrors the API upload limit used in production. When the backend IMAGE_LIMIT_MB
 * is customized, expose the same value as VITE_IMAGE_LIMIT_MB for the client.
 */
export const ADMIN_IMAGE_LIMIT_MB =
  Number.isFinite(configuredImageLimitMb) && configuredImageLimitMb > 0
    ? configuredImageLimitMb
    : 3;

function validImageLimit(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
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

function staticCatalog(): CatalogItem[] {
  return staticCatalogData.map((product) => ({
    ...product,
    imageUrl: "",
  })).map(normalizeCatalogItem);
}

function catalogErrorFromResponse(status: number, data: unknown): Error {
  const payload = data as { error?: string | { message?: string }; message?: string } | null;
  const message =
    (typeof payload?.error === "string" && payload.error) ||
    (typeof payload?.error === "object" &&
      typeof payload.error.message === "string" &&
      payload.error.message) ||
    (typeof payload?.message === "string" && payload.message) ||
    `Nao foi possivel carregar o catalogo (HTTP ${status}).`;

  return new Error(message);
}

export async function fetchCatalog(options: FetchCatalogOptions = {}): Promise<CatalogItem[]> {
  const { fallbackToStatic = true } = options;

  try {
    const response = await fetch("/api/catalog", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => null);
      throw catalogErrorFromResponse(response.status, data);
    }

    const data = await response.json().catch(() => null);
    if (data && Array.isArray(data.products)) {
      return data.products.map(normalizeCatalogItem);
    }

    throw new Error("Resposta invalida da API de catalogo.");
  } catch (error) {
    if (!fallbackToStatic) {
      throw error instanceof Error
        ? error
        : new Error("Nao foi possivel carregar o catalogo.");
    }

    // The static catalog keeps the public site useful while the API is offline.
  }

  return staticCatalog();
}

export async function fetchAppConfig(): Promise<AppConfig> {
  try {
    const response = await fetch("/api/config", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error("Config API unavailable");
    }

    const data = await response.json().catch(() => null);
    return {
      imageLimitMb: validImageLimit(data?.imageLimitMb)
        ? data.imageLimitMb
        : ADMIN_IMAGE_LIMIT_MB,
    };
  } catch {
    return { imageLimitMb: ADMIN_IMAGE_LIMIT_MB };
  }
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
