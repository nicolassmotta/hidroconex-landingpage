import { useMemo, useState } from "react";
import { ArrowRight, PackageSearch, RotateCcw, Search, SlidersHorizontal } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import WhatsAppButton from "@/components/WhatsAppButton";
import { catalogCategories } from "@/data/catalogCategories";
import { useStoredProducts } from "@/hooks/useStoredProducts";
import { resolveProductImage } from "@/lib/catalogImages";

const CatalogPage = () => {
  const products = useStoredProducts();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMainCategory, setSelectedMainCategory] = useState("todos");
  const [selectedCategoryId, setSelectedCategoryId] = useState("todos");
  const [selectedMaterial, setSelectedMaterial] = useState("todos");

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "ativo"),
    [products],
  );

  const mainCategories = useMemo(
    () => Array.from(new Set(catalogCategories.map((category) => category.mainCategory))),
    [],
  );

  const availableCategories = useMemo(() => {
    if (selectedMainCategory === "todos") return catalogCategories;
    return catalogCategories.filter((category) => category.mainCategory === selectedMainCategory);
  }, [selectedMainCategory]);

  const materials = useMemo(
    () => Array.from(new Set(activeProducts.map((product) => product.material))).filter(Boolean),
    [activeProducts],
  );

  const filteredProducts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return activeProducts.filter((product) => {
      const matchesSearch =
        !normalizedSearch ||
        [product.model, product.mainCategory, product.subCategory, product.description, product.material]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesMainCategory =
        selectedMainCategory === "todos" || product.mainCategory === selectedMainCategory;

      const matchesCategory = selectedCategoryId === "todos" || product.categoryId === selectedCategoryId;
      const matchesMaterial = selectedMaterial === "todos" || product.material === selectedMaterial;

      return matchesSearch && matchesMainCategory && matchesCategory && matchesMaterial;
    });
  }, [activeProducts, searchTerm, selectedMainCategory, selectedCategoryId, selectedMaterial]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedMainCategory("todos");
    setSelectedCategoryId("todos");
    setSelectedMaterial("todos");
  };

  const handleMainCategoryChange = (value: string) => {
    setSelectedMainCategory(value);
    setSelectedCategoryId("todos");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header variant="internal" />
      <main className="pt-20">
        <section className="bg-secondary text-secondary-foreground py-14 md:py-20">
          <div className="section-container">
            <div className="max-w-3xl">
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-4 py-2 text-sm font-semibold text-primary">
                <PackageSearch className="h-4 w-4" />
                Catálogo técnico
              </span>
              <h1 className="mt-6 text-4xl font-bold md:text-5xl">
                Peças e conexões para aplicações industriais
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-relaxed text-secondary-foreground/75 md:text-lg">
                Consulte produtos por família, categoria, material e modelo. O catálogo reflete os itens cadastrados na área administrativa.
              </p>
            </div>
          </div>
        </section>

        <section className="section-padding" aria-labelledby="catalogo-filtros">
          <div className="section-container">
            <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase text-primary">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </span>
                <h2 id="catalogo-filtros" className="mt-2 text-3xl font-bold text-foreground">
                  Catálogo de produtos
                </h2>
              </div>
              <p className="text-sm font-medium text-muted-foreground">
                {filteredProducts.length} de {activeProducts.length} produtos ativos
              </p>
            </div>

            <form
              className="grid gap-4 rounded-lg border border-border bg-card p-4 shadow-card md:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"
              onSubmit={(event) => event.preventDefault()}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Buscar</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Modelo, categoria ou material"
                    className="h-11 w-full rounded-md border border-border bg-background pl-10 pr-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Família</span>
                <select
                  value={selectedMainCategory}
                  onChange={(event) => handleMainCategoryChange(event.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                >
                  <option value="todos">Todas</option>
                  {mainCategories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Categoria</span>
                <select
                  value={selectedCategoryId}
                  onChange={(event) => setSelectedCategoryId(event.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                >
                  <option value="todos">Todas</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.title}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-foreground">Material</span>
                <select
                  value={selectedMaterial}
                  onChange={(event) => setSelectedMaterial(event.target.value)}
                  className="h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none transition focus:ring-2 focus:ring-primary/40"
                >
                  <option value="todos">Todos</option>
                  {materials.map((material) => (
                    <option key={material} value={material}>
                      {material}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex h-11 items-center justify-center gap-2 self-end rounded-md border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary hover:text-primary"
              >
                <RotateCcw className="h-4 w-4" />
                Limpar
              </button>
            </form>

            <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product) => (
                <article key={product.id} className="card-industrial overflow-hidden">
                  <div className="flex h-56 items-center justify-center border-b border-border bg-white p-6">
                    <img
                      src={resolveProductImage(product)}
                      alt={product.model}
                      loading="lazy"
                      decoding="async"
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                  <div className="p-5">
                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {product.mainCategory}
                      </span>
                      <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                        {product.subCategory}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-foreground">{product.model}</h3>
                    <p className="mt-3 min-h-16 text-sm leading-relaxed text-muted-foreground">
                      {product.description}
                    </p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border/70 pt-4">
                      <span className="text-sm font-medium text-muted-foreground">{product.material}</span>
                      <a
                        href="/#contato"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition hover:text-lime-dark"
                      >
                        Orçar
                        <ArrowRight className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredProducts.length === 0 && (
              <div className="mt-10 rounded-lg border border-dashed border-border bg-muted/30 p-10 text-center">
                <h3 className="text-xl font-bold text-foreground">Nenhum produto encontrado</h3>
                <p className="mt-2 text-muted-foreground">
                  Ajuste os filtros para visualizar outras peças cadastradas.
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
