-- This migration fixes existing tables by adding missing columns
-- Run this if tables already exist but are missing columns

-- Add missing columns to campaigns table if they don't exist
DO $$
BEGIN
    -- Check and add slug column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'slug'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN slug TEXT UNIQUE;
    END IF;

    -- Check and add message column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'message'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN message TEXT NOT NULL DEFAULT '';
    END IF;

    -- Check and add batch_size column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'batch_size'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN batch_size INTEGER DEFAULT 100;
    END IF;

    -- Check and add status column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'status'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'paused', 'completed', 'failed'));
    END IF;

    -- Check and add total_recipients column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'total_recipients'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN total_recipients INTEGER DEFAULT 0;
    END IF;

    -- Check and add processed_recipients column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'processed_recipients'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN processed_recipients INTEGER DEFAULT 0;
    END IF;

    -- Check and add successful_submissions column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'successful_submissions'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN successful_submissions INTEGER DEFAULT 0;
    END IF;

    -- Check and add failed_submissions column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'failed_submissions'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN failed_submissions INTEGER DEFAULT 0;
    END IF;

    -- Check and add current_batch column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'current_batch'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN current_batch INTEGER DEFAULT 0;
    END IF;

    -- Check and add landing_page_url column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'landing_page_url'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN landing_page_url TEXT;
    END IF;

    -- Check and add updated_at column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'campaigns' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE campaigns ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Generate slugs for existing campaigns that don't have one
UPDATE campaigns
SET slug = 'campaign-' || id::text
WHERE slug IS NULL OR slug = '';

-- Add index on slug if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);
