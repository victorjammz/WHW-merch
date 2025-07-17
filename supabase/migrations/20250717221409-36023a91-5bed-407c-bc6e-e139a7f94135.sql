-- Create a storage bucket for inventory images
INSERT INTO storage.buckets (id, name, public)
VALUES ('inventory-images', 'inventory-images', true);

-- Create policies for the bucket
-- Allow public viewing of inventory images
CREATE POLICY "Public can view inventory images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'inventory-images');

-- Allow authenticated users to upload inventory images
CREATE POLICY "Authenticated users can upload inventory images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'inventory-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to update their own inventory images
CREATE POLICY "Authenticated users can update their inventory images"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'inventory-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their inventory images
CREATE POLICY "Authenticated users can delete their inventory images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'inventory-images' AND auth.role() = 'authenticated');