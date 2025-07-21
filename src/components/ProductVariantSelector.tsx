import { useState } from "react";
import { Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/contexts/CurrencyContext";

interface ProductVariant {
  id: string;
  sku: string;
  color: string | null;
  size: string | null;
  price: number;
  quantity: number;
  product: {
    name: string;
    category: string;
  };
}

interface ProductVariantSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  productVariants: ProductVariant[];
  placeholder?: string;
  label?: string;
}

export const ProductVariantSelector = ({
  value,
  onValueChange,
  productVariants,
  placeholder = "Select product variant",
  label = "Product Variant"
}: ProductVariantSelectorProps) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const { formatPrice } = useCurrency();

  const selectedVariant = productVariants.find(variant => variant.id === value);

  const filteredVariants = productVariants.filter(variant => {
    const searchLower = searchTerm.toLowerCase();
    return (
      variant.product.name.toLowerCase().includes(searchLower) ||
      variant.sku?.toLowerCase().includes(searchLower) ||
      variant.color?.toLowerCase().includes(searchLower) ||
      variant.size?.toLowerCase().includes(searchLower) ||
      variant.product.category.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between text-left font-normal"
          >
            {selectedVariant ? (
              <div className="flex items-center justify-between w-full">
                <div className="flex flex-col">
                  <div className="font-medium">{selectedVariant.product.name}</div>
                  <div className="text-sm text-muted-foreground flex items-center gap-2">
                    <span>SKU: {selectedVariant.sku}</span>
                    {selectedVariant.color && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedVariant.color}
                      </Badge>
                    )}
                    {selectedVariant.size && (
                      <Badge variant="secondary" className="text-xs">
                        {selectedVariant.size}
                      </Badge>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className="ml-2">
                  {selectedVariant.quantity} available
                </Badge>
              </div>
            ) : (
              placeholder
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[500px] p-0" align="start">
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products, SKU, color, size..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <ScrollArea className="h-60 pointer-events-auto">
            <div className="p-2 pointer-events-auto">
              {filteredVariants.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  No products found
                </div>
              ) : (
                filteredVariants.map((variant) => (
                  <div
                    key={variant.id}
                    className={cn(
                      "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-2 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                      value === variant.id && "bg-accent text-accent-foreground"
                    )}
                    onClick={() => {
                      onValueChange(variant.id);
                      setOpen(false);
                      setSearchTerm("");
                    }}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex flex-col gap-1">
                        <div className="font-medium">{variant.product.name}</div>
                        <div className="text-xs text-muted-foreground">
                          SKU: {variant.sku} • Category: {variant.product.category}
                        </div>
                        <div className="flex items-center gap-1">
                          {variant.color && (
                            <Badge variant="secondary" className="text-xs">
                              Color: {variant.color}
                            </Badge>
                          )}
                          {variant.size && (
                            <Badge variant="secondary" className="text-xs">
                              Size: {variant.size}
                            </Badge>
                          )}
                          <Badge variant="outline" className="text-xs">
                            {formatPrice(variant.price)}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={variant.quantity > 10 ? "default" : variant.quantity > 0 ? "secondary" : "destructive"} 
                          className="text-xs"
                        >
                          {variant.quantity} available
                        </Badge>
                        {value === variant.id && (
                          <Check className="h-4 w-4" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};