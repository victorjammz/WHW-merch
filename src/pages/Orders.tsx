import { useState, useEffect } from "react";
import { Plus, Search, Download, Calendar, Clock, CheckCircle, XCircle, User, Mail, Phone, MapPin, ArrowRight, ArrowLeft, Check, ChevronsUpDown, Eye, Edit, Star, Trash2, Undo, ChevronUp, ChevronDown } from "lucide-react";
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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatDateWithUserSettings } from "@/utils/dateFormatting";
import { CreateOrderForm } from "@/components/CreateOrderForm";
import { EditOrderForm } from "@/components/EditOrderForm";

// Helper functions for color coding
const getColorValue = (colorName: string): string => {
  const colorMap: { [key: string]: string } = {
    'Black': '#000000',
    'White': '#FFFFFF', 
    'Grey': '#808080',
    'Gray': '#808080',
    'Navy': '#000080',
    'Brown': '#8B4513',
    'Beige': '#F5F5DC',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#008000'
  };
  return colorMap[colorName] || '#E5E7EB'; // Default to light gray
};

const getTextColor = (colorName: string): string => {
  const lightColors = ['White', 'Beige', 'Grey', 'Gray'];
  return lightColors.includes(colorName) ? '#000000' : '#FFFFFF';
};

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [deletedOrders, setDeletedOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [sortBy, setSortBy] = useState("created_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFilter, setDateFilter] = useState("all");
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isViewOrderOpen, setIsViewOrderOpen] = useState(false);
  const [isEditOrderOpen, setIsEditOrderOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { settings } = useUserSettings();

  useEffect(() => {
    fetchOrders();
    fetchDeletedOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('event_orders')
        .select('*')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Parse the items JSON string back to array for each order
      const ordersWithParsedItems = (data || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items || '[]') : order.items || []
      }));
      
      setOrders(ordersWithParsedItems);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch orders: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDeletedOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('event_orders')
        .select('*')
        .not('deleted_at', 'is', null)
        .gte('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('deleted_at', { ascending: false });

      if (error) throw error;
      
      // Parse the items JSON string back to array for each deleted order
      const deletedOrdersWithParsedItems = (data || []).map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items || '[]') : order.items || []
      }));
      
      setDeletedOrders(deletedOrdersWithParsedItems);
    } catch (error: any) {
      console.error('Error fetching deleted orders:', error);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('soft_delete_order', {
        order_id: orderId
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Order deleted successfully. It can be recovered within 30 days."
        });
        fetchOrders();
        fetchDeletedOrders();
      } else {
        toast({
          title: "Error",
          description: "Order not found or already deleted",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to delete order: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleRestoreOrder = async (orderId: string) => {
    try {
      const { data, error } = await supabase.rpc('restore_order', {
        order_id: orderId
      });

      if (error) throw error;

      if (data) {
        toast({
          title: "Success",
          description: "Order restored successfully"
        });
        fetchOrders();
        fetchDeletedOrders();
      } else {
        toast({
          title: "Error",
          description: "Order not found or restoration period expired (30 days)",
          variant: "destructive"
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to restore order: " + error.message,
        variant: "destructive"
      });
    }
  };

  const handleViewOrder = (orderId: string) => {
    const order = (activeTab === "active" ? orders : deletedOrders).find(o => o.id === orderId);
    setSelectedOrder(order);
    setIsViewOrderOpen(true);
  };

  const handleEditOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setSelectedOrder(order);
    setIsEditOrderOpen(true);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('event_orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order status updated successfully"
      });

      fetchOrders(); // Refresh the orders list
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to update order status: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "pending";
      case "in_progress": return "in-progress";
      case "shipped": return "shipped";
      case "delivered": return "delivered";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-3 w-3" />;
      case "in_progress": return <ArrowRight className="h-3 w-3" />;
      case "shipped": return <ArrowRight className="h-3 w-3" />;
      case "delivered": return <Check className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const filteredAndSortedOrders = (activeTab === "active" ? orders : deletedOrders)
    .filter(order => {
      const matchesSearch = order.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           order.event_name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = selectedStatus === "all" || order.status === selectedStatus;
      
      let matchesDate = true;
      if (dateFilter !== "all") {
        const orderDate = new Date(order.event_date);
        const today = new Date();
        const daysDiff = Math.ceil((orderDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case "today":
            matchesDate = daysDiff === 0;
            break;
          case "week":
            matchesDate = daysDiff >= 0 && daysDiff <= 7;
            break;
          case "month":
            matchesDate = daysDiff >= 0 && daysDiff <= 30;
            break;
          case "past":
            matchesDate = daysDiff < 0;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesDate;
    })
    .sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case "client_name":
          aValue = a.client_name?.toLowerCase() || "";
          bValue = b.client_name?.toLowerCase() || "";
          break;
        case "event_name":
          aValue = a.event_name?.toLowerCase() || "";
          bValue = b.event_name?.toLowerCase() || "";
          break;
        case "event_date":
          aValue = new Date(a.event_date).getTime();
          bValue = new Date(b.event_date).getTime();
          break;
        case "total_amount":
          aValue = parseFloat(a.total_amount) || 0;
          bValue = parseFloat(b.total_amount) || 0;
          break;
        case "status":
           aValue = a.status || "";
           bValue = b.status || "";
           break;
         case "payment_status":
           aValue = a.payment_status || "";
           bValue = b.payment_status || "";
           break;
        case "deleted_at":
          aValue = a.deleted_at ? new Date(a.deleted_at).getTime() : 0;
          bValue = b.deleted_at ? new Date(b.deleted_at).getTime() : 0;
          break;
        case "created_at":
        default:
          aValue = new Date(a.created_at).getTime();
          bValue = new Date(b.created_at).getTime();
          break;
      }
      
      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const inProgressOrders = orders.filter(o => o.status === "in_progress").length;
  const shippedOrders = orders.filter(o => o.status === "shipped").length;

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
        <p className="text-muted-foreground">
          Manage orders and special requests
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              All orders in the system
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
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{inProgressOrders}</div>
            <p className="text-xs text-muted-foreground">
              Currently processing
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shipped Orders</CardTitle>
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{shippedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Out for delivery
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Orders</TabsTrigger>
          <TabsTrigger value="deleted">Deleted Orders ({deletedOrders.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle>Active Orders</CardTitle>
                <CardDescription>
                  View and manage all active orders and special requests
                </CardDescription>
              </div>
              <Dialog open={isCreateOrderOpen} onOpenChange={setIsCreateOrderOpen}>
                <DialogTrigger asChild>
                  <Button className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    New Order
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Order - Step {currentStep} of 2</DialogTitle>
                    <DialogDescription>
                      Add a new event order to the system
                    </DialogDescription>
                  </DialogHeader>
                  <CreateOrderForm 
                    onSuccess={() => {
                      setIsCreateOrderOpen(false);
                      setCurrentStep(1);
                      fetchOrders();
                    }}
                    onCancel={() => {
                      setIsCreateOrderOpen(false);
                      setCurrentStep(1);
                    }}
                  />
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Next 7 Days</SelectItem>
                    <SelectItem value="month">Next 30 Days</SelectItem>
                    <SelectItem value="past">Past Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50 w-32" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-2">
                        Order ID
                        {renderSortIcon("created_at")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("event_name")}>
                      <div className="flex items-center gap-2">
                        Event Name
                        {renderSortIcon("event_name")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("client_name")}>
                      <div className="flex items-center gap-2">
                        Client
                        {renderSortIcon("client_name")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("event_date")}>
                      <div className="flex items-center gap-2">
                        Date
                        {renderSortIcon("event_date")}
                      </div>
                    </TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("total_amount")}>
                      <div className="flex items-center gap-2">
                        Total
                        {renderSortIcon("total_amount")}
                      </div>
                    </TableHead>
                     <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("status")}>
                       <div className="flex items-center gap-2">
                         Status
                         {renderSortIcon("status")}
                       </div>
                     </TableHead>
                     <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("payment_status")}>
                       <div className="flex items-center gap-2">
                         Payment
                         {renderSortIcon("payment_status")}
                       </div>
                     </TableHead>
                     <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>{order.event_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>{order.client_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{new Date(order.event_date).toLocaleDateString()}</TableCell>
                      <TableCell>{Array.isArray(order.items) ? order.items.length : 0} items</TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                        <TableCell className="py-4">
                          <Select 
                            value={order.status} 
                            onValueChange={(newStatus) => handleStatusChange(order.id, newStatus)}
                          >
                            <SelectTrigger className="w-36 h-8 p-1 border-none bg-transparent hover:bg-transparent">
                              <SelectValue>
                                <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-full h-6 px-2 text-xs">
                                  {getStatusIcon(order.status)}
                                  <span className="capitalize whitespace-nowrap">{order.status.replace('_', ' ')}</span>
                                </Badge>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent className="z-50">
                              <SelectItem value="pending">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-3 w-3" />
                                  Pending
                                </div>
                              </SelectItem>
                              <SelectItem value="in_progress">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-3 w-3" />
                                  In Progress
                                </div>
                              </SelectItem>
                              <SelectItem value="shipped">
                                <div className="flex items-center gap-2">
                                  <ArrowRight className="h-3 w-3" />
                                  Shipped
                                </div>
                              </SelectItem>
                              <SelectItem value="delivered">
                                <div className="flex items-center gap-2">
                                  <Check className="h-3 w-3" />
                                  Delivered
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                         </TableCell>
                        <TableCell>
                          <Badge variant={order.payment_status === 'paid' ? 'default' : 'secondary'}>
                            {order.payment_status || 'not paid'}
                          </Badge>
                        </TableCell>
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
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  This will delete the order. You can recover it within 30 days from the deleted orders tab.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedOrders.length === 0 && (
                     <TableRow>
                       <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                         No orders found
                       </TableCell>
                     </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deleted">
          <Card>
            <CardHeader>
              <CardTitle>Deleted Orders</CardTitle>
              <CardDescription>
                Orders deleted within the last 30 days. They can be restored or will be permanently deleted after 30 days.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search deleted orders..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">Next 7 Days</SelectItem>
                    <SelectItem value="month">Next 30 Days</SelectItem>
                    <SelectItem value="past">Past Events</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer hover:bg-muted/50 w-32" onClick={() => handleSort("created_at")}>
                      <div className="flex items-center gap-2">
                        Order ID
                        {renderSortIcon("created_at")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("event_name")}>
                      <div className="flex items-center gap-2">
                        Event Name
                        {renderSortIcon("event_name")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("client_name")}>
                      <div className="flex items-center gap-2">
                        Client
                        {renderSortIcon("client_name")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("event_date")}>
                      <div className="flex items-center gap-2">
                        Event Date
                        {renderSortIcon("event_date")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("total_amount")}>
                      <div className="flex items-center gap-2">
                        Total
                        {renderSortIcon("total_amount")}
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleSort("deleted_at")}>
                      <div className="flex items-center gap-2">
                        Deleted At
                        {renderSortIcon("deleted_at")}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedOrders.map((order) => (
                    <TableRow key={order.id} className="opacity-60">
                      <TableCell className="font-medium">{order.id.substring(0, 8)}...</TableCell>
                      <TableCell>{order.event_name}</TableCell>
                      <TableCell>{order.client_name}</TableCell>
                      <TableCell>{new Date(order.event_date).toLocaleDateString()}</TableCell>
                      <TableCell>{formatPrice(order.total_amount)}</TableCell>
                      <TableCell>{new Date(order.deleted_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreOrder(order.id)}
                          className="flex items-center gap-1"
                        >
                          <Undo className="h-4 w-4" />
                          Restore
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredAndSortedOrders.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No deleted orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Order Dialog */}
      <Dialog open={isViewOrderOpen} onOpenChange={setIsViewOrderOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Order Details - {selectedOrder?.id?.substring(0, 8)}...
            </DialogTitle>
            <DialogDescription>
              View complete order information including product variants
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <div className="grid gap-6 py-4">
              {/* Order Status and Payment Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Order Status</Label>
                  <Badge variant={getStatusVariant(selectedOrder.status)} className="mt-1 flex items-center gap-1 w-fit">
                    {getStatusIcon(selectedOrder.status)}
                    <span className="capitalize">{selectedOrder.status.replace('_', ' ')}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Payment Status</Label>
                  <Badge 
                    variant={selectedOrder.payment_status === 'paid' ? 'shipped' : selectedOrder.payment_status === 'partially_paid' ? 'in-progress' : 'pending'} 
                    className="mt-1 flex items-center gap-1 w-fit"
                  >
                    {selectedOrder.payment_status === 'paid' ? <CheckCircle className="h-3 w-3" /> : 
                     selectedOrder.payment_status === 'partially_paid' ? <Clock className="h-3 w-3" /> :
                     <XCircle className="h-3 w-3" />}
                    <span className="capitalize">{selectedOrder.payment_status?.replace('_', ' ') || 'Not Paid'}</span>
                  </Badge>
                </div>
              </div>

              {/* Event and Client Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Event Name</Label>
                  <p className="text-sm text-muted-foreground">
                    {(() => {
                      // Check if order uses multiple inventory sources
                      const hasMainInventory = selectedOrder.items?.some((item: any) => item.inventory_type === 'main');
                      const hasEventInventory = selectedOrder.items?.some((item: any) => item.inventory_type === 'event');
                      
                      if (hasMainInventory && hasEventInventory) {
                        return "Multi Order";
                      }
                      
                      return selectedOrder.event_name;
                    })()}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Client Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedOrder.client_name}</p>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="grid grid-cols-2 gap-4">
                {selectedOrder.client_email && (
                  <div>
                    <Label className="text-sm font-medium">Email</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{selectedOrder.client_email}</span>
                    </div>
                  </div>
                )}
                {selectedOrder.client_phone && (
                  <div>
                    <Label className="text-sm font-medium">Phone</Label>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{selectedOrder.client_phone}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Address Information */}
              {(selectedOrder.client_address || selectedOrder.client_postcode) && (
                <div>
                  <Label className="text-sm font-medium">Full Address</Label>
                  <div className="flex items-start gap-2 text-sm text-muted-foreground mt-1 p-3 bg-muted/50 rounded-lg">
                    <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                    <div className="space-y-1">
                      {selectedOrder.client_address && (
                        <p className="font-medium">{selectedOrder.client_address}</p>
                      )}
                      {selectedOrder.client_postcode && (
                        <p className="text-xs uppercase tracking-wide">{selectedOrder.client_postcode}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              {(selectedOrder.payment_method || selectedOrder.payment_reference) && (
                <div className="grid grid-cols-2 gap-4">
                  {selectedOrder.payment_method && (
                    <div>
                      <Label className="text-sm font-medium">Payment Method</Label>
                      <p className="text-sm text-muted-foreground capitalize">{selectedOrder.payment_method}</p>
                    </div>
                  )}
                  {selectedOrder.payment_reference && (
                    <div>
                      <Label className="text-sm font-medium">Payment Reference</Label>
                      <p className="text-sm text-muted-foreground font-mono">{selectedOrder.payment_reference}</p>
                    </div>
                  )}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Event Date</Label>
                  <p className="text-sm text-muted-foreground">{new Date(selectedOrder.event_date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Total Amount</Label>
                  <p className="text-lg font-bold text-primary">{formatPrice(selectedOrder.total_amount)}</p>
                </div>
              </div>
              
              {/* Product Variants - Enhanced Display */}
              {selectedOrder.items && Array.isArray(selectedOrder.items) && selectedOrder.items.length > 0 ? (
                <div>
                  <Label className="text-sm font-medium">Product Variants ({selectedOrder.items.length} items)</Label>
                  <div className="mt-3 space-y-3">
                    {selectedOrder.items.map((item: any, index: number) => (
                      <div key={index} className="border rounded-lg p-4 bg-card">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-foreground">
                              {item.name || 'Product Name Not Available'}
                            </h4>
                            <div className="flex flex-wrap gap-2 mt-2">
                               {/* Inventory Source Badge */}
                               {item.inventory_type && (
                                 <Badge 
                                   variant={item.inventory_type === 'main' ? 'default' : 'secondary'} 
                                   className="text-xs"
                                 >
                                   {item.inventory_type === 'main' ? 'Main Inventory' : `Event: ${item.event_name || 'Unknown Event'}`}
                                 </Badge>
                               )}
                              {item.size && (
                                <Badge variant="outline" className="text-xs">
                                  Size: {item.size}
                                </Badge>
                              )}
                              {item.color && (
                                <Badge 
                                  variant="outline" 
                                  className="text-xs"
                                  style={{
                                    backgroundColor: getColorValue(item.color),
                                    color: getTextColor(item.color),
                                    borderColor: getColorValue(item.color)
                                  }}
                                >
                                  {item.color}
                                </Badge>
                              )}
                              {item.sku && (
                                <Badge variant="secondary" className="text-xs font-mono">
                                  SKU: {item.sku}
                                </Badge>
                              )}
                             </div>
                           </div>
                          <div className="text-right ml-4">
                            <p className="text-sm font-medium">Qty: {item.quantity || 'N/A'}</p>
                            <p className="text-xs text-muted-foreground">@ {formatPrice(item.price || 0)}</p>
                            <p className="text-sm font-bold text-primary">{formatPrice((item.price || 0) * (item.quantity || 0))}</p>
                          </div>
                        </div>
                        {item.notes && (
                          <div className="mt-2 pt-2 border-t">
                            <p className="text-xs text-muted-foreground italic">Notes: {item.notes}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium">Product Variants</Label>
                  <p className="text-sm text-muted-foreground mt-1">No items found in this order</p>
                </div>
              )}
              
              {selectedOrder.notes && (
                <div>
                  <Label className="text-sm font-medium">Order Notes</Label>
                  <div className="mt-1 p-3 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
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
              Update order information
            </DialogDescription>
          </DialogHeader>
          {selectedOrder && (
            <EditOrderForm 
              order={selectedOrder}
              onSuccess={() => {
                setIsEditOrderOpen(false);
                fetchOrders();
                toast({
                  title: "Success",
                  description: "Order updated successfully"
                });
              }}
              onCancel={() => setIsEditOrderOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;