import { AlertTriangle, CheckCircle2, RefreshCcw, ServerCrash } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AdminFailureEvent {
  id: string;
  source: "api" | "frontend" | string;
  severity: "error" | "warning" | string;
  type: string;
  method?: string;
  route?: string;
  statusCode?: number | null;
  message: string;
  createdAt?: string;
}

export interface AdminFailureSummary {
  ttlDays: number;
  count24h: number;
  count7d: number;
  lastFailureAt: string | null;
  events: AdminFailureEvent[];
}

interface AdminFailurePanelProps {
  summary: AdminFailureSummary | null;
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

function formatDateTime(iso?: string | null) {
  if (!iso) return "Sem registro";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Data inválida";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sourceLabel(source: string) {
  return source === "frontend" ? "Front" : "API";
}

export function AdminFailurePanel({
  summary,
  isLoading,
  error,
  onRefresh,
}: AdminFailurePanelProps) {
  const hasFailures = Boolean(summary && summary.count24h > 0);
  const events = summary?.events || [];

  return (
    <section className="rounded-lg bg-card border border-border shadow-card p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              hasFailures ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
            )}
          >
            {hasFailures ? <ServerCrash className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground">Saúde do sistema</h2>
            <p className="text-sm text-muted-foreground">
              Falhas recentes da API e do navegador, mantidas por {summary?.ttlDays || 14} dias.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:border-primary/50 transition-colors disabled:opacity-70"
        >
          <RefreshCcw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          Atualizar status
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
          {error}
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <Metric label="Últimas 24h" value={summary?.count24h ?? 0} tone={hasFailures ? "danger" : "ok"} />
            <Metric label="Últimos 7 dias" value={summary?.count7d ?? 0} />
            <Metric label="Última falha" value={formatDateTime(summary?.lastFailureAt)} compact />
          </div>

          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <AlertTriangle className="w-4 h-4 text-muted-foreground" />
              Eventos recentes
            </div>

            {events.length === 0 ? (
              <p className="mt-3 text-sm text-muted-foreground">
                Nenhuma falha registrada no período monitorado.
              </p>
            ) : (
              <div className="mt-3 space-y-2">
                {events.slice(0, 5).map((event) => (
                  <article key={event.id} className="rounded-md border border-border bg-background p-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-muted px-2 py-0.5 font-semibold text-foreground">
                        {sourceLabel(event.source)}
                      </span>
                      {event.statusCode ? <span>HTTP {event.statusCode}</span> : null}
                      {event.method ? <span>{event.method}</span> : null}
                      <span>{formatDateTime(event.createdAt)}</span>
                    </div>
                    <p className="mt-2 text-sm font-medium text-foreground">{event.message}</p>
                    {event.route ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{event.route}</p>
                    ) : null}
                  </article>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
  compact,
}: {
  label: string;
  value: number | string;
  tone?: "ok" | "danger";
  compact?: boolean;
}) {
  return (
    <div className="rounded-md border border-border bg-background px-4 py-3">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <strong
        className={cn(
          "mt-1 block font-bold text-foreground",
          compact ? "text-base" : "text-2xl",
          tone === "ok" && "text-green-700",
          tone === "danger" && "text-red-700",
        )}
      >
        {value}
      </strong>
    </div>
  );
}
