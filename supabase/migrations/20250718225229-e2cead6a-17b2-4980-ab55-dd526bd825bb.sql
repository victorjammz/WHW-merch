-- Fix foreign key constraint issue with event deletion logging
-- Allow event_id to be nullable in event_logs for deletion records
ALTER TABLE public.event_logs 
DROP CONSTRAINT event_logs_event_id_fkey;

-- Make event_id nullable to handle deletion logs
ALTER TABLE public.event_logs 
ALTER COLUMN event_id DROP NOT NULL;

-- Update the log_event_changes function to handle deletions properly
CREATE OR REPLACE FUNCTION public.log_event_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.event_logs (event_id, action, performed_by, new_values)
    VALUES (NEW.id, 'created', NEW.created_by, to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.event_logs (event_id, action, performed_by, old_values, new_values)
    VALUES (NEW.id, 'updated', auth.uid(), to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- For deletions, we log without event_id reference since the event will be deleted
    INSERT INTO public.event_logs (event_id, action, performed_by, old_values)
    VALUES (NULL, 'deleted', auth.uid(), jsonb_build_object(
      'id', OLD.id,
      'name', OLD.name,
      'location', OLD.location,
      'event_date', OLD.event_date,
      'created_by', OLD.created_by
    ));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;