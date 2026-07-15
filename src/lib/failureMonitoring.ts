type FailureSeverity = "error" | "warning";

interface FailureReport {
  type: string;
  severity?: FailureSeverity;
  message: string;
  stack?: string;
  route?: string;
  component?: string;
}

let isInitialized = false;
let lastReportKey = "";
let lastReportAt = 0;

const DEDUPE_WINDOW_MS = 5000;

function truncate(value: unknown, maxLength: number) {
  const text = String(value || "").trim();
  return text.length > maxLength ? text.slice(0, maxLength - 1) : text;
}

function messageFromUnknown(value: unknown) {
  if (value instanceof Error) return value.message;
  if (typeof value === "string") return value;

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function stackFromUnknown(value: unknown) {
  return value instanceof Error ? value.stack || "" : "";
}

export function reportFailure(report: FailureReport) {
  if (typeof window === "undefined") return;

  const payload = {
    source: "frontend",
    type: truncate(report.type || "runtime", 80),
    severity: report.severity || "error",
    message: truncate(report.message, 500),
    stack: truncate(report.stack, 2000),
    route: truncate(report.route || window.location.pathname, 240),
    component: truncate(report.component, 120),
  };

  if (!payload.message) return;

  const now = Date.now();
  const reportKey = `${payload.type}:${payload.route}:${payload.message}`;
  if (reportKey === lastReportKey && now - lastReportAt < DEDUPE_WINDOW_MS) return;

  lastReportKey = reportKey;
  lastReportAt = now;

  const body = JSON.stringify(payload);

  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/monitoring/failures", new Blob([body], { type: "application/json" }));
    return;
  }

  fetch("/api/monitoring/failures", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body,
    keepalive: true,
  }).catch(() => undefined);
}

export function initFailureMonitoring() {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;

  window.addEventListener("error", (event) => {
    reportFailure({
      type: "window-error",
      message: event.message || "Erro de runtime no navegador.",
      stack: event.error?.stack || "",
      route: window.location.pathname,
    });
  });

  window.addEventListener("unhandledrejection", (event) => {
    reportFailure({
      type: "unhandled-rejection",
      message: messageFromUnknown(event.reason) || "Promise rejeitada sem tratamento.",
      stack: stackFromUnknown(event.reason),
      route: window.location.pathname,
    });
  });
}
