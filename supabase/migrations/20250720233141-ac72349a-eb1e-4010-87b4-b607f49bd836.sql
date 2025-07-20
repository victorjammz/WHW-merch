-- Rename locations table to events
ALTER TABLE public.locations RENAME TO events;

-- Rename location_inventory table to event_inventory
ALTER TABLE public.location_inventory RENAME TO event_inventory;

-- Rename location_id column to event_id in event_inventory table
ALTER TABLE public.event_inventory RENAME COLUMN location_id TO event_id;

-- Rename location columns in stock_transfers table
ALTER TABLE public.stock_transfers RENAME COLUMN from_location_id TO from_event_id;
ALTER TABLE public.stock_transfers RENAME COLUMN to_location_id TO to_event_id;

-- Update RLS policies for events table (renamed from locations)
DROP POLICY IF EXISTS "All users can view locations" ON public.events;
DROP POLICY IF EXISTS "Authenticated users can manage locations" ON public.events;

CREATE POLICY "All users can view events" 
ON public.events FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage events" 
ON public.events FOR ALL 
USING (auth.role() = 'authenticated');

-- Update RLS policies for event_inventory table (renamed from location_inventory)
DROP POLICY IF EXISTS "All users can view location inventory" ON public.event_inventory;
DROP POLICY IF EXISTS "Authenticated users can manage location inventory" ON public.event_inventory;

CREATE POLICY "All users can view event inventory" 
ON public.event_inventory FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage event inventory" 
ON public.event_inventory FOR ALL 
USING (auth.role() = 'authenticated');