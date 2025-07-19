-- Update existing statuses to match new constraint
UPDATE public.event_orders SET status = 'in_progress' WHERE status = 'confirmed';
UPDATE public.event_orders SET status = 'delivered' WHERE status = 'completed';
UPDATE public.event_orders SET status = 'pending' WHERE status = 'cancelled';

-- Add the new constraint with updated status values
ALTER TABLE public.event_orders ADD CONSTRAINT event_orders_status_check 
CHECK (status = ANY (ARRAY['pending'::text, 'in_progress'::text, 'shipped'::text, 'delivered'::text]));