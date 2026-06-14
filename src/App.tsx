import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";
import CatalogPage from "./pages/CatalogPage";
import AdminPage from "./pages/AdminPage";

function getCurrentPage() {
  const normalizedPath = window.location.pathname.replace(/\/$/, "") || "/";

  if (normalizedPath === "/catalogo") return "catalog";
  if (normalizedPath === "/admin") return "admin";

  return "home";
}

const App = () => {
  const [currentPage, setCurrentPage] = useState(() => getCurrentPage());

  useEffect(() => {
    const handleRouteChange = () => setCurrentPage(getCurrentPage());

    window.addEventListener("popstate", handleRouteChange);
    return () => window.removeEventListener("popstate", handleRouteChange);
  }, []);

  const page = {
    home: <Index />,
    catalog: <CatalogPage />,
    admin: <AdminPage />,
  }[currentPage];

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {page}
    </TooltipProvider>
  );
};

export default App;
