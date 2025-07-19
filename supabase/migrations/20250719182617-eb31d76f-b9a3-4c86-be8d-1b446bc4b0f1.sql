-- Drop the existing status constraint
ALTER TABLE public.event_orders DROP CONSTRAINT event_orders_status_check;

-- Add the new constraint with updated status values
ALTER TABLE public.event_orders ADD CONSTRAINT event_orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'shipped'::text, 'delivered'::text]));