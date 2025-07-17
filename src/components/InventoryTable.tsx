import { useState } from "react";
import { Search, Edit, Trash2, Package, QrCode, ZoomIn } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";

interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  size: string | null;
  color: string | null;
  quantity: number;  
  price: number;
  status: "low" | "medium" | "high";
  image_url?: string | null;
}

interface InventoryTableProps {
  data: InventoryItem[];
}

export function InventoryTable({ data }: InventoryTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredData, setFilteredData] = useState(data);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      setFilteredData(data);
      return;
    }
    
    const searchLower = term.toLowerCase();
    const filtered = data.filter(item => {
      // Search across all text-based fields
      return (
        // Standard fields
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
        (item.category && item.category.toLowerCase().includes(searchLower)) ||
        // Optional fields with null check
        (item.size && item.size.toLowerCase().includes(searchLower)) ||
        (item.color && item.color.toLowerCase().includes(searchLower)) ||
        // Convert numbers to string for searching
        (item.quantity.toString().includes(searchLower)) ||
        (item.price.toString().includes(searchLower)) ||
        // Status field
        (item.status && item.status.toLowerCase().includes(searchLower))
      );
    });
    setFilteredData(filtered);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "low":
        return "bg-inventory-low text-white";
      case "medium":
        return "bg-inventory-medium text-warning-foreground";
      case "high":
        return "bg-inventory-high text-white";
      default:
        return "bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "low":
        return "Low Stock";
      case "medium":
        return "Medium";
      case "high":
        return "In Stock";
      default:
        return "Unknown";
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search across all fields (name, SKU, price, quantity, etc.)"
          value={searchTerm}
          onChange={(e) => handleSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Image</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Color</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/20">
                  <TableCell>
                    {item.image_url ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <div className="h-12 w-12 rounded-md overflow-hidden border border-border relative group cursor-pointer">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="h-full w-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <ZoomIn className="h-5 w-5 text-white" />
                            </div>
                          </div>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-72 p-0">
                          <div className="relative aspect-square overflow-hidden rounded-md">
                            <img 
                              src={item.image_url} 
                              alt={item.name} 
                              className="h-full w-full object-contain"
                            />
                          </div>
                          <div className="p-3">
                            <h4 className="font-medium text-sm">{item.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">SKU: {item.sku}</p>
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.color}</TableCell>
                  <TableCell className="font-semibold">{item.quantity}</TableCell>
                  <TableCell>${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" title="Generate Barcode">
                        <QrCode className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Edit Item">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" title="Delete Item">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8">
                  <div className="flex flex-col items-center space-y-2">
                    <Package className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No inventory items found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}