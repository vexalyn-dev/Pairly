-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0010_functions_and_triggers.sql
-- Purpose: Global updated_at trigger and secure RLS authorization helpers.
-- ==============================================================================

-- 1. Generic set_updated_at trigger function
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS 'Automatically updates updated_at column to current UTC timestamp on row update';

-- Attach set_updated_at trigger to tables with updated_at
DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_rooms_updated_at ON public.rooms;
CREATE TRIGGER trg_rooms_updated_at
  BEFORE UPDATE ON public.rooms
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_memories_updated_at ON public.memories;
CREATE TRIGGER trg_memories_updated_at
  BEFORE UPDATE ON public.memories
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- 2. Secure RLS Helper: is_room_member()
-- Evaluates whether the given user (defaulting to auth.uid()) is a verified member of the room.
-- Marked SECURITY DEFINER to avoid infinite recursion when called within RLS policies on tables
-- that participate in room relationships.
CREATE OR REPLACE FUNCTION public.is_room_member(
  p_room_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE room_id = p_room_id
      AND user_id = p_user_id
  );
$$;

COMMENT ON FUNCTION public.is_room_member(UUID, UUID) IS 'Checks if a user is an active member of the given room (Recursion-safe SECURITY DEFINER)';

-- 3. Secure RLS Helper: is_room_owner()
CREATE OR REPLACE FUNCTION public.is_room_owner(
  p_room_id UUID,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.room_members
    WHERE room_id = p_room_id
      AND user_id = p_user_id
      AND role = 'owner'
  );
$$;

COMMENT ON FUNCTION public.is_room_owner(UUID, UUID) IS 'Checks if a user has the owner role in the given room';
