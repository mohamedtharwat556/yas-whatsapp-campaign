-- Create storage bucket for campaign media
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-media', 'campaign-media', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Public can view campaign media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete campaign media" ON storage.objects;

-- RLS Policies for campaign-media storage
-- Allow all users to upload (no auth required)
CREATE POLICY "Allow upload campaign media"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'campaign-media');

-- Allow all users to view campaign media
CREATE POLICY "Allow view campaign media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'campaign-media');

-- Allow all users to delete campaign media
CREATE POLICY "Allow delete campaign media"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'campaign-media');
