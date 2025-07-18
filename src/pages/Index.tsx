import { useState, useEffect } from "react";
import { Plus, Package, ShoppingCart, TrendingUp, AlertTriangle, QrCode, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryTable } from "@/components/InventoryTable";
import { AddInventoryForm } from "@/components/AddInventoryForm";
import { POSConnectionCard } from "@/components/POSConnectionCard";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  size: string | null;
  color: string | null;
  quantity: number;
  price: number;
  status: "low" | "medium" | "high";
}

const getStockStatus = (quantity: number): "low" | "medium" | "high" => {
  if (quantity <= 0) return 'low';
  if (quantity < 20) return 'medium';
  return 'high';
};

const Index = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [inventoryData, setInventoryData] = useState<InventoryItem[]>([]);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchInventory = async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('*');
      
      if (error) {
        toast({
          title: "Error fetching inventory",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      setInventoryData(data.map(item => ({
        ...item,
        status: getStockStatus(item.quantity)
      })));
    };

    const fetchPendingOrders = async () => {
      const { count, error } = await supabase
        .from('event_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (error) {
        console.error('Error fetching pending orders:', error);
        return;
      }

      setPendingOrdersCount(count || 0);
    };

    fetchInventory();
    fetchPendingOrders();
  }, [toast]);

  const stats = {
    totalItems: inventoryData.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventoryData.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    lowStockItems: inventoryData.filter(item => item.status === "low").length,
    totalProducts: inventoryData.length
  };

  const handleAddInventory = () => {
    setShowAddForm(false);
    // Refresh inventory data
    window.location.reload();
  };

  return (
    <div className="space-y-4 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground">Welcome to Warehouse Worship CRM - Manage your inventory and customers</p>
        </div>
        <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
          <Button 
            onClick={() => setShowAddForm(true)} 
            size="default"
            className="flex-1 sm:flex-none bg-gradient-primary hover:opacity-90 shadow-elegant"
          >
            <Plus className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Add Item</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
          <Card className="shadow-card border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Inventory</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Items in stock</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">${stats.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">+12% from last month</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
              <ShoppingCart className="h-5 w-5 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground mt-1">Unique SKUs</p>
            </CardContent>
          </Card>

          <Card className="shadow-card border-l-4 border-l-warning">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Low Stock Alerts</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground mt-1">Need immediate attention</p>
            </CardContent>
          </Card>

          <Card 
            className="shadow-card border-l-4 border-l-info cursor-pointer hover:shadow-lg transition-shadow" 
            onClick={() => navigate('/event-orders')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Orders</CardTitle>
              <Calendar className="h-5 w-5 text-info" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{pendingOrdersCount}</div>
              <p className="text-xs text-muted-foreground mt-1">Click to view orders</p>
            </CardContent>
          </Card>
        </div>

        {/* CRM Features Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-6">
          <div className="xl:col-span-2 order-2 xl:order-1">
            <Card className="shadow-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Package className="h-5 w-5" />
                  Inventory Management
                </CardTitle>
                <CardDescription className="text-sm">
                  Manage your clothing inventory, track stock levels, and monitor product performance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <InventoryTable data={inventoryData} />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4 md:space-y-6 order-1 xl:order-2">
            <BarcodeGenerator 
              onGenerate={(code, type) => {
                console.log('Generated barcode:', code, type);
              }}
            />
            <POSConnectionCard />
          </div>
        </div>

        {/* Add Inventory Modal */}
        {showAddForm && (
          <AddInventoryForm 
            onAdd={handleAddInventory}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
  );
};

export default Index;