const ADMIN_SESSION_KEY = "hidroconex:admin-session";
const ADMIN_SESSION_TTL_MS = 60 * 60 * 1000;

export const MAX_PRODUCTS = 200;
export const MAX_QUOTE_REQUESTS = 100;

function stripUnsafeControlCharacters(value: string, preserveLineBreaks = false) {
  return Array.from(value)
    .filter((character) => {
      const code = character.charCodeAt(0);
      const isLineBreak = code === 10 || code === 13;
      const isTab = code === 9;

      if (preserveLineBreaks && isLineBreak) return true;
      if (isTab) return true;

      return code >= 32 && code !== 127;
    })
    .join("");
}

export function sanitizePlainText(value: unknown, maxLength = 160) {
  return stripUnsafeControlCharacters(String(value ?? "").normalize("NFKC"))
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeMultilineText(value: unknown, maxLength = 800) {
  return stripUnsafeControlCharacters(String(value ?? "").normalize("NFKC"), true)
    .replace(/[<>]/g, "")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, maxLength);
}

export function sanitizeEmail(value: unknown) {
  const email = sanitizePlainText(value, 120).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

export function sanitizePhone(value: unknown) {
  return sanitizePlainText(value, 30).replace(/[^\d()+\-\s]/g, "");
}

export function sanitizeEntityId(value: unknown, fallback = "") {
  const id = sanitizePlainText(value, 120);
  return /^[a-zA-Z0-9:_\-.]+$/.test(id) ? id : fallback;
}

export function isSafeHttpsUrl(value: unknown) {
  const url = sanitizePlainText(value, 500);
  if (!url) return true;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.protocol === "https:" && !parsedUrl.username && !parsedUrl.password;
  } catch {
    return false;
  }
}

export function sanitizeHttpsUrl(value: unknown) {
  const url = sanitizePlainText(value, 500);
  return isSafeHttpsUrl(url) ? url : "";
}

export function createSecureEntityId(prefix: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  const bytes = new Uint8Array(12);
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    crypto.getRandomValues(bytes);
  }

  const randomPart = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${prefix}-${Date.now()}-${randomPart}`;
}

export function isDemoAdminAvailable() {
  return import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_ADMIN === "true";
}

export function hasConfiguredDemoAdminPassword() {
  return /^[a-f0-9]{64}$/i.test(import.meta.env.VITE_DEMO_ADMIN_PASSWORD_SHA256 || "");
}

function constantTimeEqual(left: string, right: string) {
  const maxLength = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;

  for (let index = 0; index < maxLength; index += 1) {
    difference |= (left.charCodeAt(index) || 0) ^ (right.charCodeAt(index) || 0);
  }

  return difference === 0;
}

async function sha256Hex(value: string) {
  if (typeof crypto === "undefined" || !crypto.subtle) return "";

  const encodedValue = new TextEncoder().encode(value);
  const hashBuffer = await crypto.subtle.digest("SHA-256", encodedValue);
  return Array.from(new Uint8Array(hashBuffer), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function validateDemoAdminPassword(password: string) {
  const configuredHash = (import.meta.env.VITE_DEMO_ADMIN_PASSWORD_SHA256 || "").toLowerCase();
  if (!/^[a-f0-9]{64}$/.test(configuredHash)) return false;

  return constantTimeEqual(await sha256Hex(password), configuredHash);
}

function readAdminSession() {
  if (typeof window === "undefined") return null;

  try {
    const rawSession = window.sessionStorage.getItem(ADMIN_SESSION_KEY);
    if (!rawSession) return null;

    const parsedSession = JSON.parse(rawSession) as { authenticatedAt?: number };
    if (!parsedSession.authenticatedAt) return null;

    const expired = Date.now() - parsedSession.authenticatedAt > ADMIN_SESSION_TTL_MS;
    if (expired) {
      window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return null;
    }

    return parsedSession;
  } catch {
    window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }
}

export function isDemoAdminAuthenticated() {
  return Boolean(readAdminSession());
}

export function createDemoAdminSession() {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    ADMIN_SESSION_KEY,
    JSON.stringify({ authenticatedAt: Date.now() }),
  );
}

export function clearDemoAdminSession() {
  if (typeof window === "undefined") return;

  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
