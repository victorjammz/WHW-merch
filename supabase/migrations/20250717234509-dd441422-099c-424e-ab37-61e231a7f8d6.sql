-- Create barcodes table to store generated barcodes
CREATE TABLE public.barcodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sku TEXT,
  product_name TEXT,
  barcode_text TEXT NOT NULL,
  barcode_type TEXT NOT NULL DEFAULT 'CODE128',
  category TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.barcodes ENABLE ROW LEVEL SECURITY;

-- Create policies for barcode access
CREATE POLICY "Users can view all barcodes" 
ON public.barcodes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own barcodes" 
ON public.barcodes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own barcodes" 
ON public.barcodes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own barcodes" 
ON public.barcodes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_barcodes_updated_at
BEFORE UPDATE ON public.barcodes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for barcode images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('barcodes', 'barcodes', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for barcode images
CREATE POLICY "Barcode images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'barcodes');

CREATE POLICY "Users can upload barcode images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'barcodes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own barcode images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'barcodes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own barcode images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'barcodes' AND auth.uid()::text = (storage.foldername(name))[1]);