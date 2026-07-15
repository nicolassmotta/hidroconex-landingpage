import { useEffect, useRef, useState } from "react";
import { Check, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDeleteButtonProps {
  onConfirm: () => void;
  ariaLabel: string;
  disabled?: boolean;
  /** "icon" shows a trash icon button; "full" shows a labelled button. */
  variant?: "icon" | "full";
}

/**
 * Two-step delete: the first click arms an inline "Excluir / cancelar"
 * confirmation that auto-resets after a few seconds. Avoids the jarring
 * native window.confirm dialog.
 */
export function ConfirmDeleteButton({
  onConfirm,
  ariaLabel,
  disabled,
  variant = "icon",
}: ConfirmDeleteButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const timer = useRef<number>();

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function arm() {
    setConfirming(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setConfirming(false), 4000);
  }

  if (confirming) {
    return (
      <div className="inline-flex max-w-full flex-wrap items-center justify-end gap-1">
        <button
          type="button"
          disabled={disabled}
          aria-label="Confirmar exclusão"
          onClick={() => {
            setConfirming(false);
            onConfirm();
          }}
          className="inline-flex min-w-0 items-center gap-1.5 rounded-md bg-destructive px-2.5 py-2.5 text-xs font-semibold text-destructive-foreground hover:bg-destructive/90 transition-colors disabled:opacity-70 sm:px-3"
        >
          <Check className="w-3.5 h-3.5" />
          <span className={cn(variant === "icon" && "hidden sm:inline")}>Confirmar</span>
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="inline-flex items-center justify-center rounded-md border border-border px-2.5 py-2.5 text-muted-foreground hover:bg-muted transition-colors"
          aria-label="Cancelar exclusão"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={arm}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-70",
        variant === "full" ? "px-4 py-2.5 text-sm font-semibold" : "px-3 py-2.5",
      )}
    >
      <Trash2 className="w-4 h-4" />
      {variant === "full" && "Excluir"}
    </button>
  );
}
