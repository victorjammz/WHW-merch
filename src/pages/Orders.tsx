import { useState } from "react";
import { Plus, Search, Filter, Download, Package, Clock, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

// Mock order data
const initialMockOrders = [
  {
    id: "ORD-001",
    customer: "John Smith",
    items: 3,
    total: 125.00,
    status: "completed",
    date: "2024-01-15",
    paymentStatus: "paid"
  },
  {
    id: "ORD-002",
    customer: "Sarah Johnson",
    items: 2,
    total: 85.00,
    status: "processing",
    date: "2024-01-14",
    paymentStatus: "paid"
  },
  {
    id: "ORD-003",
    customer: "Mike Wilson",
    items: 1,
    total: 45.00,
    status: "pending",
    date: "2024-01-13",
    paymentStatus: "pending"
  },
  {
    id: "ORD-004",
    customer: "Emma Davis",
    items: 5,
    total: 225.00,
    status: "shipped",
    date: "2024-01-12",
    paymentStatus: "paid"
  },
  {
    id: "ORD-005",
    customer: "Tom Brown",
    items: 2,
    total: 95.00,
    status: "cancelled",
    date: "2024-01-11",
    paymentStatus: "refunded"
  }
];

const Orders = () => {
  const [orders, setOrders] = useState(initialMockOrders);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isNewOrderOpen, setIsNewOrderOpen] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    customer: "",
    items: "",
    total: "",
    status: "pending",
    paymentStatus: "pending"
  });
  const { toast } = useToast();

  const generateOrderId = () => {
    const nextNumber = orders.length + 1;
    return `ORD-${String(nextNumber).padStart(3, '0')}`;
  };

  const handleNewOrder = () => {
    setIsNewOrderOpen(true);
  };

  const handleCreateOrder = () => {
    if (!newOrderForm.customer || !newOrderForm.items || !newOrderForm.total) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    const newOrder = {
      id: generateOrderId(),
      customer: newOrderForm.customer,
      items: parseInt(newOrderForm.items),
      total: parseFloat(newOrderForm.total),
      status: newOrderForm.status,
      date: new Date().toISOString().split('T')[0],
      paymentStatus: newOrderForm.paymentStatus
    };

    setOrders([newOrder, ...orders]);
    setNewOrderForm({
      customer: "",
      items: "",
      total: "",
      status: "pending",
      paymentStatus: "pending"
    });
    setIsNewOrderOpen(false);
    
    toast({
      title: "Order Created",
      description: `Order ${newOrder.id} has been created successfully`,
    });
  };

  const handleExport = () => {
    const csvContent = filteredOrders.map(order => 
      `${order.id},${order.customer},${order.items},${order.total},${order.status},${order.paymentStatus},${order.date}`
    ).join('\n');
    
    const blob = new Blob([`Order ID,Customer,Items,Total,Status,Payment,Date\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'orders.csv';
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Orders exported to CSV file",
    });
  };

  const handleViewOrder = (orderId: string) => {
    toast({
      title: "View Order",
      description: `Opening order details for ${orderId}`,
    });
  };

  const handleEditOrder = (orderId: string) => {
    toast({
      title: "Edit Order",
      description: `Opening edit form for order ${orderId}`,
    });
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === "pending").length;
  const completedOrders = orders.filter(o => o.status === "completed").length;
  const totalRevenue = orders.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + o.total, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "processing": return <Package className="h-4 w-4" />;
      case "shipped": return <Package className="h-4 w-4" />;
      case "completed": return <CheckCircle className="h-4 w-4" />;
      case "cancelled": return <XCircle className="h-4 w-4" />;
      default: return null;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "pending": return "secondary";
      case "processing": return "default";
      case "shipped": return "default";
      case "completed": return "default";
      case "cancelled": return "destructive";
      default: return "secondary";
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Order Management</h1>
          <p className="text-muted-foreground">
            Track and manage customer orders
          </p>
        </div>
        <Dialog open={isNewOrderOpen} onOpenChange={setIsNewOrderOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNewOrder}>
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <DialogDescription>
                Add a new order to the system. Fill in the customer details and order information.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="customer" className="text-right">
                  Customer *
                </Label>
                <Input
                  id="customer"
                  value={newOrderForm.customer}
                  onChange={(e) => setNewOrderForm({...newOrderForm, customer: e.target.value})}
                  className="col-span-3"
                  placeholder="Customer name"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="items" className="text-right">
                  Items *
                </Label>
                <Input
                  id="items"
                  type="number"
                  value={newOrderForm.items}
                  onChange={(e) => setNewOrderForm({...newOrderForm, items: e.target.value})}
                  className="col-span-3"
                  placeholder="Number of items"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="total" className="text-right">
                  Total *
                </Label>
                <Input
                  id="total"
                  type="number"
                  step="0.01"
                  value={newOrderForm.total}
                  onChange={(e) => setNewOrderForm({...newOrderForm, total: e.target.value})}
                  className="col-span-3"
                  placeholder="Order total"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">
                  Status
                </Label>
                <Select value={newOrderForm.status} onValueChange={(value) => setNewOrderForm({...newOrderForm, status: value})}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="shipped">Shipped</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="payment" className="text-right">
                  Payment
                </Label>
                <Select value={newOrderForm.paymentStatus} onValueChange={(value) => setNewOrderForm({...newOrderForm, paymentStatus: value})}>
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
              <Button variant="outline" onClick={() => setIsNewOrderOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateOrder}>Create Order</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              All time orders
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
              Need attention
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Successfully fulfilled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From completed orders
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
                View and manage all customer orders
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
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
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
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
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
                    <div className="font-medium">{order.id}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{order.customer}</div>
                  </TableCell>
                  <TableCell>
                    <div>{order.items} items</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">${order.total.toFixed(2)}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status)} className="flex items-center gap-1 w-fit">
                      {getStatusIcon(order.status)}
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={order.paymentStatus === "paid" ? "default" : order.paymentStatus === "pending" ? "secondary" : "destructive"}
                    >
                      {order.paymentStatus}
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
    </div>
  );
};

export default Orders;