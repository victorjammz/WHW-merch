-- Add payment method column to event_orders table
ALTER TABLE public.event_orders 
ADD COLUMN payment_method TEXT;