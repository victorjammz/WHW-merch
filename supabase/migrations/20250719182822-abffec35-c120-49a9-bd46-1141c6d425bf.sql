-- Update existing statuses to match new constraint
UPDATE public.event_orders SET status = 'in_progress' WHERE status = 'confirmed';
UPDATE public.event_orders SET status = 'delivered' WHERE status = 'completed';
UPDATE public.event_orders SET status = 'pending' WHERE status = 'cancelled';