-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Users can view order documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload order documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can update order documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete order documents" ON storage.objects;

-- Update the order-documents bucket configuration
UPDATE storage.buckets 
SET 
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
WHERE id = 'order-documents';

-- Create comprehensive policies for order documents
CREATE POLICY "order_documents_select_policy" 
ON storage.objects 
FOR SELECT 
USING (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "order_documents_insert_policy" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "order_documents_update_policy" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "order_documents_delete_policy" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'order-documents' 
  AND auth.role() = 'authenticated'
);