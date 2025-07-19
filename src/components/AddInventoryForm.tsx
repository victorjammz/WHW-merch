import { useState, useEffect } from "react";
import { X, Upload, Image, Trash2, Camera, FolderOpen, Check, ChevronsUpDown, Plus, Edit, Save, MoreVertical } from "lucide-react";
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

interface AddInventoryFormProps {
  onAdd: () => void;
  onCancel: () => void;
}

export function AddInventoryForm({ onAdd, onCancel }: AddInventoryFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    category: "",
    size: "",
    color: "",
    quantity: "",
    price: "",
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

  const { toast } = useToast();
  const { getCurrencySymbol, currency } = useCurrency();

  // Fetch existing product names for autocomplete
  useEffect(() => {
    const fetchProductNames = async () => {
      const { data, error } = await supabase
        .from('inventory')
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

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = ["Black", "White", "Grey", "Navy", "Brown", "Beige", "Red", "Blue", "Green"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCameraCapture = () => {
    // Trigger the camera input
    const cameraInput = document.getElementById('camera-upload') as HTMLInputElement;
    if (cameraInput) {
      cameraInput.click();
    }
  };

  const handleFileUpload = () => {
    // Trigger the file input
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.category || !formData.quantity || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    // Upload image if present
    let imageUrl = null;
    if (imageFile) {
      imageUrl = await uploadImage(imageFile);
      if (!imageUrl && imageFile) {
        // If image upload failed but image was provided, alert user
        toast({
          title: "Warning",
          description: "Failed to upload image, but continuing with item creation"
        });
      }
    }

    const { error } = await supabase
      .from('inventory')
      .insert({
        sku: '', // Will be auto-generated by trigger
        name: formData.name,
        category: formData.category,
        size: formData.size || null,
        color: formData.color || null,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        image_url: imageUrl
      });

    if (error) {
      toast({
        title: "Error adding item",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Success",
      description: "Item added to inventory"
    });
    
    onAdd();
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
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
                        .slice(0, 8) // Limit to 8 suggestions
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
          <p className="text-xs text-muted-foreground">
            Type to create new product or select from existing suggestions • SKU will be automatically generated
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                        : "Create a new category for your inventory items."
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
            <div className="flex gap-2">
              <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
                <SelectTrigger className="bg-background border border-border flex-1">
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
              {formData.category && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-10 w-10 p-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-background border border-border">
                    <DropdownMenuItem
                      onClick={() => {
                        const category = categories.find(cat => cat.name === formData.category);
                        if (category) openEditDialog(category);
                      }}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Category
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        const category = categories.find(cat => cat.name === formData.category);
                        if (category) handleDeleteCategory(category.id);
                      }}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Category
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="size">Size</Label>
            <Select value={formData.size} onValueChange={(value) => handleChange("size", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                {sizes.map((size) => (
                  <SelectItem key={size} value={size}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <Select value={formData.color} onValueChange={(value) => handleChange("color", value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select color" />
              </SelectTrigger>
              <SelectContent>
                {colors.map((color) => (
                  <SelectItem key={color} value={color}>
                    {color}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) => handleChange("quantity", e.target.value)}
              placeholder="0"
              min="0"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price">Price ({getCurrencySymbol(currency)}) *</Label>
            <Input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(e) => handleChange("price", e.target.value)}
              placeholder="0.00"
              min="0"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="image">Product Image</Label>
          {imagePreview ? (
            <div className="relative w-full h-32 md:h-48 border border-border rounded-md overflow-hidden group">
              <img 
                src={imagePreview} 
                alt="Product preview" 
                className="w-full h-full object-contain"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button 
                  type="button" 
                  variant="destructive"
                  size="sm"
                  onClick={handleRemoveImage}
                  className="flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ) : (
            <div className="border border-dashed border-border rounded-md p-4 md:p-6 flex flex-col items-center justify-center h-32 md:h-48 bg-muted/30">
              <Image className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground mb-3" />
              <p className="text-xs md:text-sm text-muted-foreground mb-3 text-center">Take a photo or select from device</p>
              
              <div className="flex flex-col sm:flex-row gap-2 w-full max-w-xs">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 flex-1" 
                  disabled={isUploading}
                  onClick={handleCameraCapture}
                >
                  <Camera className="h-4 w-4" />
                  <span className="text-xs md:text-sm">Camera</span>
                </Button>
                
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-2 flex-1" 
                  disabled={isUploading}
                  onClick={handleFileUpload}
                >
                  <FolderOpen className="h-4 w-4" />
                  <span className="text-xs md:text-sm">Browse</span>
                </Button>
              </div>
              
              {/* Camera input - will prompt camera on mobile */}
              <input
                id="camera-upload"
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                className="hidden"
                disabled={isUploading}
              />
              
              {/* File input - for gallery/desktop selection */}
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">Take a photo with camera or select from gallery/desktop. Supported: JPEG, PNG, WebP. Max size: 5MB</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            placeholder="Optional product description..."
            rows={3}
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-4">
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" className="bg-gradient-primary w-full sm:w-auto" disabled={isUploading}>
            {isUploading ? "Adding..." : "Add Item"}
          </Button>
        </div>
      </form>
    </div>
  );
}