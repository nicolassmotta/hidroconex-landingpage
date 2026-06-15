import crypto from "node:crypto";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { GridFSBucket, MongoClient, ObjectId } from "mongodb";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const DIST_DIR = path.join(ROOT_DIR, "dist");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");
const LEGACY_JSON_FILE = path.join(__dirname, "data", "catalog.json");

loadEnv(path.join(ROOT_DIR, ".env"));

const PORT = Number(process.env.PORT || 3333);
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "hidroconex";
const TOKEN_TTL_MS = Number(process.env.ADMIN_TOKEN_TTL_HOURS || 8) * 60 * 60 * 1000;
const DEFAULT_IMAGE_LIMIT_MB = process.env.VERCEL ? 3 : 8;
const JSON_LIMIT_BYTES = Number(process.env.JSON_BODY_LIMIT_MB || DEFAULT_IMAGE_LIMIT_MB + 2) * 1024 * 1024;
const IMAGE_LIMIT_BYTES = Number(process.env.IMAGE_LIMIT_MB || DEFAULT_IMAGE_LIMIT_MB) * 1024 * 1024;

const CATEGORY_MAP = {
  "rm-luvas": { mainCategory: "Reservatórios Metálicos", subCategory: "Luvas" },
  "rm-niples": { mainCategory: "Reservatórios Metálicos", subCategory: "Niples" },
  "ts-juntas": { mainCategory: "Tanques Subterrâneos", subCategory: "Juntas" },
  "ts-luvas": { mainCategory: "Tanques Subterrâneos", subCategory: "Luvas" },
  "ts-niples": { mainCategory: "Tanques Subterrâneos", subCategory: "Niples" },
  "ts-plugs": { mainCategory: "Tanques Subterrâneos", subCategory: "Plugs" },
  "ts-filtros": { mainCategory: "Tanques Subterrâneos", subCategory: "Filtros" },
};

const IMAGE_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

let mongoClient;
let database;
let productsCollection;
let settingsCollection;
let imagesBucket;
let databaseReadyPromise;

function loadEnv(filePath) {
  if (!fsSync.existsSync(filePath)) return;

  const content = fsSync.readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separator = line.indexOf("=");
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function setCorsHeaders(req, res) {
  const configuredOrigin = process.env.CORS_ORIGIN;
  const origin = configuredOrigin || req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type,Authorization");
}

function sendJson(res, statusCode, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
  });
  res.end(body);
}

function sendError(res, statusCode, message) {
  sendJson(res, statusCode, { error: message });
}

function cleanText(value) {
  if (!value) return "";
  if (!/[ÃÂ]/.test(value)) return value;

  try {
    const bytes = Uint8Array.from(String(value), (character) => character.charCodeAt(0) & 0xff);
    const decoded = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    return decoded.includes("�") ? String(value) : decoded;
  } catch {
    return String(value);
  }
}

function adminPassword() {
  return process.env.ADMIN_PASSWORD || "";
}

function base64Url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(value) {
  return crypto.createHmac("sha256", adminPassword()).update(value).digest("base64url");
}

function createToken() {
  const payload = {
    iat: Date.now(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const encodedPayload = base64Url(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

function verifyToken(token) {
  if (!adminPassword()) {
    return { ok: false, status: 500, message: "ADMIN_PASSWORD não configurado no backend." };
  }

  const [encodedPayload, receivedSignature] = String(token || "").split(".");
  if (!encodedPayload || !receivedSignature) {
    return { ok: false, status: 401, message: "Token inválido." };
  }

  const expectedSignature = sign(encodedPayload);
  const received = Buffer.from(receivedSignature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length || !crypto.timingSafeEqual(received, expected)) {
    return { ok: false, status: 401, message: "Token inválido." };
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));
    if (!payload.exp || payload.exp < Date.now()) {
      return { ok: false, status: 401, message: "Sessão expirada." };
    }
  } catch {
    return { ok: false, status: 401, message: "Token inválido." };
  }

  return { ok: true };
}

function requireAdmin(req, res) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice("Bearer ".length) : "";
  const result = verifyToken(token);

  if (!result.ok) {
    sendError(res, result.status, result.message);
    return false;
  }

  return true;
}

async function readJsonBody(req) {
  const chunks = [];
  let totalLength = 0;

  for await (const chunk of req) {
    totalLength += chunk.length;
    if (totalLength > JSON_LIMIT_BYTES) {
      const error = new Error("Payload muito grande.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  if (!chunks.length) return {};

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("JSON inválido.");
    error.statusCode = 400;
    throw error;
  }
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function makeProductId(categoryId, model, currentId) {
  const base = `${categoryId}-${slugify(model) || crypto.randomUUID().slice(0, 8)}`;
  let candidate = base;
  let suffix = 2;

  while (true) {
    const existingProduct = await productsCollection.findOne({ id: candidate });
    if (!existingProduct || existingProduct.id === currentId) {
      return candidate;
    }

    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

function toDate(value, fallback = new Date()) {
  if (value instanceof Date) return value;
  if (!value) return fallback;

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed;
}

function toObjectId(value) {
  if (!value) return null;
  if (value instanceof ObjectId) return value;
  if (ObjectId.isValid(String(value))) return new ObjectId(String(value));
  return null;
}

function normalizeProductForStorage(product) {
  const category = CATEGORY_MAP[product.categoryId];
  const now = new Date();

  return {
    id: String(product.id),
    categoryId: String(product.categoryId),
    mainCategory: category?.mainCategory || cleanText(product.mainCategory),
    subCategory: category?.subCategory || cleanText(product.subCategory),
    model: cleanText(product.model),
    importPath: product.importPath || "",
    imageUrl: product.imageUrl || "",
    imageId: toObjectId(product.imageId),
    description: cleanText(product.description),
    createdAt: toDate(product.createdAt, now),
    updatedAt: toDate(product.updatedAt, now),
  };
}

function serializeProduct(product) {
  const imageId = toObjectId(product.imageId);

  return {
    id: product.id,
    categoryId: product.categoryId,
    mainCategory: product.mainCategory,
    subCategory: product.subCategory,
    model: product.model,
    importPath: product.importPath || "",
    imageUrl: imageId ? `/api/catalog/images/${imageId.toString()}` : product.imageUrl || "",
    description: product.description || "",
    createdAt: toDate(product.createdAt).toISOString(),
    updatedAt: toDate(product.updatedAt).toISOString(),
  };
}

async function loadCatalogFromJsonFile() {
  if (!fsSync.existsSync(LEGACY_JSON_FILE)) return [];

  try {
    const content = await fs.readFile(LEGACY_JSON_FILE, "utf8");
    const parsed = JSON.parse(content);
    const products = Array.isArray(parsed.products) ? parsed.products : [];
    return products.map(normalizeProductForStorage);
  } catch (error) {
    console.warn("Não foi possível importar o catálogo JSON antigo:", error.message);
    return [];
  }
}

async function loadCatalogFromStaticFile() {
  const legacyPath = path.join(ROOT_DIR, "src", "data", "catalog.ts");

  try {
    const source = await fs.readFile(legacyPath, "utf8");
    const markerIndex = source.indexOf("export const catalogData");
    if (markerIndex === -1) return [];

    const afterMarker = source.slice(markerIndex);
    const assignmentIndex = afterMarker.indexOf("=");
    const arrayStart = afterMarker.indexOf("[", assignmentIndex);
    const arrayEnd = afterMarker.lastIndexOf("];");
    if (assignmentIndex === -1 || arrayStart === -1 || arrayEnd === -1) return [];

    const jsonText = afterMarker.slice(arrayStart, arrayEnd + 1);
    const items = JSON.parse(jsonText);
    const timestamp = new Date();

    return items.map((item) =>
      normalizeProductForStorage({
        ...item,
        imageUrl: "",
        createdAt: timestamp,
        updatedAt: timestamp,
      }),
    );
  } catch (error) {
    console.warn("Não foi possível importar o catálogo estático:", error.message);
    return [];
  }
}

async function loadSeedCatalog() {
  const jsonProducts = await loadCatalogFromJsonFile();
  if (jsonProducts.length) return jsonProducts;

  return loadCatalogFromStaticFile();
}

async function seedCatalogIfNeeded() {
  const seedSetting = await settingsCollection.findOne({ key: "legacyCatalogSeeded" });
  if (seedSetting) return;

  const currentCount = await productsCollection.countDocuments();
  if (currentCount > 0) {
    await settingsCollection.updateOne(
      { key: "legacyCatalogSeeded" },
      { $set: { value: true, seededAt: new Date(), skippedBecauseProductsExist: true } },
      { upsert: true },
    );
    return;
  }

  const products = await loadSeedCatalog();
  if (products.length) {
    await productsCollection.insertMany(products, { ordered: false });
  }

  await settingsCollection.updateOne(
    { key: "legacyCatalogSeeded" },
    { $set: { value: true, seededAt: new Date(), productCount: products.length } },
    { upsert: true },
  );
}

async function connectDatabase() {
  if (productsCollection) return;

  const client = new MongoClient(MONGODB_URI, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_TIMEOUT_MS || 5000),
  });

  await client.connect();
  mongoClient = client;
  database = client.db(MONGODB_DB_NAME);
  productsCollection = database.collection("products");
  settingsCollection = database.collection("settings");
  imagesBucket = new GridFSBucket(database, { bucketName: "productImages" });

  await productsCollection.createIndex({ id: 1 }, { unique: true });
  await productsCollection.createIndex({ categoryId: 1, model: 1 });
  await productsCollection.createIndex({ mainCategory: 1, subCategory: 1, model: 1 });
  await settingsCollection.createIndex({ key: 1 }, { unique: true });
  await seedCatalogIfNeeded();
}

async function ensureDatabase() {
  if (productsCollection) return;

  if (!databaseReadyPromise) {
    databaseReadyPromise = connectDatabase().catch((error) => {
      databaseReadyPromise = undefined;
      throw error;
    });
  }

  await databaseReadyPromise;
}

async function readCatalog() {
  const products = await productsCollection
    .find({})
    .sort({ mainCategory: 1, subCategory: 1, model: 1 })
    .toArray();

  return products.map(serializeProduct);
}

function validateProductPayload(payload, options = {}) {
  const category = CATEGORY_MAP[payload.categoryId];
  if (!category) {
    return { ok: false, message: "Categoria inválida." };
  }

  const model = String(payload.model || "").trim();
  if (!model) {
    return { ok: false, message: "Informe o modelo do produto." };
  }

  if (options.requireImage && !payload.image?.data) {
    return { ok: false, message: "Envie uma imagem para o produto." };
  }

  return {
    ok: true,
    product: {
      categoryId: payload.categoryId,
      mainCategory: category.mainCategory,
      subCategory: category.subCategory,
      model,
      description: String(payload.description || "").trim(),
    },
  };
}

function safeUploadName(filename, extension) {
  const baseName = path.basename(filename || "produto").replace(/\.[^.]+$/, "");
  const safeBaseName = slugify(baseName) || "produto";
  return `${Date.now()}-${crypto.randomUUID()}-${safeBaseName}.${extension}`;
}

async function writeUploadedImage(image) {
  if (!image?.data) return null;

  const contentType = String(image.contentType || "").toLowerCase();
  const extension = IMAGE_TYPES[contentType];
  if (!extension) {
    const error = new Error("Formato de imagem inválido. Use PNG, JPG ou WebP.");
    error.statusCode = 400;
    throw error;
  }

  const buffer = Buffer.from(String(image.data), "base64");
  if (!buffer.length) {
    const error = new Error("Arquivo de imagem vazio.");
    error.statusCode = 400;
    throw error;
  }

  if (buffer.length > IMAGE_LIMIT_BYTES) {
    const error = new Error(`Imagem muito grande. Limite atual: ${process.env.IMAGE_LIMIT_MB || 8} MB.`);
    error.statusCode = 413;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const uploadStream = imagesBucket.openUploadStream(safeUploadName(image.filename, extension), {
      contentType,
      metadata: {
        originalName: image.filename || "",
        contentType,
        uploadedAt: new Date(),
      },
    });

    uploadStream.on("finish", () => resolve(uploadStream.id));
    uploadStream.on("error", reject);
    uploadStream.end(buffer);
  });
}

async function deleteUploadedImage(imageId) {
  const objectId = toObjectId(imageId);
  if (!objectId) return;

  try {
    await imagesBucket.delete(objectId);
  } catch (error) {
    if (error.code !== "ENOENT") {
      console.warn("Não foi possível remover imagem antiga:", error.message);
    }
  }
}

async function streamCatalogImage(res, imageId) {
  const objectId = toObjectId(imageId);
  if (!objectId) {
    sendError(res, 404, "Imagem não encontrada.");
    return;
  }

  const file = await database.collection("productImages.files").findOne({ _id: objectId });
  if (!file) {
    sendError(res, 404, "Imagem não encontrada.");
    return;
  }

  res.writeHead(200, {
    "Content-Type": file.contentType || file.metadata?.contentType || "application/octet-stream",
    "Cache-Control": "public, max-age=31536000, immutable",
  });

  imagesBucket.openDownloadStream(objectId).pipe(res);
}

async function handleApi(req, res, pathname) {
  if (req.method === "GET" && pathname === "/api/health") {
    sendJson(res, 200, {
      ok: true,
      service: "hidroconex-api",
      database: "mongodb",
      dbName: MONGODB_DB_NAME,
    });
    return;
  }

  if (req.method === "GET" && pathname === "/api/catalog") {
    const products = await readCatalog();
    sendJson(res, 200, { products });
    return;
  }

  if (req.method === "GET" && pathname.startsWith("/api/catalog/images/")) {
    const imageId = decodeURIComponent(pathname.replace("/api/catalog/images/", ""));
    await streamCatalogImage(res, imageId);
    return;
  }

  if (req.method === "POST" && pathname === "/api/admin/login") {
    const payload = await readJsonBody(req);
    const configuredPassword = adminPassword();

    if (!configuredPassword) {
      sendError(res, 500, "ADMIN_PASSWORD não configurado no backend.");
      return;
    }

    if (String(payload.password || "") !== configuredPassword) {
      sendError(res, 401, "Senha inválida.");
      return;
    }

    sendJson(res, 200, { token: createToken(), expiresInMs: TOKEN_TTL_MS });
    return;
  }

  if (pathname.startsWith("/api/admin/products")) {
    if (!requireAdmin(req, res)) return;

    if (req.method === "POST" && pathname === "/api/admin/products") {
      const payload = await readJsonBody(req);
      const validation = validateProductPayload(payload, { requireImage: true });
      if (!validation.ok) {
        sendError(res, 400, validation.message);
        return;
      }

      const now = new Date();
      const imageId = await writeUploadedImage(payload.image);
      const product = normalizeProductForStorage({
        ...validation.product,
        id: await makeProductId(validation.product.categoryId, validation.product.model),
        imageId,
        importPath: "",
        imageUrl: "",
        createdAt: now,
        updatedAt: now,
      });

      await productsCollection.insertOne(product);
      sendJson(res, 201, { product: serializeProduct(product) });
      return;
    }

    const productId = decodeURIComponent(pathname.replace("/api/admin/products/", ""));
    const existingProduct = await productsCollection.findOne({ id: productId });

    if (!productId || !existingProduct) {
      sendError(res, 404, "Produto não encontrado.");
      return;
    }

    if (req.method === "PUT") {
      const payload = await readJsonBody(req);
      const validation = validateProductPayload(payload);
      if (!validation.ok) {
        sendError(res, 400, validation.message);
        return;
      }

      const nextImageId = payload.image?.data
        ? await writeUploadedImage(payload.image)
        : existingProduct.imageId;

      if (payload.image?.data && existingProduct.imageId) {
        await deleteUploadedImage(existingProduct.imageId);
      }

      const nextProduct = normalizeProductForStorage({
        ...existingProduct,
        ...validation.product,
        id: await makeProductId(
          validation.product.categoryId,
          validation.product.model,
          existingProduct.id,
        ),
        imageId: nextImageId,
        imageUrl: payload.image?.data ? "" : existingProduct.imageUrl,
        importPath: payload.image?.data ? "" : existingProduct.importPath,
        updatedAt: new Date(),
      });

      await productsCollection.updateOne(
        { _id: existingProduct._id },
        { $set: nextProduct },
      );
      sendJson(res, 200, { product: serializeProduct(nextProduct) });
      return;
    }

    if (req.method === "DELETE") {
      await productsCollection.deleteOne({ _id: existingProduct._id });
      await deleteUploadedImage(existingProduct.imageId);
      sendJson(res, 200, { product: serializeProduct(existingProduct) });
      return;
    }
  }

  sendError(res, 404, "Rota não encontrada.");
}

export async function handleApiRequest(req, res, pathname) {
  await ensureDatabase();

  const requestPath =
    pathname ||
    decodeURIComponent(new URL(req.url || "/", `http://${req.headers.host || "localhost"}`).pathname);

  await handleApi(req, res, requestPath);
}

function contentTypeFor(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const types = {
    ".css": "text/css; charset=utf-8",
    ".gif": "image/gif",
    ".html": "text/html; charset=utf-8",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".txt": "text/plain; charset=utf-8",
    ".webp": "image/webp",
  };

  return types[extension] || "application/octet-stream";
}

function safeJoin(baseDir, requestPath) {
  const normalizedBase = path.resolve(baseDir);
  const relativePath = decodeURIComponent(requestPath).replace(/^\/+/, "");
  const targetPath = path.resolve(normalizedBase, relativePath);

  if (!targetPath.toLowerCase().startsWith(normalizedBase.toLowerCase())) {
    return null;
  }

  return targetPath;
}

async function fileExists(filePath) {
  try {
    const stat = await fs.stat(filePath);
    return stat.isFile();
  } catch {
    return false;
  }
}

async function streamFile(res, filePath) {
  res.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
  fsSync.createReadStream(filePath).pipe(res);
}

async function serveStatic(req, res, pathname) {
  if (pathname.startsWith("/uploads/")) {
    const uploadPath = safeJoin(PUBLIC_DIR, pathname);
    if (uploadPath && (await fileExists(uploadPath))) {
      await streamFile(res, uploadPath);
      return;
    }
  }

  if (!fsSync.existsSync(DIST_DIR)) {
    sendError(res, 404, "Build não encontrado. Rode npm run build antes de servir o frontend pelo Node.");
    return;
  }

  const requestedPath = pathname === "/" ? "/index.html" : pathname;
  const staticPath = safeJoin(DIST_DIR, requestedPath);

  if (staticPath && (await fileExists(staticPath))) {
    await streamFile(res, staticPath);
    return;
  }

  await streamFile(res, path.join(DIST_DIR, "index.html"));
}

const server = http.createServer(async (req, res) => {
  try {
    setCorsHeaders(req, res);

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith("/api/")) {
      await handleApiRequest(req, res, pathname);
      return;
    }

    await serveStatic(req, res, pathname);
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      sendError(res, error.statusCode || 500, error.message || "Erro interno.");
    } else {
      res.end();
    }
  }
});

async function shutdown() {
  server.close();
  if (mongoClient) {
    await mongoClient.close();
  }
}

process.on("SIGINT", () => {
  shutdown().finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  shutdown().finally(() => process.exit(0));
});

function redactMongoUri(uri) {
  return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
}

async function startServer() {
  try {
    await ensureDatabase();

    server.listen(PORT, () => {
      console.log(`Hidroconex API rodando em http://localhost:${PORT}`);
      console.log(`MongoDB conectado em ${MONGODB_DB_NAME}`);
    });
  } catch (error) {
    console.error("Não foi possível conectar ao MongoDB.");
    console.error(`MONGODB_URI=${redactMongoUri(MONGODB_URI)}`);
    console.error(`MONGODB_DB_NAME=${MONGODB_DB_NAME}`);
    console.error(error.message);
    process.exit(1);
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  await startServer();
}
