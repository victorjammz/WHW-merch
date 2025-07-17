-- Add image_url column to inventory table
ALTER TABLE public.inventory
ADD COLUMN image_url TEXT;

-- Update the timestamp
UPDATE public.inventory
SET updated_at = now()
WHERE image_url IS NULL;