import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { PostcodeAutocomplete } from "@/components/AddressAutocomplete";
import { Check, ChevronsUpDown, Plus, Minus, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EditOrderFormProps {
  order: any;
  onSuccess: () => void;
  onCancel: () => void;
}

interface OrderItem {
  id: string;
  category: string;
  product_id: string;
  product_name: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  available_stock: number;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
}

interface Category {
  id: string;
  name: string;
}

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  color: string;
  size: string;
  quantity: number;
  price: number;
  status: string;
}

export function EditOrderForm({ order, onSuccess, onCancel }: EditOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [fullName, setFullName] = useState(order?.client_name || "");
  const [email, setEmail] = useState(order?.client_email || "");
  const [phone, setPhone] = useState(order?.client_phone || "");
  const [postcode, setPostcode] = useState(order?.client_postcode || "");
  const [address, setAddress] = useState(order?.client_address || "");
  const [status, setStatus] = useState(order?.status || "pending");
  const [notes, setNotes] = useState(order?.notes || "");
  const [items, setItems] = useState<OrderItem[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [eventSearchOpen, setEventSearchOpen] = useState(false);
  
  const { toast } = useToast();

  // Initialize form data
  useEffect(() => {
    if (order) {
      // Parse items from order
      let orderItems = [];
      try {
        const parsedItems = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
        orderItems = Array.isArray(parsedItems) ? parsedItems.map((item: any, index: number) => ({
          id: `${index + 1}`,
          category: item.category || "",
          product_id: item.product_id || "",
          product_name: item.product_name || item.name || "",
          color: item.color || "",
          size: item.size || "",
          quantity: item.quantity || 1,
          price: item.price || 0,
          available_stock: 0
        })) : [];
      } catch (error) {
        console.error('Error parsing order items:', error);
        orderItems = [];
      }

      if (orderItems.length === 0) {
        orderItems = [{
          id: "1",
          category: "",
          product_id: "",
          product_name: "",
          color: "",
          size: "",
          quantity: 1,
          price: 0,
          available_stock: 0
        }];
      }

      setItems(orderItems);
    }

    fetchEvents();
    fetchCategories();
    fetchInventory();
  }, [order]);

  // Set selected event when events are loaded
  useEffect(() => {
    if (events.length > 0 && order?.event_name) {
      const event = events.find(e => e.name === order.event_name);
      if (event) {
        setSelectedEvent(event);
      }
    }
  }, [events, order]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, event_date, location')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, category, color, size, quantity, price, status')
        .order('name', { ascending: true });

      if (error) throw error;
      setInventory(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
    }
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      category: "",
      product_id: "",
      product_name: "",
      color: "",
      size: "",
      quantity: 1,
      price: 0,
      available_stock: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If category changes, reset product selection
        if (field === 'category') {
          updatedItem.product_id = "";
          updatedItem.product_name = "";
          updatedItem.color = "";
          updatedItem.size = "";
          updatedItem.price = 0;
          updatedItem.available_stock = 0;
        }
        
        // If product changes, update price and stock info
        if (field === 'product_id') {
          const selectedProduct = inventory.find(inv => 
            inv.id === value && 
            inv.color === item.color && 
            inv.size === item.size
          );
          if (selectedProduct) {
            updatedItem.product_name = selectedProduct.name;
            updatedItem.price = selectedProduct.price;
            updatedItem.available_stock = selectedProduct.quantity;
          }
        }
        
        // If color or size changes, update stock and price
        if (field === 'color' || field === 'size') {
          const selectedProduct = inventory.find(inv => 
            inv.id === item.product_id && 
            inv.color === (field === 'color' ? value : item.color) && 
            inv.size === (field === 'size' ? value : item.size)
          );
          if (selectedProduct) {
            updatedItem.price = selectedProduct.price;
            updatedItem.available_stock = selectedProduct.quantity;
          }
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const getProductsByCategory = (category: string) => {
    return inventory
      .filter(item => item.category === category)
      .reduce((unique, item) => {
        if (!unique.find(u => u.id === item.id && u.name === item.name)) {
          unique.push({ id: item.id, name: item.name });
        }
        return unique;
      }, [] as { id: string; name: string }[]);
  };

  const getColorsByProduct = (productId: string) => {
    return [...new Set(inventory
      .filter(item => item.id === productId)
      .map(item => item.color)
      .filter(color => color && color.trim() !== "")
    )];
  };

  const getSizesByProductAndColor = (productId: string, color: string) => {
    return [...new Set(inventory
      .filter(item => item.id === productId && item.color === color)
      .map(item => item.size)
      .filter(size => size && size.trim() !== "")
    )];
  };

  const isLowStock = (stock: number) => stock < 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent || !fullName || !email || !phone || !(postcode && address)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validItems = items.filter(item => 
        item.category && item.product_id && item.quantity > 0
      );
      
      const orderData = {
        event_name: selectedEvent.name,
        client_name: fullName,
        client_email: email,
        client_phone: phone,
        client_postcode: postcode,
        client_address: address,
        event_date: selectedEvent.event_date,
        status,
        notes: notes || null,
        items: JSON.stringify(validItems),
        total_amount: calculateTotal()
      };

      const { error } = await supabase
        .from('event_orders')
        .update(orderData)
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order updated successfully"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Select Event *</Label>
          <Popover open={eventSearchOpen} onOpenChange={setEventSearchOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={eventSearchOpen}
                className="w-full justify-between"
              >
                {selectedEvent ? selectedEvent.name : "Select event..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0">
              <Command>
                <CommandInput placeholder="Search events..." />
                <CommandList>
                  <CommandEmpty>No events found.</CommandEmpty>
                  <CommandGroup>
                    {events.map((event) => (
                      <CommandItem
                        key={event.id}
                        value={`${event.name} ${event.location}`}
                        onSelect={() => {
                          setSelectedEvent(event);
                          setEventSearchOpen(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedEvent?.id === event.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        <div className="flex flex-col">
                          <span className="font-medium">{event.name}</span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.event_date), "PPP")} • {event.location}
                          </span>
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="full-name">Full Name *</Label>
          <Input
            id="full-name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="e.g., John Smith"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g., john@example.com"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g., +44 1234 567890"
            required
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">Address Information</Label>
        <PostcodeAutocomplete
          onAddressComplete={(addressData) => {
            setAddress(addressData.address);
            setPostcode(addressData.postcode);
          }}
          className="space-y-4"
        />
        
        {/* Show individual fields if they have values */}
        {(address || postcode) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="address-display">Address</Label>
              <Input
                id="address-display"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Address will be filled automatically"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postcode-display">Postcode</Label>
              <Input
                id="postcode-display"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Postcode will be filled automatically"
              />
            </div>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Order Items</Label>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
        
        {items.map((item, index) => (
          <div key={item.id} className="border rounded-lg p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Category Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Category *</Label>
                <Select 
                  value={item.category} 
                  onValueChange={(value) => updateItem(item.id, "category", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Product *</Label>
                <Select 
                  value={item.product_id} 
                  onValueChange={(value) => updateItem(item.id, "product_id", value)}
                  disabled={!item.category}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {getProductsByCategory(item.category).map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Color Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Color *</Label>
                <Select 
                  value={item.color} 
                  onValueChange={(value) => updateItem(item.id, "color", value)}
                  disabled={!item.product_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {getColorsByProduct(item.product_id).map((color) => (
                      <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Size Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Size *</Label>
                <Select 
                  value={item.size} 
                  onValueChange={(value) => updateItem(item.id, "size", value)}
                  disabled={!item.color}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent className="bg-background z-50">
                    {getSizesByProductAndColor(item.product_id, item.color).map((size) => (
                      <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity */}
              <div className="space-y-2">
                <Label className="text-sm">Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  max={item.available_stock}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <Label className="text-sm">Price (each)</Label>
                <div className="text-sm font-medium py-2">
                  £{item.price.toFixed(2)}
                </div>
              </div>

              {/* Subtotal */}
              <div className="space-y-2">
                <Label className="text-sm">Subtotal</Label>
                <div className="text-sm font-medium py-2">
                  £{(item.quantity * item.price).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Stock Level Warning */}
            {item.available_stock > 0 && isLowStock(item.available_stock) && (
              <Alert className="border-orange-200 bg-orange-50">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  Low stock warning: Only {item.available_stock} units available
                </AlertDescription>
              </Alert>
            )}

            {/* Stock Info */}
            {item.available_stock > 0 && (
              <div className="text-sm text-muted-foreground">
                Available stock: {item.available_stock} units
              </div>
            )}

            {/* Remove Item Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="text-destructive hover:text-destructive"
              >
                <Minus className="h-4 w-4 mr-1" />
                Remove Item
              </Button>
            </div>
          </div>
        ))}
        
        <div className="flex justify-end">
          <div className="text-lg font-semibold">
            Total: £{calculateTotal().toFixed(2)}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (Optional)</Label>
        <Textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requirements or additional information..."
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Updating..." : "Update Order"}
        </Button>
      </div>
    </form>
  );
}