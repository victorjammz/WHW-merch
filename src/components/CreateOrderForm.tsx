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

interface CreateOrderFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface OrderItem {
  id: string;
  variant_id: string;
  product_name: string;
  variant_display: string; // e.g., "Red - Large"
  sku: string;
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

interface ProductVariant {
  id: string;
  sku: string;
  product_id: string;
  product_name: string;
  color: string | null;
  size: string | null;
  quantity: number;
  price: number;
}

export function CreateOrderForm({ onSuccess, onCancel }: CreateOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { 
      id: "1", 
      variant_id: "", 
      product_name: "", 
      variant_display: "",
      sku: "",
      quantity: 1, 
      price: 0, 
      available_stock: 0 
    }
  ]);
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [eventSearchOpen, setEventSearchOpen] = useState(false);
  
  const { toast } = useToast();

  // Email validation function
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Phone validation function - supports various formats
  const validatePhone = (phone: string): boolean => {
    // Remove all non-digit characters for validation
    const cleaned = phone.replace(/\D/g, '');
    // Check if it's between 10-15 digits (international format)
    return cleaned.length >= 10 && cleaned.length <= 15;
  };

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (value && !validateEmail(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Handle phone change with validation
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    if (value && !validatePhone(value)) {
      setPhoneError("Please enter a valid phone number (10-15 digits)");
    } else {
      setPhoneError("");
    }
  };

  // Fetch events, categories, and product variants on component mount
  useEffect(() => {
    fetchEvents();
    fetchCategories();
    fetchProductVariants();
  }, []);

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
      toast({
        title: "Error",
        description: "Failed to load events",
        variant: "destructive"
      });
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
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive"
      });
    }
  };

  const fetchProductVariants = async () => {
    try {
      const { data, error } = await supabase
        .from('product_variants')
        .select(`
          id,
          sku,
          product_id,
          color,
          size,
          quantity,
          price,
          products!inner(name)
        `)
        .gt('quantity', 0) // Only show in-stock variants
        .order('products(name)', { ascending: true });

      if (error) throw error;
      
      // Transform the data to include product name
      const transformedData = (data || []).map(variant => ({
        id: variant.id,
        sku: variant.sku,
        product_id: variant.product_id,
        product_name: variant.products.name,
        color: variant.color,
        size: variant.size,
        quantity: variant.quantity,
        price: variant.price
      }));
      
      setProductVariants(transformedData);
    } catch (error) {
      console.error('Error fetching product variants:', error);
      toast({
        title: "Error",
        description: "Failed to load product variants",
        variant: "destructive"
      });
    }
  };

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      variant_id: "",
      product_name: "",
      variant_display: "",
      sku: "",
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
        
        // If variant_id changes, update all related fields
        if (field === 'variant_id') {
          const selectedVariant = productVariants.find(variant => variant.id === value);
          if (selectedVariant) {
            updatedItem.product_name = selectedVariant.product_name;
            updatedItem.variant_display = `${selectedVariant.color || 'No Color'} - ${selectedVariant.size || 'No Size'}`;
            updatedItem.sku = selectedVariant.sku;
            updatedItem.price = selectedVariant.price;
            updatedItem.available_stock = selectedVariant.quantity;
            updatedItem.quantity = Math.min(updatedItem.quantity, selectedVariant.quantity);
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

  const getVariantDisplayText = (variant: ProductVariant) => {
    const colorSize = [variant.color, variant.size].filter(Boolean).join(' - ');
    return `${variant.product_name} (${colorSize || 'Standard'}) - £${variant.price.toFixed(2)} - Stock: ${variant.quantity}`;
  };

  const getFilteredVariants = (searchTerm: string = '') => {
    return productVariants.filter(variant => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        variant.product_name.toLowerCase().includes(searchLower) ||
        variant.sku.toLowerCase().includes(searchLower) ||
        (variant.color && variant.color.toLowerCase().includes(searchLower)) ||
        (variant.size && variant.size.toLowerCase().includes(searchLower))
      );
    });
  };

  const isLowStock = (stock: number) => stock < 15;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!selectedEvent || !fullName || !email || !phone || !(postcode && address)) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    if (!validateEmail(email)) {
      setEmailError("Please enter a valid email address");
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return;
    }

    // Validate phone format
    if (!validatePhone(phone)) {
      setPhoneError("Please enter a valid phone number (10-15 digits)");
      toast({
        title: "Validation Error", 
        description: "Please enter a valid phone number",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validItems = items.filter(item => 
        item.variant_id && item.quantity > 0
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
        items: JSON.stringify(validItems), // Convert to JSON string
        total_amount: calculateTotal()
      };

      const { error } = await supabase
        .from('event_orders')
        .insert(orderData);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order created successfully"
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order: " + error.message,
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
            onChange={(e) => handleEmailChange(e.target.value)}
            placeholder="e.g., john@example.com"
            className={emailError ? "border-destructive" : ""}
            required
          />
          {emailError && (
            <p className="text-sm text-destructive">{emailError}</p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            placeholder="e.g., +44 1234 567890"
            className={phoneError ? "border-destructive" : ""}
            required
          />
          {phoneError && (
            <p className="text-sm text-destructive">{phoneError}</p>
          )}
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
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
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
            {/* Product Variant Selection - Single Dropdown */}
            <div className="space-y-2">
              <Label className="text-sm">Select Product Variant *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="w-full justify-between text-left font-normal"
                  >
                    {item.variant_id ? 
                      `${item.product_name} (${item.variant_display}) - ${item.sku}` : 
                      "Select a product variant..."
                    }
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search products..." />
                    <CommandList>
                      <CommandEmpty>No variants found.</CommandEmpty>
                      <CommandGroup>
                        {getFilteredVariants().map((variant) => (
                          <CommandItem
                            key={variant.id}
                            value={getVariantDisplayText(variant)}
                            onSelect={() => updateItem(item.id, "variant_id", variant.id)}
                            className="flex flex-col items-start space-y-1 p-3"
                          >
                            <div className="flex items-center space-x-2 w-full">
                              <Check
                                className={cn(
                                  "h-4 w-4",
                                  item.variant_id === variant.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex-1">
                                <div className="font-medium">{variant.product_name}</div>
                                <div className="text-sm text-muted-foreground">
                                  {variant.color && variant.size ? 
                                    `${variant.color} - ${variant.size}` : 
                                    (variant.color || variant.size || 'Standard')
                                  } • £{variant.price.toFixed(2)} • SKU: {variant.sku}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {variant.quantity} in stock
                                  {variant.quantity < 15 && (
                                    <span className="text-orange-600 ml-2">⚠ Low stock</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Quantity and Price Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm">Quantity *</Label>
                <Input
                  type="number"
                  min="1"
                  max={item.available_stock}
                  value={item.quantity}
                  onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
                  disabled={!item.variant_id}
                />
                {item.available_stock > 0 && (
                  <div className="text-xs text-muted-foreground">
                    Max: {item.available_stock} available
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Price (each)</Label>
                <div className="text-sm font-medium py-2 px-3 bg-muted/50 rounded">
                  £{item.price.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm">Subtotal</Label>
                <div className="text-sm font-semibold py-2 px-3 bg-primary/10 rounded">
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
          {isSubmitting ? "Creating..." : "Create Order"}
        </Button>
      </div>
    </form>
  );
}