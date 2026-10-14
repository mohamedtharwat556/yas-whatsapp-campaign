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
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload campaign media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'campaign-media' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to view their uploads
CREATE POLICY "Authenticated users can view campaign media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'campaign-media' AND
    auth.role() = 'authenticated'
  );

-- Allow public read access to campaign media (for landing pages)
CREATE POLICY "Public can view campaign media"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'campaign-media' AND
    (storage.foldername(name))[1] = 'public'
  );

-- Allow authenticated users to delete their uploads
CREATE POLICY "Authenticated users can delete campaign media"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'campaign-media' AND
    auth.role() = 'authenticated'
  );
