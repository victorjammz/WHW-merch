-- Create products table for base product information
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create product_variants table for color/size combinations
CREATE TABLE public.product_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  sku TEXT NOT NULL UNIQUE,
  color TEXT,
  size TEXT,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  barcode_text TEXT,
  barcode_type TEXT DEFAULT 'CODE128',
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'in_stock',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Create policies for products table
CREATE POLICY "Allow all users to view products" 
ON public.products 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert products" 
ON public.products 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to update products" 
ON public.products 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to delete products" 
ON public.products 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create policies for product_variants table
CREATE POLICY "Allow all users to view product variants" 
ON public.product_variants 
FOR SELECT 
USING (true);

CREATE POLICY "Allow authenticated users to insert product variants" 
ON public.product_variants 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to update product variants" 
ON public.product_variants 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Allow authenticated users to delete product variants" 
ON public.product_variants 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create triggers for updated_at columns
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for auto-generating SKUs for variants
CREATE TRIGGER generate_variant_sku
  BEFORE INSERT ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_auto_sku();

-- Create trigger for auto-generating barcodes for variants
CREATE TRIGGER generate_variant_barcode
  BEFORE INSERT ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_barcode_from_sku();

-- Create indexes for better performance
CREATE INDEX idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);

-- Migrate existing inventory data to new structure
-- First, create products from unique inventory names
INSERT INTO public.products (name, category, description, image_url)
SELECT DISTINCT 
  name,
  category,
  NULL as description,
  image_url
FROM public.inventory
WHERE name IS NOT NULL
ON CONFLICT DO NOTHING;

-- Then, create variants from existing inventory items
INSERT INTO public.product_variants (
  product_id, 
  sku, 
  color, 
  size, 
  price, 
  quantity, 
  barcode_text, 
  barcode_type, 
  image_url, 
  status
)
SELECT 
  p.id as product_id,
  i.sku,
  i.color,
  i.size,
  i.price,
  i.quantity,
  i.barcode_text,
  i.barcode_type,
  i.image_url,
  i.status
FROM public.inventory i
JOIN public.products p ON p.name = i.name AND p.category = i.category
WHERE i.name IS NOT NULL;