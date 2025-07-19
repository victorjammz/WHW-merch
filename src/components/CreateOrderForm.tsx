import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Plus, Minus } from "lucide-react";
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

export function CreateOrderForm({ onSuccess, onCancel }: CreateOrderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventName, setEventName] = useState("");
  const [clientName, setClientName] = useState("");
  const [eventDate, setEventDate] = useState<Date>();
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<OrderItem[]>([
    { id: "1", name: "", quantity: 1, price: 0 }
  ]);
  
  const { toast } = useToast();

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
    
    if (!eventName || !clientName || !eventDate) {
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
        event_name: eventName,
        client_name: clientName,
        event_date: eventDate.toISOString().split('T')[0],
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
          <Label htmlFor="event-name">Event Name *</Label>
          <Input
            id="event-name"
            value={eventName}
            onChange={(e) => setEventName(e.target.value)}
            placeholder="e.g., Annual Conference 2024"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="client-name">Client Name *</Label>
          <Input
            id="client-name"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="e.g., John Smith"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Event Date *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !eventDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {eventDate ? format(eventDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={eventDate}
                onSelect={setEventDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
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