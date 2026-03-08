import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import Index from "./pages/Index";

const App = () => {
  useEffect(() => {
    // Fallback: Redireciona qualquer rota diferente da raiz ("/") de volta para a landing page
    if (window.location.pathname !== "/") {
      window.location.replace("/" + window.location.search + window.location.hash);
    }
  }, []);

  return (
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <Index />
    </TooltipProvider>
  );
};

export default App;
