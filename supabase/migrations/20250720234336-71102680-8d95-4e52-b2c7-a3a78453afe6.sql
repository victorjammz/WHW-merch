-- Drop foreign key constraints first
ALTER TABLE public.stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_from_event_id_fkey;
ALTER TABLE public.stock_transfers DROP CONSTRAINT IF EXISTS stock_transfers_to_event_id_fkey;
ALTER TABLE public.event_inventory DROP CONSTRAINT IF EXISTS event_inventory_event_id_fkey;

-- Drop tables
DROP TABLE IF EXISTS public.event_inventory;
DROP TABLE IF EXISTS public.stock_transfers;
DROP TABLE IF EXISTS public.events;
DROP TABLE IF EXISTS public.event_logs;