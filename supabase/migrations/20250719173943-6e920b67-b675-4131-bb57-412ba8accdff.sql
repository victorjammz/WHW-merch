-- Update the product_variants table to make SKU optional for inserts
-- The trigger will still generate it automatically
ALTER TABLE public.product_variants ALTER COLUMN sku DROP NOT NULL;

-- Update the trigger to handle optional SKU
CREATE OR REPLACE FUNCTION public.generate_auto_sku()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    next_number INTEGER;
    new_sku TEXT;
BEGIN
    -- Only generate SKU if not provided
    IF NEW.sku IS NULL OR NEW.sku = '' THEN
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
        FROM product_variants 
        WHERE sku IS NOT NULL;
        
        -- Generate new SKU with format WHW-XXXXX (5 digits, zero-padded)
        new_sku := 'WHW-' || LPAD(next_number::TEXT, 5, '0');
        NEW.sku = new_sku;
    END IF;
    
    RETURN NEW;
END;
$$;