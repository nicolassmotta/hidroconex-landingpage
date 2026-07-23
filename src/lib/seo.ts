import type { CatalogCategory } from "@/data/categories";
import type { CatalogItem } from "@/lib/catalog";
import { absoluteUrl, categoryPath, productPath, SITE_URL } from "@/lib/siteUrls";

export const defaultSeo = {
  title: "Hidroconex | Luvas de Aço Carbono, Conexões e Componentes Industriais",
  description:
    "Fabricante de luvas de aço carbono, conexões, niples, juntas, plugs e filtros industriais. Produção própria em São José do Rio Preto — SP. Peças para tanques subterrâneos e reservatórios metálicos.",
  image: "/logo-hidroconex.jpeg",
};

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: "Hidroconex Indústria e Comércio Ltda",
    url: SITE_URL,
    logo: absoluteUrl("/logo-hidroconex.jpeg"),
    email: "hidroconex@terra.com.br",
    telephone: "+55 17 99772-6171",
    sameAs: ["https://wa.me/5517997726171"],
  };
}

export function localBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "@id": `${SITE_URL}/#localbusiness`,
    name: "Hidroconex Indústria e Comércio Ltda",
    url: SITE_URL,
    image: absoluteUrl("/logo-hidroconex.jpeg"),
    telephone: "+55 17 99772-6171",
    email: "hidroconex@terra.com.br",
    priceRange: "$$",
    address: {
      "@type": "PostalAddress",
      streetAddress: "R. Monteiro Lobato, 750 - Distrito Industrial Campo Verdi",
      addressLocality: "São José do Rio Preto",
      addressRegion: "SP",
      postalCode: "15076-000",
      addressCountry: "BR",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        opens: "07:30",
        closes: "17:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Friday",
        opens: "07:30",
        closes: "16:00",
      },
    ],
    makesOffer: [
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Luvas de Aço Carbono",
          description: "Luvas de aço carbono e inox usinadas em alta precisão para tanques subterrâneos e reservatórios metálicos.",
          category: "Conexões Industriais",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Niples e Niples de Redução",
          description: "Niples de aço carbono para interligação de linhas de fluido em tanques e reservatórios.",
          category: "Conexões Industriais",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Juntas de Fixação",
          description: "Juntas de alto desempenho e vedação segura para tanques de armazenamento subterrâneo.",
          category: "Conexões Industriais",
        },
      },
      {
        "@type": "Offer",
        itemOffered: {
          "@type": "Product",
          name: "Plugs de Vedação e Filtros Industriais",
          description: "Plugs usinados para vedação estanque e filtros para captação de combustíveis e químicos.",
          category: "Conexões Industriais",
        },
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: "Hidroconex",
    url: SITE_URL,
    publisher: {
      "@id": `${SITE_URL}/#organization`,
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function categoryCollectionSchema(
  category: CatalogCategory | null,
  products: CatalogItem[],
) {
  const path = category ? categoryPath(category) : "/catalogo";
  const name = category ? category.title : "Catálogo Hidroconex";

  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name,
    description: category?.description || defaultSeo.description,
    url: absoluteUrl(path),
    mainEntity: {
      "@type": "ItemList",
      numberOfItems: products.length,
      itemListElement: products.slice(0, 24).map((product, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(productPath(product)),
        name: product.model,
      })),
    },
  };
}

export function productSchema(product: CatalogItem, image: string) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.model,
    image: absoluteUrl(image),
    description:
      product.description ||
      `${product.model} em aço carbono — ${product.mainCategory.toLowerCase()}, linha ${product.subCategory.toLowerCase()}. Fabricação Hidroconex.`,
    category: `${product.mainCategory} > ${product.subCategory}`,
    brand: {
      "@type": "Brand",
      name: "Hidroconex",
    },
    manufacturer: {
      "@id": `${SITE_URL}/#organization`,
    },
    url: absoluteUrl(productPath(product)),
  };
}

