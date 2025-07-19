-- Update SKU generation function to use WHW prefix
CREATE OR REPLACE FUNCTION public.generate_auto_sku()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_sku TEXT;
BEGIN
    -- Get the next number by finding the highest existing SKU number + 1
    -- Support both old INV format and new WHW format during transition
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN sku ~ '^WHW-[0-9]+$' THEN 
                    CAST(SUBSTRING(sku FROM 5) AS INTEGER)
                WHEN sku ~ '^INV-[0-9]+$' THEN 
                    CAST(SUBSTRING(sku FROM 5) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1 INTO next_number
    FROM inventory;
    
    -- Generate new SKU with format WHW-XXXXX (5 digits, zero-padded)
    new_sku := 'WHW-' || LPAD(next_number::TEXT, 5, '0');
    
    -- Set the SKU if not provided
    IF NEW.sku IS NULL OR NEW.sku = '' THEN
        NEW.sku = new_sku;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;