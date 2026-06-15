import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, MessageCircle, Search } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import { catalogCategories, getCategoryMeta } from "@/data/categories";
import {
  CatalogItem,
  fetchCatalog,
  productSearchText,
  resolveCatalogImage,
} from "@/lib/catalog";

function getInitialCategory() {
  const params = new URLSearchParams(window.location.search);
  return params.get("categoria") || "todos";
}

function quoteUrl(product: CatalogItem) {
  const message = `Olá! Vim pelo site da Hidroconex e gostaria de solicitar orçamento do produto: ${product.model}.`;
  return `https://wa.me/5517997726171?text=${encodeURIComponent(message)}`;
}

const CatalogPage = () => {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(getInitialCategory);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchCatalog()
      .then((items) => {
        if (isMounted) {
          setProducts(items);
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesCategory =
        selectedCategory === "todos" || product.categoryId === selectedCategory;
      const matchesSearch =
        !normalizedSearch || productSearchText(product).includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchTerm, selectedCategory]);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((accumulator, product) => {
      accumulator[product.categoryId] = (accumulator[product.categoryId] || 0) + 1;
      return accumulator;
    }, {});
  }, [products]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main>
        <section className="bg-gradient-navy text-secondary-foreground pt-32 pb-16">
          <div className="section-container">
            <a
              href="/#produtos"
              className="inline-flex items-center gap-2 text-secondary-foreground/75 hover:text-primary transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para produtos
            </a>

            <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-end">
              <div>
                <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
                  Catálogo Hidroconex
                </span>
                <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
                  Peças industriais com precisão de fabricação.
                </h1>
                <p className="text-lg text-secondary-foreground/75 max-w-2xl leading-relaxed">
                  Consulte modelos disponíveis para tanques subterrâneos,
                  reservatórios metálicos e aplicações industriais. Para medidas
                  especiais, fale com a equipe técnica.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-bold text-primary">{products.length}</p>
                  <p className="text-sm text-secondary-foreground/65">produtos listados</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-5">
                  <p className="text-3xl font-bold text-primary">{catalogCategories.length}</p>
                  <p className="text-sm text-secondary-foreground/65">linhas de produto</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="section-padding">
          <div className="section-container">
            <div className="flex flex-col lg:flex-row gap-4 lg:items-center lg:justify-between mb-10">
              <div className="relative w-full lg:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  type="search"
                  placeholder="Buscar por modelo, linha ou aplicação"
                  className="w-full rounded-lg border border-border bg-card pl-12 pr-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("todos")}
                  className={`whitespace-nowrap rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                    selectedCategory === "todos"
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/50"
                  }`}
                >
                  Todos ({products.length})
                </button>
                {catalogCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategory(category.id)}
                    className={`whitespace-nowrap rounded-lg border px-4 py-3 text-sm font-semibold transition-colors ${
                      selectedCategory === category.id
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-card text-foreground border-border hover:border-primary/50"
                    }`}
                  >
                    {category.shortTitle} ({categoryCounts[category.id] || 0})
                  </button>
                ))}
              </div>
            </div>

            {isLoading ? (
              <div className="py-20 text-center text-muted-foreground">
                Carregando catálogo...
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map((product) => {
                  const category = getCategoryMeta(product.categoryId);

                  return (
                    <article
                      key={product.id}
                      className="card-industrial overflow-hidden bg-card flex flex-col"
                    >
                      <div className="h-56 bg-white border-b border-border p-5 flex items-center justify-center">
                        <img
                          src={resolveCatalogImage(product)}
                          alt={product.model}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      <div className="p-5 flex flex-col flex-1">
                        <span className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">
                          {category?.title || product.subCategory}
                        </span>
                        <h2 className="text-lg font-bold text-foreground leading-snug mb-2">
                          {product.model}
                        </h2>
                        <p className="text-sm text-muted-foreground flex-1">
                          {product.description ||
                            `${product.mainCategory} • ${product.subCategory}`}
                        </p>

                        <a
                          href={quoteUrl(product)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-5 inline-flex items-center justify-center gap-2 rounded-md bg-secondary px-4 py-3 text-sm font-semibold text-secondary-foreground hover:bg-secondary/90 transition-colors"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Solicitar orçamento
                        </a>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border bg-card py-16 px-6 text-center">
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Nenhum produto encontrado
                </h2>
                <p className="text-muted-foreground">
                  Ajuste os filtros ou fale com a Hidroconex para uma peça sob medida.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default CatalogPage;
