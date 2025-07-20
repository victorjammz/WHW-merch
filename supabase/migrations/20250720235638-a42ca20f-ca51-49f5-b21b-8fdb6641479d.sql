-- Create events table (renamed from locations)
CREATE TABLE public.events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  manager_name TEXT,
  manager_email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create event_inventory table (renamed from location_inventory)
CREATE TABLE public.event_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  allocated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(event_id, product_variant_id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_inventory ENABLE ROW LEVEL SECURITY;

-- Create policies for events
CREATE POLICY "All users can view events" 
ON public.events FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage events" 
ON public.events FOR ALL 
USING (auth.role() = 'authenticated');

-- Create policies for event_inventory
CREATE POLICY "All users can view event inventory" 
ON public.event_inventory FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage event inventory" 
ON public.event_inventory FOR ALL 
USING (auth.role() = 'authenticated');

-- Create triggers for updated_at
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_inventory_updated_at
  BEFORE UPDATE ON public.event_inventory
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes
CREATE INDEX idx_event_inventory_event_id ON public.event_inventory(event_id);
CREATE INDEX idx_event_inventory_product_variant_id ON public.event_inventory(product_variant_id);