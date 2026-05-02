-- ============================================================
-- NOVA UNPLUGGED — Migration 006: 8-Digit Alphanumeric Entry Codes
-- ============================================================

-- 1. Create a function to generate a random 8-character alphanumeric string
CREATE OR REPLACE FUNCTION public.generate_8_digit_alphanumeric()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 2. Update the trigger function to use the new 8-digit function instead of UUID
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    NEW.entry_code   := public.generate_8_digit_alphanumeric();
    NEW.entry_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Update existing users who have a UUID entry code
-- This replaces any existing long UUIDs with the new 8-digit format.
UPDATE public.users 
SET entry_code = public.generate_8_digit_alphanumeric()
WHERE entry_code IS NOT NULL AND length(entry_code) > 8;
