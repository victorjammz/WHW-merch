import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  category: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  category: string;
}

interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  size: string | null;
  color: string | null;
  price: number;
  quantity: number;
  product: {
    name: string;
    category: string;
  };
}

interface EnhancedItemSelectorProps {
  items: OrderItem[];
  onItemsChange: (items: OrderItem[]) => void;
}

export function EnhancedItemSelector({ items, onItemsChange }: EnhancedItemSelectorProps) {
  const [categories, setCategories] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('name')
        .order('name');
      
      if (categoriesError) throw categoriesError;
      setCategories(categoriesData.map(c => c.name));

      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, category')
        .order('name');
      
      if (productsError) throw productsError;
      setProducts(productsData);

      // Fetch variants with product details
      const { data: variantsData, error: variantsError } = await supabase
        .from('product_variants')
        .select(`
          *,
          product:products(name, category)
        `)
        .order('sku');
      
      if (variantsError) throw variantsError;
      setVariants(variantsData);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to fetch inventory data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addItem = () => {
    const newId = (items.length + 1).toString();
    const newItems = [...items, { 
      id: newId, 
      category: "", 
      product_id: "", 
      variant_id: "", 
      quantity: 1, 
      price: 0 
    }];
    onItemsChange(newItems);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      onItemsChange(items.filter(item => item.id !== id));
    }
  };

  const updateItem = (id: string, field: keyof OrderItem, value: string | number) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // Reset dependent fields when category changes
        if (field === 'category') {
          updatedItem.product_id = "";
          updatedItem.variant_id = "";
          updatedItem.price = 0;
        }
        
        // Reset variant when product changes
        if (field === 'product_id') {
          updatedItem.variant_id = "";
          updatedItem.price = 0;
        }
        
        // Update price when variant changes
        if (field === 'variant_id' && value) {
          const variant = variants.find(v => v.id === value);
          if (variant) {
            updatedItem.price = variant.price;
          }
        }
        
        return updatedItem;
      }
      return item;
    });
    onItemsChange(updatedItems);
  };

  const getProductsForCategory = (category: string) => {
    return products.filter(p => p.category === category);
  };

  const getVariantsForProduct = (productId: string) => {
    return variants.filter(v => v.product_id === productId);
  };

  const getVariantDisplay = (variant: ProductVariant) => {
    const parts = [];
    if (variant.color) parts.push(variant.color);
    if (variant.size) parts.push(variant.size);
    if (parts.length === 0) parts.push('Standard');
    return parts.join(', ');
  };

  const calculateTotal = () => {
    return items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  if (isLoading) {
    return <div className="text-center py-4">Loading inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Order Items</h3>
        <Button type="button" onClick={addItem} size="sm">
          Add Item
        </Button>
      </div>
      
      {items.map((item, index) => (
        <Card key={item.id} className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 items-end">
            {/* Category Selection */}
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={item.category} onValueChange={(value) => updateItem(item.id, 'category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Product Selection */}
            <div className="space-y-2">
              <Label>Product *</Label>
              <Select 
                value={item.product_id} 
                onValueChange={(value) => updateItem(item.id, 'product_id', value)}
                disabled={!item.category}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {getProductsForCategory(item.category).map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Variant Selection (Color/Size) */}
            <div className="space-y-2">
              <Label>Variant *</Label>
              <Select 
                value={item.variant_id} 
                onValueChange={(value) => updateItem(item.id, 'variant_id', value)}
                disabled={!item.product_id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select variant" />
                </SelectTrigger>
                <SelectContent>
                  {getVariantsForProduct(item.product_id).map((variant) => (
                    <SelectItem key={variant.id} value={variant.id}>
                      <div className="flex flex-col text-left">
                        <span>{getVariantDisplay(variant)}</span>
                        <span className="text-xs text-muted-foreground">
                          £{variant.price} - Stock: {variant.quantity}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Quantity */}
            <div className="space-y-2">
              <Label>Quantity *</Label>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
              />
            </div>
            
            {/* Price Display */}
            <div className="space-y-2">
              <Label>Total</Label>
              <div className="flex flex-col">
                <span className="text-sm text-muted-foreground">£{item.price.toFixed(2)} each</span>
                <Badge variant="secondary">
                  £{(item.price * item.quantity).toFixed(2)}
                </Badge>
              </div>
            </div>
            
            {/* Remove Button */}
            <div className="flex justify-end">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => removeItem(item.id)}
                disabled={items.length === 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
      
      <div className="flex justify-end">
        <div className="text-lg font-semibold">
          Total: £{calculateTotal().toFixed(2)}
        </div>
      </div>
    </div>
  );
}