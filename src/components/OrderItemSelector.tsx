import { useState, useEffect } from "react";
import { Plus, Trash2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface OrderItem {
  id: string;
  inventory_type: "main" | "event";
  event_id?: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
  name?: string;
  size?: string;
  color?: string;
  sku?: string;
  available_quantity?: number;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
  product: {
    name: string;
    category: string;
  };
}

interface EventInventory {
  id: string;
  event_id: string;
  product_variant_id: string;
  quantity: number;
  event: {
    name: string;
    code: string;
  };
  product_variant: ProductVariant;
}

interface Event {
  id: string;
  name: string;
  code: string;
}

interface OrderItemSelectorProps {
  orderItems: OrderItem[];
  onOrderItemsChange: (items: OrderItem[]) => void;
}

export function OrderItemSelector({ orderItems, onOrderItemsChange }: OrderItemSelectorProps) {
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [eventInventory, setEventInventory] = useState<EventInventory[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        fetchProductVariants(),
        fetchEventInventory(),
        fetchEvents()
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load inventory data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProductVariants = async () => {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        product:products(name, category)
      `)
      .order('sku');

    if (error) throw error;
    setProductVariants(data || []);
  };

  const fetchEventInventory = async () => {
    const { data, error } = await supabase
      .from('event_inventory')
      .select(`
        *,
        event:events(name, code),
        product_variant:product_variants(
          *,
          product:products(name, category)
        )
      `)
      .order('allocated_at');

    if (error) throw error;
    setEventInventory(data || []);
  };

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('id, name, code')
      .eq('status', 'active')
      .order('name');

    if (error) throw error;
    setEvents(data || []);
  };

  const addOrderItem = () => {
    const newItem: OrderItem = {
      id: `item-${Date.now()}`,
      inventory_type: "main",
      product_id: "",
      variant_id: "",
      quantity: 1,
      price: 0
    };
    onOrderItemsChange([...orderItems, newItem]);
  };

  const updateOrderItem = (index: number, updates: Partial<OrderItem>) => {
    const updatedItems = [...orderItems];
    updatedItems[index] = { ...updatedItems[index], ...updates };
    onOrderItemsChange(updatedItems);
  };

  const removeOrderItem = (index: number) => {
    const updatedItems = orderItems.filter((_, i) => i !== index);
    onOrderItemsChange(updatedItems);
  };

  const getAvailableInventory = (item: OrderItem) => {
    if (item.inventory_type === "main") {
      return productVariants.filter(v => v.quantity > 0);
    } else if (item.inventory_type === "event" && item.event_id) {
      return eventInventory
        .filter(ei => ei.event_id === item.event_id && ei.quantity > 0)
        .map(ei => ({
          ...ei.product_variant,
          available_quantity: ei.quantity
        }));
    }
    return [];
  };

  const handleVariantSelect = (index: number, variantId: string) => {
    const item = orderItems[index];
    let selectedVariant;
    
    if (item.inventory_type === "main") {
      selectedVariant = productVariants.find(v => v.id === variantId);
    } else {
      const eventItem = eventInventory.find(ei => 
        ei.product_variant_id === variantId && ei.event_id === item.event_id
      );
      selectedVariant = eventItem?.product_variant;
    }

    if (selectedVariant) {
      updateOrderItem(index, {
        variant_id: variantId,
        product_id: selectedVariant.product_id,
        price: selectedVariant.price,
        name: selectedVariant.product.name,
        size: selectedVariant.size || undefined,
        color: selectedVariant.color || undefined,
        sku: selectedVariant.sku,
        available_quantity: item.inventory_type === "main" 
          ? selectedVariant.quantity 
          : eventInventory.find(ei => ei.product_variant_id === variantId && ei.event_id === item.event_id)?.quantity
      });
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Label className="text-lg font-medium">Order Items</Label>
        <Button type="button" onClick={addOrderItem} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center text-muted-foreground">Loading inventory...</div>
      ) : (
        <div className="space-y-4">
          {orderItems.map((item, index) => (
            <OrderItemRow
              key={item.id}
              item={item}
              index={index}
              events={events}
              availableInventory={getAvailableInventory(item)}
              onUpdate={(updates) => updateOrderItem(index, updates)}
              onRemove={() => removeOrderItem(index)}
              onVariantSelect={(variantId) => handleVariantSelect(index, variantId)}
            />
          ))}

          {orderItems.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-muted-foreground">
                No items added. Click "Add Item" to start building your order.
              </CardContent>
            </Card>
          )}

          {orderItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span>Total:</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

interface OrderItemRowProps {
  item: OrderItem;
  index: number;
  events: Event[];
  availableInventory: any[];
  onUpdate: (updates: Partial<OrderItem>) => void;
  onRemove: () => void;
  onVariantSelect: (variantId: string) => void;
}

function OrderItemRow({
  item,
  index,
  events,
  availableInventory,
  onUpdate,
  onRemove,
  onVariantSelect
}: OrderItemRowProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);

  const selectedVariant = availableInventory.find(v => v.id === item.variant_id);

  const filteredInventory = availableInventory.filter(variant => {
    const searchLower = searchTerm.toLowerCase();
    return (
      variant.product?.name?.toLowerCase().includes(searchLower) ||
      variant.sku?.toLowerCase().includes(searchLower) ||
      variant.color?.toLowerCase().includes(searchLower) ||
      variant.size?.toLowerCase().includes(searchLower)
    );
  });

  const maxQuantity = item.inventory_type === "main" 
    ? selectedVariant?.quantity || 0
    : selectedVariant?.available_quantity || 0;

  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline">Item #{index + 1}</Badge>
          <Button 
            type="button" 
            variant="ghost" 
            size="sm" 
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Inventory Type */}
          <div className="space-y-2">
            <Label>Inventory Source</Label>
            <Select 
              value={item.inventory_type} 
              onValueChange={(value: "main" | "event") => {
                onUpdate({ 
                  inventory_type: value, 
                  variant_id: "", 
                  product_id: "", 
                  event_id: value === "event" ? "" : undefined,
                  price: 0 
                });
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="main">Main Inventory</SelectItem>
                <SelectItem value="event">Event Inventory</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Selection (only for event inventory) */}
          {item.inventory_type === "event" && (
            <div className="space-y-2">
              <Label>Event</Label>
              <Select 
                value={item.event_id || ""} 
                onValueChange={(value) => onUpdate({ event_id: value, variant_id: "", product_id: "", price: 0 })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map(event => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({event.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Product Variant Selection */}
          <div className="space-y-2 lg:col-span-2">
            <Label>Product</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  className="w-full justify-between text-left font-normal"
                  disabled={item.inventory_type === "event" && !item.event_id}
                >
                  {selectedVariant ? (
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col">
                        <div className="font-medium">{selectedVariant.product?.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <span>SKU: {selectedVariant.sku}</span>
                          {selectedVariant.color && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedVariant.color}
                            </Badge>
                          )}
                          {selectedVariant.size && (
                            <Badge variant="secondary" className="text-xs">
                              {selectedVariant.size}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {maxQuantity} available
                      </Badge>
                    </div>
                  ) : (
                    "Select product variant"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[500px] p-0" align="start">
                <div className="p-4 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search products, SKU, color, size..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <ScrollArea className="h-60 pointer-events-auto">
                  <div className="p-2 pointer-events-auto">
                    {filteredInventory.length === 0 ? (
                      <div className="p-4 text-center text-muted-foreground">
                        No products found
                      </div>
                    ) : (
                      filteredInventory.map((variant) => (
                        <div
                          key={variant.id}
                          className={cn(
                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                            item.variant_id === variant.id && "bg-accent text-accent-foreground"
                          )}
                          onClick={() => {
                            onVariantSelect(variant.id);
                            setOpen(false);
                            setSearchTerm("");
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex flex-col gap-1">
                              <div className="font-medium">{variant.product?.name}</div>
                              <div className="text-xs text-muted-foreground">
                                SKU: {variant.sku} • ${variant.price}
                              </div>
                              <div className="flex items-center gap-1">
                                {variant.color && (
                                  <Badge variant="secondary" className="text-xs">
                                    {variant.color}
                                  </Badge>
                                )}
                                {variant.size && (
                                  <Badge variant="secondary" className="text-xs">
                                    {variant.size}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge 
                              variant={
                                (variant.quantity || variant.available_quantity || 0) > 10 ? "default" : 
                                (variant.quantity || variant.available_quantity || 0) > 0 ? "secondary" : "destructive"
                              } 
                              className="text-xs"
                            >
                              {variant.quantity || variant.available_quantity || 0} available
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Quantity and Price */}
        {item.variant_id && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="1"
                max={maxQuantity}
                value={item.quantity}
                onChange={(e) => onUpdate({ quantity: Math.min(parseInt(e.target.value) || 1, maxQuantity) })}
              />
              <div className="text-xs text-muted-foreground">
                Max: {maxQuantity} available
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Unit Price</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.price}
                onChange={(e) => onUpdate({ price: parseFloat(e.target.value) || 0 })}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Total</Label>
              <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}