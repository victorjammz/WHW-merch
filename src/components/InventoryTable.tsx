import { useState } from "react";
import { Edit, Trash2, Package, QrCode, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarcodeGenerator } from "@/components/BarcodeGenerator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
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
  onRefresh?: () => void;
}

export function InventoryTable({ data, onRefresh }: InventoryTableProps) {
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [editItem, setEditItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    size: "",
    color: "",
    quantity: "",
    price: ""
  });
  const { toast } = useToast();
  const { formatPrice, getCurrencySymbol, currency } = useCurrency();

  const categories = ["Shirts", "Pants", "Dresses", "Outerwear", "Shoes", "Accessories", "Underwear", "Activewear"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = ["Black", "White", "Grey", "Navy", "Brown", "Beige", "Red", "Blue", "Green"];

  // Handle edit dialog
  const handleEditClick = (item: InventoryItem) => {
    setEditItem(item);
    setEditForm({
      name: item.name,
      category: item.category,
      size: item.size || "",
      color: item.color || "",
      quantity: item.quantity.toString(),
      price: item.price.toString()
    });
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editItem) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          name: editForm.name,
          category: editForm.category,
          size: editForm.size || null,
          color: editForm.color || null,
          quantity: parseInt(editForm.quantity),
          price: parseFloat(editForm.price)
        })
        .eq('id', editItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item updated successfully"
      });
      
      setEditItem(null);
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive"
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteItem) return;

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', deleteItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Item deleted successfully"
      });
      
      setDeleteItem(null);
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete item",
        variant: "destructive"
      });
    }
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
                  <TableCell className="text-sm">{formatPrice(item.price)}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusText(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                     <div className="flex gap-1">
                       <Button 
                         variant="outline" 
                         size="sm" 
                         title="Generate Barcode" 
                         className="h-8 w-8 p-0"
                         onClick={() => setSelectedItem(item)}
                       >
                         <QrCode className="h-3 w-3" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         title="Edit Item" 
                         className="h-8 w-8 p-0"
                         onClick={() => handleEditClick(item)}
                       >
                         <Edit className="h-3 w-3" />
                       </Button>
                       <Button 
                         variant="outline" 
                         size="sm" 
                         title="Delete Item" 
                         className="h-8 w-8 p-0"
                         onClick={() => setDeleteItem(item)}
                       >
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

      {/* Barcode Generator Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Generate Barcode</DialogTitle>
            <DialogDescription>
              Generate a barcode for {selectedItem?.name} (SKU: {selectedItem?.sku})
            </DialogDescription>
          </DialogHeader>
          {selectedItem && (
            <BarcodeGenerator 
              defaultValue={selectedItem.sku} 
              onGenerate={(code, type) => {
                // Optionally update the item's barcode in the database
                console.log(`Generated ${type} barcode: ${code} for ${selectedItem.name}`);
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Item Dialog */}
      <Dialog open={!!editItem} onOpenChange={() => setEditItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
            <DialogDescription>
              Update the details for {editItem?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Product Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                placeholder="Product name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-category">Category</Label>
              <Select value={editForm.category} onValueChange={(value) => setEditForm({...editForm, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-size">Size</Label>
                <Select value={editForm.size} onValueChange={(value) => setEditForm({...editForm, size: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    {sizes.map((size) => (
                      <SelectItem key={size} value={size}>{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-color">Color</Label>
                <Select value={editForm.color} onValueChange={(value) => setEditForm({...editForm, color: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {colors.map((color) => (
                      <SelectItem key={color} value={color}>{color}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                  placeholder="0"
                  min="0"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ({getCurrencySymbol(currency)})</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  placeholder="0.00"
                  min="0"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditItem(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave}>
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={() => setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}