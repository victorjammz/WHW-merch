import { useState, useEffect } from "react";
import { X, Upload, Image, Trash2, Camera, FolderOpen, Check, ChevronsUpDown, Plus, Edit, Save, MoreVertical, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  description?: string;
}

interface ProductVariant {
  id?: string;
  color: string;
  size: string;
  price: string;
  quantity: string;
}

interface AddProductFormProps {
  onAdd: () => void;
  onCancel: () => void;
}

export function AddProductForm({ onAdd, onCancel }: AddProductFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    description: ""
  });
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [existingProductNames, setExistingProductNames] = useState<string[]>([]);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryDescription, setNewCategoryDescription] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([
    { color: "", size: "", price: "", quantity: "" }
  ]);

  const { toast } = useToast();
  const { getCurrencySymbol, currency } = useCurrency();

  // Fetch existing product names for autocomplete
  useEffect(() => {
    const fetchProductNames = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('name')
        .order('name');
      
      if (!error && data) {
        const uniqueNames = [...new Set(data.map(item => item.name))];
        setExistingProductNames(uniqueNames);
      }
    };
    
    fetchProductNames();
  }, []);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (!error && data) {
        setCategories(data);
      }
    };
    
    fetchCategories();
  }, []);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .insert([
        {
          name: newCategoryName,
          description: newCategoryDescription || null
        }
      ])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding category",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setCategories(prev => [...prev, data]);
    setNewCategoryName("");
    setNewCategoryDescription("");
    setOpenCategoryDialog(false);
    toast({
      title: "Success",
      description: "Category added successfully"
    });
  };

  const handleEditCategory = async () => {
    if (!editingCategory || !newCategoryName.trim()) return;

    const { data, error } = await supabase
      .from('categories')
      .update({
        name: newCategoryName,
        description: newCategoryDescription || null
      })
      .eq('id', editingCategory.id)
      .select()
      .single();

    if (error) {
      toast({
        title: "Error updating category",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setCategories(prev => 
      prev.map(cat => cat.id === editingCategory.id ? data : cat)
    );
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryDescription("");
    setOpenCategoryDialog(false);
    toast({
      title: "Success",
      description: "Category updated successfully"
    });
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    setNewCategoryName(category.name);
    setNewCategoryDescription(category.description || "");
    setOpenCategoryDialog(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      toast({
        title: "Error deleting category",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setCategories(prev => prev.filter(cat => cat.id !== categoryId));
    toast({
      title: "Success",
      description: "Category deleted successfully"
    });
  };

  const resetCategoryDialog = () => {
    setEditingCategory(null);
    setNewCategoryName("");
    setNewCategoryDescription("");
    setOpenCategoryDialog(false);
  };

  const sizes = ["XS", "S", "M", "L", "XL", "XXL", "Age 2-3", "Age 4-5", "Age 5-6", "Age 7-8", "Age 9-10", "Age 10-11"];
  const colors = ["Black", "White", "Grey", "Navy", "Brown", "Beige", "Red", "Blue", "Green"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCameraCapture = () => {
    const cameraInput = document.getElementById('camera-upload') as HTMLInputElement;
    if (cameraInput) {
      cameraInput.click();
    }
  };

  const handleFileUpload = () => {
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };
  
  const uploadImage = async (file: File): Promise<string | null> => {
    setIsUploading(true);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;
      
      const { error: uploadError } = await supabase.storage
        .from('inventory-images')
        .upload(filePath, file);
        
      if (uploadError) {
        toast({
          title: "Error uploading image",
          description: uploadError.message,
          variant: "destructive"
        });
        return null;
      }
      
      const { data } = supabase.storage
        .from('inventory-images')
        .getPublicUrl(filePath);
        
      return data.publicUrl;
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Error uploading image",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const addVariant = () => {
    setVariants([...variants, { color: "", size: "", price: "", quantity: "" }]);
  };

  const removeVariant = (index: number) => {
    if (variants.length > 1) {
      setVariants(variants.filter((_, i) => i !== index));
    }
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: string) => {
    const updatedVariants = [...variants];
    updatedVariants[index] = { ...updatedVariants[index], [field]: value };
    setVariants(updatedVariants);
  };

  // Check for duplicate color/size combinations
  const getDuplicateVariants = () => {
    const combinations = new Map<string, number[]>();
    
    variants.forEach((variant, index) => {
      if (variant.color && variant.size) {
        const key = `${variant.color}-${variant.size}`;
        if (!combinations.has(key)) {
          combinations.set(key, []);
        }
        combinations.get(key)!.push(index);
      }
    });
    
    return Array.from(combinations.entries())
      .filter(([_, indices]) => indices.length > 1)
      .reduce((acc, [combination, indices]) => {
        indices.forEach(index => {
          acc.set(index, combination);
        });
        return acc;
      }, new Map<number, string>());
  };

  const duplicateVariants = getDuplicateVariants();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in product name and category",
        variant: "destructive"
      });
      return;
    }

    // Validate variants
    const validVariants = variants.filter(v => v.color && v.size && v.price && v.quantity);
    if (validVariants.length === 0) {
      toast({
        title: "Validation Error",
        description: "Please add at least one complete variant (color, size, price, quantity)",
        variant: "destructive"
      });
      return;
    }

    // Upload image if present
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl && imageFile) {
        toast({
          title: "Warning",
          description: "Failed to upload image, but continuing with product creation"
        });
      }
    }

    try {
      // Create product first
      const { data: product, error: productError } = await supabase
        .from('products')
        .insert({
          name: formData.name,
          category: formData.category,
          description: formData.description || null,
          image_url: imageUrl
        })
        .select()
        .single();

      if (productError) throw productError;

      // Create variants (SKU will be auto-generated by trigger)
      const variantInserts = validVariants.map(variant => ({
        product_id: product.id,
        color: variant.color,
        size: variant.size,
        price: parseFloat(variant.price),
        quantity: parseInt(variant.quantity),
        image_url: imageUrl,
        sku: '', // This will be auto-generated by the database trigger
      }));

      const { error: variantsError } = await supabase
        .from('product_variants')
        .insert(variantInserts);

      if (variantsError) throw variantsError;

      toast({
        title: "Success",
        description: `Product created with ${validVariants.length} variants`
      });
      
      onAdd();
    } catch (error: any) {
      toast({
        title: "Error creating product",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
        {/* Product Basic Info */}
        <div className="space-y-2">
          <Label htmlFor="name">Product Name *</Label>
          <div className="relative">
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => {
                handleChange("name", e.target.value);
                setOpenCombobox(e.target.value.length > 0);
              }}
              onFocus={() => setOpenCombobox(formData.name.length > 0)}
              onBlur={() => setTimeout(() => setOpenCombobox(false), 200)}
              placeholder="Type new product name or select existing..."
              className="w-full"
              required
            />
            {openCombobox && existingProductNames.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 max-h-60 overflow-auto rounded-md border bg-popover p-0 text-popover-foreground shadow-md">
                <Command className="border-0">
                  <CommandList>
                    <CommandEmpty>No matching products found.</CommandEmpty>
                    <CommandGroup>
                      {existingProductNames
                        .filter(name => 
                          name.toLowerCase().includes(formData.name.toLowerCase()) &&
                          name.toLowerCase() !== formData.name.toLowerCase()
                        )
                        .slice(0, 8)
                        .map((name) => (
                          <CommandItem
                            key={name}
                            value={name}
                            onSelect={() => {
                              handleChange("name", name);
                              setOpenCombobox(false);
                            }}
                            className="cursor-pointer"
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                formData.name === name ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {name}
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="category">Category *</Label>
              <Dialog open={openCategoryDialog} onOpenChange={setOpenCategoryDialog}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="h-6 px-2"
                    onClick={() => resetCategoryDialog()}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-background border border-border z-50">
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingCategory 
                        ? "Update the category details below."
                        : "Create a new category for your products."
                      }
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Category Name *</Label>
                      <Input
                        id="categoryName"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="e.g., Seasonal Items"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="categoryDescription">Description</Label>
                      <Textarea
                        id="categoryDescription"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        placeholder="Optional description for this category"
                        rows={2}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={resetCategoryDialog}
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={editingCategory ? handleEditCategory : handleAddCategory}
                        disabled={!newCategoryName.trim()}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {editingCategory ? "Update" : "Add"} Category
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
              <SelectTrigger className="bg-background border border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent className="bg-background border border-border z-50">
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Optional product description"
              rows={2}
            />
          </div>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>Product Image</Label>
          <div className="border-2 border-dashed border-border rounded-lg p-4">
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-md"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <div className="flex space-x-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleFileUpload}
                    disabled={isUploading}
                  >
                    <FolderOpen className="h-4 w-4 mr-2" />
                    Choose File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCameraCapture}
                    disabled={isUploading}
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    Camera
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Upload a product image or take a photo
                </p>
              </div>
            )}
          </div>
          
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
          />
          <input
            id="camera-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageChange}
            className="hidden"
          />
        </div>

        {/* Product Variants */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Product Variants *</Label>
            <Button type="button" variant="outline" size="sm" onClick={addVariant}>
              <Plus className="h-4 w-4 mr-2" />
              Add Variant
            </Button>
          </div>
          
          <div className="space-y-3">
            {variants.map((variant, index) => {
              const isDuplicate = duplicateVariants.has(index);
              const duplicateCombination = duplicateVariants.get(index);
              
              return (
                <Card key={index} className={cn("p-4", isDuplicate && "border-warning bg-warning/5")}>
                  {isDuplicate && (
                    <Alert className="mb-4 border-warning bg-warning/10">
                      <AlertTriangle className="h-4 w-4 text-warning" />
                      <AlertDescription className="text-warning-foreground">
                        Duplicate variant detected: {duplicateCombination?.replace('-', ' / ')}. This may be a duplicate entry.
                      </AlertDescription>
                    </Alert>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                    <div className="space-y-2">
                      <Label>Color</Label>
                      <Select 
                        value={variant.color} 
                        onValueChange={(value) => updateVariant(index, "color", value)}
                      >
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
                      <Label>Size</Label>
                      <Select 
                        value={variant.size} 
                        onValueChange={(value) => updateVariant(index, "size", value)}
                      >
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
                      <Label>Price ({getCurrencySymbol(currency)})</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, "price", e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Quantity</Label>
                      <Input
                        type="number"
                        min="0"
                        value={variant.quantity}
                        onChange={(e) => updateVariant(index, "quantity", e.target.value)}
                        placeholder="0"
                      />
                    </div>
                    
                    <div>
                      {variants.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeVariant(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isUploading}>
            {isUploading ? "Uploading..." : "Create Product"}
          </Button>
        </div>
      </form>
    </div>
  );
}