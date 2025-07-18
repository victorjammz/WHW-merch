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
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { PageLoader } from "@/components/PageLoader";

// Lazy load pages for better performance
import { lazy, Suspense } from "react";

const Index = lazy(() => import("./pages/Index"));
const Inventory = lazy(() => import("./pages/Inventory"));
const Customers = lazy(() => import("./pages/Customers"));
const Orders = lazy(() => import("./pages/Orders"));
const EventOrders = lazy(() => import("./pages/EventOrders"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Barcodes = lazy(() => import("./pages/Barcodes"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const UserManagement = lazy(() => import("./pages/UserManagement"));
const RoleManagement = lazy(() => import("./pages/RoleManagement"));
const Auth = lazy(() => import("./pages/Auth"));
const Unauthorized = lazy(() => import("./pages/Unauthorized"));
const PendingApproval = lazy(() => import("./pages/PendingApproval"));

// Optimized QueryClient for better performance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Reduce network requests with longer cache times
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      // Retry configuration
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.message?.includes('4')) return false;
        // Only retry up to 2 times for server errors
        return failureCount < 2;
      },
      // Performance optimizations
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
  },
});

const AppRoutes = () => {
  const { profile, isAdmin } = useAuth();

  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        <Route path="/pending-approval" element={<PendingApproval />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <CurrencyProvider>
              <SidebarProvider>
                <div className="flex h-screen w-full bg-gradient-subtle">
                  <CRMSidebar />
                  <div className="flex-1 flex flex-col min-w-0 h-full">
                    <Header />
                    <main className="flex-1 overflow-y-auto p-4 md:p-6 h-0">
                      <Suspense fallback={<PageLoader />}>
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
                        <Route path="/event-orders" element={<EventOrders />} />
                        <Route path="/analytics" element={<Analytics />} />
                        <Route path="/barcodes" element={<Barcodes />} />
                        <Route path="/reports" element={<Reports />} />
                        <Route path="/settings" element={<Settings />} />
                        
                        <Route path="*" element={<Navigate to="/" replace />} />
                        </Routes>
                      </Suspense>
                    </main>
                  </div>
                </div>
              </SidebarProvider>
            </CurrencyProvider>
          </ProtectedRoute>
        }
      />
      </Routes>
    </Suspense>
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
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;