import { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import logo from "@/assets/Logo/logo-hidroconex.jpeg";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHome = window.location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const sectionHref = (hash: string) => (isHome ? hash : `/${hash}`);

  const navItems = [
    { label: "Início", href: sectionHref("#inicio") },
    { label: "Produtos", href: sectionHref("#produtos") },
    { label: "Catálogo", href: "/catalogo" },
    { label: "Sobre", href: sectionHref("#sobre") },
    { label: "Localização", href: sectionHref("#localizacao") },
    { label: "Contato", href: sectionHref("#contato") },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled || isMobileMenuOpen
          ? "bg-card/95 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="section-container">
        <div className="flex items-center justify-between h-20">
          <a href="/#inicio" className="flex items-center" aria-label="Hidroconex">
            <img src={logo} alt="Hidroconex" className="h-14 w-auto" />
          </a>

          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={`font-medium transition-colors duration-200 ${
                  isScrolled
                    ? "text-foreground/80 hover:text-lime-dark"
                    : "text-secondary-foreground/90 hover:text-primary"
                }`}
              >
                {item.label}
              </a>
            ))}
            <a href={sectionHref("#contato")} className="btn-hero text-sm px-6 py-3">
              Solicitar Orçamento
            </a>
          </nav>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`md:hidden p-2 transition-colors ${
              isScrolled || isMobileMenuOpen ? "text-foreground" : "text-secondary-foreground"
            }`}
            aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <nav id="mobile-navigation" className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-4 bg-card rounded-lg p-4 shadow-lg">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-foreground/80 hover:text-lime-dark font-medium py-2 transition-colors"
                >
                  {item.label}
                </a>
              ))}
              <a
                href={sectionHref("#contato")}
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
