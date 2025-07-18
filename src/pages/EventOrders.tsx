import { useState, useEffect } from "react";
import { Plus, Search, Download, Calendar, Clock, CheckCircle, XCircle, User, Mail, Phone, MapPin, ArrowRight, ArrowLeft, Check, ChevronsUpDown, Eye, Edit } from "lucide-react";
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

// Mock event order data
const initialEventOrders = [
  {
    id: "EO-001",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+1 (555) 123-4567",
    address: "123 Main St",
    postcode: "10001",
    items: "Wedding Package - Premium",
    status: "confirmed",
    payment: "paid",
    date: "2024-02-15"
  },
  {
    id: "EO-002",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+1 (555) 987-6543",
    address: "456 Oak Avenue",
    postcode: "10002",
    items: "Birthday Party Package",
    status: "pending",
    payment: "pending",
    date: "2024-02-20"
  },
  {
    id: "EO-003",
    name: "Mike Wilson",
    email: "mike.wilson@email.com",
    phone: "+1 (555) 456-7890",
    address: "789 Pine Road",
    postcode: "10003",
    items: "Corporate Event Setup",
    status: "in_progress",
    payment: "paid",
    date: "2024-02-25"
  }
];

const EventOrders = () => {
  const [orders, setOrders] = useState(initialEventOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
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
    items: "",
    status: "pending",
    payment: "pending"
  });
  const [newOrderForm, setNewOrderForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    postcode: "",
    items: "",
    status: "pending",
    payment: "pending"
  });
  const { toast } = useToast();

  // Fetch inventory items when dialog opens
  useEffect(() => {
    if (isNewOrderOpen) {
      fetchInventoryItems();
    }
  }, [isNewOrderOpen]);

  const fetchInventoryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, name, sku, price, quantity')
        .gt('quantity', 0);
      
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
      items: "",
      status: "pending",
      payment: "pending"
    });
  };

  const validateStep1 = () => {
    return newOrderForm.name && 
           newOrderForm.email && 
           newOrderForm.phone && 
           newOrderForm.address && 
           newOrderForm.postcode && 
           newOrderForm.items;
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
    if (!newOrderForm.name || !newOrderForm.email || !newOrderForm.phone || !newOrderForm.address || !newOrderForm.postcode || !newOrderForm.items) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newOrder = {
      id: generateOrderId(),
      name: newOrderForm.name,
      email: newOrderForm.email,
      phone: newOrderForm.phone,
      address: newOrderForm.address,
      postcode: newOrderForm.postcode,
      items: newOrderForm.items,
      status: newOrderForm.status,
      payment: newOrderForm.payment,
      date: new Date().toISOString().split('T')[0]
    };

    setOrders([newOrder, ...orders]);
    setNewOrderForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
      items: "",
      status: "pending",
      payment: "pending"
    });
    setCurrentStep(1);
    setIsNewOrderOpen(false);
    
    toast({
      title: "Event Order Created",
      description: `Event order ${newOrder.id} has been created successfully`,
    });
  };

  const handleExport = () => {
    const csvContent = filteredOrders.map(order => 
      `${order.id},${order.name},${order.email},${order.phone},${order.address},${order.postcode},${order.items},${order.status},${order.payment},${order.date}`
    ).join('\n');
    
    const blob = new Blob([`Order ID,Name,Email,Phone,Address,Postcode,Items,Status,Payment,Date\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'event-orders.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Event orders exported to CSV file",
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
      setEditOrderForm({
        name: order.name,
        email: order.email,
        phone: order.phone,
        address: order.address,
        postcode: order.postcode,
        items: order.items,
        status: order.status,
        payment: order.payment
      });
      setIsEditOrderOpen(true);
      fetchInventoryItems();
    }
  };

  const handleUpdateOrder = () => {
    if (!editOrderForm.name || !editOrderForm.email || !editOrderForm.phone || !editOrderForm.address || !editOrderForm.postcode || !editOrderForm.items) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const updatedOrders = orders.map(order => 
      order.id === selectedOrder.id 
        ? {
            ...order,
            name: editOrderForm.name,
            email: editOrderForm.email,
            phone: editOrderForm.phone,
            address: editOrderForm.address,
            postcode: editOrderForm.postcode,
            items: editOrderForm.items,
            status: editOrderForm.status,
            payment: editOrderForm.payment
          }
        : order
    );

    setOrders(updatedOrders);
    setIsEditOrderOpen(false);
    setSelectedOrder(null);
    setEditOrderForm({
      name: "",
      email: "",
      phone: "",
      address: "",
      postcode: "",
      items: "",
      status: "pending",
      payment: "pending"
    });

    toast({
      title: "Order Updated",
      description: `Order ${selectedOrder.id} has been updated successfully`,
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const confirmedOrders = orders.filter(o => o.status === "confirmed").length;
  const inProgressOrders = orders.filter(o => o.status === "in_progress").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "confirmed": return <CheckCircle className="h-4 w-4" />;
      case "in_progress": return <Calendar className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "confirmed": return "default";
      case "in_progress": return "default";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Orders</h1>
          <p className="text-muted-foreground">
            Manage event bookings and special orders
          </p>
        </div>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewOrder}>
              <Plus className="mr-2 h-4 w-4" />
              New Event Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Event Order - Step {currentStep} of 2</DialogTitle>
              <DialogDescription>
                {currentStep === 1 
                  ? "Enter customer details and select items for the event order."
                  : "Set the order status and payment information."
                }
              </DialogDescription>
            </DialogHeader>

            {currentStep === 1 && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    Full Name *
                  </Label>
                  <Input
                    id="name"
                    value={newOrderForm.name}
                    onChange={(e) => setNewOrderForm({...newOrderForm, name: e.target.value})}
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
                    onChange={(e) => setNewOrderForm({...newOrderForm, email: e.target.value})}
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
                    onChange={(e) => setNewOrderForm({...newOrderForm, phone: e.target.value})}
                    className="col-span-3"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="address" className="text-right">
                    Address *
                  </Label>
                  <Input
                    id="address"
                    value={newOrderForm.address}
                    onChange={(e) => setNewOrderForm({...newOrderForm, address: e.target.value})}
                    className="col-span-3"
                    placeholder="Street address"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="postcode" className="text-right">
                    Postcode *
                  </Label>
                  <Input
                    id="postcode"
                    value={newOrderForm.postcode}
                    onChange={(e) => setNewOrderForm({...newOrderForm, postcode: e.target.value})}
                    className="col-span-3"
                    placeholder="12345"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="items" className="text-right">
                    Items *
                  </Label>
                  <Popover open={isItemsPopoverOpen} onOpenChange={setIsItemsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isItemsPopoverOpen}
                        className="col-span-3 justify-between"
                      >
                        {newOrderForm.items || "Search and select items from inventory..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder="Search inventory items..." />
                        <CommandList>
                          <CommandEmpty>No inventory items found.</CommandEmpty>
                          <CommandGroup>
                            {inventoryItems.map((item) => (
                              <CommandItem
                                key={item.id}
                                value={item.name}
                                onSelect={(currentValue) => {
                                  setNewOrderForm({...newOrderForm, items: currentValue});
                                  setIsItemsPopoverOpen(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    newOrderForm.items === item.name ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span className="font-medium">{item.name}</span>
                                  <span className="text-sm text-muted-foreground">
                                    ${item.price} • Stock: {item.quantity} • SKU: {item.sku}
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
              </div>
            )}

            {currentStep === 2 && (
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="status" className="text-right">
                    Status *
                  </Label>
                  <Select value={newOrderForm.status} onValueChange={(value) => setNewOrderForm({...newOrderForm, status: value})}>
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
                  <Select value={newOrderForm.payment} onValueChange={(value) => setNewOrderForm({...newOrderForm, payment: value})}>
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
                      Create Event Order
                    </Button>
                  )}
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
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
              All event orders
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
              <CardTitle>Event Orders</CardTitle>
              <CardDescription>
                View and manage all event bookings and special orders
              </CardDescription>
            </div>
            <div className="flex gap-4">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
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
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
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
                    <div className="text-sm max-w-[200px] truncate">{order.items}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={order.payment === "paid" ? "default" : order.payment === "pending" ? "secondary" : "destructive"}
                    >
                      {order.payment}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{order.date}</div>
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
                  <Label className="text-sm font-medium text-muted-foreground">Customer Name</Label>
                  <p className="text-sm font-medium">{selectedOrder.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Order Date</Label>
                  <p className="text-sm">{selectedOrder.date}</p>
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
                <p className="text-sm">{selectedOrder.items}</p>
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
                  <Badge 
                    variant={selectedOrder.payment === "paid" ? "default" : selectedOrder.payment === "pending" ? "secondary" : "destructive"}
                  >
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
                Full Name *
              </Label>
              <Input
                id="edit-name"
                value={editOrderForm.name}
                onChange={(e) => setEditOrderForm({...editOrderForm, name: e.target.value})}
                className="col-span-3"
                placeholder="Customer full name"
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
                onChange={(e) => setEditOrderForm({...editOrderForm, email: e.target.value})}
                className="col-span-3"
                placeholder="customer@email.com"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone *
              </Label>
              <Input
                id="edit-phone"
                value={editOrderForm.phone}
                onChange={(e) => setEditOrderForm({...editOrderForm, phone: e.target.value})}
                className="col-span-3"
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-address" className="text-right">
                Address *
              </Label>
              <Input
                id="edit-address"
                value={editOrderForm.address}
                onChange={(e) => setEditOrderForm({...editOrderForm, address: e.target.value})}
                className="col-span-3"
                placeholder="Street address"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-postcode" className="text-right">
                Postcode *
              </Label>
              <Input
                id="edit-postcode"
                value={editOrderForm.postcode}
                onChange={(e) => setEditOrderForm({...editOrderForm, postcode: e.target.value})}
                className="col-span-3"
                placeholder="12345"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-items" className="text-right">
                Items *
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    className="col-span-3 justify-between"
                  >
                    {editOrderForm.items || "Search and select items from inventory..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search inventory items..." />
                    <CommandList>
                      <CommandEmpty>No inventory items found.</CommandEmpty>
                      <CommandGroup>
                        {inventoryItems.map((item) => (
                          <CommandItem
                            key={item.id}
                            value={item.name}
                            onSelect={(currentValue) => {
                              setEditOrderForm({...editOrderForm, items: currentValue});
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                editOrderForm.items === item.name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-sm text-muted-foreground">
                                ${item.price} • Stock: {item.quantity} • SKU: {item.sku}
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
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">
                Status *
              </Label>
              <Select value={editOrderForm.status} onValueChange={(value) => setEditOrderForm({...editOrderForm, status: value})}>
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
              <Select value={editOrderForm.payment} onValueChange={(value) => setEditOrderForm({...editOrderForm, payment: value})}>
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

export default EventOrders;