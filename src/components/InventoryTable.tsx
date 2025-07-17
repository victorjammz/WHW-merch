import { Edit, Trash2, Package, QrCode, ZoomIn } from "lucide-react";
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
      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-16">Image</TableHead>
                <TableHead className="min-w-[100px]">SKU</TableHead>
                <TableHead className="min-w-[150px]">Product Name</TableHead>
                <TableHead className="min-w-[100px] hidden sm:table-cell">Category</TableHead>
                <TableHead className="min-w-[80px] hidden md:table-cell">Size</TableHead>
                <TableHead className="min-w-[80px] hidden md:table-cell">Color</TableHead>
                <TableHead className="min-w-[80px]">Qty</TableHead>
                <TableHead className="min-w-[80px]">Price</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
                <TableHead className="min-w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
          <TableBody>
            {data.length > 0 ? (
              data.map((item) => (
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
                  <TableCell className="font-mono text-xs md:text-sm">{item.sku}</TableCell>
                  <TableCell className="font-medium text-sm">{item.name}</TableCell>
                  <TableCell className="hidden sm:table-cell text-sm">{item.category}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{item.size}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm">{item.color}</TableCell>
                  <TableCell className="font-semibold text-sm">{item.quantity}</TableCell>
                  <TableCell className="text-sm">${item.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" title="Generate Barcode" className="h-8 w-8 p-0">
                        <QrCode className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" title="Edit Item" className="h-8 w-8 p-0">
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" title="Delete Item" className="h-8 w-8 p-0">
                        <Trash2 className="h-3 w-3" />
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
                    <p className="text-sm text-muted-foreground">No inventory items found</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}