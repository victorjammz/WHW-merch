import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CRMSidebar } from "@/components/CRMSidebar";
import { CRMHeader } from "@/components/CRMHeader";
import { Dashboard } from "@/pages/Dashboard";
import { Barcodes } from "@/pages/Barcodes";
import { Orders } from "@/pages/Orders";
import { Analytics } from "@/pages/Analytics";
import { Reports } from "@/pages/Reports";
import { Settings } from "@/pages/Settings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <SidebarProvider>
          <div className="min-h-screen flex w-full bg-gradient-subtle">
            <CRMSidebar />
            <div className="flex-1 flex flex-col">
              <CRMHeader />
              <main className="flex-1 overflow-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/barcodes" element={<Barcodes />} />
                  <Route path="/orders" element={<Orders />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </main>
            </div>
          </div>
        </SidebarProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
