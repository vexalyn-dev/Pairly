-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0013_storage.sql
-- Purpose: Configure Supabase Storage buckets and room-aware storage RLS policies.
-- ==============================================================================

-- 1. Create storage buckets for Pairly
-- avatars: Publicly readable for fast rendering, writable only by owner
-- memories: Strictly PRIVATE, accessible only by verified room members
-- photobooth: Strictly PRIVATE, accessible only by verified room members
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  (
    'avatars', 
    'avatars', 
    true, 
    5242880, -- 5 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  ),
  (
    'memories', 
    'memories', 
    false, 
    52428800, -- 50 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav', 'audio/webm']
  ),
  (
    'photobooth', 
    'photobooth', 
    false, 
    20971520, -- 20 MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  )
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- 2. Storage Policies: avatars (Path: avatars/{user_id}/{filename})
-- ==========================================
CREATE POLICY "Avatars are publicly readable"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ==========================================
-- 3. Storage Policies: memories (Path: memories/{room_id}/{memory_id}/{filename})
-- ==========================================
CREATE POLICY "Room members can view memories media"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'memories' AND
    public.is_room_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Room members can upload memories media"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'memories' AND
    public.is_room_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Room members can delete memories media"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'memories' AND
    public.is_room_member(((storage.foldername(name))[1])::uuid)
  );

-- ==========================================
-- 4. Storage Policies: photobooth (Path: photobooth/{room_id}/{filename})
-- ==========================================
CREATE POLICY "Room members can view photobooth photos"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'photobooth' AND
    public.is_room_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Room members can upload photobooth photos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'photobooth' AND
    public.is_room_member(((storage.foldername(name))[1])::uuid)
  );

CREATE POLICY "Room members can delete photobooth photos"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'photobooth' AND
    public.is_room_member(((storage.foldername(name))[1])::uuid)
  );
