import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PostcodeAutocomplete } from "@/components/AddressAutocomplete";
import { EnhancedItemSelector } from "@/components/EnhancedItemSelector";

interface CreateOrderFormProps {
  onSuccess?: () => void;
  onCancel: () => void;
}

interface OrderItem {
  id: string;
  category: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
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
  product_id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  product: {
    name: string;
    category: string;
  };
}

export function CreateOrderForm({ onSuccess, onCancel }: CreateOrderFormProps) {
  // Step 1 - Order Details
  const [selectedEvent, setSelectedEvent] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [postcode, setPostcode] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("pending");
  const [notes, setNotes] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    { id: "1", category: "", product_id: "", variant_id: "", quantity: 1, price: 0 }
  ]);

  // Step 2 - Payment Details
  const [paymentStatus, setPaymentStatus] = useState("not paid");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  // Form step management
  const [currentStep, setCurrentStep] = useState(1);

  // Validation states
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  // Data states
  const [events, setEvents] = useState<Event[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [productVariants, setProductVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  // Email validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (value && !emailRegex.test(value)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  // Phone validation
  const handlePhoneChange = (value: string) => {
    setPhone(value);
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/;
    if (value && !phoneRegex.test(value)) {
      setPhoneError("Please enter a valid phone number");
    } else {
      setPhoneError("");
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchCategories();
    fetchProductVariants();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch events: " + error.message,
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch categories: " + error.message,
        variant: "destructive"
      });
    }
  };

  const fetchProductVariants = async () => {
    try {
      setIsLoading(true);
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
        title: "Error",
        description: "Failed to fetch product variants: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      return total + (item.price * item.quantity);
    }, 0);
  };

  const syncCustomerFromOrder = async () => {
    try {
      // Check if customer already exists
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', email)
        .maybeSingle();

      if (checkError) throw checkError;

      const totalAmount = calculateTotal();
      const itemCount = orderItems.reduce((total, item) => total + item.quantity, 0);

      if (existingCustomer) {
        // Update existing customer
        const { error: updateError } = await supabase
          .from('customers')
          .update({
            name: fullName,
            phone,
            address: `${address}, ${city}`,
            postcode,
            location: `${city}, ${country}`,
            total_orders: existingCustomer.total_orders + 1,
            total_spent: Number(existingCustomer.total_spent) + totalAmount,
            last_order_date: new Date().toISOString().split('T')[0],
            updated_at: new Date().toISOString()
          })
          .eq('id', existingCustomer.id);

        if (updateError) throw updateError;
      } else {
        // Create new customer
        const { error: insertError } = await supabase
          .from('customers')
          .insert({
            name: fullName,
            email,
            phone,
            address: `${address}, ${city}`,
            postcode,
            location: `${city}, ${country}`,
            total_orders: 1,
            total_spent: totalAmount,
            last_order_date: new Date().toISOString().split('T')[0],
            status: 'active'
          });

        if (insertError) throw insertError;
      }
    } catch (error: any) {
      console.error('Error syncing customer:', error);
      // Don't throw - we don't want customer sync failure to prevent order creation
    }
  };


  const handleNextStep = () => {
    // Validate required fields for step 1
    if (!selectedEvent || !fullName || !email || !phone || !address || !city || !postcode || !country) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including complete address",
        variant: "destructive"
      });
      return;
    }

    if (emailError || phoneError) {
      toast({
        title: "Validation Error",
        description: "Please fix validation errors before proceeding",
        variant: "destructive"
      });
      return;
    }

    if (orderItems.length === 0 || orderItems.some(item => !item.variant_id || item.quantity <= 0)) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one valid item to the order",
        variant: "destructive"
      });
      return;
    }

    setCurrentStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (orderItems.length === 0 || orderItems.some(item => !item.variant_id || item.quantity <= 0)) {
      toast({
        title: "Validation Error", 
        description: "Please add at least one valid item to the order",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase
        .from('event_orders')
        .insert({
          event_name: events.find(e => e.id === selectedEvent)?.name || "",
          event_date: events.find(e => e.id === selectedEvent)?.event_date || "",
          client_name: fullName,
          client_email: email,
          client_phone: phone,
          client_address: address,
          client_postcode: postcode,
          status,
          notes,
          items: orderItems as any,
          total_amount: calculateTotal(),
          payment_status: paymentStatus,
          payment_method: paymentMethod,
          payment_reference: paymentReference
        })
        .select()
        .single();

      if (error) throw error;

      // Sync customer information to customers table
      await syncCustomerFromOrder();

      toast({
        title: "Success",
        description: "Order created successfully"
      });

      // Reset form
      setSelectedEvent("");
      setFullName("");
      setEmail("");
      setPhone("");
      setPostcode("");
      setAddress("");
      setCity("");
      setCountry("");
      setStatus("pending");
      setNotes("");
      setOrderItems([{ id: "1", category: "", product_id: "", variant_id: "", quantity: 1, price: 0 }]);
      setPaymentStatus("not paid");
      setPaymentMethod("");
      setPaymentReference("");
      setCurrentStep(1);
      onSuccess?.();
    } catch (error: any) {
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
      {currentStep === 1 ? (
        <div className="space-y-6">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="event">Event *</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {new Date(event.event_date).toLocaleDateString()} ({event.location})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Customer Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter customer full name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="customer@example.com"
                className={emailError ? "border-red-500" : ""}
                required
              />
              {emailError && (
                <p className="text-sm text-red-500">{emailError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone *</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+44 123 456 7890"
                className={phoneError ? "border-red-500" : ""}
                required
              />
              {phoneError && (
                <p className="text-sm text-red-500">{phoneError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Order Status</Label>
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
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Address Information</h3>
            <PostcodeAutocomplete
              onAddressComplete={(addressData) => {
                setAddress(addressData.address);
                setCity(addressData.city);
                setPostcode(addressData.postcode);
                setCountry(addressData.country);
              }}
            />
            
            {/* Show individual fields if they have values */}
            {(address || city || postcode || country) && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <Label htmlFor="address-display">Address *</Label>
                  <Input
                    id="address-display"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Address will be filled automatically"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city-display">City *</Label>
                  <Input
                    id="city-display"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City will be filled automatically"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postcode-display">Postcode *</Label>
                  <Input
                    id="postcode-display"
                    value={postcode}
                    onChange={(e) => setPostcode(e.target.value)}
                    placeholder="Postcode will be filled automatically"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country-display">Country *</Label>
                  <Input
                    id="country-display"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Country will be filled automatically"
                    required
                  />
                </div>
              </div>
            )}
          </div>

          {/* Order Items */}
          <EnhancedItemSelector 
            items={orderItems}
            onItemsChange={setOrderItems}
          />

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes for this order..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button type="button" onClick={handleNextStep}>
              Next
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Payment Information</h3>
            
            <div className="space-y-2">
              <Label>Payment Status *</Label>
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="not paid">Not Paid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Paid via</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select payment method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="payment-reference">Payment Reference</Label>
              <Input
                id="payment-reference"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Enter payment reference (optional)"
              />
            </div>
          </div>

          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => setCurrentStep(1)}>
              Back
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Order"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}