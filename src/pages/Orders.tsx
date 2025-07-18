import { useState, useEffect } from "react";
import { Plus, Search, Download, Calendar, Clock, CheckCircle, XCircle, User, Mail, Phone, MapPin, ArrowRight, ArrowLeft, Check, ChevronsUpDown, Eye, Edit } from "lucide-react";
import { AddressAutocomplete } from "@/components/AddressAutocomplete";
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
  phone: "+1 (555) 123-4567",
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
  phone: "+1 (555) 987-6543",
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
  phone: "+1 (555) 456-7890",
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
    postcode: "",
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
  const {
    toast
  } = useToast();
  const {
    formatPrice
  } = useCurrency();
  const {
    settings
  } = useUserSettings();

  // Fetch inventory items and categories when dialog opens
  useEffect(() => {
    if (isNewOrderOpen || isEditOrderOpen) {
      fetchInventoryItems();
      fetchCategories();
    }
  }, [isNewOrderOpen, isEditOrderOpen]);
  const fetchInventoryItems = async () => {
    try {
      const {
        data,
        error
      } = await supabase.from('inventory').select('id, name, sku, price, quantity, category, size, color').gt('quantity', 0);
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
      const {
        data,
        error
      } = await supabase.from('categories').select('id, name');
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

  // Filter products when category changes
  useEffect(() => {
    if (currentItem.category) {
      const filtered = inventoryItems.filter(item => item.category === currentItem.category);
      setFilteredProducts(filtered);
      // Reset product, size, color when category changes
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
        // Get all variants of this product to find available sizes and colors
        const variants = inventoryItems.filter(item => item.name === currentItem.product);
        const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
        const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
        setProductSizes(sizes);
        setProductColors(colors);
        // Reset size and color when product changes
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
      postcode: "",
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
    return newOrderForm.name && newOrderForm.email && newOrderForm.phone && newOrderForm.address && newOrderForm.postcode && orderItems.length > 0;
  };
  const validateCurrentItem = () => {
    const product = inventoryItems.find(item => item.name === currentItem.product);
    if (!product) return false;

    // Check if size is required (product has variants with sizes)
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
  const calculateOrderTotal = (items?: any[]) => {
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
      address: newOrderForm.address,
      postcode: newOrderForm.postcode,
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
      // Parse the items back into category, product, size, color if possible
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
        postcode: order.postcode,
        category: "",
        // We'll need to determine this from the product
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
    if (!editOrderForm.name || !editOrderForm.email || !editOrderForm.phone || !editOrderForm.address || !editOrderForm.postcode || !editOrderForm.category || !editOrderForm.product) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Combine the selections into an items string
    const itemsDescription = `${editOrderForm.product}${editOrderForm.size ? ` - ${editOrderForm.size}` : ''}${editOrderForm.color ? ` - ${editOrderForm.color}` : ''}`;
    const updatedOrders = orders.map(order => order.id === selectedOrder.id ? {
      ...order,
      name: editOrderForm.name,
      email: editOrderForm.email,
      phone: editOrderForm.phone,
      address: editOrderForm.address,
      postcode: editOrderForm.postcode,
      items: [{
        name: itemsDescription,
        quantity: 1,
        price: 0
      }],
      // Default structure for updated orders
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
  return <div className="space-y-6 p-6">
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

            {currentStep === 1 && <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Full Name *
                  </Label>
                  <Input id="name" value={newOrderForm.name} onChange={e => setNewOrderForm({
                  ...newOrderForm,
                  name: e.target.value
                })} className="col-span-3" placeholder="Customer full name" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email *
                  </Label>
                  <Input id="email" type="email" value={newOrderForm.email} onChange={e => setNewOrderForm({
                  ...newOrderForm,
                  email: e.target.value
                })} className="col-span-3" placeholder="customer@email.com" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="phone" className="text-right">
                    Phone *
                  </Label>
                  <Input id="phone" value={newOrderForm.phone} onChange={e => setNewOrderForm({
                  ...newOrderForm,
                  phone: e.target.value
                })} className="col-span-3" placeholder="+1 (555) 123-4567" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address *
                  </Label>
                  <div className="col-span-3">
                    <AddressAutocomplete
                      id="address"
                      value={newOrderForm.address}
                      onChange={(value) => setNewOrderForm({
                        ...newOrderForm,
                        address: value
                      })}
                      onAddressSelect={(suggestion) => {
                        const formattedAddress = [
                          suggestion.address.house_number,
                          suggestion.address.road,
                          suggestion.address.suburb,
                          suggestion.address.city
                        ].filter(Boolean).join(", ");
                        
                        setNewOrderForm({
                          ...newOrderForm,
                          address: formattedAddress,
                          postcode: suggestion.address.postcode || newOrderForm.postcode
                        });
                      }}
                      placeholder="Start typing an address..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="postcode" className="text-right">
                    Postcode *
                  </Label>
                  <Input id="postcode" value={newOrderForm.postcode} onChange={e => setNewOrderForm({
                  ...newOrderForm,
                  postcode: e.target.value
                })} className="col-span-3" placeholder="12345" />
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
                        {categories.map(category => <SelectItem key={category.id} value={category.name}>
                            {category.name}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {currentItem.category && <div className="grid grid-cols-4 items-center gap-4">
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
                          {filteredProducts.map(product => <SelectItem key={product.id} value={product.name}>
                              {product.name} - {formatPrice(product.price)}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>}

                  {currentItem.product && productSizes.length > 0 && <div className="grid grid-cols-4 items-center gap-4">
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
                          {productSizes.map(size => <SelectItem key={size} value={size}>
                              {size}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>}

                  {currentItem.product && productColors.length > 0 && <div className="grid grid-cols-4 items-center gap-4">
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
                          {productColors.map(color => <SelectItem key={color} value={color}>
                              {color}
                            </SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>}

                  {currentItem.product && <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="quantity" className="text-right">
                        Quantity *
                      </Label>
                      <Input id="quantity" type="number" min="1" value={currentItem.quantity} onChange={e => setCurrentItem({
                    ...currentItem,
                    quantity: parseInt(e.target.value) || 1
                  })} className="col-span-3" />
                    </div>}

                  {currentItem.product && <div className="flex justify-end">
                      <Button onClick={addItemToOrder} disabled={!validateCurrentItem()}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Item
                      </Button>
                    </div>}
                </div>

                {/* Order Items List */}
                {orderItems.length > 0 && <div className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="font-semibold">Order Items</h3>
                      <div className="text-lg font-bold">
                        Total: {formatPrice(calculateOrderTotal())}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {orderItems.map((item, index) => <div key={index} className="flex justify-between items-center bg-muted p-3 rounded">
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
                        </div>)}
                    </div>
                  </div>}
              </div>}

            {currentStep === 2 && <div className="grid gap-4 py-4">
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
              </div>}

            <DialogFooter>
              <div className="flex justify-between w-full">
                <div>
                  {currentStep === 2 && <Button variant="outline" onClick={handlePrevStep}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancel
                  </Button>
                  {currentStep === 1 ? <Button onClick={handleNextStep}>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button> : <Button onClick={handleCreateOrder}>
                      Create Event Order
                    </Button>}
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
          </Dialog>
          
          <Button variant="outline" onClick={handleNewOrder} className="text-yellow-900 bg-slate-50">
            <Plus className="mr-2 h-4 w-4" />
            Event Orders
          </Button>
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
              All orders
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingOrders}</div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{confirmedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Confirmed bookings
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

      {/* Event Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Orders</CardTitle>
              <CardDescription>
                View and manage all orders and special requests
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search orders..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-8 w-64" />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExport}>
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Postcode</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map(order => <TableRow key={order.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div className="font-medium">{order.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">{order.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm">{order.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div className="text-sm max-w-[150px] truncate">{order.address}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{order.postcode}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm max-w-[200px] truncate">{formatItemsDisplay(order.items)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-semibold">{formatPrice(calculateOrderTotal(order.items))}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={order.payment === "paid" ? "default" : order.payment === "pending" ? "secondary" : "destructive"}>
                      {order.payment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatDateWithUserSettings(order.date, settings?.date_format)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewOrder(order.id)}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditOrder(order.id)}>
                        Edit
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>)}
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
          {selectedOrder && <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
                  <p className="text-sm font-medium">{selectedOrder.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order Date</Label>
                  <p className="text-sm">{formatDateWithUserSettings(selectedOrder.date, settings?.date_format)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-sm">{selectedOrder.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                  <p className="text-sm">{selectedOrder.phone}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Address</Label>
                  <p className="text-sm">{selectedOrder.address}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Postcode</Label>
                  <p className="text-sm">{selectedOrder.postcode}</p>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Items</Label>
                <div className="space-y-2">
                  {Array.isArray(selectedOrder.items) ? selectedOrder.items.map((item: any, index: number) => <div key={index} className="text-sm border rounded p-2">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-muted-foreground">
                          Quantity: {item.quantity} × {formatPrice(item.price)} = {formatPrice(item.quantity * item.price)}
                        </div>
                      </div>) : <p className="text-sm">{selectedOrder.items}</p>}
                  {Array.isArray(selectedOrder.items) && <div className="text-sm font-semibold border-t pt-2">
                      Total: {formatPrice(calculateOrderTotal(selectedOrder.items))}
                    </div>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Status</Label>
                  <Badge variant={getStatusVariant(selectedOrder.status)} className="flex items-center gap-1 w-fit">
                    {getStatusIcon(selectedOrder.status)}
                    {selectedOrder.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Payment</Label>
                  <Badge variant={selectedOrder.payment === "paid" ? "default" : selectedOrder.payment === "pending" ? "secondary" : "destructive"}>
                    {selectedOrder.payment}
                  </Badge>
                </div>
              </div>
            </div>}
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
                Full Name *
              </Label>
              <Input id="edit-name" value={editOrderForm.name} onChange={e => setEditOrderForm({
              ...editOrderForm,
              name: e.target.value
            })} className="col-span-3" placeholder="Customer full name" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email *
              </Label>
              <Input id="edit-email" type="email" value={editOrderForm.email} onChange={e => setEditOrderForm({
              ...editOrderForm,
              email: e.target.value
            })} className="col-span-3" placeholder="customer@email.com" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone *
              </Label>
              <Input id="edit-phone" value={editOrderForm.phone} onChange={e => setEditOrderForm({
              ...editOrderForm,
              phone: e.target.value
            })} className="col-span-3" placeholder="+1 (555) 123-4567" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Address *
              </Label>
              <div className="col-span-3">
                <AddressAutocomplete
                  id="edit-address"
                  value={editOrderForm.address}
                  onChange={(value) => setEditOrderForm({
                    ...editOrderForm,
                    address: value
                  })}
                  onAddressSelect={(suggestion) => {
                    const formattedAddress = [
                      suggestion.address.house_number,
                      suggestion.address.road,
                      suggestion.address.suburb,
                      suggestion.address.city
                    ].filter(Boolean).join(", ");
                    
                    setEditOrderForm({
                      ...editOrderForm,
                      address: formattedAddress,
                      postcode: suggestion.address.postcode || editOrderForm.postcode
                    });
                  }}
                  placeholder="Start typing an address..."
                />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-postcode" className="text-right">
                Postcode *
              </Label>
              <Input id="edit-postcode" value={editOrderForm.postcode} onChange={e => setEditOrderForm({
              ...editOrderForm,
              postcode: e.target.value
            })} className="col-span-3" placeholder="12345" />
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
                  {categories.map(category => <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            {editOrderForm.category && <div className="grid grid-cols-4 items-center gap-4">
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
                    {inventoryItems.filter(item => item.category === editOrderForm.category).map(product => <SelectItem key={product.id} value={product.name}>
                        {product.name} - {formatPrice(product.price)}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

            {editOrderForm.product && <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-size" className="text-right">
                  Size
                </Label>
                <Select value={editOrderForm.size} onValueChange={value => setEditOrderForm({
              ...editOrderForm,
              size: value
            })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a size (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {[...new Set(inventoryItems.filter(item => item.name === editOrderForm.product).map(v => v.size).filter(Boolean))].map(size => <SelectItem key={size} value={size}>
                        {size}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}

            {editOrderForm.product && <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="edit-color" className="text-right">
                  Color
                </Label>
                <Select value={editOrderForm.color} onValueChange={value => setEditOrderForm({
              ...editOrderForm,
              color: value
            })}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select a color (optional)" />
                  </SelectTrigger>
                  <SelectContent className="bg-background border z-50">
                    {[...new Set(inventoryItems.filter(item => item.name === editOrderForm.product).map(v => v.color).filter(Boolean))].map(color => <SelectItem key={color} value={color}>
                        {color}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>}
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
    </div>;
};
export default Orders;