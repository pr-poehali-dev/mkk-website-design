
import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { apiCheckReminders } from "@/lib/api";
import Index from "./pages/Index";
import Anketa from "./pages/Anketa";
import Login from "./pages/Login";
import Cabinet from "./pages/Cabinet";
import News from "./pages/News";
import NewsArticle from "./pages/NewsArticle";
import PaymentMethods from "./pages/PaymentMethods";
import Admin from "./pages/Admin";
import AdminSettings from "./pages/AdminSettings";
import AdminEmails from "./pages/AdminEmails";
import AdminSupport from "./pages/AdminSupport";
import AdminNews from "./pages/AdminNews";
import SiteClosed from "./pages/SiteClosed";
import NotFound from "./pages/NotFound";
import MaintenanceBanner from "./components/MaintenanceBanner";
import { MaintenanceProvider, useMaintenance } from "./lib/maintenanceContext";
import CookieBanner from "./components/CookieBanner";
import ChatWidget from "./components/ChatWidget";
import SupportModal from "./components/SupportModal";
import { SupportModalProvider } from "./lib/supportModalContext";

const queryClient = new QueryClient();

const SiteGuard = ({ children }: { children: React.ReactNode }) => {
  const { siteClosed } = useMaintenance();
  const location = useLocation();
  const adminPaths = ['/admin', '/admin/settings', '/admin/emails', '/admin/support', '/admin/news'];
  if (siteClosed && !adminPaths.includes(location.pathname)) {
    return <SiteClosed />;
  }
  return <>{children}</>;
};

const App = () => {
  useEffect(() => {
    apiCheckReminders();
  }, []);

  return (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MaintenanceProvider>
          <SupportModalProvider>
            <SiteGuard>
              <MaintenanceBanner />
              <CookieBanner />
              <ChatWidget />
              <SupportModal />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/anketa" element={<Anketa />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cabinet" element={<Cabinet />} />
                <Route path="/news" element={<News />} />
                <Route path="/news/:id" element={<NewsArticle />} />
                <Route path="/payment" element={<PaymentMethods />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/settings" element={<AdminSettings />} />
                <Route path="/admin/emails" element={<AdminEmails />} />
                <Route path="/admin/support" element={<AdminSupport />} />
                <Route path="/admin/news" element={<AdminNews />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SiteGuard>
          </SupportModalProvider>
        </MaintenanceProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;