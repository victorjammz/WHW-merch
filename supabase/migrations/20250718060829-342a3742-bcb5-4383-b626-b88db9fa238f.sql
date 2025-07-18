-- Create event_orders table for managing event orders
CREATE TABLE public.event_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL,
  client_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.event_orders ENABLE ROW LEVEL SECURITY;

-- Create policies for event_orders
CREATE POLICY "Anyone can view event orders" 
ON public.event_orders 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create event orders" 
ON public.event_orders 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update event orders" 
ON public.event_orders 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete event orders" 
ON public.event_orders 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_event_orders_updated_at
BEFORE UPDATE ON public.event_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();