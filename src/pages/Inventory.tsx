import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryTable } from "@/components/InventoryTable";
import { AddInventoryForm } from "@/components/AddInventoryForm";
import { BarcodeScannerInventory } from "@/components/BarcodeScannerInventory";
import { TestDataHelper } from "@/components/TestDataHelper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  image_url?: string | null;
}

  const getStockStatus = (quantity: number): "low" | "medium" | "high" => {
    if (quantity <= 0) return 'low';
    if (quantity < 20) return 'medium';
    return 'high';
  };

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
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

      setInventory(data.map(item => ({
        ...item,
        status: getStockStatus(item.quantity)
      })));
    };

    fetchInventory();
  }, [toast]);

  // Filter inventory based on search term
  const filteredInventory = searchTerm.trim() 
    ? inventory.filter(item => {
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.name && item.name.toLowerCase().includes(searchLower)) ||
          (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
          (item.category && item.category.toLowerCase().includes(searchLower)) ||
          (item.size && item.size.toLowerCase().includes(searchLower)) ||
          (item.color && item.color.toLowerCase().includes(searchLower)) ||
          item.quantity.toString().includes(searchLower) ||
          item.price.toString().includes(searchLower) ||
          (item.status && item.status.toLowerCase().includes(searchLower))
        );
      })
    : inventory;

  const handleRefresh = async () => {
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

    setInventory(data.map(item => ({
      ...item,
      status: getStockStatus(item.quantity)
    })));
  };

  // Calculate stats based on filtered data
  const totalItems = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const totalProducts = filteredInventory.length;
  const lowStockItems = filteredInventory.filter(item => item.quantity < 20 && item.quantity > 0).length;
  const outOfStockItems = filteredInventory.filter(item => item.quantity === 0).length;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your warehouse inventory and stock levels
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <BarcodeScannerInventory 
            onInventoryUpdate={() => {
              // Refresh inventory data
              window.location.reload();
            }} 
          />
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Add Product</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] md:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Product</DialogTitle>
              </DialogHeader>
              <AddInventoryForm 
                onAdd={() => {
                  setIsAddDialogOpen(false);
                  // Refresh inventory data
                  window.location.reload();
                }} 
                onCancel={() => setIsAddDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-3 md:gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">{totalItems}</div>
            <p className="text-xs text-muted-foreground">
              All categories
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold">{totalProducts}</div>
            <p className="text-xs text-muted-foreground">
              Unique items
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Low Stock</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold text-warning">{lowStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Need reorder
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs md:text-sm font-medium">Out of Stock</CardTitle>
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-xl md:text-2xl font-bold text-destructive">{outOfStockItems}</div>
            <p className="text-xs text-muted-foreground">
              Urgent restock
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
          <CardDescription>
            Search and filter your inventory items
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 md:p-6">
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search inventory..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Filter className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Filters</span>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
          
          <InventoryTable data={filteredInventory} onRefresh={handleRefresh} />
        </CardContent>
      </Card>
      
      {/* Test Data Helper - Only show in development */}
      <TestDataHelper />
    </div>
  );
};

export default Inventory;