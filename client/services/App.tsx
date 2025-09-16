import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RealAuthProvider } from "@/components/RealAuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { CRMProvider } from "@/contexts/CRMContext";
import { useClearLocalStorage } from "@/hooks/useClearLocalStorage";
import CompanyLogin from "../pages/CompanyLogin";
import Dashboard from "../pages/Dashboard";
import VerifyEmail from "../pages/VerifyEmail";
import ResetPassword from "../pages/ResetPassword";
import APITest from "../pages/APITest";
import NotFound from "../pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  // Clear old localStorage data on app start
  useClearLocalStorage();

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<CompanyLogin />} />
        <Route path="/login" element={<CompanyLogin />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/api-test" element={<APITest />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

const App = () => (
  <ThemeProvider defaultTheme="system" storageKey="yitro-ui-theme">
    <RealAuthProvider>
      <CRMProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
          </TooltipProvider>
        </QueryClientProvider>
      </CRMProvider>
    </RealAuthProvider>
  </ThemeProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

