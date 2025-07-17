import { useState } from "react";
import { Plus, Package, ShoppingCart, TrendingUp, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InventoryTable } from "@/components/InventoryTable";
import { AddInventoryForm } from "@/components/AddInventoryForm";
import { POSConnectionCard } from "@/components/POSConnectionCard";

// Mock data for demonstration
const mockInventoryData = [
  {
    id: "1",
    sku: "CLT-001",
    name: "Classic Cotton T-Shirt",
    category: "Shirts",
    size: "M",
    color: "White",
    quantity: 45,
    price: 29.99,
    status: "high" as const
  },
  {
    id: "2", 
    sku: "JNS-002",
    name: "Slim Fit Jeans",
    category: "Pants",
    size: "32",
    color: "Blue",
    quantity: 12,
    price: 89.99,
    status: "medium" as const
  },
  {
    id: "3",
    sku: "JKT-003", 
    name: "Leather Jacket",
    category: "Outerwear",
    size: "L",
    color: "Black",
    quantity: 3,
    price: 199.99,
    status: "low" as const
  }
];

const Index = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [inventoryData, setInventoryData] = useState(mockInventoryData);

  const stats = {
    totalItems: inventoryData.reduce((sum, item) => sum + item.quantity, 0),
    totalValue: inventoryData.reduce((sum, item) => sum + (item.quantity * item.price), 0),
    lowStockItems: inventoryData.filter(item => item.status === "low").length,
    totalProducts: inventoryData.length
  };

  const handleAddInventory = (newItem: any) => {
    const item = {
      id: Date.now().toString(),
      ...newItem,
      status: newItem.quantity > 20 ? "high" : newItem.quantity > 10 ? "medium" : "low"
    };
    setInventoryData([...inventoryData, item]);
    setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="container mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-bold text-foreground mb-2">Inventory Management</h1>
            <p className="text-muted-foreground text-lg">Manage your clothing store inventory efficiently</p>
          </div>
          <Button 
            onClick={() => setShowAddForm(true)} 
            size="lg"
            className="bg-gradient-primary hover:opacity-90 shadow-elegant"
          >
            <Plus className="mr-2 h-5 w-5" />
            Add Item
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Items</CardTitle>
              <Package className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems}</div>
              <p className="text-xs text-muted-foreground">Items in stock</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Value</CardTitle>
              <TrendingUp className="h-5 w-5 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.totalValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Inventory value</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products</CardTitle>
              <ShoppingCart className="h-5 w-5 text-accent-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalProducts}</div>
              <p className="text-xs text-muted-foreground">Unique products</p>
            </CardContent>
          </Card>

          <Card className="shadow-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
              <AlertTriangle className="h-5 w-5 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-warning">{stats.lowStockItems}</div>
              <p className="text-xs text-muted-foreground">Items need restock</p>
            </CardContent>
          </Card>
        </div>

        {/* POS Connection */}
        <POSConnectionCard />

        {/* Inventory Table */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Inventory Overview</CardTitle>
            <CardDescription>
              Manage your clothing inventory, track stock levels, and monitor product performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InventoryTable data={inventoryData} />
          </CardContent>
        </Card>

        {/* Add Inventory Modal */}
        {showAddForm && (
          <AddInventoryForm 
            onAdd={handleAddInventory}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Index;