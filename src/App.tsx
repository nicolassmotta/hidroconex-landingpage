import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { initFailureMonitoring } from "@/lib/failureMonitoring";

import AdminPage from "./pages/Admin";
import CatalogPage from "./pages/Catalog";
import Index from "./pages/Index";

function getRoute() {
  return window.location.pathname.replace(/\/+$/, "") || "/";
}

const App = () => {
  const route = getRoute();

  useEffect(() => {
    initFailureMonitoring();
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {route === "/catalogo" ? (
        <CatalogPage />
      ) : route === "/admin" ? (
        <AdminPage />
      ) : (
        <Index />
      )}
    </TooltipProvider>
  );
};

export default App;
