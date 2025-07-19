import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Plus, Minus } from "lucide-react";
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
  name: string;
  quantity: number;
  price: number;
}

interface Event {
  id: string;
  name: string;
  event_date: string;
  location: string;
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
  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", name: "", quantity: 1, price: 0 }
  ]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventSearchOpen, setEventSearchOpen] = useState(false);
  
  const { toast } = useToast();

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
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

  const addItem = () => {
    const newItem: OrderItem = {
      id: Date.now().toString(),
      name: "",
      quantity: 1,
      price: 0
    };
    setItems([...items, newItem]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedEvent || !fullName || !email || !phone || !postcode || !address) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const validItems = items.filter(item => item.name.trim() !== "");
      
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            value={postcode}
            onChange={(e) => setPostcode(e.target.value)}
            placeholder="e.g., SW1A 1AA"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="address">Address *</Label>
          <Input
            id="address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="e.g., 123 Main Street, London"
            required
          />
        </div>
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
            <SelectItem value="in_progress">In Progress</SelectItem>
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
          <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end border rounded-lg p-3">
            <div className="md:col-span-5">
              <Label className="text-sm">Item Name</Label>
              <Input
                value={item.name}
                onChange={(e) => updateItem(item.id, "name", e.target.value)}
                placeholder="e.g., T-Shirt, Program Book"
              />
            </div>
            
            <div className="md:col-span-2">
              <Label className="text-sm">Quantity</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 1)}
              />
            </div>
            
            <div className="md:col-span-3">
              <Label className="text-sm">Price (each)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.price}
                onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
              />
            </div>
            
            <div className="md:col-span-1">
              <Label className="text-sm">Subtotal</Label>
              <div className="text-sm font-medium py-2">
                £{(item.quantity * item.price).toFixed(2)}
              </div>
            </div>
            
            <div className="md:col-span-1">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
                className="text-destructive hover:text-destructive"
              >
                <Minus className="h-4 w-4" />
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