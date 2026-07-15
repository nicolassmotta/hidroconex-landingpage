import logo from "@/assets/Logo/logo-hidroconex.jpeg";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
}

const BrandLogo = ({ className, imageClassName }: BrandLogoProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-lg bg-white/95 p-1.5 shadow-sm ring-1 ring-black/10",
        className,
      )}
    >
      <img
        src={logo}
        alt="Hidroconex Indústria e Comércio"
        className={cn("h-11 w-auto rounded object-contain", imageClassName)}
      />
    </span>
  );
};

export default BrandLogo;

