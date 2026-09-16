-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0017_couples_quiz_functions.sql
-- Purpose: Authoritative Couples Quiz gameplay RPCs.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.ensure_couples_quiz_member(p_session_id UUID)
RETURNS public.activity_sessions
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.activity_sessions%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Kamu harus masuk terlebih dahulu.';
  END IF;

  SELECT s.* INTO v_session
  FROM public.activity_sessions s
  JOIN public.activities a ON a.id = s.activity_id
  WHERE s.id = p_session_id
    AND a.slug = 'couples-quiz';

  IF v_session.id IS NULL THEN
    RAISE EXCEPTION 'Sesi Couples Quiz tidak ditemukan.';
  END IF;

  IF NOT public.is_room_member(v_session.room_id, v_user_id) THEN
    RAISE EXCEPTION 'Kamu bukan anggota room ini.';
  END IF;

  RETURN v_session;
END;
$$;

CREATE OR REPLACE FUNCTION public.start_couples_quiz(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.activity_sessions%ROWTYPE;
  v_state JSONB;
BEGIN
  v_session := public.ensure_couples_quiz_member(p_session_id);

  v_state := COALESCE(v_session.state, '{}'::jsonb) || jsonb_build_object(
    'started_by', v_user_id,
    'started_at', timezone('utc'::text, now()),
    'question_index', COALESCE((v_session.state->>'question_index')::int, 0),
    'answers', COALESCE(v_session.state->'answers', '{}'::jsonb)
  );

  UPDATE public.activity_sessions
  SET status = 'in_progress',
      started_at = COALESCE(started_at, timezone('utc'::text, now())),
      state = v_state
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  INSERT INTO public.activity_events (session_id, user_id, event_type, payload)
  VALUES (p_session_id, v_user_id, 'quiz_started', '{}'::jsonb);

  RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'state', v_session.state);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_couples_quiz_answer(
  p_session_id UUID,
  p_question_id TEXT,
  p_answer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.activity_sessions%ROWTYPE;
  v_question_id TEXT := TRIM(p_question_id);
  v_answer TEXT := LEFT(TRIM(p_answer), 500);
  v_answers JSONB;
  v_user_answers JSONB;
BEGIN
  v_session := public.ensure_couples_quiz_member(p_session_id);

  IF v_session.status NOT IN ('waiting', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz sudah selesai.');
  END IF;

  IF char_length(v_question_id) < 2 OR char_length(v_question_id) > 80 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pertanyaan tidak valid.');
  END IF;

  IF char_length(v_answer) < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jawaban tidak boleh kosong.');
  END IF;

  v_answers := COALESCE(v_session.state->'answers', '{}'::jsonb);
  v_user_answers := COALESCE(v_answers->(v_user_id::text), '{}'::jsonb);
  v_user_answers := v_user_answers || jsonb_build_object(v_question_id, v_answer);
  v_answers := v_answers || jsonb_build_object(v_user_id::text, v_user_answers);

  UPDATE public.activity_sessions
  SET status = 'in_progress',
      state = COALESCE(state, '{}'::jsonb) || jsonb_build_object('answers', v_answers)
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  INSERT INTO public.activity_events (session_id, user_id, event_type, payload)
  VALUES (
    p_session_id,
    v_user_id,
    'quiz_answer_submitted',
    jsonb_build_object('question_id', v_question_id)
  );

  RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'state', v_session.state);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

CREATE OR REPLACE FUNCTION public.finish_couples_quiz(p_session_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_session public.activity_sessions%ROWTYPE;
  v_member_ids UUID[];
  v_answers JSONB;
  v_left JSONB;
  v_right JSONB;
  v_key TEXT;
  v_value TEXT;
  v_total INT := 0;
  v_matches INT := 0;
  v_score INT := 0;
  v_result JSONB;
BEGIN
  v_session := public.ensure_couples_quiz_member(p_session_id);

  SELECT ARRAY_AGG(user_id ORDER BY joined_at ASC) INTO v_member_ids
  FROM public.room_members
  WHERE room_id = v_session.room_id;

  IF array_length(v_member_ids, 1) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Butuh dua pemain untuk menyelesaikan quiz.');
  END IF;

  v_answers := COALESCE(v_session.state->'answers', '{}'::jsonb);
  v_left := COALESCE(v_answers->(v_member_ids[1]::text), '{}'::jsonb);
  v_right := COALESCE(v_answers->(v_member_ids[2]::text), '{}'::jsonb);

  FOR v_key, v_value IN SELECT * FROM jsonb_each_text(v_left) LOOP
    IF v_right ? v_key THEN
      v_total := v_total + 1;
      IF lower(trim(v_value)) = lower(trim(v_right->>v_key)) THEN
        v_matches := v_matches + 1;
      END IF;
    END IF;
  END LOOP;

  IF v_total > 0 THEN
    v_score := ROUND((v_matches::numeric / v_total::numeric) * 100);
  END IF;

  v_result := jsonb_build_object(
    'score', v_score,
    'matches', v_matches,
    'total', v_total,
    'finished_by', v_user_id,
    'finished_at', timezone('utc'::text, now())
  );

  UPDATE public.activity_sessions
  SET status = 'completed',
      ended_at = timezone('utc'::text, now()),
      state = COALESCE(state, '{}'::jsonb) || jsonb_build_object('result', v_result)
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  INSERT INTO public.activity_events (session_id, user_id, event_type, payload)
  VALUES (p_session_id, v_user_id, 'quiz_completed', v_result);

  RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'state', v_session.state, 'result', v_result);
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.start_couples_quiz(UUID) IS 'Starts a Couples Quiz session for an authenticated room member';
COMMENT ON FUNCTION public.submit_couples_quiz_answer(UUID, TEXT, TEXT) IS 'Stores one Couples Quiz answer for auth.uid()';
COMMENT ON FUNCTION public.finish_couples_quiz(UUID) IS 'Completes Couples Quiz and stores the simple match result';

GRANT EXECUTE ON FUNCTION public.ensure_couples_quiz_member(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_couples_quiz(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_couples_quiz_answer(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.finish_couples_quiz(UUID) TO authenticated;
