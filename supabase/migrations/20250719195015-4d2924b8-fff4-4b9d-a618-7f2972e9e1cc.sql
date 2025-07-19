-- Add payment columns to event_orders table
ALTER TABLE public.event_orders 
ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'not paid',
ADD COLUMN payment_reference TEXT;