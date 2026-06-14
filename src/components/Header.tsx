import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/Logo/logo-hidroconex.jpeg";
import { isDemoAdminAvailable } from "@/lib/security";

interface HeaderProps {
  variant?: "home" | "internal";
}

const Header = ({ variant = "home" }: HeaderProps) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const anchorPrefix = variant === "home" ? "" : "/";
  const contactHref = variant === "home" ? "#contato" : "/#contato";

  const navItems = [
    { label: "Início", href: `${anchorPrefix}#inicio` },
    { label: "Produtos", href: `${anchorPrefix}#produtos` },
    { label: "Catálogo", href: "/catalogo" },
    { label: "Sobre", href: `${anchorPrefix}#sobre` },
    { label: "Localização", href: `${anchorPrefix}#localizacao` },
    { label: "Contato", href: contactHref },
    ...(isDemoAdminAvailable() ? [{ label: "Admin", href: "/admin" }] : []),
  ];

  // Header turns solid when scrolled OR when the mobile menu is open,
  // so nav controls stay legible instead of sitting on the dark hero.
  const solid = variant === "internal" || isScrolled || isMobileMenuOpen;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${solid
        ? "bg-card/95 backdrop-blur-md shadow-lg"
        : "bg-transparent"
        }`}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <a href={variant === "home" ? "#inicio" : "/"} className="flex items-center">
            <img
              src={logo}
              alt="Hidroconex"
              className="h-14 w-auto"
            />
          </a>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-5 xl:gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`font-medium transition-colors duration-200 ${solid
                  ? "text-foreground/80 hover:text-primary"
                  : "text-secondary-foreground/90 hover:text-primary"
                  }`}
              >
                {item.label}
              </a>
            ))}
            <a
              href={contactHref}
              className="btn-hero text-sm px-6 py-3"
            >
              Solicitar Orçamento
            </a>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            className={`lg:hidden p-2 transition-colors ${solid ? "text-foreground" : "text-white"}`}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <nav className="lg:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-4 bg-card rounded-lg p-4 shadow-lg">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-foreground/80 hover:text-primary font-medium py-2 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={contactHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className="btn-hero text-center text-sm px-6 py-3 mt-2"
              >
                Solicitar Orçamento
              </a>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};

export default Header;
