import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Factory, MessageCircle, Ruler, ShieldCheck } from "lucide-react";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import ProductImageFrame from "@/components/ProductImageFrame";
import Seo from "@/components/Seo";
import WhatsAppButton from "@/components/WhatsAppButton";
import { getCategoryMeta } from "@/data/categories";
import { CatalogItem, fetchCatalog, resolveCatalogImage } from "@/lib/catalog";
import {
  breadcrumbSchema,
  organizationSchema,
  productSchema,
} from "@/lib/seo";
import { categoryPath, productPath, productSlug } from "@/lib/siteUrls";

interface ProductDetailProps {
  slug: string;
}

function quoteUrl(product: CatalogItem) {
  const message = `Olá! Vim pelo site da Hidroconex e gostaria de solicitar orçamento do produto: ${product.model}.`;
  return `https://wa.me/5517997726171?text=${encodeURIComponent(message)}`;
}

const ProductDetail = ({ slug }: ProductDetailProps) => {
  const [products, setProducts] = useState<CatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    fetchCatalog()
      .then((items) => {
        if (isMounted) {
          setProducts(items);
          setLoadError(null);
        }
      })
      .catch((error) => {
        if (isMounted) {
          setProducts([]);
          setLoadError(error instanceof Error ? error.message : "Não foi possível carregar o produto.");
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

  const product = useMemo(
    () => products.find((item) => productSlug(item) === slug),
    [products, slug],
  );
  const category = product ? getCategoryMeta(product.categoryId) : null;
  const image = product ? resolveCatalogImage(product) : "/placeholder.svg";
  const relatedProducts = product
    ? products
        .filter((item) => item.categoryId === product.categoryId && item.id !== product.id)
        .slice(0, 3)
    : [];

  const title = product
    ? `${product.model} | Hidroconex`
    : "Produto Hidroconex";
  const description = product
    ? product.description ||
      `${product.model} da linha ${product.subCategory.toLowerCase()} para ${product.mainCategory.toLowerCase()}. Solicite orçamento técnico com a Hidroconex.`
    : "Detalhes de produto do catálogo Hidroconex.";

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={title}
        description={description}
        path={product ? productPath(product) : `/produto/${slug}`}
        image={image}
        type="product"
        robots={!isLoading && !product ? "noindex,follow" : "index,follow"}
        structuredData={
          product
            ? [
                organizationSchema(),
                productSchema(product, image),
                breadcrumbSchema([
                  { name: "Início", path: "/" },
                  { name: "Catálogo", path: "/catalogo" },
                  ...(category ? [{ name: category.title, path: categoryPath(category) }] : []),
                  { name: product.model, path: productPath(product) },
                ]),
              ]
            : [organizationSchema()]
        }
      />

      <Header />

      <main>
        <section className="bg-gradient-navy pt-32 pb-16 text-secondary-foreground">
          <div className="section-container">
            <a
              href={category ? categoryPath(category) : "/catalogo"}
              className="mb-8 inline-flex items-center gap-2 text-secondary-foreground/75 transition-colors hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar para o catálogo
            </a>

            {isLoading ? (
              <div className="py-12 text-secondary-foreground/75">Carregando produto...</div>
            ) : loadError || !product ? (
              <div className="max-w-2xl rounded-lg border border-white/10 bg-white/5 p-8">
                <h1 className="mb-3 text-3xl font-bold">Produto não encontrado</h1>
                <p className="text-secondary-foreground/75">
                  {loadError || "Esse item não está disponível no catálogo atual."}
                </p>
              </div>
            ) : (
              <div className="grid items-center gap-10 lg:grid-cols-[0.95fr_1.05fr]">
                <ProductImageFrame
                  src={image}
                  alt={product.model}
                  loading="eager"
                  className="h-[360px] rounded-lg border border-white/10 p-8 shadow-2xl lg:h-[480px]"
                  imageClassName="drop-shadow-xl"
                />

                <div>
                  <span className="mb-4 inline-block text-sm font-semibold uppercase tracking-wider text-primary">
                    {category?.title || product.subCategory}
                  </span>
                  <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl">
                    {product.model}
                  </h1>
                  <p className="mb-8 max-w-2xl text-lg leading-relaxed text-secondary-foreground/75">
                    {description}
                  </p>

                  <div className="mb-8 grid gap-3 sm:grid-cols-3">
                    {[
                      { icon: Factory, label: "Fabricação própria" },
                      { icon: Ruler, label: "Medidas técnicas" },
                      { icon: ShieldCheck, label: "Controle dimensional" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-4"
                      >
                        <item.icon className="h-5 w-5 text-primary" />
                        <span className="text-sm font-semibold text-secondary-foreground/80">
                          {item.label}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <a
                      href={quoteUrl(product)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-hero inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-5 w-5" />
                      Solicitar orçamento
                    </a>
                    <a
                      href={category ? categoryPath(category) : "/catalogo"}
                      className="btn-secondary-hero inline-flex items-center justify-center"
                    >
                      Ver produtos da linha
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {product && (
          <section className="section-padding">
            <div className="section-container">
              <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
                <div>
                  <span className="mb-3 inline-block text-sm font-semibold uppercase tracking-wider text-lime-dark">
                    Aplicação
                  </span>
                  <h2 className="mb-4 text-3xl font-bold text-foreground">
                    Especificação orientada ao uso industrial
                  </h2>
                  <p className="text-muted-foreground">
                    A equipe técnica confirma medida, rosca, material e aplicação antes da
                    fabricação ou separação do item.
                  </p>
                </div>

                <dl className="grid gap-4 sm:grid-cols-2">
                  {[
                    ["Linha", product.mainCategory],
                    ["Categoria", product.subCategory],
                    ["Modelo", product.model],
                    ["Atendimento", "Orçamento técnico por WhatsApp ou formulário"],
                  ].map(([label, value]) => (
                    <div key={label} className="card-industrial p-5">
                      <dt className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-lime-dark">
                        {label}
                      </dt>
                      <dd className="font-semibold text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {relatedProducts.length > 0 && (
                <div className="mt-16 border-t border-border pt-10">
                  <h2 className="mb-6 text-2xl font-bold text-foreground">
                    Produtos relacionados
                  </h2>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {relatedProducts.map((related) => (
                      <a
                        key={related.id}
                        href={productPath(related)}
                        className="card-industrial group overflow-hidden bg-card"
                      >
                        <ProductImageFrame
                          src={resolveCatalogImage(related)}
                          alt={related.model}
                          className="h-48 p-5"
                        />
                        <div className="p-5">
                          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                            {related.subCategory}
                          </p>
                          <h3 className="mt-2 text-lg font-bold text-foreground transition-colors group-hover:text-lime-dark">
                            {related.model}
                          </h3>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default ProductDetail;

