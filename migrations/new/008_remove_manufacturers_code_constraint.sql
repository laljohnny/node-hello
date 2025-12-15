-- Drop the unique constraint on the code column (which is likely country_code based on context)
ALTER TABLE public.manufacturers 
DROP CONSTRAINT IF EXISTS manufacturers_code_key;

