import { useState } from "react";
import { Plus, Search, Mail, Phone, MapPin, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useUserSettings } from "@/hooks/useUserSettings";
import { formatDateWithUserSettings } from "@/utils/dateFormatting";

// Mock customer data
const mockCustomers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@email.com",
    phone: "+44 7911 123456",
    location: "New York, NY",
    orders: 12,
    totalSpent: 450.00,
    lastOrder: "2024-01-15",
    status: "active"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@email.com",
    phone: "+353 87 123 4567",
    location: "Los Angeles, CA",
    orders: 8,
    totalSpent: 320.00,
    lastOrder: "2024-01-10",
    status: "active"
  },
  {
    id: "3",
    name: "Mike Wilson",
    email: "mike.wilson@email.com",
    phone: "+44 20 7946 0958",
    location: "Chicago, IL",
    orders: 3,
    totalSpent: 125.00,
    lastOrder: "2023-12-20",
    status: "inactive"
  }
];

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();
  const { formatPrice } = useCurrency();
  const { settings } = useUserSettings();

  const handleAddCustomer = () => {
    toast({
      title: "Add Customer",
      description: "New customer form would open here",
    });
  };

  const handleViewCustomer = (customerId: string, customerName: string) => {
    toast({
      title: "View Customer",
      description: `Opening details for ${customerName}`,
    });
  };

  const handleEditCustomer = (customerId: string, customerName: string) => {
    toast({
      title: "Edit Customer",
      description: `Opening edit form for ${customerName}`,
    });
  };

  const filteredCustomers = mockCustomers.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCustomers = mockCustomers.length;
  const activeCustomers = mockCustomers.filter(c => c.status === "active").length;
  const totalRevenue = mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrderValue = totalRevenue / mockCustomers.reduce((sum, c) => sum + c.orders, 0);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
          <p className="text-muted-foreground">
            Manage your customer relationships and data
          </p>
        </div>
        <Button onClick={handleAddCustomer}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Registered customers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Customers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeCustomers}</div>
            <p className="text-xs text-muted-foreground">
              Recently active
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From all customers
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPrice(avgOrderValue)}</div>
            <p className="text-xs text-muted-foreground">
              Per order
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Customer Table */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Customers</CardTitle>
              <CardDescription>
                View and manage your customer database
              </CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Orders</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Last Order</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {customer.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {customer.location}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        {customer.email}
                      </div>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Phone className="h-3 w-3 mr-1" />
                        {customer.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{customer.orders}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{formatPrice(customer.totalSpent)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formatDateWithUserSettings(customer.lastOrder, settings?.date_format)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={customer.status === "active" ? "default" : "secondary"}
                    >
                      {customer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleViewCustomer(customer.id, customer.name)}>
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleEditCustomer(customer.id, customer.name)}>
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

export default Customers;