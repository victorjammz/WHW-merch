import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { CRMSidebar } from "@/components/CRMSidebar";
import { Header } from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { RoleProtectedRoute } from "@/components/RoleProtectedRoute";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Index from "./pages/Index";
import Inventory from "./pages/Inventory";
import Customers from "./pages/Customers";
import Orders from "./pages/Orders";
import Analytics from "./pages/Analytics";
import Barcodes from "./pages/Barcodes";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import UserManagement from "./pages/UserManagement";
import RoleManagement from "./pages/RoleManagement";
import Auth from "./pages/Auth";
import Unauthorized from "./pages/Unauthorized";

const queryClient = new QueryClient();

const AppRoutes = () => {
  const { profile, isAdmin } = useAuth();

  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <div className="flex min-h-screen w-full bg-gradient-subtle">
                <CRMSidebar />
                <div className="flex-1 flex flex-col min-w-0">
                  <Header />
                  <main className="flex-1 overflow-auto p-4 md:p-6">
                    <Routes>
                      <Route path="/" element={<Index />} />
                      
                      {/* Routes accessible by both roles */}
                      <Route path="/inventory" element={<Inventory />} />
                      
                      {/* Admin-only routes */}
                      <Route 
                        path="/user-management" 
                        element={
                          <RoleProtectedRoute allowedRoles={['admin']}>
                            <UserManagement />
                          </RoleProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/role-management" 
                        element={
                          <RoleProtectedRoute allowedRoles={['admin']}>
                            <RoleManagement />
                          </RoleProtectedRoute>
                        } 
                      />
                      
                      {/* Routes accessible by both roles */}
                      <Route path="/customers" element={<Customers />} />
                      <Route path="/orders" element={<Orders />} />
                      <Route path="/analytics" element={<Analytics />} />
                      <Route path="/barcodes" element={<Barcodes />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/settings" element={<Settings />} />
                      
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </main>
                </div>
              </div>
            </SidebarProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <div className="min-h-screen bg-background">
              <AppRoutes />
            </div>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;