import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Seo from "@/components/Seo";
import { catalogCategories } from "@/data/categories";
import { initFailureMonitoring } from "@/lib/failureMonitoring";

import AdminPage from "./pages/Admin";
import CatalogPage from "./pages/Catalog";
import Index from "./pages/Index";
import ProductDetail from "./pages/ProductDetail";

function getRoute() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

const App = () => {
  const route = getRoute();
  const catalogMatch = route.match(/^\/catalogo\/([^/]+)$/);
  const productMatch = route.match(/^\/produto\/([^/]+)$/);
  const categoryFromRoute = catalogMatch
    ? catalogCategories.find((category) => category.slug === decodeURIComponent(catalogMatch[1]))
    : null;

  useEffect(() => {
    initFailureMonitoring();
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {route === "/catalogo" || catalogMatch ? (
        <CatalogPage initialCategoryId={categoryFromRoute?.id} />
      ) : productMatch ? (
        <ProductDetail slug={decodeURIComponent(productMatch[1])} />
      ) : route === "/admin" ? (
        <>
          <Seo
            title="Painel Hidroconex"
            description="Área administrativa da Hidroconex."
            path="/admin"
            robots="noindex,nofollow"
          />
          <AdminPage />
        </>
      ) : (
        <Index />
      )}
    </TooltipProvider>
  );
};

export default App;
