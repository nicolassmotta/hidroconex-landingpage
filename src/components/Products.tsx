import { useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { catalogCategoryGroups, CatalogCategory } from "@/data/categories";
import { CatalogItem, fetchCatalog, resolveCatalogImage } from "@/lib/catalog";

function getCategoryThumbnail(categoryId: string, products: CatalogItem[]): string {
  const item = products.find((product) => product.categoryId === categoryId);
  return item ? resolveCatalogImage(item) : "/placeholder.svg";
}

const ProductCard = ({
  category,
  image,
  index,
}: {
  category: CatalogCategory;
  image: string;
  index: number;
}) => (
  <a
    href={`/catalogo?categoria=${category.id}`}
    className="card-industrial group overflow-hidden bg-card flex flex-col h-full"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className="relative h-64 w-full overflow-hidden bg-white flex items-center justify-center p-6 border-b border-border">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 duration-300 pointer-events-none" />
      <img
        src={image}
        alt={category.title}
        loading={index > 1 ? "lazy" : "eager"}
        decoding="async"
        className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition-transform duration-500 ease-out"
      />
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-lime-dark transition-colors">
        {category.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed text-sm flex-grow">
        {category.description}
      </p>

      <div className="mt-4 flex items-center text-muted-foreground group-hover:text-lime-dark font-medium transition-colors duration-300">
        <span className="text-sm">Ver catálogo detalhado</span>
        <span className="ml-2 transition-transform duration-300 group-hover:translate-x-1">→</span>
      </div>
    </div>
  </a>
);

const Products = () => {
  const [products, setProducts] = useState<CatalogItem[]>([]);

  useEffect(() => {
    let isMounted = true;

    fetchCatalog().then((items) => {
      if (isMounted) {
        setProducts(items);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<string, number>>((accumulator, product) => {
      accumulator[product.categoryId] = (accumulator[product.categoryId] || 0) + 1;
      return accumulator;
    }, {});
  }, [products]);

  const renderCategoryGrid = (categories: CatalogCategory[], columnsClass: string) => (
    <div className={columnsClass}>
      {categories.map((category, index) => (
        <div key={category.id} className="relative">
          <ProductCard
            category={category}
            image={getCategoryThumbnail(category.id, products)}
            index={index}
          />
          {categoryCounts[category.id] > 0 && (
            <span className="absolute top-4 right-4 z-20 rounded-full bg-secondary text-secondary-foreground text-xs font-semibold px-3 py-1 shadow-md">
              {categoryCounts[category.id]} {categoryCounts[category.id] === 1 ? "item" : "itens"}
            </span>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <section id="produtos" className="section-padding bg-muted/30">
      <div className="section-container">
        <div className="text-center mb-16">
          <span className="inline-block text-lime-dark font-semibold text-sm uppercase tracking-wider mb-4 animate-fade-in">
            Nosso Catálogo
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-heading tracking-tight">
            Nossos <span className="text-lime-dark">Produtos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Peças de alta precisão técnica para tanques subterrâneos,
            reservatórios metálicos e aplicações industriais sob medida.
          </p>
        </div>

        <Tabs defaultValue="tanques" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="!grid grid-cols-2 items-stretch bg-background border border-border p-1 w-full max-w-[600px] h-auto min-h-[60px] shadow-sm rounded-lg">
              <TabsTrigger
                value="tanques"
                className="h-full min-h-12 !whitespace-normal px-2 text-center text-xs leading-tight sm:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-md"
              >
                Tanques Subterrâneos
              </TabsTrigger>
              <TabsTrigger
                value="reservatorios"
                className="h-full min-h-12 !whitespace-normal px-2 text-center text-xs leading-tight sm:text-base font-semibold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-md"
              >
                Reservatórios Metálicos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tanques" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderCategoryGrid(
              catalogCategoryGroups.tanques,
              "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8",
            )}
          </TabsContent>

          <TabsContent value="reservatorios" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {renderCategoryGrid(
              catalogCategoryGroups.reservatorios,
              "grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto",
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center mt-16 pt-8 border-t border-border/50">
          <a
            href="/catalogo"
            className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold px-8 py-4 rounded-lg hover:bg-secondary/90 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            Abrir catálogo completo
            <span className="ml-1">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Products;
