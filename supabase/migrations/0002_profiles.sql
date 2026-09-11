-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0002_profiles.sql
-- Purpose: Create profiles table and secure auth.users lifecycle trigger.
-- ==============================================================================

-- 1. Create profiles table linked 1:1 with auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Ensure username follows alphanumeric and underscore rules (3-30 chars) if provided
  CONSTRAINT chk_profiles_username_format CHECK (
    username IS NULL OR (
      char_length(username) >= 3 AND 
      char_length(username) <= 30 AND 
      username ~ '^[a-zA-Z0-9_]+$'
    )
  )
);

-- 2. Create index for fast profile lookup by username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);

-- 3. Add table comments
COMMENT ON TABLE public.profiles IS 'Public user profile information, linked 1:1 to auth.users';
COMMENT ON COLUMN public.profiles.id IS 'Primary key, references auth.users(id)';
COMMENT ON COLUMN public.profiles.username IS 'Unique handle for Pairly users (3-30 characters, alphanumeric + underscore)';

-- 4. Create trigger function to automatically create profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_display_name TEXT;
  v_avatar_url TEXT;
BEGIN
  -- Extract fallback display name from metadata (OAuth Google, GitHub, etc.) or email prefix
  v_display_name := COALESCE(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );

  v_avatar_url := new.raw_user_meta_data->>'avatar_url';

  -- Insert profile safely; username left NULL for onboarding completion
  INSERT INTO public.profiles (
    id,
    username,
    display_name,
    avatar_url,
    bio,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    NULL,
    v_display_name,
    v_avatar_url,
    NULL,
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger function to auto-create public.profiles record when new auth.users is created';

-- 5. Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
