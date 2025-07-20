-- Create locations table for different business sites
CREATE TABLE public.locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,
    address TEXT,
    phone TEXT,
    manager_name TEXT,
    manager_email TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create location_inventory table to track stock at each location
CREATE TABLE public.location_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    UNIQUE(location_id, product_variant_id)
);

-- Create stock_transfers table to track movements between main inventory and locations
CREATE TABLE public.stock_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transfer_type TEXT NOT NULL CHECK (transfer_type IN ('allocation', 'return')),
    from_location_id UUID REFERENCES public.locations(id),
    to_location_id UUID REFERENCES public.locations(id),
    product_variant_id UUID NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    notes TEXT,
    transferred_by UUID REFERENCES auth.users(id),
    transferred_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled'))
);

-- Enable RLS on all new tables
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for locations
CREATE POLICY "All users can view locations" 
ON public.locations 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage locations" 
ON public.locations 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create RLS policies for location_inventory
CREATE POLICY "All users can view location inventory" 
ON public.location_inventory 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage location inventory" 
ON public.location_inventory 
FOR ALL 
USING (auth.role() = 'authenticated');

-- Create RLS policies for stock_transfers
CREATE POLICY "All users can view stock transfers" 
ON public.stock_transfers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create stock transfers" 
ON public.stock_transfers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update stock transfers" 
ON public.stock_transfers 
FOR UPDATE 
USING (auth.role() = 'authenticated');

-- Create updated_at triggers
CREATE TRIGGER update_locations_updated_at
    BEFORE UPDATE ON public.locations
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_location_inventory_updated_at
    BEFORE UPDATE ON public.location_inventory
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_location_inventory_location_id ON public.location_inventory(location_id);
CREATE INDEX idx_location_inventory_product_variant_id ON public.location_inventory(product_variant_id);
CREATE INDEX idx_stock_transfers_location_ids ON public.stock_transfers(from_location_id, to_location_id);
CREATE INDEX idx_stock_transfers_product_variant_id ON public.stock_transfers(product_variant_id);
CREATE INDEX idx_stock_transfers_transferred_at ON public.stock_transfers(transferred_at);