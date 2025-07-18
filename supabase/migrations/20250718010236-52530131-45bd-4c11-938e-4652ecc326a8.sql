-- Ensure the order-documents bucket exists (it should already exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('order-documents', 'order-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

-- Create comprehensive policies for order documents
-- Allow authenticated users to view order documents they have access to
CREATE POLICY "Users can view order documents" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to upload order documents
CREATE POLICY "Users can upload order documents" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to update order documents
CREATE POLICY "Users can update order documents" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);

-- Allow authenticated users to delete order documents
CREATE POLICY "Users can delete order documents" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);