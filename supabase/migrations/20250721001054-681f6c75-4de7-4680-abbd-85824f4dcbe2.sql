-- Create function to auto-generate event codes
CREATE OR REPLACE FUNCTION public.generate_auto_event_code()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
    next_number INTEGER;
    new_code TEXT;
BEGIN
    -- Only generate code if not provided
    IF NEW.code IS NULL OR NEW.code = '' THEN
        -- Get the next number by finding the highest existing event code number + 1
        SELECT COALESCE(
            MAX(
                CASE 
                    WHEN code ~ '^EV-[0-9]+$' THEN 
                        CAST(SUBSTRING(code FROM 4) AS INTEGER)
                    ELSE 0
                END
            ), 0
        ) + 1 INTO next_number
        FROM events 
        WHERE code IS NOT NULL;
        
        -- Generate new code with format EV-XXXXX (5 digits, zero-padded)
        new_code := 'EV-' || LPAD(next_number::TEXT, 5, '0');
        NEW.code = new_code;
    END IF;
    
    RETURN NEW;
END;
$function$;

-- Create trigger to auto-generate event codes on insert
CREATE TRIGGER generate_event_code_trigger
    BEFORE INSERT ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_auto_event_code();