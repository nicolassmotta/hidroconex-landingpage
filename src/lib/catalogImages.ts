import { sanitizeHttpsUrl } from "@/lib/security";

// Load product images statically at build time so Vite includes them in production.
const productImages = import.meta.glob("/src/assets/Products/**/*.webp", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export interface ProductImageSource {
  importPath?: string;
  imageUrl?: string;
}

export function resolveCatalogImage(importPath?: string): string {
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
      const foundKey = Object.keys(productImages).find((imageKey) => imageKey.endsWith(`/${filename}`));
      if (foundKey) url = productImages[foundKey];
    }
  }

  return url ?? "";
}

export function resolveProductImage(product: ProductImageSource): string {
  const safeExternalImage = sanitizeHttpsUrl(product.imageUrl);
  return safeExternalImage || resolveCatalogImage(product.importPath) || "/placeholder.svg";
}
