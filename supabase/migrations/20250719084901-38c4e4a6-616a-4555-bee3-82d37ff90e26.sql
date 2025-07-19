-- Add soft delete functionality to event_orders table
ALTER TABLE public.event_orders 
ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE NULL,
ADD COLUMN deleted_by UUID NULL;

-- Create index for better performance on deleted items
CREATE INDEX idx_event_orders_deleted_at ON public.event_orders(deleted_at);

-- Create function to soft delete orders
CREATE OR REPLACE FUNCTION public.soft_delete_order(order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.event_orders 
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  WHERE id = order_id AND deleted_at IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Create function to restore deleted orders (within 30 days)
CREATE OR REPLACE FUNCTION public.restore_order(order_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.event_orders 
  SET 
    deleted_at = NULL,
    deleted_by = NULL,
    updated_at = now()
  WHERE id = order_id 
    AND deleted_at IS NOT NULL 
    AND deleted_at > now() - interval '30 days';
  
  RETURN FOUND;
END;
$$;

-- Create function to permanently delete old orders (30+ days)
CREATE OR REPLACE FUNCTION public.cleanup_deleted_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.event_orders 
  WHERE deleted_at IS NOT NULL 
    AND deleted_at <= now() - interval '30 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;