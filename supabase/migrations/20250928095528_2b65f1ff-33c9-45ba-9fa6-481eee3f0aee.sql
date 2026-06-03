-- Fix the phone column to allow NULL values
ALTER TABLE contact_messages ALTER COLUMN phone DROP NOT NULL;