-- Add is_hybrid column to cars table
ALTER TABLE public.cars ADD COLUMN is_hybrid boolean DEFAULT false;