-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('submissions', 'submissions', false),
  ('qr-codes', 'qr-codes', false),
  ('exports', 'exports', false),
  ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on storage.objects for our buckets to avoid conflict
DROP POLICY IF EXISTS "Allow public uploads matching draft_id" ON storage.objects;
DROP POLICY IF EXISTS "Allow select for public and admin" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin read qr-codes" ON storage.objects;
DROP POLICY IF EXISTS "Allow SA access to exports" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read avatars" ON storage.objects;
DROP POLICY IF EXISTS "Allow user manage own avatar" ON storage.objects;

-- 1. Submissions Policies
-- Allow public uploads (insert) matching draft_id (where registration id is folder name and registration is DRAFT)
CREATE POLICY "Allow public uploads matching draft_id" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'submissions' 
    AND (
      EXISTS (
        SELECT 1 FROM public.registrations 
        WHERE id::text = (storage.foldername(name))[2] 
        AND status = 'DRAFT'
      )
    )
  );

-- Allow select to matching team (via x-draft-id header) or Admins/Super Admins
CREATE POLICY "Allow select for public and admin" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'submissions'
    AND (
      (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'ADMIN')
      OR
      EXISTS (
        SELECT 1 FROM public.registrations
        WHERE id::text = (storage.foldername(name))[2]
        AND draft_id = current_setting('request.headers', true)::json->>'x-draft-id'
      )
    )
  );

-- 2. QR Codes Policies
-- Allow select limited to Admin/SA profiles
CREATE POLICY "Allow admin read qr-codes" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'qr-codes'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') IN ('SUPER_ADMIN', 'ADMIN')
  );

-- 3. Exports Policies
-- Locked exclusively to Super Admin profile (all actions)
CREATE POLICY "Allow SA access to exports" ON storage.objects
  FOR ALL USING (
    bucket_id = 'exports'
    AND (auth.jwt() -> 'app_metadata' ->> 'role') = 'SUPER_ADMIN'
  );

-- 4. Avatars Policies
-- Read allowed for anyone (public)
CREATE POLICY "Allow public read avatars" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'avatars'
  );

-- Write allowed for authenticated profile owner (avatars/{user_id}/filename)
CREATE POLICY "Allow user manage own avatar" ON storage.objects
  FOR ALL TO authenticated USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
