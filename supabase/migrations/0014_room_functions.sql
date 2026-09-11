-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0014_room_functions.sql
-- Purpose: Atomic, concurrency-safe room creation and join functions.
-- ==============================================================================

-- 1. Atomic Room Creation Function
-- Creates a room and immediately adds the creator as the 'owner' member.
CREATE OR REPLACE FUNCTION public.create_room(
  p_name TEXT,
  p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_room_id UUID;
  v_room_code TEXT;
  v_clean_name TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu harus masuk terlebih dahulu.');
  END IF;

  v_clean_name := TRIM(p_name);
  IF length(v_clean_name) < 2 OR length(v_clean_name) > 50 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Nama room harus antara 2 hingga 50 karakter.');
  END IF;

  -- Insert room (code will use default generate_room_code(6))
  INSERT INTO public.rooms (name, created_by)
  VALUES (v_clean_name, v_user_id)
  RETURNING id, code INTO v_room_id, v_room_code;

  -- Add creator as owner
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (v_room_id, v_user_id, 'owner');

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room_id,
    'code', v_room_code,
    'name', v_clean_name
  );
END;
$$;

COMMENT ON FUNCTION public.create_room(TEXT, TEXT) IS 'Atomically creates a room and assigns the authenticated creator as owner';

-- 2. Concurrency-Safe Room Join Function
-- Serializes on the room row to strictly enforce max 2 members without race conditions.
CREATE OR REPLACE FUNCTION public.join_room_by_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_normalized_code TEXT;
  v_room RECORD;
  v_member_count INT;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu harus masuk terlebih dahulu.');
  END IF;

  v_normalized_code := UPPER(TRIM(p_code));
  IF length(v_normalized_code) != 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kode room harus 6 karakter.');
  END IF;

  -- 1. Find room and lock row to serialize concurrent joins
  SELECT id, code, name, status INTO v_room
  FROM public.rooms
  WHERE code = v_normalized_code
  FOR UPDATE;

  IF v_room.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room dengan kode tersebut tidak ditemukan.');
  END IF;

  IF v_room.status != 'active' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room ini sudah diarsipkan atau tidak aktif.');
  END IF;

  -- 2. Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM public.room_members
    WHERE room_id = v_room.id AND user_id = v_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', true,
      'room_id', v_room.id,
      'code', v_room.code,
      'name', v_room.name,
      'already_member', true
    );
  END IF;

  -- 3. Check existing member count
  SELECT COUNT(*) INTO v_member_count
  FROM public.room_members
  WHERE room_id = v_room.id;

  IF v_member_count >= 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Room ini sudah penuh. Maksimal 2 orang.');
  END IF;

  -- 4. Insert member as 'partner'
  INSERT INTO public.room_members (room_id, user_id, role)
  VALUES (v_room.id, v_user_id, 'partner');

  RETURN jsonb_build_object(
    'success', true,
    'room_id', v_room.id,
    'code', v_room.code,
    'name', v_room.name,
    'already_member', false
  );
END;
$$;

COMMENT ON FUNCTION public.join_room_by_code(TEXT) IS 'Concurrency-safe transactional room join enforcing exactly max 2 members';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.create_room(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_room_by_code(TEXT) TO authenticated;
