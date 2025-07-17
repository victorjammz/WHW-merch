-- Update RLS on inventory table to allow all authenticated users to manage inventory
-- First, drop the existing admin-only policies
DROP POLICY IF EXISTS "Allow admins to insert inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow admins to update inventory" ON public.inventory;
DROP POLICY IF EXISTS "Allow admins to delete inventory" ON public.inventory;

-- Create new policies allowing all authenticated users to manage inventory
CREATE POLICY "Allow authenticated users to insert inventory"
ON public.inventory
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update inventory"
ON public.inventory
FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete inventory"
ON public.inventory
FOR DELETE
USING (auth.role() = 'authenticated');