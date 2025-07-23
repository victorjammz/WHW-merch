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
import { ProductVariantTable } from "@/components/ProductVariantTable";
import { AddInventoryForm } from "@/components/AddInventoryForm";
import { AddProductForm } from "@/components/AddProductForm";
import { BarcodeScannerInventory } from "@/components/BarcodeScannerInventory";
import { TestDataHelper } from "@/components/TestDataHelper";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { HelpTooltip } from "@/components/HelpTooltip";
import { HelpSection } from "@/components/HelpSection";
import { HelpButton } from "@/components/HelpButton";
import { HelpToggle } from "@/components/HelpToggle";

interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
  price: number;
  status: "low" | "medium" | "high";
  image_url?: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
  variants: ProductVariant[];
}

interface FilterState {
  categories: string[];
  status: string[];
  colors: string[];
  sizes: string[];
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
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    status: [],
    colors: [],
    sizes: [],
    priceRange: { min: "", max: "" },
    stockLevel: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchProducts = async () => {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          category,
          description,
          image_url,
          created_at,
          updated_at
        `)
        .order('name');
      
      if (productsError) {
        toast({
          title: "Error fetching products",
          description: productsError.message,
          variant: "destructive",
        });
        return;
      }

      // Fetch variants for each product
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select('*')
        .order('sku');

      if (variantsError) {
        toast({
          title: "Error fetching variants",
          description: variantsError.message,
          variant: "destructive",
        });
        return;
      }

      // Group variants by product
      const productsWithVariants = productsData.map(product => ({
        ...product,
        variants: variantsData
          .filter(variant => variant.product_id === product.id)
          .map(variant => ({
            ...variant,
            status: getStockStatus(variant.quantity)
          }))
      }));

      setProducts(productsWithVariants);

      // Extract unique categories from products
      const uniqueCategories = [...new Set(productsData.map(product => product.category))];
      setCategories(uniqueCategories);

      // Extract unique colors and sizes from variants
      const uniqueColors = [...new Set(variantsData.map(variant => variant.color).filter(Boolean))];
      const uniqueSizes = [...new Set(variantsData.map(variant => variant.size).filter(Boolean))];
      setColors(uniqueColors);
      setSizes(uniqueSizes);
    };

    fetchProducts();
  }, [toast]);

  // Apply all filters
  const filteredProducts = products.filter(product => {
    // Search filter - search across product name, category, and variant details
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      const productMatches = (
        product.name.toLowerCase().includes(searchLower) ||
        product.category.toLowerCase().includes(searchLower)
      );
      
      const variantMatches = product.variants.some(variant => (
        (variant.sku && variant.sku.toLowerCase().includes(searchLower)) ||
        (variant.color && variant.color.toLowerCase().includes(searchLower)) ||
        (variant.size && variant.size.toLowerCase().includes(searchLower)) ||
        variant.quantity.toString().includes(searchLower) ||
        variant.price.toString().includes(searchLower) ||
        (variant.status && variant.status.toLowerCase().includes(searchLower))
      ));

      if (!productMatches && !variantMatches) return false;
    }

    // Category filter
    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }

    // Status filter - check if any variant matches the status
    if (filters.status.length > 0) {
      const hasMatchingStatus = product.variants.some(variant => 
        filters.status.includes(variant.status)
      );
      if (!hasMatchingStatus) return false;
    }

    // Price range filter - check if any variant matches the price range
    if (filters.priceRange.min || filters.priceRange.max) {
      const hasMatchingPrice = product.variants.some(variant => {
        if (filters.priceRange.min && variant.price < parseFloat(filters.priceRange.min)) {
          return false;
        }
        if (filters.priceRange.max && variant.price > parseFloat(filters.priceRange.max)) {
          return false;
        }
        return true;
      });
      if (!hasMatchingPrice) return false;
    }

    // Color filter - check if any variant matches the selected colors
    if (filters.colors.length > 0) {
      const hasMatchingColor = product.variants.some(variant => 
        variant.color && filters.colors.includes(variant.color)
      );
      if (!hasMatchingColor) return false;
    }

    // Size filter - check if any variant matches the selected sizes
    if (filters.sizes.length > 0) {
      const hasMatchingSize = product.variants.some(variant => 
        variant.size && filters.sizes.includes(variant.size)
      );
      if (!hasMatchingSize) return false;
    }

    // Stock level filter - check if any variant matches the stock level
    if (filters.stockLevel) {
      const hasMatchingStock = product.variants.some(variant => {
        switch (filters.stockLevel) {
          case "in-stock":
            return variant.quantity > 0;
          case "low-stock":
            return variant.quantity > 0 && variant.quantity < 20;
          case "out-of-stock":
            return variant.quantity === 0;
          default:
            return true;
        }
      });
      if (!hasMatchingStock) return false;
    }

    return true;
  });

  const handleRefresh = async () => {
    const { data: productsData, error: productsError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        category,
        description,
        image_url,
        created_at,
        updated_at
      `)
      .order('name');
    
    if (productsError) {
      toast({
        title: "Error fetching products",
        description: productsError.message,
        variant: "destructive",
      });
      return;
    }

    // Fetch variants for each product
    const { data: variantsData, error: variantsError } = await supabase
      .from('product_variants')
      .select('*')
      .order('sku');

    if (variantsError) {
      toast({
        title: "Error fetching variants",
        description: variantsError.message,
        variant: "destructive",
      });
      return;
    }

    // Group variants by product
    const productsWithVariants = productsData.map(product => ({
      ...product,
      variants: variantsData
        .filter(variant => variant.product_id === product.id)
        .map(variant => ({
          ...variant,
          status: getStockStatus(variant.quantity)
        }))
    }));

    setProducts(productsWithVariants);

    // Extract unique categories
    const uniqueCategories = [...new Set(productsData.map(product => product.category))];
    setCategories(uniqueCategories);

    // Extract unique colors and sizes from variants
    const uniqueColors = [...new Set(variantsData.map(variant => variant.color).filter(Boolean))];
    const uniqueSizes = [...new Set(variantsData.map(variant => variant.size).filter(Boolean))];
    setColors(uniqueColors);
    setSizes(uniqueSizes);
  };

  const clearFilters = () => {
    setFilters({
      categories: [],
      status: [],
      colors: [],
      sizes: [],
      priceRange: { min: "", max: "" },
      stockLevel: ""
    });
  };

  const hasActiveFilters = () => {
    return filters.categories.length > 0 || 
           filters.status.length > 0 || 
           filters.colors.length > 0 || 
           filters.sizes.length > 0 || 
           filters.priceRange.min || 
           filters.priceRange.max || 
           filters.stockLevel;
  };

  const exportToCSV = () => {
    // Create CSV content from all variants
    const allVariants = filteredProducts.flatMap(product => 
      product.variants.map(variant => ({
        productName: product.name,
        category: product.category,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        quantity: variant.quantity,
        price: variant.price,
        status: variant.status
      }))
    );

    const headers = ['Product Name', 'Category', 'SKU', 'Color', 'Size', 'Quantity', 'Price', 'Status'];
    const csvContent = [
      headers.join(','),
      ...allVariants.map(variant => [
        `"${variant.productName}"`,
        variant.category,
        variant.sku,
        variant.color || '',
        variant.size || '',
        variant.quantity,
        variant.price,
        variant.status
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
      description: `Exported ${allVariants.length} variants to CSV file`,
    });
  };

  // Calculate stats based on filtered data
  const allVariants = filteredProducts.flatMap(product => product.variants);
  const totalItems = allVariants.reduce((sum, variant) => sum + variant.quantity, 0);
  const totalProducts = filteredProducts.length;
  const lowStockItems = allVariants.filter(variant => variant.quantity < 20 && variant.quantity > 0).length;
  const outOfStockItems = allVariants.filter(variant => variant.quantity === 0).length;

  return (
    <div className="space-y-4 md:space-y-6">
      <HelpButton />
      <HelpToggle />
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="min-w-0 flex-1">
          <HelpTooltip content="This page allows you to manage all your product inventory, track stock levels, and organize items by categories.">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Inventory Management</h1>
          </HelpTooltip>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your warehouse inventory and stock levels
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <HelpTooltip content="Scan barcodes to quickly add or update inventory items" showIcon={false}>
            <BarcodeScannerInventory 
              onInventoryUpdate={() => {
                // Refresh inventory data
                handleRefresh();
              }} 
            />
          </HelpTooltip>
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
              <AddProductForm
                onAdd={() => {
                  setIsAddDialogOpen(false);
                  handleRefresh();
                }} 
                onCancel={() => setIsAddDialogOpen(false)} 
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <HelpSection helpText="These cards show real-time statistics about your inventory, including total items, number of products, and stock alerts.">
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
      </HelpSection>

      {/* Filters and Search */}
      <HelpSection helpText="Use the search bar to quickly find items by name, SKU, or category. Apply filters to narrow down results by category, stock status, price range, or stock levels.">
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

                    {/* Color Filter */}
                    <div className="space-y-2">
                      <Label>Colors</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {colors.map((color) => (
                          <div key={color} className="flex items-center space-x-2">
                            <Checkbox
                              id={`color-${color}`}
                              checked={filters.colors.includes(color)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    colors: [...prev.colors, color]
                                  }));
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    colors: prev.colors.filter(c => c !== color)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`color-${color}`} className="text-sm">
                              {color}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Size Filter */}
                    <div className="space-y-2">
                      <Label>Sizes</Label>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {sizes.map((size) => (
                          <div key={size} className="flex items-center space-x-2">
                            <Checkbox
                              id={`size-${size}`}
                              checked={filters.sizes.includes(size)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setFilters(prev => ({
                                    ...prev,
                                    sizes: [...prev.sizes, size]
                                  }));
                                } else {
                                  setFilters(prev => ({
                                    ...prev,
                                    sizes: prev.sizes.filter(s => s !== size)
                                  }));
                                }
                              }}
                            />
                            <Label htmlFor={`size-${size}`} className="text-sm">
                              {size}
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
          
          <ProductVariantTable data={filteredProducts} onRefresh={handleRefresh} />
        </CardContent>
        </Card>
      </HelpSection>
      
      {/* Test Data Helper - Only show in development */}
      <TestDataHelper />
    </div>
  );
};

export default Inventory;