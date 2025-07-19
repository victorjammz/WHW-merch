-- Add customer detail columns to event_orders table
ALTER TABLE public.event_orders 
ADD COLUMN client_email TEXT,
ADD COLUMN client_phone TEXT, 
ADD COLUMN client_postcode TEXT,
ADD COLUMN client_address TEXT;