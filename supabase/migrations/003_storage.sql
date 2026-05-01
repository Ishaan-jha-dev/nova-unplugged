-- ============================================================
-- NOVA UNPLUGGED — Migration 003: Storage Buckets
-- ============================================================

-- Payment screenshots bucket (private — user uploads, admin reads all)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'payment-screenshots',
  'payment-screenshots',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- Event banners bucket (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-banners',
  'event-banners',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ─── Storage RLS Policies ────────────────────────────────────

-- payment-screenshots: users upload to their own folder
CREATE POLICY "payment_screenshots_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'payment-screenshots' AND
  (storage.foldername(name))[1] = auth.uid()::TEXT
);

-- payment-screenshots: user reads own; admin reads all
CREATE POLICY "payment_screenshots_select"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'payment-screenshots' AND (
    (storage.foldername(name))[1] = auth.uid()::TEXT OR
    public.get_my_role_level() >= 4
  )
);

-- event-banners: public read (anyone, even unauthenticated)
CREATE POLICY "event_banners_public_select"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'event-banners');

-- event-banners: level 3+ can upload
CREATE POLICY "event_banners_insert"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'event-banners' AND
  public.get_my_role_level() >= 3
);

-- event-banners: level 3+ can update/delete
CREATE POLICY "event_banners_update"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'event-banners' AND public.get_my_role_level() >= 3);

CREATE POLICY "event_banners_delete"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'event-banners' AND public.get_my_role_level() >= 3);
