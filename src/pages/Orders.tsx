import { useState, useEffect } from "react";
import { Plus, Search, Download, Calendar, Clock, CheckCircle, XCircle, User, Mail, Phone, MapPin, ArrowRight, ArrowLeft, Check, ChevronsUpDown, Eye, Edit, Star } from "lucide-react";
import { PostcodeAutocomplete } from "@/components/AddressAutocomplete";
import { supabase } from "@/integrations/supabase/client";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatDateWithUserSettings } from "@/utils/dateFormatting";

// Mock event order data with detailed items
const initialOrders = [{
  id: "EO-001",
  name: "John Smith",
  email: "john.smith@email.com",
  phone: "+44 7911 123456",
  address: "123 Main St",
  postcode: "10001",
  items: [{
    name: "Wedding Dress - Premium",
    quantity: 1,
    price: 299.99
  }, {
    name: "Suit - Classic",
    quantity: 1,
    price: 199.99
  }, {
    name: "Decoration Package",
    quantity: 1,
    price: 150.00
  }],
  status: "confirmed",
  payment: "paid",
  date: "2024-02-15"
}, {
  id: "EO-002",
  name: "Sarah Johnson",
  email: "sarah.j@email.com",
  phone: "+353 87 123 4567",
  address: "456 Oak Avenue",
  postcode: "10002",
  items: [{
    name: "Birthday Cake Toppers",
    quantity: 5,
    price: 12.99
  }, {
    name: "Party Decorations",
    quantity: 2,
    price: 25.00
  }, {
    name: "Gift Bags",
    quantity: 10,
    price: 3.50
  }],
  status: "pending",
  payment: "pending",
  date: "2024-02-20"
}, {
  id: "EO-003",
  name: "Mike Wilson",
  email: "mike.wilson@email.com",
  phone: "+44 20 7946 0958",
  address: "789 Pine Road",
  postcode: "10003",
  items: [{
    name: "Corporate Banner",
    quantity: 2,
    price: 75.00
  }, {
    name: "Table Setup",
    quantity: 10,
    price: 15.00
  }, {
    name: "Sound System Rental",
    quantity: 1,
    price: 200.00
  }],
  status: "in_progress",
  payment: "paid",
  date: "2024-02-25"
}];

// Function to calculate total for an order
const calculateOrderTotal = (items: any[]) => {
  return items.reduce((total, item) => total + item.quantity * item.price, 0);
};

// Function to format items display
const formatItemsDisplay = (items: any[]) => {
  if (items.length === 1) {
    return `${items[0].name} x${items[0].quantity}`;
  }
  return `${items.length} items`;
};

const Orders = () => {
  const [orders, setOrders] = useState(initialOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [productSizes, setProductSizes] = useState<string[]>([]);
  const [productColors, setProductColors] = useState<string[]>([]);
  const [isItemsPopoverOpen, setIsItemsPopoverOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [editOrderForm, setEditOrderForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postcode: "",
    category: "",
    product: "",
    size: "",
    color: "",
    status: "pending",
    payment: "pending"
  });
  const [newOrderForm, setNewOrderForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    postcode: "",
    event_id: "",
    status: "pending",
    payment: "pending"
  });
  const [orderItems, setOrderItems] = useState<Array<{
    category: string;
    product: string;
    size: string;
    color: string;
    quantity: number;
    price: number;
  }>>([]);
  const [currentItem, setCurrentItem] = useState({
    category: "",
    product: "",
    size: "",
    color: "",
    quantity: 1
  });
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { settings } = useUserSettings();

  // Events state
  const [events, setEvents] = useState<any[]>([]);
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [eventSearch, setEventSearch] = useState("");
  const [defaultEvent, setDefaultEvent] = useState<any>(null);
  const [defaultEventExpiry, setDefaultEventExpiry] = useState<number | null>(null);

  // Fetch inventory items and categories when dialog opens
  useEffect(() => {
    if (isNewOrderOpen || isEditOrderOpen) {
      fetchInventoryItems();
      fetchCategories();
      fetchEvents();
    }
  }, [isNewOrderOpen, isEditOrderOpen]);

  // Load default event from localStorage on component mount
  useEffect(() => {
    const savedDefault = localStorage.getItem('defaultEvent');
    const savedExpiry = localStorage.getItem('defaultEventExpiry');
    
    if (savedDefault && savedExpiry) {
      const expiry = parseInt(savedExpiry);
      if (Date.now() < expiry) {
        try {
          const event = JSON.parse(savedDefault);
          setDefaultEvent(event);
          setDefaultEventExpiry(expiry);
          setNewOrderForm(prev => ({ ...prev, event_id: event.id }));
        } catch (error) {
          localStorage.removeItem('defaultEvent');
          localStorage.removeItem('defaultEventExpiry');
        }
      } else {
        localStorage.removeItem('defaultEvent');
        localStorage.removeItem('defaultEventExpiry');
      }
    }
  }, []);

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase.from('inventory').select('id, name, sku, price, quantity, category, size, color').gt('quantity', 0);
      if (error) throw error;
      setInventoryItems(data || []);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory items",
        variant: "destructive"
      });
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase.from('categories').select('id, name');
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

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('name');
      
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

  // Filter products when category changes
  useEffect(() => {
    if (currentItem.category) {
      const filtered = inventoryItems.filter(item => item.category === currentItem.category);
      setFilteredProducts(filtered);
      setCurrentItem(prev => ({
        ...prev,
        product: "",
        size: "",
        color: ""
      }));
      setProductSizes([]);
      setProductColors([]);
    }
  }, [currentItem.category, inventoryItems]);

  // Update sizes and colors when product changes
  useEffect(() => {
    if (currentItem.product) {
      const product = inventoryItems.find(item => item.name === currentItem.product);
      if (product) {
        const variants = inventoryItems.filter(item => item.name === currentItem.product);
        const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
        const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
        setProductSizes(sizes);
        setProductColors(colors);
        setCurrentItem(prev => ({
          ...prev,
          size: "",
          color: ""
        }));
      }
    }
  }, [currentItem.product, inventoryItems]);

  const generateOrderId = () => {
    const nextNumber = orders.length + 1;
    return `EO-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleNewOrder = () => {
    setCurrentStep(1);
    setIsNewOrderOpen(true);
  };

  const handleCloseDialog = () => {
    setIsNewOrderOpen(false);
    setCurrentStep(1);
    setNewOrderForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      postcode: "",
      event_id: defaultEvent?.id || "",
      status: "pending",
      payment: "pending"
    });
    setOrderItems([]);
    setCurrentItem({
      category: "",
      product: "",
      size: "",
      color: "",
      quantity: 1
    });
  };

  const validateStep1 = () => {
    return newOrderForm.name && newOrderForm.email && newOrderForm.phone && newOrderForm.address && newOrderForm.city && newOrderForm.postcode && newOrderForm.event_id && orderItems.length > 0;
  };

  const validateCurrentItem = () => {
    const product = inventoryItems.find(item => item.name === currentItem.product);
    if (!product) return false;

    const variants = inventoryItems.filter(item => item.name === currentItem.product);
    const hasSizes = variants.some(v => v.size);
    const hasColors = variants.some(v => v.color);
    return currentItem.category && currentItem.product && currentItem.quantity > 0 && (!hasSizes || currentItem.size) && (!hasColors || currentItem.color);
  };

  const addItemToOrder = () => {
    if (!validateCurrentItem()) {
      toast({
        title: "Error",
        description: "Please fill in all required item fields",
        variant: "destructive"
      });
      return;
    }
    const product = inventoryItems.find(item => item.name === currentItem.product && (!currentItem.size || item.size === currentItem.size) && (!currentItem.color || item.color === currentItem.color));
    if (!product) {
      toast({
        title: "Error",
        description: "Selected product variant not found",
        variant: "destructive"
      });
      return;
    }
    const newItem = {
      ...currentItem,
      price: product.price
    };
    setOrderItems([...orderItems, newItem]);
    setCurrentItem({
      category: "",
      product: "",
      size: "",
      color: "",
      quantity: 1
    });
    setFilteredProducts([]);
    setProductSizes([]);
    setProductColors([]);
    toast({
      title: "Item Added",
      description: `${product.name} added to order`
    });
  };

  const removeItemFromOrder = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const calculateOrderTotalItems = (items?: any[]) => {
    if (items) {
      return items.reduce((total, item) => total + item.quantity * item.price, 0);
    }
    return orderItems.reduce((total, item) => total + item.quantity * item.price, 0);
  };

  const handleNextStep = () => {
    if (!validateStep1()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const handleCreateOrder = () => {
    if (!validateStep1()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one item",
        variant: "destructive"
      });
      return;
    }
    const orderItemsFormatted = orderItems.map(item => ({
      name: `${item.product}${item.size ? ` - ${item.size}` : ''}${item.color ? ` - ${item.color}` : ''}`,
      quantity: item.quantity,
      price: item.price
    }));
    const newOrder = {
      id: generateOrderId(),
      name: newOrderForm.name,
      email: newOrderForm.email,
      phone: newOrderForm.phone,
      address: `${newOrderForm.address}, ${newOrderForm.city}, ${newOrderForm.country}`,
      postcode: newOrderForm.postcode,
      event_id: newOrderForm.event_id,
      items: orderItemsFormatted,
      status: newOrderForm.status,
      payment: newOrderForm.payment,
      date: new Date().toISOString().split('T')[0]
    };
    setOrders([newOrder, ...orders]);
    handleCloseDialog();
    toast({
      title: "Order Created",
      description: `Order ${newOrder.id} has been created successfully`
    });
  };

  const handleSetDefaultEvent = (event: any) => {
    const expiry = Date.now() + (48 * 60 * 60 * 1000); // 48 hours from now
    localStorage.setItem('defaultEvent', JSON.stringify(event));
    localStorage.setItem('defaultEventExpiry', expiry.toString());
    setDefaultEvent(event);
    setDefaultEventExpiry(expiry);
    setNewOrderForm(prev => ({ ...prev, event_id: event.id }));
    setIsEventsOpen(false);
    
    toast({
      title: "Default Event Set",
      description: `${event.name} is now your default event for 48 hours`
    });
  };

  const filteredEvents = events.filter(event => 
    event.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
    event.location.toLowerCase().includes(eventSearch.toLowerCase())
  );

  const handleExport = () => {
    const csvContent = filteredOrders.map(order => `${order.id},${order.name},${order.email},${order.phone},${order.address},${order.postcode},"${formatItemsDisplay(order.items)}",${order.status},${order.payment},${order.date}`).join('\n');
    const blob = new Blob([`Order ID,Name,Email,Phone,Address,Postcode,Items,Status,Payment,Date\n${csvContent}`], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orders.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: "Orders exported to CSV file"
    });
  };

  const handleViewOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      setIsViewOrderOpen(true);
    }
  };

  const handleEditOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (order) {
      setSelectedOrder(order);
      const itemsArray = Array.isArray(order.items) ? order.items : [{
        name: order.items,
        quantity: 1,
        price: 0
      }];
      const firstItem = itemsArray[0]?.name || "";
      const itemsParts = firstItem.split(' - ');
      setEditOrderForm({
        name: order.name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        city: "",
        country: "",
        postcode: order.postcode,
        category: "",
        product: itemsParts[0] || "",
        size: itemsParts[1] || "",
        color: itemsParts[2] || "",
        status: order.status,
        payment: order.payment
      });
      setIsEditOrderOpen(true);
      fetchInventoryItems();
    }
  };

  const handleUpdateOrder = () => {
    if (!editOrderForm.name || !editOrderForm.email || !editOrderForm.phone || !editOrderForm.address || !editOrderForm.city || !editOrderForm.postcode || !editOrderForm.category || !editOrderForm.product) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const itemsDescription = `${editOrderForm.product}${editOrderForm.size ? ` - ${editOrderForm.size}` : ''}${editOrderForm.color ? ` - ${editOrderForm.color}` : ''}`;
    const updatedOrders = orders.map(order => order.id === selectedOrder.id ? {
      ...order,
      name: editOrderForm.name,
      email: editOrderForm.email,
      phone: editOrderForm.phone,
      address: `${editOrderForm.address}, ${editOrderForm.city}, ${editOrderForm.country}`,
      postcode: editOrderForm.postcode,
      items: [{
        name: itemsDescription,
        quantity: 1,
        price: 0
      }],
      status: editOrderForm.status,
      payment: editOrderForm.payment
    } : order);
    setOrders(updatedOrders);
    setIsEditOrderOpen(false);
    setSelectedOrder(null);
    setEditOrderForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      country: "",
      postcode: "",
      category: "",
      product: "",
      size: "",
      color: "",
      status: "pending",
      payment: "pending"
    });
    toast({
      title: "Order Updated",
      description: `Order ${selectedOrder.id} has been updated successfully`
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) || order.name.toLowerCase().includes(searchTerm.toLowerCase()) || order.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
  const inProgressOrders = orders.filter(o => o.status === "in_progress").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle className="h-4 w-4" />;
      case "in_progress":
        return <Calendar className="h-4 w-4" />;
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "cancelled":
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "confirmed":
        return "default";
      case "in_progress":
        return "default";
      case "completed":
        return "default";
      case "cancelled":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage orders and special requests
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleNewOrder}>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Order - Step {currentStep} of 2</DialogTitle>
                <DialogDescription>
                  {currentStep === 1 ? "Enter customer details and select items for the order." : "Set the order status and payment information."}
                </DialogDescription>
              </DialogHeader>

              {currentStep === 1 && (
                <div className="grid gap-4 py-4">
                  {/* Event Selection - Moved to top and made compulsory */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="event" className="text-right">
                      Event *
                    </Label>
                    <div className="col-span-3 relative">
                      <Popover open={isEventsOpen} onOpenChange={setIsEventsOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isEventsOpen}
                            className="w-full justify-between"
                          >
                            {newOrderForm.event_id ? 
                              events.find(event => event.id === newOrderForm.event_id)?.name || "Select event..."
                              : "Select event..."
                            }
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[400px] p-0">
                          <Command>
                            <CommandInput 
                              placeholder="Search events..." 
                              value={eventSearch}
                              onValueChange={setEventSearch}
                            />
                            <CommandList>
                              <CommandEmpty>No events found.</CommandEmpty>
                              <CommandGroup>
                                {filteredEvents.map((event) => (
                                  <CommandItem
                                    key={event.id}
                                    value={event.id}
                                    onSelect={() => {
                                      setNewOrderForm(prev => ({ ...prev, event_id: event.id }));
                                      setIsEventsOpen(false);
                                    }}
                                    className="flex items-center justify-between"
                                  >
                                    <div className="flex-1">
                                      <div className="font-medium">{event.name}</div>
                                      <div className="text-sm text-muted-foreground">
                                        {event.location} • {new Date(event.event_date).toLocaleDateString()}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {defaultEvent?.id === event.id && (
                                        <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                      )}
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleSetDefaultEvent(event);
                                        }}
                                        className="h-6 px-2 text-xs"
                                      >
                                        Set Default
                                      </Button>
                                    </div>
                                    <Check
                                      className={`ml-2 h-4 w-4 ${
                                        newOrderForm.event_id === event.id ? "opacity-100" : "opacity-0"
                                      }`}
                                    />
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {defaultEvent && defaultEventExpiry && Date.now() < defaultEventExpiry && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Default: {defaultEvent.name} (expires in {Math.round((defaultEventExpiry - Date.now()) / (1000 * 60 * 60))}h)
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Full Name *
                    </Label>
                    <Input 
                      id="name" 
                      value={newOrderForm.name} 
                      onChange={e => setNewOrderForm({
                        ...newOrderForm,
                        name: e.target.value
                      })} 
                      className="col-span-3" 
                      placeholder="Customer full name" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email *
                    </Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={newOrderForm.email} 
                      onChange={e => setNewOrderForm({
                        ...newOrderForm,
                        email: e.target.value
                      })} 
                      className="col-span-3" 
                      placeholder="customer@email.com" 
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="phone" className="text-right">
                      Phone *
                    </Label>
                    <Input 
                      id="phone" 
                      value={newOrderForm.phone} 
                      onChange={e => setNewOrderForm({
                        ...newOrderForm,
                        phone: e.target.value
                      })} 
                      className="col-span-3" 
                      placeholder="+44 7911 123456" 
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="col-span-4">
                      <PostcodeAutocomplete
                        onAddressComplete={(address) => {
                          setNewOrderForm({
                            ...newOrderForm,
                            address: address.address,
                            city: address.city,
                            country: address.country,
                            postcode: address.postcode
                          });
                        }}
                      />
                    </div>
                  </div>

                  {/* Add Items Section */}
                  <div className="border rounded-lg p-4 space-y-4">
                    <h3 className="font-semibold">Add Items to Order</h3>
                    
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="category" className="text-right">
                        Category *
                      </Label>
                      <Select value={currentItem.category} onValueChange={value => setCurrentItem({
                        ...currentItem,
                        category: value
                      })}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border z-50">
                          {categories.map(category => (
                            <SelectItem key={category.id} value={category.name}>
                              {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {currentItem.category && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="product" className="text-right">
                          Product *
                        </Label>
                        <Select value={currentItem.product} onValueChange={value => setCurrentItem({
                          ...currentItem,
                          product: value
                        })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a product" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {filteredProducts.map(product => (
                              <SelectItem key={product.id} value={product.name}>
                                {product.name} - {formatPrice(product.price)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {currentItem.product && productSizes.length > 0 && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="size" className="text-right">
                          Size *
                        </Label>
                        <Select value={currentItem.size} onValueChange={value => setCurrentItem({
                          ...currentItem,
                          size: value
                        })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a size" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {productSizes.map(size => (
                              <SelectItem key={size} value={size}>
                                {size}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {currentItem.product && productColors.length > 0 && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="color" className="text-right">
                          Color *
                        </Label>
                        <Select value={currentItem.color} onValueChange={value => setCurrentItem({
                          ...currentItem,
                          color: value
                        })}>
                          <SelectTrigger className="col-span-3">
                            <SelectValue placeholder="Select a color" />
                          </SelectTrigger>
                          <SelectContent className="bg-background border z-50">
                            {productColors.map(color => (
                              <SelectItem key={color} value={color}>
                                {color}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {currentItem.product && (
                      <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="quantity" className="text-right">
                          Quantity *
                        </Label>
                        <Input 
                          id="quantity" 
                          type="number" 
                          min="1" 
                          value={currentItem.quantity} 
                          onChange={e => setCurrentItem({
                            ...currentItem,
                            quantity: parseInt(e.target.value) || 1
                          })} 
                          className="col-span-3" 
                        />
                      </div>
                    )}

                    {currentItem.product && (
                      <div className="flex justify-end">
                        <Button onClick={addItemToOrder} disabled={!validateCurrentItem()}>
                          <Plus className="mr-2 h-4 w-4" />
                          Add Item
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Order Items List */}
                  {orderItems.length > 0 && (
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Order Items</h3>
                        <div className="text-lg font-bold">
                          Total: {formatPrice(calculateOrderTotalItems())}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {orderItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center bg-muted p-3 rounded">
                            <div>
                              <div className="font-medium">
                                {item.product}
                                {item.size && ` - ${item.size}`}
                                {item.color && ` - ${item.color}`}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                Qty: {item.quantity} × {formatPrice(item.price)} = {formatPrice(item.quantity * item.price)}
                              </div>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => removeItemFromOrder(index)}>
                              Remove
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {currentStep === 2 && (
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="status" className="text-right">
                      Status *
                    </Label>
                    <Select value={newOrderForm.status} onValueChange={value => setNewOrderForm({
                      ...newOrderForm,
                      status: value
                    })}>
                      <SelectTrigger className="col-span-3">
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
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="payment" className="text-right">
                      Payment *
                    </Label>
                    <Select value={newOrderForm.payment} onValueChange={value => setNewOrderForm({
                      ...newOrderForm,
                      payment: value
                    })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="refunded">Refunded</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <DialogFooter>
                <div className="flex justify-between w-full">
                  <div>
                    {currentStep === 2 && (
                      <Button variant="outline" onClick={handlePrevStep}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Previous
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={handleCloseDialog}>
                      Cancel
                    </Button>
                    {currentStep === 1 ? (
                      <Button onClick={handleNextStep}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button onClick={handleCreateOrder}>
                        Create Order
                      </Button>
                    )}
                  </div>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting confirmation
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Ready to fulfill
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressOrders}</div>
            <p className="text-xs text-muted-foreground">
              Currently active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                View and manage all orders and special requests
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span>{order.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{order.email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{order.phone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatItemsDisplay(order.items)}</TableCell>
                  <TableCell>{formatPrice(calculateOrderTotal(order.items))}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.payment === "paid" ? "default" : "secondary"}>
                      {order.payment}
                    </Badge>
                  </TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewOrder(order.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditOrder(order.id)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Order Details - {selectedOrder?.id}
            </DialogTitle>
            <DialogDescription>
              View complete order information
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Customer Name</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Order ID</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.id}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.phone}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-sm font-medium">Address</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Postcode</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.postcode}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Date</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedOrder.date}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Items</Label>
                <div className="mt-2 space-y-2">
                  {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <span className="text-sm">{item.name}</span>
                      <span className="text-sm font-medium">
                        {item.quantity}x {formatPrice(item.price)}
                      </span>
                    </div>
                  )) : (
                    <div className="p-2 bg-muted rounded">
                      <span className="text-sm">{selectedOrder.items}</span>
                    </div>
                  )}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold">{formatPrice(calculateOrderTotal(selectedOrder.items))}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge variant={getStatusVariant(selectedOrder.status)} className="mt-1">
                    {selectedOrder.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment</Label>
                  <Badge variant={selectedOrder.payment === "paid" ? "default" : "secondary"} className="mt-1">
                    {selectedOrder.payment}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewOrderOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Order Dialog */}
      <Dialog open={isEditOrderOpen} onOpenChange={setIsEditOrderOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5" />
              Edit Order - {selectedOrder?.id}
            </DialogTitle>
            <DialogDescription>
              Update order information and details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name *
              </Label>
              <Input 
                id="edit-name" 
                value={editOrderForm.name} 
                onChange={e => setEditOrderForm({
                  ...editOrderForm,
                  name: e.target.value
                })} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email *
              </Label>
              <Input 
                id="edit-email" 
                type="email" 
                value={editOrderForm.email} 
                onChange={e => setEditOrderForm({
                  ...editOrderForm,
                  email: e.target.value
                })} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone *
              </Label>
              <Input 
                id="edit-phone" 
                value={editOrderForm.phone} 
                onChange={e => setEditOrderForm({
                  ...editOrderForm,
                  phone: e.target.value
                })} 
                className="col-span-3" 
              />
            </div>
            <div className="grid grid-cols-1 gap-4">
              <div className="col-span-4">
                <PostcodeAutocomplete
                  onAddressComplete={(address) => {
                    setEditOrderForm({
                      ...editOrderForm,
                      address: address.address,
                      city: address.city,
                      country: address.country,
                      postcode: address.postcode
                    });
                  }}
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-category" className="text-right">
                Category *
              </Label>
              <Select value={editOrderForm.category} onValueChange={value => setEditOrderForm({
                ...editOrderForm,
                category: value
              })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-background border z-50">
                  {categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {editOrderForm.category && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-product" className="text-right">
                  Product *
                </Label>
                <Select value={editOrderForm.product} onValueChange={value => setEditOrderForm({
                  ...editOrderForm,
                  product: value
                })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a product" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {filteredProducts.map(product => (
                      <SelectItem key={product.id} value={product.name}>
                        {product.name} - {formatPrice(product.price)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status *
              </Label>
              <Select value={editOrderForm.status} onValueChange={value => setEditOrderForm({
                ...editOrderForm,
                status: value
              })}>
                <SelectTrigger className="col-span-3">
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-payment" className="text-right">
                Payment *
              </Label>
              <Select value={editOrderForm.payment} onValueChange={value => setEditOrderForm({
                ...editOrderForm,
                payment: value
              })}>
                <SelectTrigger className="col-span-3">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOrderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateOrder}>
              Update Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;