-- Add barcode column to Merch Inventory table
ALTER TABLE public."Merch Inventory"
ADD COLUMN barcode_text TEXT,
ADD COLUMN barcode_type TEXT DEFAULT 'CODE128';

-- Enable Row Level Security
ALTER TABLE public."Merch Inventory" ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable read access for all users" 
ON public."Merch Inventory" 
FOR SELECT 
USING (true);

CREATE POLICY "Enable insert for authenticated users" 
ON public."Merch Inventory" 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users" 
ON public."Merch Inventory" 
FOR UPDATE 
TO authenticated
USING (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public."Merch Inventory" 
FOR DELETE 
TO authenticated
USING (true);