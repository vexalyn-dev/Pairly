-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0003_rooms.sql
-- Purpose: Create rooms and room_members tables with secure 2-member room limit.
-- ==============================================================================

-- 1. Helper function to generate unambiguous human-friendly uppercase room codes
-- Uses Crockford Base32-inspired alphabet (excludes I, O, 0, 1 to prevent human confusion)
CREATE OR REPLACE FUNCTION public.generate_room_code(p_length INT DEFAULT 6)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_chars TEXT := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  v_code TEXT;
  v_exists BOOLEAN;
  v_idx INT;
BEGIN
  LOOP
    v_code := '';
    FOR i IN 1..p_length LOOP
      v_idx := floor(random() * length(v_chars))::INT + 1;
      v_code := v_code || substr(v_chars, v_idx, 1);
    END LOOP;

    -- Ensure collision-free uniqueness in rooms table
    SELECT EXISTS (SELECT 1 FROM public.rooms WHERE code = v_code) INTO v_exists;
    IF NOT v_exists THEN
      RETURN v_code;
    END IF;
  END LOOP;
END;
$$;

COMMENT ON FUNCTION public.generate_room_code(INT) IS 'Generates unique, collision-safe, human-friendly uppercase room code without ambiguous characters';

-- 2. Create rooms table
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(8) UNIQUE NOT NULL DEFAULT public.generate_room_code(6),
  name TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Status constraint
  CONSTRAINT chk_rooms_status CHECK (status IN ('active', 'archived', 'closed')),

  -- Room code validation: 4 to 8 uppercase alphanumeric characters
  CONSTRAINT chk_rooms_code_format CHECK (code ~ '^[A-Z0-9]{4,8}$')
);

-- Indexes for rooms
CREATE INDEX IF NOT EXISTS idx_rooms_code ON public.rooms(code);
CREATE INDEX IF NOT EXISTS idx_rooms_created_by ON public.rooms(created_by);
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

COMMENT ON TABLE public.rooms IS 'Private Pairly spaces for two connected partners';
COMMENT ON COLUMN public.rooms.code IS 'Human-friendly short code for room pairing and invitation';

-- 3. Create room_members table
CREATE TABLE IF NOT EXISTS public.room_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'partner',
  nickname TEXT,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  last_seen_at TIMESTAMPTZ,

  -- Unique pairing: A user can only be a member of the same room once
  CONSTRAINT uq_room_members_room_user UNIQUE (room_id, user_id),

  -- Role constraint: owner (creator) or partner
  CONSTRAINT chk_room_members_role CHECK (role IN ('owner', 'partner'))
);

-- Indexes for room_members
CREATE INDEX IF NOT EXISTS idx_room_members_room_id ON public.room_members(room_id);
CREATE INDEX IF NOT EXISTS idx_room_members_user_id ON public.room_members(user_id);
CREATE INDEX IF NOT EXISTS idx_room_members_composite ON public.room_members(room_id, user_id);

COMMENT ON TABLE public.room_members IS 'Members of a private Pairly room. Enforces max 2 members per room at the database level.';

-- 4. Transaction-safe enforcement: MAX 2 MEMBERS PER ROOM
-- By locking the parent rooms row with FOR UPDATE, concurrent join transactions are serialized,
-- preventing race conditions where 2 users join simultaneously and exceed the 2-member limit.
CREATE OR REPLACE FUNCTION public.check_room_member_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_member_count INT;
BEGIN
  -- 1. Lock the parent room row to eliminate race conditions between concurrent joins
  PERFORM 1 FROM public.rooms WHERE id = NEW.room_id FOR UPDATE;

  -- 2. Count existing members in the room
  SELECT COUNT(*) INTO v_member_count
  FROM public.room_members
  WHERE room_id = NEW.room_id;

  -- 3. Enforce maximum 2 members business rule
  IF v_member_count >= 2 THEN
    RAISE EXCEPTION 'Pairly rooms are private spaces designed for exactly two people. Room % is already full.', NEW.room_id
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.check_room_member_limit() IS 'Enforces transaction-safe max 2 members per Pairly room by serializing on the parent room lock';

-- Attach member limit trigger BEFORE INSERT
DROP TRIGGER IF EXISTS trg_enforce_room_member_limit ON public.room_members;
CREATE TRIGGER trg_enforce_room_member_limit
  BEFORE INSERT ON public.room_members
  FOR EACH ROW
  EXECUTE FUNCTION public.check_room_member_limit();
