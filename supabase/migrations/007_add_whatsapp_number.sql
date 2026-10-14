-- Add whatsapp_number column to campaigns table
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
