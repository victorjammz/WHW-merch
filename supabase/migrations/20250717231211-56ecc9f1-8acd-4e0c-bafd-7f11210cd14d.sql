-- Create function to generate auto-incrementing SKU
CREATE OR REPLACE FUNCTION generate_auto_sku()
RETURNS TRIGGER AS $$
DECLARE
    next_number INTEGER;
    new_sku TEXT;
BEGIN
    -- Get the next number by finding the highest existing SKU number + 1
    SELECT COALESCE(
        MAX(
            CASE 
                WHEN sku ~ '^INV-[0-9]+$' THEN 
                    CAST(SUBSTRING(sku FROM 5) AS INTEGER)
                ELSE 0
            END
        ), 0
    ) + 1 INTO next_number
    FROM inventory;
    
    -- Generate new SKU with format INV-XXXXX (5 digits, zero-padded)
    new_sku := 'INV-' || LPAD(next_number::TEXT, 5, '0');
    
    -- Set the SKU if not provided
    IF NEW.sku IS NULL OR NEW.sku = '' THEN
        NEW.sku = new_sku;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate SKU before insert
CREATE TRIGGER auto_generate_sku
    BEFORE INSERT ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION generate_auto_sku();