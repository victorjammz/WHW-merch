-- Make user-profiles bucket public to allow avatar display
UPDATE storage.buckets 
SET public = true 
WHERE id = 'user-profiles';

-- Create RLS policies for user-profiles bucket
CREATE POLICY "Users can view any avatar" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-profiles');

CREATE POLICY "Users can upload their own avatar" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'user-profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'user-profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'user-profiles' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);