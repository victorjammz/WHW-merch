import { useState, useEffect } from "react";
import { Plus, Search, Filter, Download, QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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

interface FilterState {
  categories: string[];
  status: string[];
  priceRange: { min: string; max: string };
  stockLevel: string;
}

const getStockStatus = (quantity: number): "low" | "medium" | "high" => {
  if (quantity < 15) return 'low';
  if (quantity <= 25) return 'medium';
  return 'high';
};

const Inventory = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isFilterDialogOpen, setIsFilterDialogOpen] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    status: [],
    priceRange: { min: "", max: "" },
    stockLevel: ""
  });
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

      // Extract unique categories
      const uniqueCategories = [...new Set(data.map(item => item.category))];
      setCategories(uniqueCategories);
    };

    fetchInventory();
  }, [toast]);

  // Apply all filters
  const filteredInventory = inventory.filter(item => {
    // Search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = (
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower)) ||
        (item.size && item.size.toLowerCase().includes(searchLower)) ||
        (item.color && item.color.toLowerCase().includes(searchLower)) ||
        item.quantity.toString().includes(searchLower) ||
        item.price.toString().includes(searchLower) ||
        (item.status && item.status.toLowerCase().includes(searchLower))
      );
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false;
    }

    // Status filter
    if (filters.status.length > 0 && !filters.status.includes(item.status)) {
      return false;
    }

    // Price range filter
    if (filters.priceRange.min && item.price < parseFloat(filters.priceRange.min)) {
      return false;
    }
    if (filters.priceRange.max && item.price > parseFloat(filters.priceRange.max)) {
      return false;
    }

    // Stock level filter
    if (filters.stockLevel) {
      switch (filters.stockLevel) {
        case "in-stock":
          if (item.quantity <= 0) return false;
          break;
        case "low-stock":
          if (item.quantity >= 20 || item.quantity <= 0) return false;
          break;
        case "out-of-stock":
          if (item.quantity > 0) return false;
          break;
      }
    }

    return true;
  });

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

    // Extract unique categories
    const uniqueCategories = [...new Set(data.map(item => item.category))];
    setCategories(uniqueCategories);
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      status: [],
      priceRange: { min: "", max: "" },
      stockLevel: ""
    });
  };

  const hasActiveFilters = () => {
    return filters.categories.length > 0 || 
           filters.status.length > 0 || 
           filters.priceRange.min || 
           filters.priceRange.max || 
           filters.stockLevel;
  };

  const exportToCSV = () => {
    // Create CSV content
    const headers = ['SKU', 'Name', 'Category', 'Size', 'Color', 'Quantity', 'Price', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredInventory.map(item => [
        item.sku,
        `"${item.name}"`, // Wrap in quotes in case of commas
        item.category,
        item.size || '',
        item.color || '',
        item.quantity,
        item.price,
        item.status
      ].join(','))
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    
    // Generate filename with current date
    const now = new Date();
    const timestamp = now.toISOString().split('T')[0]; // YYYY-MM-DD format
    link.setAttribute('download', `inventory-export-${timestamp}.csv`);
    
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredInventory.length} items to CSV file`,
    });
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
              <Dialog open={isFilterDialogOpen} onOpenChange={setIsFilterDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-none relative">
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {hasActiveFilters() && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
                    )}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md bg-background border border-border z-50">
                  <DialogHeader>
                    <DialogTitle className="flex items-center justify-between">
                      Filter Inventory
                      {hasActiveFilters() && (
                        <Button variant="ghost" size="sm" onClick={clearFilters}>
                          <X className="h-4 w-4 mr-1" />
                          Clear All
                        </Button>
                      )}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {/* Category Filter */}
                    <div className="space-y-2">
                      <Label>Categories</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {categories.map((category) => (
                          <div key={category} className="flex items-center space-x-2">
                            <Checkbox
                              id={`category-${category}`}
                              checked={filters.categories.includes(category)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    categories: [...prev.categories, category]
                                  }));
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    categories: prev.categories.filter(c => c !== category)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`category-${category}`} className="text-sm">
                              {category}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Status Filter */}
                    <div className="space-y-2">
                      <Label>Stock Status</Label>
                      <div className="space-y-2">
                        {[
                          { value: "high", label: "In Stock" },
                          { value: "medium", label: "Medium Stock" },
                          { value: "low", label: "Low Stock" }
                        ].map((status) => (
                          <div key={status.value} className="flex items-center space-x-2">
                            <Checkbox
                              id={`status-${status.value}`}
                              checked={filters.status.includes(status.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    status: [...prev.status, status.value]
                                  }));
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    status: prev.status.filter(s => s !== status.value)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`status-${status.value}`} className="text-sm">
                              {status.label}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Price Range Filter */}
                    <div className="space-y-2">
                      <Label>Price Range</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          type="number"
                          placeholder="Min"
                          value={filters.priceRange.min}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, min: e.target.value }
                          }))}
                        />
                        <Input
                          type="number"
                          placeholder="Max"
                          value={filters.priceRange.max}
                          onChange={(e) => setFilters(prev => ({
                            ...prev,
                            priceRange: { ...prev.priceRange, max: e.target.value }
                          }))}
                        />
                      </div>
                    </div>

                    {/* Stock Level Filter */}
                    <div className="space-y-2">
                      <Label>Stock Level</Label>
                      <Select 
                        value={filters.stockLevel} 
                        onValueChange={(value) => setFilters(prev => ({ ...prev, stockLevel: value }))}
                      >
                        <SelectTrigger className="bg-background border border-border">
                          <SelectValue placeholder="All stock levels" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border z-50">
                          <SelectItem value="">All stock levels</SelectItem>
                          <SelectItem value="in-stock">In Stock (&gt;0)</SelectItem>
                          <SelectItem value="low-stock">Low Stock (1-19)</SelectItem>
                          <SelectItem value="out-of-stock">Out of Stock (0)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 sm:flex-none"
                onClick={exportToCSV}
              >
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