-- Create missing tables if they don't exist

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  message TEXT NOT NULL,
  batch_size INTEGER DEFAULT 100,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'paused', 'completed', 'failed')),
  total_recipients INTEGER DEFAULT 0,
  processed_recipients INTEGER DEFAULT 0,
  successful_submissions INTEGER DEFAULT 0,
  failed_submissions INTEGER DEFAULT 0,
  current_batch INTEGER DEFAULT 0,
  landing_page_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Recipients table
CREATE TABLE IF NOT EXISTS recipients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  name TEXT,
  phone_number TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Campaign media table
CREATE TABLE IF NOT EXISTS campaign_media (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_recipients_campaign_id ON recipients(campaign_id);
CREATE INDEX IF NOT EXISTS idx_recipients_status ON recipients(status);
CREATE INDEX IF NOT EXISTS idx_campaign_media_campaign_id ON campaign_media(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_slug ON campaigns(slug);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_media ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can create campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can view their campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update their campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can delete their campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can manage recipients" ON recipients;
DROP POLICY IF EXISTS "Users can manage campaign media" ON campaign_media;

-- Create new policies that allow all access
CREATE POLICY "Users can create campaigns" ON campaigns
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view their campaigns" ON campaigns
  FOR SELECT USING (true);

CREATE POLICY "Users can update their campaigns" ON campaigns
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete their campaigns" ON campaigns
  FOR DELETE USING (true);

CREATE POLICY "Users can manage recipients" ON recipients
  FOR ALL USING (true);

CREATE POLICY "Users can manage campaign media" ON campaign_media
  FOR ALL USING (true);

-- Trigger to update updated_at
DROP TRIGGER IF EXISTS update_campaigns_updated_at ON campaigns;
CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
