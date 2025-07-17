import { useState, useEffect } from "react";
import { X, Upload, Image, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AddInventoryFormProps {
  onAdd: () => void;
  onCancel: () => void;
}

export function AddInventoryForm({ onAdd, onCancel }: AddInventoryFormProps) {
  const [formData, setFormData] = useState({
    sku: "",
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

  const { toast } = useToast();

  const categories = [
    "Shirts",
    "Pants", 
    "Dresses",
    "Outerwear",
    "Shoes",
    "Accessories",
    "Underwear",
    "Activewear"
  ];

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = ["Black", "White", "Grey", "Navy", "Brown", "Beige", "Red", "Blue", "Green"];

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
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
    if (!formData.sku || !formData.name || !formData.quantity || !formData.price) {
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
      .insert([{
        sku: formData.sku,
        name: formData.name,
        category: formData.category,
        size: formData.size || null,
        color: formData.color || null,
        quantity: parseInt(formData.quantity),
        price: parseFloat(formData.price),
        image_url: imageUrl
      }]);

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sku">SKU *</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              placeholder="e.g., CLT-001"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleChange("name", e.target.value)}
              placeholder="e.g., Classic Cotton T-Shirt"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={formData.category} onValueChange={(value) => handleChange("category", value)}>
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
            <Label htmlFor="price">Price *</Label>
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
              <Image className="h-6 w-6 md:h-8 md:w-8 text-muted-foreground mb-2" />
              <p className="text-xs md:text-sm text-muted-foreground mb-2 text-center">Drag and drop or click to upload</p>
              <label htmlFor="image-upload" className="cursor-pointer">
                <Button type="button" variant="outline" size="sm" className="flex items-center gap-1" disabled={isUploading}>
                  <Upload className="h-3 w-3" />
                  <span className="text-xs md:text-sm">{isUploading ? "Uploading..." : "Select Image"}</span>
                </Button>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                  disabled={isUploading}
                />
              </label>
            </div>
          )}
          <p className="text-xs text-muted-foreground">Supported formats: JPEG, PNG, WebP. Max size: 5MB</p>
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