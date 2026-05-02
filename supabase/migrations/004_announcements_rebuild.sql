-- ============================================================
-- NOVA UNPLUGGED — Migration 004: Announcements Rebuild
-- ============================================================

-- Add new columns to announcements table
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS target_audience TEXT,
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for announcements if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'announcements',
  'announcements',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Announcements bucket: public read (anyone, even unauthenticated)
CREATE POLICY "announcements_public_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'announcements');

-- Announcements bucket: level 3+ can upload
CREATE POLICY "announcements_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'announcements' AND
  public.get_my_role_level() >= 3
);

-- Announcements bucket: level 3+ can update/delete
CREATE POLICY "announcements_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'announcements' AND public.get_my_role_level() >= 3);

CREATE POLICY "announcements_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'announcements' AND public.get_my_role_level() >= 3);
