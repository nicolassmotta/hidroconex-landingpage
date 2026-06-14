export interface CatalogCategory {
  id: string;
  title: string;
  mainCategory: string;
  subCategory: string;
  description: string;
}

export interface CatalogCategoryGroup {
  id: "tanques" | "reservatorios";
  label: string;
  categoryIds: string[];
}

export const catalogCategories: CatalogCategory[] = [
  {
    id: "ts-juntas",
    title: "Juntas de Fixação",
    mainCategory: "Tanques Subterrâneos",
    subCategory: "Juntas",
    description: "Juntas de alto desempenho e vedação segura para tanques de armazenamento subterrâneo.",
  },
  {
    id: "ts-luvas",
    title: "Luvas",
    mainCategory: "Tanques Subterrâneos",
    subCategory: "Luvas",
    description: "Luvas robustas em aço carbono projetadas para segurança em sistemas subterrâneos.",
  },
  {
    id: "ts-niples",
    title: "Niples de Redução",
    mainCategory: "Tanques Subterrâneos",
    subCategory: "Niples",
    description: "Diversas medidas em niples de redução e adaptação para interligação de linhas de fluido.",
  },
  {
    id: "ts-plugs",
    title: "Plugs de Vedação",
    mainCategory: "Tanques Subterrâneos",
    subCategory: "Plugs",
    description: "Plugs usinados para vedação estanque e segura em compartimentos e tubulações.",
  },
  {
    id: "ts-filtros",
    title: "Filtros",
    mainCategory: "Tanques Subterrâneos",
    subCategory: "Filtros",
    description: "Sistemas de filtragem duráveis fundamentais para a captação de combustíveis e químicos.",
  },
  {
    id: "rm-luvas",
    title: "Luvas de Aço",
    mainCategory: "Reservatórios Metálicos",
    subCategory: "Luvas",
    description: "Luvas de aço inox e carbono usinadas em alta precisão para reservatórios metálicos.",
  },
  {
    id: "rm-niples",
    title: "Niples",
    mainCategory: "Reservatórios Metálicos",
    subCategory: "Niples",
    description: "Niples resistentes projetados para suportar pressões exigidas em estruturas de reservação.",
  },
];

export const catalogCategoryGroups: CatalogCategoryGroup[] = [
  {
    id: "tanques",
    label: "Tanques Subterrâneos",
    categoryIds: ["ts-juntas", "ts-luvas", "ts-niples", "ts-plugs", "ts-filtros"],
  },
  {
    id: "reservatorios",
    label: "Reservatórios Metálicos",
    categoryIds: ["rm-luvas", "rm-niples"],
  },
];

export function getCategoryById(categoryId: string) {
  return catalogCategories.find((category) => category.id === categoryId);
}
