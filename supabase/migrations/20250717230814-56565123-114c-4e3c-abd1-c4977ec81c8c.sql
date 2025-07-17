-- Add barcode fields to inventory table to link barcodes with SKUs
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS barcode_text TEXT,
ADD COLUMN IF NOT EXISTS barcode_type TEXT DEFAULT 'CODE128';

-- Create index for faster barcode lookups
CREATE INDEX IF NOT EXISTS idx_inventory_barcode_text ON inventory(barcode_text) WHERE barcode_text IS NOT NULL;

-- Create a function to auto-generate barcode from SKU if not provided
CREATE OR REPLACE FUNCTION generate_barcode_from_sku()
RETURNS TRIGGER AS $$
BEGIN
  -- If barcode_text is not provided, use the SKU as the barcode
  IF NEW.barcode_text IS NULL OR NEW.barcode_text = '' THEN
    NEW.barcode_text = NEW.sku;
  END IF;
  
  -- Ensure barcode_type has a default value
  IF NEW.barcode_type IS NULL OR NEW.barcode_type = '' THEN
    NEW.barcode_type = 'CODE128';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate barcode from SKU
DROP TRIGGER IF EXISTS trigger_generate_barcode_from_sku ON inventory;
CREATE TRIGGER trigger_generate_barcode_from_sku
  BEFORE INSERT OR UPDATE ON inventory
  FOR EACH ROW
  EXECUTE FUNCTION generate_barcode_from_sku();