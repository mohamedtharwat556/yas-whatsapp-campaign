-- Fix RLS policies to allow access without authentication
-- This is needed for the current implementation without Supabase Auth

-- Drop existing policies
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
