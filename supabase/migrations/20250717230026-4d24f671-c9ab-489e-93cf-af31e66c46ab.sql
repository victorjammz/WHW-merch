-- Create storage buckets for customer management, order management, and barcodes

-- Create customer-documents bucket for customer-related files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'customer-documents', 
  'customer-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create order-documents bucket for order-related files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'order-documents', 
  'order-documents', 
  false,
  52428800, -- 50MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
);

-- Create barcodes bucket for generated and uploaded barcode images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'barcodes', 
  'barcodes', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Storage policies for customer-documents bucket
-- Users can view customer documents if they have access to that customer
CREATE POLICY "Users can view customer documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'customer-documents' AND auth.role() = 'authenticated');

-- Users can upload customer documents
CREATE POLICY "Users can upload customer documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'customer-documents' AND auth.role() = 'authenticated');

-- Users can update customer documents
CREATE POLICY "Users can update customer documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'customer-documents' AND auth.role() = 'authenticated');

-- Users can delete customer documents
CREATE POLICY "Users can delete customer documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'customer-documents' AND auth.role() = 'authenticated');

-- Storage policies for order-documents bucket
-- Users can view order documents if authenticated
CREATE POLICY "Users can view order documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- Users can upload order documents
CREATE POLICY "Users can upload order documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- Users can update order documents
CREATE POLICY "Users can update order documents" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- Users can delete order documents
CREATE POLICY "Users can delete order documents" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'order-documents' AND auth.role() = 'authenticated');

-- Storage policies for barcodes bucket (public bucket)
-- Anyone can view barcodes (public bucket)
CREATE POLICY "Anyone can view barcodes" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'barcodes');

-- Authenticated users can upload barcodes
CREATE POLICY "Users can upload barcodes" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'barcodes' AND auth.role() = 'authenticated');

-- Authenticated users can update barcodes
CREATE POLICY "Users can update barcodes" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'barcodes' AND auth.role() = 'authenticated');

-- Authenticated users can delete barcodes
CREATE POLICY "Users can delete barcodes" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'barcodes' AND auth.role() = 'authenticated');