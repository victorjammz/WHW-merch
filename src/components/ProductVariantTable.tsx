import { useState } from "react";
import { Edit, Trash2, Package, QrCode, ZoomIn, ChevronUp, ChevronDown, Eye, EyeOff } from "lucide-react";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;  
  price: number;
  status: "low" | "medium" | "high";
  image_url?: string | null;
  barcode_text?: string | null;
  barcode_type?: string | null;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  image_url?: string | null;
  variants: ProductVariant[];
}

type SortField = 'sku' | 'color' | 'size' | 'quantity' | 'price' | 'status';
type SortDirection = 'asc' | 'desc';

interface ProductVariantTableProps {
  data: Product[];
  onRefresh?: () => void;
}

export function ProductVariantTable({ data, onRefresh }: ProductVariantTableProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [editVariant, setEditVariant] = useState<ProductVariant | null>(null);
  const [deleteVariant, setDeleteVariant] = useState<ProductVariant | null>(null);
  const [sortField, setSortField] = useState<SortField>('sku');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());
  const [editForm, setEditForm] = useState({
    color: "",
    size: "",
    quantity: "",
    price: ""
  });
  const { toast } = useToast();
  const { formatPrice, getCurrencySymbol } = useCurrency();

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = ["Black", "White", "Grey", "Navy", "Brown", "Beige", "Red", "Blue", "Green"];

  const toggleProductExpansion = (productId: string) => {
    const newExpanded = new Set(expandedProducts);
    if (newExpanded.has(productId)) {
      newExpanded.delete(productId);
    } else {
      newExpanded.add(productId);
    }
    setExpandedProducts(newExpanded);
  };

  const getAllVariants = () => {
    return data.flatMap(product => 
      product.variants.map(variant => ({
        ...variant,
        productName: product.name,
        productCategory: product.category
      }))
    );
  };

  // Sort variants
  const sortedVariants = getAllVariants().sort((a, b) => {
    let aValue: any = a[sortField];
    let bValue: any = b[sortField];

    // Handle null/undefined values
    if (aValue === null || aValue === undefined) aValue = '';
    if (bValue === null || bValue === undefined) bValue = '';

    // Convert to strings for comparison, except for numbers
    if (sortField === 'quantity' || sortField === 'price') {
      aValue = Number(aValue);
      bValue = Number(bValue);
    } else {
      aValue = String(aValue).toLowerCase();
      bValue = String(bValue).toLowerCase();
    }

    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  // Handle edit dialog
  const handleEditClick = (variant: ProductVariant) => {
    setEditVariant(variant);
    setEditForm({
      color: variant.color || "",
      size: variant.size || "",
      quantity: variant.quantity.toString(),
      price: variant.price.toString()
    });
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editVariant) return;

    try {
      const { error } = await supabase
        .from('product_variants')
        .update({
          color: editForm.color || null,
          size: editForm.size || null,
          quantity: parseInt(editForm.quantity),
          price: parseFloat(editForm.price)
        })
        .eq('id', editVariant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variant updated successfully"
      });
      
      setEditVariant(null);
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update variant",
        variant: "destructive"
      });
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!deleteVariant) return;

    try {
      const { error } = await supabase
        .from('product_variants')
        .delete()
        .eq('id', deleteVariant.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Variant deleted successfully"
      });
      
      setDeleteVariant(null);
      onRefresh?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete variant",
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
      {/* Grouped by Product View */}
      <div className="space-y-4">
        {data.map((product) => (
          <div key={product.id} className="border rounded-lg overflow-hidden">
            <Collapsible
              open={expandedProducts.has(product.id)}
              onOpenChange={() => toggleProductExpansion(product.id)}
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 cursor-pointer">
                  <div className="flex items-center gap-4">
                    {product.image_url ? (
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="h-12 w-12 rounded-md object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {product.category} • {product.variants.length} variant{product.variants.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {product.variants.reduce((sum, v) => sum + v.quantity, 0)} total items
                    </Badge>
                    {expandedProducts.has(product.id) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              
              <CollapsibleContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/20">
                      <TableRow>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead 
                          className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('sku')}
                        >
                          <div className="flex items-center gap-1">
                            SKU
                            {renderSortIcon('sku')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="min-w-[80px] cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('color')}
                        >
                          <div className="flex items-center gap-1">
                            Color
                            {renderSortIcon('color')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="min-w-[80px] cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('size')}
                        >
                          <div className="flex items-center gap-1">
                            Size
                            {renderSortIcon('size')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="min-w-[80px] cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('quantity')}
                        >
                          <div className="flex items-center gap-1">
                            Qty
                            {renderSortIcon('quantity')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="min-w-[80px] cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('price')}
                        >
                          <div className="flex items-center gap-1">
                            Price
                            {renderSortIcon('price')}
                          </div>
                        </TableHead>
                        <TableHead 
                          className="min-w-[100px] cursor-pointer hover:bg-muted/50 select-none"
                          onClick={() => handleSort('status')}
                        >
                          <div className="flex items-center gap-1">
                            Status
                            {renderSortIcon('status')}
                          </div>
                        </TableHead>
                        <TableHead className="min-w-[120px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {product.variants.length > 0 ? (
                        product.variants.map((variant) => (
                          <TableRow key={variant.id} className="hover:bg-muted/20">
                            <TableCell>
                              {variant.image_url ? (
                                <HoverCard>
                                  <HoverCardTrigger asChild>
                                    <div className="h-12 w-12 rounded-md overflow-hidden border border-border relative group cursor-pointer">
                                      <img 
                                        src={variant.image_url} 
                                        alt={`${product.name} - ${variant.color} ${variant.size}`} 
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
                                        src={variant.image_url} 
                                        alt={`${product.name} - ${variant.color} ${variant.size}`} 
                                        className="h-full w-full object-contain"
                                      />
                                    </div>
                                    <div className="p-3">
                                      <h4 className="font-medium text-sm">{product.name}</h4>
                                      <p className="text-xs text-muted-foreground mt-1">
                                        {variant.color} • {variant.size} • SKU: {variant.sku}
                                      </p>
                                    </div>
                                  </HoverCardContent>
                                </HoverCard>
                              ) : (
                                <div className="h-12 w-12 rounded-md bg-muted flex items-center justify-center">
                                  <Package className="h-6 w-6 text-muted-foreground" />
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="font-mono text-xs md:text-sm">{variant.sku}</TableCell>
                            <TableCell className="text-sm">{variant.color}</TableCell>
                            <TableCell className="text-sm">{variant.size}</TableCell>
                            <TableCell className="font-semibold text-sm">{variant.quantity}</TableCell>
                            <TableCell className="text-sm">{formatPrice(variant.price)}</TableCell>
                            <TableCell>
                              <Badge className={getStatusColor(variant.status)}>
                                {getStatusText(variant.status)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                               <div className="flex gap-1">
                                 <Button 
                                   variant="outline" 
                                   size="sm" 
                                   title="Generate Barcode" 
                                   className="h-8 w-8 p-0"
                                   onClick={() => setSelectedVariant(variant)}
                                 >
                                   <QrCode className="h-3 w-3" />
                                 </Button>
                                 <Button 
                                   variant="outline" 
                                   size="sm" 
                                   title="Edit Variant" 
                                   className="h-8 w-8 p-0"
                                   onClick={() => handleEditClick(variant)}
                                 >
                                   <Edit className="h-3 w-3" />
                                 </Button>
                                 <Button 
                                   variant="outline" 
                                   size="sm" 
                                   title="Delete Variant" 
                                   className="h-8 w-8 p-0"
                                   onClick={() => setDeleteVariant(variant)}
                                 >
                                   <Trash2 className="h-3 w-3" />
                                 </Button>
                               </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-4">
                            <p className="text-sm text-muted-foreground">No variants found for this product</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <div className="text-center py-8">
          <div className="flex flex-col items-center space-y-2">
            <Package className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No products found</p>
          </div>
        </div>
      )}

      {/* Barcode Generator Dialog */}
      <Dialog open={!!selectedVariant} onOpenChange={() => setSelectedVariant(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generate Barcode</DialogTitle>
            <DialogDescription>
              Generate a barcode for SKU: {selectedVariant?.sku}
            </DialogDescription>
          </DialogHeader>
          {selectedVariant && (
            <div className="py-2">
              <BarcodeGenerator 
                defaultValue={selectedVariant.sku} 
                onGenerate={(code, type) => {
                  console.log(`Generated ${type} barcode: ${code} for ${selectedVariant.sku}`);
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Variant Dialog */}
      <Dialog open={!!editVariant} onOpenChange={() => setEditVariant(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Variant</DialogTitle>
            <DialogDescription>
              Update the details for variant {editVariant?.sku}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={editForm.quantity}
                  onChange={(e) => setEditForm({...editForm, quantity: e.target.value})}
                  placeholder="Quantity"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price ({getCurrencySymbol()})</Label>
                <Input
                  id="edit-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={editForm.price}
                  onChange={(e) => setEditForm({...editForm, price: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setEditVariant(null)}>
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
      <AlertDialog open={!!deleteVariant} onOpenChange={() => setDeleteVariant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Variant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete variant {deleteVariant?.sku}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}