import { useState, useEffect } from "react";
import { ArrowLeftRight, Building2, Package, Search, ArrowUpDown, Plus, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Location {
  id: string;
  name: string;
  code: string;
  status: string;
}

interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  quantity: number;
  product: {
    name: string;
    category: string;
  };
}

interface LocationInventoryItem {
  id: string;
  location_id: string;
  product_variant_id: string;
  quantity: number;
  allocated_at: string;
  location: Location;
  product_variant: ProductVariant;
}

interface TransferFormData {
  product_variant_id: string;
  to_location_id: string;
  quantity: number;
  notes: string;
}

const LocationInventory = () => {
  const [locations, setLocations] = useState<Location[]>([]);
  const [locationInventory, setLocationInventory] = useState<LocationInventoryItem[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferFormData, setTransferFormData] = useState<TransferFormData>({
    product_variant_id: "",
    to_location_id: "",
    quantity: 1,
    notes: ""
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchLocations();
    fetchProductVariants();
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      fetchLocationInventory();
    }
  }, [selectedLocationId]);

  const fetchLocations = async () => {
    const { data, error } = await supabase
      .from('locations')
      .select('*')
      .eq('status', 'active')
      .order('name');

    if (error) {
      toast({
        title: "Error fetching locations",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLocations(data || []);
    if (data && data.length > 0 && !selectedLocationId) {
      setSelectedLocationId(data[0].id);
    }
  };

  const fetchProductVariants = async () => {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products(name, category)
      `)
      .gt('quantity', 0)
      .order('sku');

    if (error) {
      toast({
        title: "Error fetching product variants",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setProductVariants(data || []);
  };

  const fetchLocationInventory = async () => {
    if (!selectedLocationId) return;

    const { data, error } = await supabase
      .from('location_inventory')
      .select(`
        *,
        location:locations(*),
        product_variant:product_variants(
          *,
          product:products(name, category)
        )
      `)
      .eq('location_id', selectedLocationId)
      .order('allocated_at', { ascending: false });

    if (error) {
      toast({
        title: "Error fetching location inventory",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLocationInventory(data || []);
  };

  const handleTransfer = async () => {
    if (!transferFormData.product_variant_id || !transferFormData.to_location_id || transferFormData.quantity <= 0) {
      toast({
        title: "Missing required fields",
        description: "Please select a product, location, and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    // Check if source has enough stock
    const sourceVariant = productVariants.find(v => v.id === transferFormData.product_variant_id);
    if (!sourceVariant || sourceVariant.quantity < transferFormData.quantity) {
      toast({
        title: "Insufficient stock",
        description: "Not enough stock available in main inventory",
        variant: "destructive",
      });
      return;
    }

    // Start transaction
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData?.session?.user?.id;

    // 1. Update main inventory (reduce quantity)
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({ quantity: sourceVariant.quantity - transferFormData.quantity })
      .eq('id', transferFormData.product_variant_id);

    if (updateError) {
      toast({
        title: "Error updating main inventory",
        description: updateError.message,
        variant: "destructive",
      });
      return;
    }

    // 2. Check if location inventory already exists for this product
    const { data: existingInventory } = await supabase
      .from('location_inventory')
      .select('*')
      .eq('location_id', transferFormData.to_location_id)
      .eq('product_variant_id', transferFormData.product_variant_id)
      .single();

    if (existingInventory) {
      // Update existing location inventory
      const { error: locationUpdateError } = await supabase
        .from('location_inventory')
        .update({ quantity: existingInventory.quantity + transferFormData.quantity })
        .eq('id', existingInventory.id);

      if (locationUpdateError) {
        // Rollback main inventory
        await supabase
          .from('product_variants')
          .update({ quantity: sourceVariant.quantity })
          .eq('id', transferFormData.product_variant_id);

        toast({
          title: "Error updating location inventory",
          description: locationUpdateError.message,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Create new location inventory entry
      const { error: locationInsertError } = await supabase
        .from('location_inventory')
        .insert([{
          location_id: transferFormData.to_location_id,
          product_variant_id: transferFormData.product_variant_id,
          quantity: transferFormData.quantity
        }]);

      if (locationInsertError) {
        // Rollback main inventory
        await supabase
          .from('product_variants')
          .update({ quantity: sourceVariant.quantity })
          .eq('id', transferFormData.product_variant_id);

        toast({
          title: "Error creating location inventory",
          description: locationInsertError.message,
          variant: "destructive",
        });
        return;
      }
    }

    // 3. Record the transfer
    const { error: transferError } = await supabase
      .from('stock_transfers')
      .insert([{
        transfer_type: 'allocation',
        to_location_id: transferFormData.to_location_id,
        product_variant_id: transferFormData.product_variant_id,
        quantity: transferFormData.quantity,
        notes: transferFormData.notes || null,
        transferred_by: userId,
        status: 'completed'
      }]);

    if (transferError) {
      toast({
        title: "Warning: Transfer completed but not logged",
        description: "The stock was transferred but the transfer record failed to save",
        variant: "destructive",
      });
    }

    toast({
      title: "Stock transferred successfully",
      description: `${transferFormData.quantity} units transferred to location`,
    });

    setIsTransferDialogOpen(false);
    setTransferFormData({
      product_variant_id: "",
      to_location_id: "",
      quantity: 1,
      notes: ""
    });
    fetchProductVariants();
    fetchLocationInventory();
  };

  const selectedLocation = locations.find(l => l.id === selectedLocationId);

  const filteredInventory = locationInventory.filter(item => {
    const searchLower = searchTerm.toLowerCase();
    return (
      item.product_variant.product.name.toLowerCase().includes(searchLower) ||
      item.product_variant.sku?.toLowerCase().includes(searchLower) ||
      item.product_variant.color?.toLowerCase().includes(searchLower) ||
      item.product_variant.size?.toLowerCase().includes(searchLower) ||
      item.product_variant.product.category.toLowerCase().includes(searchLower)
    );
  });

  const totalItems = filteredInventory.reduce((sum, item) => sum + item.quantity, 0);
  const uniqueProducts = new Set(filteredInventory.map(item => item.product_variant.product.name)).size;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Location Inventory</h1>
          <p className="text-muted-foreground">
            Manage inventory allocated to specific locations
          </p>
        </div>
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ArrowUpDown className="mr-2 h-4 w-4" />
              Transfer Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Transfer Stock to Location</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product Variant</Label>
                <Select value={transferFormData.product_variant_id} onValueChange={(value) => setTransferFormData(prev => ({ ...prev, product_variant_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select product variant" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 z-50">
                    {productVariants.map((variant) => (
                      <SelectItem key={variant.id} value={variant.id}>
                        <div className="flex items-center justify-between w-full">
                          <span>{variant.product.name} - {variant.sku}</span>
                          <Badge variant="outline" className="ml-2">
                            {variant.quantity} available
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">To Location</Label>
                <Select value={transferFormData.to_location_id} onValueChange={(value) => setTransferFormData(prev => ({ ...prev, to_location_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination location" />
                  </SelectTrigger>
                  <SelectContent className="z-50">
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.id}>
                        {location.name} ({location.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={transferFormData.quantity}
                  onChange={(e) => setTransferFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  value={transferFormData.notes}
                  onChange={(e) => setTransferFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add transfer notes..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTransfer}>
                Transfer Stock
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Location Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Select Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a location to view inventory" />
            </SelectTrigger>
            <SelectContent className="z-50">
              {locations.map((location) => (
                <SelectItem key={location.id} value={location.id}>
                  {location.name} ({location.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedLocationId && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  At {selectedLocation?.name}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Unique Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueProducts}</div>
                <p className="text-xs text-muted-foreground">
                  Different products
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Product Variants</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{filteredInventory.length}</div>
                <p className="text-xs text-muted-foreground">
                  SKUs available
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg. Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${filteredInventory.length > 0 
                    ? (filteredInventory.reduce((sum, item) => sum + (item.product_variant.price * item.quantity), 0) / filteredInventory.length).toFixed(0)
                    : 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Per SKU
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory at {selectedLocation?.name}
              </CardTitle>
              <CardDescription>
                Stock allocated to this location
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search inventory..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Variant Details</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Allocated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          No inventory items found at this location
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredInventory.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.product_variant.product.name}</div>
                              <div className="text-sm text-muted-foreground">{item.product_variant.product.category}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{item.product_variant.sku}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {item.product_variant.size && (
                                <Badge variant="secondary" className="text-xs">
                                  Size: {item.product_variant.size}
                                </Badge>
                              )}
                              {item.product_variant.color && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.product_variant.color}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="font-medium">{item.quantity}</span>
                          </TableCell>
                          <TableCell>${item.product_variant.price.toFixed(2)}</TableCell>
                          <TableCell>
                            <span className="font-medium">
                              ${(item.product_variant.price * item.quantity).toFixed(2)}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {new Date(item.allocated_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default LocationInventory;