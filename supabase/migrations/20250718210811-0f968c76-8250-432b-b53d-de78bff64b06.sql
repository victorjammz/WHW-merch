-- Create events table for Events Management
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  event_date DATE NOT NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "Anyone can view events" 
ON public.events 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create events" 
ON public.events 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can update events" 
ON public.events 
FOR UPDATE 
USING (auth.role() = 'authenticated'::text);

CREATE POLICY "Authenticated users can delete events" 
ON public.events 
FOR DELETE 
USING (auth.role() = 'authenticated'::text);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_events_updated_at
BEFORE UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create event_logs table for tracking event creation/modifications
CREATE TABLE public.event_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'created', 'updated', 'deleted'
  performed_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  old_values JSONB,
  new_values JSONB
);

-- Enable Row Level Security for event logs
ALTER TABLE public.event_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for event logs
CREATE POLICY "Anyone can view event logs" 
ON public.event_logs 
FOR SELECT 
USING (true);

CREATE POLICY "System can insert event logs" 
ON public.event_logs 
FOR INSERT 
WITH CHECK (true);

-- Create function to log event changes
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
    INSERT INTO public.event_logs (event_id, action, performed_by, old_values)
    VALUES (OLD.id, 'deleted', auth.uid(), to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers for event logging
CREATE TRIGGER log_event_insert
AFTER INSERT ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.log_event_changes();

CREATE TRIGGER log_event_update
AFTER UPDATE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.log_event_changes();

CREATE TRIGGER log_event_delete
AFTER DELETE ON public.events
FOR EACH ROW
EXECUTE FUNCTION public.log_event_changes();