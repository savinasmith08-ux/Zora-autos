-- Add subject column to store optional inquiry subject
ALTER TABLE public.contact_messages
ADD COLUMN IF NOT EXISTS subject text;