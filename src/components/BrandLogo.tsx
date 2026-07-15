import { Cog } from "lucide-react";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  /** "dark" para fundos claros (header com scroll), "light" para fundos escuros (hero, footer). */
  variant?: "dark" | "light";
  className?: string;
}

const BrandLogo = ({ variant = "dark", className }: BrandLogoProps) => {
  const isLight = variant === "light";

  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
        <Cog
          className={cn("h-8 w-8 sm:h-9 sm:w-9", isLight ? "text-primary" : "text-lime-dark")}
          strokeWidth={1.75}
          aria-hidden="true"
        />
        <Cog
          className={cn(
            "absolute -right-0.5 -top-0.5 h-4 w-4",
            isLight ? "text-white/80" : "text-secondary",
          )}
          strokeWidth={2}
          aria-hidden="true"
        />
      </span>
      <span className="flex flex-col leading-none">
        <span
          className={cn(
            "font-heading text-lg font-extrabold tracking-[0.08em] sm:text-xl",
            isLight ? "text-primary" : "text-lime-dark",
          )}
        >
          HIDROCONEX
        </span>
        <span
          className={cn(
            "mt-1 text-[0.55rem] font-semibold uppercase tracking-[0.26em] sm:text-[0.6rem]",
            isLight ? "text-white/75" : "text-secondary/80",
          )}
        >
          Indústria e Comércio
        </span>
      </span>
    </span>
  );
};

export default BrandLogo;
