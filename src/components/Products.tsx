import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal";
import { catalogCategories, catalogCategoryGroups } from "@/data/catalogCategories";
import { useStoredProducts } from "@/hooks/useStoredProducts";
import { resolveProductImage } from "@/lib/catalogImages";

interface ProductCardData {
  id: string;
  title: string;
  description: string;
  image: string;
  productCount: number;
}

const ProductCard = ({ product, index, onClick }: { product: ProductCardData, index: number, onClick: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className="card-industrial group border border-border shadow-card hover:shadow-card-hover rounded-xl overflow-hidden bg-card flex flex-col h-full cursor-pointer text-left"
    style={{ animationDelay: `${index * 0.1}s` }}
  >
    <div className="relative h-64 w-full overflow-hidden bg-white flex items-center justify-center p-6 border-b border-border">
      <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity z-10 duration-300 pointer-events-none" />
      <img
        src={product.image}
        alt={product.title}
        loading="lazy"
        decoding="async"
        className="max-w-full max-h-full object-contain transform group-hover:scale-110 transition-transform duration-500 ease-out"
      />
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <h3 className="text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
        {product.title}
      </h3>
      <p className="text-muted-foreground leading-relaxed text-sm flex-grow">
        {product.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-muted-foreground group-hover:text-primary font-medium transition-colors duration-300">
        <span className="text-sm">Ver Catálogo Detalhado</span>
        <span className="rounded-full bg-muted px-3 py-1 text-xs text-muted-foreground">
          {product.productCount} itens
        </span>
        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
      </div>
    </div>
  </button>
);

const Products = () => {
  const storedProducts = useStoredProducts();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const activeProducts = useMemo(
    () => storedProducts.filter((product) => product.status === "ativo"),
    [storedProducts],
  );

  const categoryCards = useMemo(() => {
    return catalogCategoryGroups.reduce<Record<string, ProductCardData[]>>((groups, group) => {
      groups[group.id] = group.categoryIds
        .map((categoryId) => {
          const category = catalogCategories.find((item) => item.id === categoryId);
          const productsInCategory = activeProducts.filter((product) => product.categoryId === categoryId);
          const thumbnailProduct = productsInCategory[0];

          if (!category || productsInCategory.length === 0) return null;

          return {
            id: category.id,
            title: category.title,
            description: category.description,
            image: thumbnailProduct ? resolveProductImage(thumbnailProduct) : "/placeholder.svg",
            productCount: productsInCategory.length,
          };
        })
        .filter((category): category is ProductCardData => Boolean(category));

      return groups;
    }, {});
  }, [activeProducts]);

  const handleOpenCatalog = (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    setIsModalOpen(true);
  };

  const detailedItems = activeProducts.filter((item) => item.categoryId === selectedCategoryId);
  const activeCategoryTitle = catalogCategories.find((category) => category.id === selectedCategoryId)?.title || "Catálogo de Produtos";

  return (
    <section id="produtos" className="section-padding bg-muted/30">
      <div className="section-container">
        {/* Section Header */}
        <Reveal className="text-center mb-16">
          <span className="inline-block text-primary font-semibold text-sm uppercase tracking-wider mb-4">
            Nosso Catálogo
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4 font-heading tracking-tight">
            Nossos <span className="text-primary">Produtos</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
            Especialistas na fabricação de peças de alta precisão técnica para as principais aplicações e exigências da indústria atual.
          </p>
        </Reveal>

        {/* Catalog Tabs */}
        <Tabs defaultValue="tanques" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-background border border-border p-1 w-full max-w-[600px] h-[60px] shadow-sm rounded-lg">
              <TabsTrigger
                value="tanques"
                className="w-1/2 h-full px-1 text-xs sm:text-sm md:text-base font-semibold leading-tight whitespace-normal text-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-md"
              >
                Tanques Subterrâneos
              </TabsTrigger>
              <TabsTrigger
                value="reservatorios"
                className="w-1/2 h-full px-1 text-xs sm:text-sm md:text-base font-semibold leading-tight whitespace-normal text-center data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md transition-all duration-300 rounded-md"
              >
                Reservatórios Metálicos
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="tanques" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
              {categoryCards.tanques?.map((product, index) => (
                <Reveal key={product.id} className="h-full" delay={index * 80}>
                  <ProductCard
                    product={product}
                    index={index}
                    onClick={() => handleOpenCatalog(product.id)}
                  />
                </Reveal>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="reservatorios" className="mt-0 focus-visible:outline-none focus-visible:ring-0 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-4xl mx-auto">
              {categoryCards.reservatorios?.map((product, index) => (
                <Reveal key={product.id} className="h-full" delay={index * 80}>
                  <ProductCard
                    product={product}
                    index={index}
                    onClick={() => handleOpenCatalog(product.id)}
                  />
                </Reveal>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* CTA */}
        <div className="text-center mt-16 pt-8 border-t border-border/50">
          <a
            href="#contato"
            className="inline-flex items-center justify-center gap-2 bg-secondary text-secondary-foreground font-semibold px-8 py-4 rounded-lg hover:bg-secondary/90 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
          >
            Fale com um Especialista e Solicite Orçamento
            <ArrowRight className="w-5 h-5 ml-2" />
          </a>
        </div>
      </div>

      {/* Detailed Catalog Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-background p-0 gap-0 border-border">

          <div className="bg-muted px-6 py-6 border-b border-border sticky top-0 z-20 flex flex-col items-center justify-center text-center">
            <span className="text-primary font-semibold text-sm uppercase tracking-wider mb-2">
              Catálogo Detalhado
            </span>
            <DialogTitle className="text-2xl md:text-3xl font-bold text-foreground">
              {activeCategoryTitle}
            </DialogTitle>
          </div>

          <div className="p-6 md:p-8">
            {detailedItems.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {detailedItems.map((item) => (
                  <div key={item.id} className="bg-card border border-border rounded-xl p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow group">
                    <div className="h-48 w-full flex items-center justify-center mb-6">
                      <img
                        src={resolveProductImage(item)}
                        alt={item.model}
                        loading="lazy"
                        decoding="async"
                        className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <h4 className="text-lg font-bold text-foreground text-center mb-2">
                      {item.model}
                    </h4>
                    <p className="text-xs text-muted-foreground text-center">
                      {item.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                Nenhum produto detalhado cadastrado no momento.
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Products;
