-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0015_activity_functions.sql
-- Purpose: Authoritative activity session lifecycle RPCs.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.start_activity_session(
  p_room_id UUID,
  p_activity_slug TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_activity public.activities%ROWTYPE;
  v_session public.activity_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu harus masuk terlebih dahulu.');
  END IF;

  IF NOT public.is_room_member(p_room_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu bukan anggota room ini.');
  END IF;

  SELECT * INTO v_activity
  FROM public.activities
  WHERE slug = LOWER(TRIM(p_activity_slug))
    AND is_active = true;

  IF v_activity.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Aktivitas tidak tersedia.');
  END IF;

  INSERT INTO public.activity_sessions (room_id, activity_id, status, state, started_at)
  VALUES (p_room_id, v_activity.id, 'waiting', '{}'::jsonb, timezone('utc'::text, now()))
  RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'room_id', v_session.room_id,
    'activity_id', v_session.activity_id,
    'activity_slug', v_activity.slug,
    'activity_name', v_activity.name,
    'status', v_session.status,
    'state', v_session.state,
    'started_at', v_session.started_at,
    'created_at', v_session.created_at
  );
END;
$$;

COMMENT ON FUNCTION public.start_activity_session(UUID, TEXT) IS 'Starts an activity session for an authenticated room member';

CREATE OR REPLACE FUNCTION public.finish_activity_session(
  p_session_id UUID,
  p_status TEXT,
  p_state JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.activity_sessions%ROWTYPE;
  v_status TEXT := LOWER(TRIM(p_status));
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu harus masuk terlebih dahulu.');
  END IF;

  SELECT * INTO v_session
  FROM public.activity_sessions
  WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesi aktivitas tidak ditemukan.');
  END IF;

  IF NOT public.is_room_member(v_session.room_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu bukan anggota room ini.');
  END IF;

  IF v_status NOT IN ('completed', 'abandoned', 'cancelled') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Status akhir sesi tidak valid.');
  END IF;

  UPDATE public.activity_sessions
  SET status = v_status,
      state = COALESCE(p_state, '{}'::jsonb),
      ended_at = timezone('utc'::text, now())
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', v_session.id,
    'status', v_session.status,
    'state', v_session.state,
    'ended_at', v_session.ended_at
  );
END;
$$;

COMMENT ON FUNCTION public.finish_activity_session(UUID, TEXT, JSONB) IS 'Finishes an activity session with a validated terminal status';

CREATE OR REPLACE FUNCTION public.append_activity_event(
  p_session_id UUID,
  p_event_type TEXT,
  p_payload JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.activity_sessions%ROWTYPE;
  v_event public.activity_events%ROWTYPE;
  v_event_type TEXT := TRIM(p_event_type);
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu harus masuk terlebih dahulu.');
  END IF;

  IF char_length(v_event_type) < 2 OR char_length(v_event_type) > 80 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tipe event tidak valid.');
  END IF;

  SELECT * INTO v_session
  FROM public.activity_sessions
  WHERE id = p_session_id;

  IF v_session.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Sesi aktivitas tidak ditemukan.');
  END IF;

  IF NOT public.is_room_member(v_session.room_id, v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Kamu bukan anggota room ini.');
  END IF;

  INSERT INTO public.activity_events (session_id, user_id, event_type, payload)
  VALUES (p_session_id, v_user_id, v_event_type, COALESCE(p_payload, '{}'::jsonb))
  RETURNING * INTO v_event;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_event.id,
    'session_id', v_event.session_id,
    'user_id', v_event.user_id,
    'event_type', v_event.event_type,
    'payload', v_event.payload,
    'created_at', v_event.created_at
  );
END;
$$;

COMMENT ON FUNCTION public.append_activity_event(UUID, TEXT, JSONB) IS 'Appends an activity event using auth.uid() as the authoritative user_id';

GRANT EXECUTE ON FUNCTION public.start_activity_session(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_activity_session(UUID, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.append_activity_event(UUID, TEXT, JSONB) TO authenticated;
