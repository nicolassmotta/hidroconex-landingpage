import { catalogData } from "@/data/catalog";
import { getCategoryById } from "@/data/catalogCategories";
import {
  MAX_PRODUCTS,
  MAX_QUOTE_REQUESTS,
  createSecureEntityId,
  sanitizeEmail,
  sanitizeEntityId,
  sanitizeHttpsUrl,
  sanitizeMultilineText,
  sanitizePhone,
  sanitizePlainText,
} from "@/lib/security";

export const PRODUCTS_STORAGE_KEY = "hidroconex:products";
export const QUOTE_REQUESTS_STORAGE_KEY = "hidroconex:quote-requests";
export const PRODUCTS_UPDATED_EVENT = "hidroconex:products-updated";
export const QUOTE_REQUESTS_UPDATED_EVENT = "hidroconex:quote-requests-updated";

export type ProductStatus = "ativo" | "inativo";
export type QuoteStatus = "novo" | "enviado" | "erro" | "respondido";

export interface StoredProduct {
  id: string;
  categoryId: string;
  mainCategory: string;
  subCategory: string;
  model: string;
  importPath?: string;
  imageUrl?: string;
  description: string;
  material: string;
  status: ProductStatus;
  source: "catalogo-base" | "admin";
  updatedAt: string;
}

export interface QuoteRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  productId: string;
  productModel: string;
  message: string;
  status: QuoteStatus;
  createdAt: string;
}

const INITIAL_UPDATED_AT = "2026-01-01T00:00:00.000Z";
const MAX_STORAGE_VALUE_LENGTH = 250_000;

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function dispatchBrowserEvent(eventName: string) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(eventName));
  }
}

function readCollection<T>(key: string, fallback: T[]): T[] {
  if (!canUseStorage()) return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) return fallback;
    if (rawValue.length > MAX_STORAGE_VALUE_LENGTH) return fallback;

    const parsedValue = JSON.parse(rawValue);
    return Array.isArray(parsedValue) ? parsedValue : fallback;
  } catch {
    return fallback;
  }
}

function writeCollection<T>(key: string, value: T[], eventName: string) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(key, JSON.stringify(value));
  dispatchBrowserEvent(eventName);
}

function inferMaterial(mainCategory: string, subCategory: string) {
  if (mainCategory === "Reservatórios Metálicos" && subCategory === "Luvas") {
    return "Aço carbono ou inox";
  }

  return "Aço carbono";
}

function buildDescription(model: string, mainCategory: string, subCategory: string) {
  return `${model} para ${mainCategory.toLowerCase()}, linha de ${subCategory.toLowerCase()}, fabricado sob demanda industrial.`;
}

export function createInitialProducts(): StoredProduct[] {
  return catalogData.map((item) => ({
    id: item.id,
    categoryId: item.categoryId,
    mainCategory: item.mainCategory,
    subCategory: item.subCategory,
    model: item.model,
    importPath: item.importPath,
    description: item.description || buildDescription(item.model, item.mainCategory, item.subCategory),
    material: inferMaterial(item.mainCategory, item.subCategory),
    status: "ativo",
    source: "catalogo-base",
    updatedAt: INITIAL_UPDATED_AT,
  }));
}

export function createEntityId(prefix: string) {
  return createSecureEntityId(prefix);
}

function sanitizeProduct(product: StoredProduct): StoredProduct | null {
  const category = getCategoryById(product.categoryId);
  if (!category) return null;

  const model = sanitizePlainText(product.model, 120);
  if (!model) return null;

  const safeUpdatedAt = Number.isNaN(Date.parse(product.updatedAt))
    ? new Date().toISOString()
    : product.updatedAt;

  return {
    id: sanitizeEntityId(product.id, createEntityId("produto")),
    categoryId: category.id,
    mainCategory: category.mainCategory,
    subCategory: category.subCategory,
    model,
    importPath:
      typeof product.importPath === "string" && product.importPath.startsWith("./src/assets/Products/")
        ? product.importPath
        : undefined,
    imageUrl: sanitizeHttpsUrl(product.imageUrl) || undefined,
    description: sanitizeMultilineText(product.description, 500) || buildDescription(model, category.mainCategory, category.subCategory),
    material: sanitizePlainText(product.material, 80) || inferMaterial(category.mainCategory, category.subCategory),
    status: product.status === "inativo" ? "inativo" : "ativo",
    source: product.source === "catalogo-base" ? "catalogo-base" : "admin",
    updatedAt: safeUpdatedAt,
  };
}

function sanitizeQuoteRequest(request: QuoteRequest): QuoteRequest | null {
  const name = sanitizePlainText(request.name, 100);
  const phone = sanitizePhone(request.phone);
  const message = sanitizeMultilineText(request.message, 800);

  if (!name || !phone || !message) return null;

  const safeCreatedAt = Number.isNaN(Date.parse(request.createdAt))
    ? new Date().toISOString()
    : request.createdAt;

  const allowedStatuses: QuoteStatus[] = ["novo", "enviado", "erro", "respondido"];

  return {
    id: sanitizeEntityId(request.id, createEntityId("orcamento")),
    name,
    email: sanitizeEmail(request.email),
    phone,
    productId: sanitizeEntityId(request.productId),
    productModel: sanitizePlainText(request.productModel, 120) || "Produto não informado",
    message,
    status: allowedStatuses.includes(request.status) ? request.status : "novo",
    createdAt: safeCreatedAt,
  };
}

export function getStoredProducts(): StoredProduct[] {
  const initialProducts = createInitialProducts();
  const products = readCollection<StoredProduct>(PRODUCTS_STORAGE_KEY, initialProducts);

  if (canUseStorage() && !window.localStorage.getItem(PRODUCTS_STORAGE_KEY)) {
    writeCollection(PRODUCTS_STORAGE_KEY, products, PRODUCTS_UPDATED_EVENT);
  }

  return products.map((product) => {
    const category = getCategoryById(product.categoryId);

    return {
      ...product,
      mainCategory: product.mainCategory || category?.mainCategory || "Tanques Subterrâneos",
      subCategory: product.subCategory || category?.subCategory || "Peças",
      description:
        product.description ||
        buildDescription(product.model, category?.mainCategory || product.mainCategory, category?.subCategory || product.subCategory),
      material: product.material || inferMaterial(product.mainCategory, product.subCategory),
      status: product.status || "ativo",
      source: product.source || "admin",
      updatedAt: product.updatedAt || new Date().toISOString(),
    };
  }).map(sanitizeProduct).filter((product): product is StoredProduct => Boolean(product)).slice(0, MAX_PRODUCTS);
}

export function saveStoredProducts(products: StoredProduct[]) {
  const safeProducts = products
    .map(sanitizeProduct)
    .filter((product): product is StoredProduct => Boolean(product))
    .slice(0, MAX_PRODUCTS);

  writeCollection(PRODUCTS_STORAGE_KEY, safeProducts, PRODUCTS_UPDATED_EVENT);
}

export function resetStoredProducts() {
  saveStoredProducts(createInitialProducts());
}

export function getQuoteRequests(): QuoteRequest[] {
  return readCollection<QuoteRequest>(QUOTE_REQUESTS_STORAGE_KEY, [])
    .map(sanitizeQuoteRequest)
    .filter((request): request is QuoteRequest => Boolean(request))
    .slice(0, MAX_QUOTE_REQUESTS);
}

export function saveQuoteRequests(requests: QuoteRequest[]) {
  const safeRequests = requests
    .map(sanitizeQuoteRequest)
    .filter((request): request is QuoteRequest => Boolean(request))
    .slice(0, MAX_QUOTE_REQUESTS);

  writeCollection(QUOTE_REQUESTS_STORAGE_KEY, safeRequests, QUOTE_REQUESTS_UPDATED_EVENT);
}

export function appendQuoteRequest(request: QuoteRequest) {
  saveQuoteRequests([request, ...getQuoteRequests()]);
}

export function updateQuoteRequestStatus(requestId: string, status: QuoteStatus) {
  const updatedRequests = getQuoteRequests().map((request) =>
    request.id === requestId ? { ...request, status } : request,
  );

  saveQuoteRequests(updatedRequests);
}

export function deleteQuoteRequest(requestId: string) {
  saveQuoteRequests(getQuoteRequests().filter((request) => request.id !== requestId));
}
