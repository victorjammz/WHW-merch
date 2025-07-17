import { useState, useEffect } from "react";
import { Plus, Package, ShoppingCart, TrendingUp, AlertTriangle, QrCode } from "lucide-react";
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
  const { toast } = useToast();

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

    fetchInventory();
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
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Welcome to Warehouse Worship CRM - Manage your inventory and customers</p>
        </div>
        <div className="flex gap-3">
          <Button 
            onClick={() => setShowAddForm(true)} 
            size="lg"
            className="bg-gradient-primary hover:opacity-90 shadow-elegant"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Item
          </Button>
        </div>
      </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </div>

        {/* CRM Features Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Inventory Management
                </CardTitle>
                <CardDescription>
                  Manage your clothing inventory, track stock levels, and monitor product performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryTable data={inventoryData} />
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-6">
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