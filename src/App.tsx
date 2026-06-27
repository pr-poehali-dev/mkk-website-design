
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Anketa from "./pages/Anketa";
import Login from "./pages/Login";
import Cabinet from "./pages/Cabinet";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import MaintenanceBanner from "./components/MaintenanceBanner";
import { MaintenanceProvider } from "./lib/maintenanceContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MaintenanceProvider>
          <MaintenanceBanner />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/anketa" element={<Anketa />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/admin" element={<Admin />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MaintenanceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;