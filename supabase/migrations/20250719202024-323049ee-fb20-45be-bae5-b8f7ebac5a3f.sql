-- Create customers table
CREATE TABLE public.customers (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  postcode text,
  location text,
  total_orders integer NOT NULL DEFAULT 0,
  total_spent numeric(10,2) NOT NULL DEFAULT 0.00,
  last_order_date date,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view customers" 
ON public.customers 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create customers" 
ON public.customers 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update customers" 
ON public.customers 
FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete customers" 
ON public.customers 
FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample customer data
INSERT INTO public.customers (name, email, phone, address, postcode, location, total_orders, total_spent, last_order_date, status) VALUES
('John Smith', 'john.smith@email.com', '+44 7911 123456', '123 Main Street', 'SW1A 1AA', 'New York, NY', 12, 450.00, '2024-01-15', 'active'),
('Sarah Johnson', 'sarah.j@email.com', '+353 87 123 4567', '456 Oak Avenue', 'M1 1AA', 'Los Angeles, CA', 8, 320.00, '2024-01-10', 'active'),
('Mike Wilson', 'mike.wilson@email.com', '+44 20 7946 0958', '789 Pine Road', 'B1 1AA', 'Chicago, IL', 3, 125.00, '2023-12-20', 'inactive'),
('Emma Brown', 'emma.brown@email.com', '+1 555 123 4567', '321 Elm Street', '10001', 'Houston, TX', 15, 890.50, '2024-01-18', 'active'),
('David Clark', 'david.clark@email.com', '+44 7700 900123', '654 Maple Drive', 'E1 6AN', 'Phoenix, AZ', 6, 275.25, '2024-01-12', 'active');