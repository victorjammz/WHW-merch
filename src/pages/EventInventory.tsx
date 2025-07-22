import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeftRight, Package, AlertTriangle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { ProductVariantSelector } from "@/components/ProductVariantSelector";

interface Event {
  id: string;
  name: string;
  code: string;
  address: string | null;
  phone: string | null;
  manager_name: string | null;
  manager_email: string | null;
  status: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
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

interface EventInventoryItem {
  id: string;
  event_id: string;
  product_variant_id: string;
  quantity: number;
  allocated_at: string;
  event: Event;
  product_variant: ProductVariant;
}

interface TransferFormData {
  product_variant_id: string;
  to_event_id: string;
  quantity: number;
  notes: string;
}

const EventInventory = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventInventory, setEventInventory] = useState<EventInventoryItem[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isTransferDialogOpen, setIsTransferDialogOpen] = useState(false);
  const [transferFormData, setTransferFormData] = useState<TransferFormData>({
    product_variant_id: "",
    to_event_id: "",
    quantity: 1,
    notes: ""
  });

  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  useEffect(() => {
    fetchEvents();
    fetchProductVariants();
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventInventory();
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) throw error;
      setEvents(data || []);
      
      // Auto-select first event if none selected
      if (data && data.length > 0 && !selectedEventId) {
        setSelectedEventId(data[0].id);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching events",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchProductVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products(name, category)
        `)
        .order('sku');

      if (error) throw error;
      setProductVariants(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching product variants",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchEventInventory = async () => {
    if (!selectedEventId) return;

    try {
      const { data, error } = await supabase
        .from('event_inventory')
        .select(`
          *,
          event:events(*),
          product_variant:product_variants(
            *,
            product:products(name, category)
          )
        `)
        .eq('event_id', selectedEventId)
        .order('allocated_at', { ascending: false });

      if (error) throw error;
      setEventInventory(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching event inventory",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleTransfer = async () => {
    if (!transferFormData.product_variant_id || !transferFormData.to_event_id || transferFormData.quantity <= 0) {
      toast({
        title: "Missing required fields",
        description: "Please select a product, event, and enter a valid quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get current product variant to check available stock
      const productVariant = productVariants.find(pv => pv.id === transferFormData.product_variant_id);
      if (!productVariant) {
        toast({
          title: "Error",
          description: "Product variant not found",
          variant: "destructive",
        });
        return;
      }

      if (productVariant.quantity < transferFormData.quantity) {
        toast({
          title: "Insufficient stock",
          description: `Only ${productVariant.quantity} units available`,
          variant: "destructive",
        });
        return;
      }

      // Start transaction by updating main inventory
      const { error: updateError } = await supabase
        .from('product_variants')
        .update({ 
          quantity: productVariant.quantity - transferFormData.quantity 
        })
        .eq('id', transferFormData.product_variant_id);

      if (updateError) throw updateError;

      // Check if event already has this product variant
      const { data: existingInventory, error: checkError } = await supabase
        .from('event_inventory')
        .select('*')
        .eq('event_id', transferFormData.to_event_id)
        .eq('product_variant_id', transferFormData.product_variant_id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // Rollback main inventory update
        await supabase
          .from('product_variants')
          .update({ 
            quantity: productVariant.quantity 
          })
          .eq('id', transferFormData.product_variant_id);
        throw checkError;
      }

      if (existingInventory) {
        // Update existing event inventory
        const { error: inventoryError } = await supabase
          .from('event_inventory')
          .update({ 
            quantity: existingInventory.quantity + transferFormData.quantity 
          })
          .eq('id', existingInventory.id);

        if (inventoryError) {
          // Rollback main inventory update
          await supabase
            .from('product_variants')
            .update({ 
              quantity: productVariant.quantity 
            })
            .eq('id', transferFormData.product_variant_id);
          throw inventoryError;
        }
      } else {
        // Create new event inventory record
        const { error: insertError } = await supabase
          .from('event_inventory')
          .insert({
            event_id: transferFormData.to_event_id,
            product_variant_id: transferFormData.product_variant_id,
            quantity: transferFormData.quantity
          });

        if (insertError) {
          // Rollback main inventory update
          await supabase
            .from('product_variants')
            .update({ 
              quantity: productVariant.quantity 
            })
            .eq('id', transferFormData.product_variant_id);
          throw insertError;
        }
      }

      toast({
        title: "Success",
        description: "Stock transferred successfully",
      });

    } catch (error: any) {
      toast({
        title: "Error transferring stock",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setIsTransferDialogOpen(false);
    setTransferFormData({
      product_variant_id: "",
      to_event_id: "",
      quantity: 1,
      notes: ""
    });
    fetchProductVariants();
    fetchEventInventory();
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  const filteredInventory = eventInventory.filter(item => {
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
  const totalValue = filteredInventory.reduce((sum, item) => sum + (item.quantity * item.product_variant.price), 0);
  const lowStockItems = filteredInventory.filter(item => item.quantity < 10).length;

  return (
    <div className="space-y-4 md:space-y-6 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Inventory</h1>
          <p className="text-muted-foreground">
            Manage inventory allocation across your events
          </p>
        </div>
        
        <Dialog open={isTransferDialogOpen} onOpenChange={setIsTransferDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <ArrowLeftRight className="h-4 w-4 mr-2" />
              Transfer Stock
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md max-w-[95vw]">
            <DialogHeader>
              <DialogTitle>Transfer Stock to Event</DialogTitle>
              <DialogDescription>
                Move inventory from main stock to an event location.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Product Variant</Label>
                <ProductVariantSelector
                  value={transferFormData.product_variant_id}
                  onValueChange={(value) => setTransferFormData(prev => ({ ...prev, product_variant_id: value }))}
                  productVariants={productVariants}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="to_event">Destination Event</Label>
                <Select value={transferFormData.to_event_id} onValueChange={(value) => setTransferFormData(prev => ({ ...prev, to_event_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination event" />
                  </SelectTrigger>
                  <SelectContent>
                    {events.map((event) => (
                      <SelectItem key={event.id} value={event.id}>
                        {event.name} ({event.code})
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
                <Input
                  id="notes"
                  value={transferFormData.notes}
                  onChange={(e) => setTransferFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Transfer notes..."
                />
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsTransferDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleTransfer}>
                Transfer
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Event Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Select Event
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-full max-w-md">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{event.name}</span>
                    <Badge variant="outline">{event.code}</Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedEvent && (
        <>
          {/* Event Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalItems}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredInventory.length} unique products
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <Package className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(totalValue)}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">
                  {lowStockItems}
                </div>
                <p className="text-xs text-muted-foreground">
                  Items below 10 units
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Event Details</CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-sm font-medium">{selectedEvent.name}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedEvent.address || "No address"}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <div className="w-full max-w-sm">
            <Input
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Inventory Table */}
          <Card>
            <CardHeader>
              <CardTitle>Event Inventory</CardTitle>
              <CardDescription>
                Stock allocated to {selectedEvent.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredInventory.length === 0 ? (
                <Alert>
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    No inventory allocated to this event yet. Use the "Transfer Stock" button to allocate products.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>SKU</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Total Value</TableHead>
                      <TableHead>Allocated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="font-medium">{item.product_variant.product.name}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{item.product_variant.sku}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {item.product_variant.color && (
                              <div>Color: {item.product_variant.color}</div>
                            )}
                            {item.product_variant.size && (
                              <div>Size: {item.product_variant.size}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{item.product_variant.product.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span className={item.quantity < 10 ? "text-orange-600 font-medium" : ""}>
                              {item.quantity}
                            </span>
                            {item.quantity < 10 && (
                              <AlertTriangle className="h-4 w-4 text-orange-600" />
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{formatPrice(item.product_variant.price)}</TableCell>
                        <TableCell className="font-medium">
                          {formatPrice(item.quantity * item.product_variant.price)}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(item.allocated_at).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default EventInventory;