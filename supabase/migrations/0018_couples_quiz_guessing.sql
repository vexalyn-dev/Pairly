-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0018_couples_quiz_guessing.sql
-- Purpose: Two-phase Couples Quiz answers and authoritative reciprocal scoring.
-- ==============================================================================

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
    'started_at', COALESCE(v_session.state->>'started_at', (timezone('utc'::text, now()))::text),
    'answers', jsonb_build_object(
      'original', COALESCE(v_session.state->'answers'->'original', '{}'::jsonb),
      'guess', COALESCE(v_session.state->'answers'->'guess', '{}'::jsonb)
    )
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
  p_answer TEXT,
  p_phase TEXT
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
  v_phase TEXT := LOWER(TRIM(p_phase));
  v_answers JSONB;
  v_phase_answers JSONB;
  v_user_answers JSONB;
  v_other_original JSONB;
BEGIN
  v_session := public.ensure_couples_quiz_member(p_session_id);

  IF v_session.status NOT IN ('waiting', 'in_progress') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Quiz sudah selesai.');
  END IF;
  IF v_phase NOT IN ('original', 'guess') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tahap jawaban tidak valid.');
  END IF;
  IF char_length(v_question_id) < 2 OR char_length(v_question_id) > 80 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Pertanyaan tidak valid.');
  END IF;
  IF char_length(v_answer) < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Jawaban tidak boleh kosong.');
  END IF;

  v_answers := COALESCE(v_session.state->'answers', '{}'::jsonb);
  v_phase_answers := COALESCE(v_answers->v_phase, '{}'::jsonb);

  IF v_phase = 'guess' THEN
    SELECT value INTO v_other_original
    FROM jsonb_each(COALESCE(v_answers->'original', '{}'::jsonb))
    WHERE key <> v_user_id::text
    LIMIT 1;
    IF v_other_original IS NULL OR NOT (v_other_original ? v_question_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Tunggu pasanganmu mengisi jawaban asli dulu.');
    END IF;
  END IF;

  v_user_answers := COALESCE(v_phase_answers->(v_user_id::text), '{}'::jsonb)
    || jsonb_build_object(v_question_id, v_answer);
  v_phase_answers := v_phase_answers || jsonb_build_object(v_user_id::text, v_user_answers);
  v_answers := v_answers || jsonb_build_object(v_phase, v_phase_answers);

  UPDATE public.activity_sessions
  SET status = 'in_progress',
      state = COALESCE(state, '{}'::jsonb) || jsonb_build_object('answers', v_answers)
  WHERE id = p_session_id
  RETURNING * INTO v_session;

  INSERT INTO public.activity_events (session_id, user_id, event_type, payload)
  VALUES (p_session_id, v_user_id, 'quiz_answer_submitted',
    jsonb_build_object('question_id', v_question_id, 'phase', v_phase));

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
  v_original JSONB;
  v_guess JSONB;
  v_left_original JSONB;
  v_right_original JSONB;
  v_left_guess JSONB;
  v_right_guess JSONB;
  v_question_id TEXT;
  v_total INT := 0;
  v_matches INT := 0;
  v_score INT := 0;
  v_rounds JSONB := '{}'::jsonb;
  v_left_match BOOLEAN;
  v_right_match BOOLEAN;
BEGIN
  v_session := public.ensure_couples_quiz_member(p_session_id);

  SELECT ARRAY_AGG(user_id ORDER BY joined_at ASC) INTO v_member_ids
  FROM public.room_members WHERE room_id = v_session.room_id;
  IF COALESCE(array_length(v_member_ids, 1), 0) < 2 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Butuh dua pemain untuk menyelesaikan quiz.');
  END IF;

  v_answers := COALESCE(v_session.state->'answers', '{}'::jsonb);
  v_original := COALESCE(v_answers->'original', '{}'::jsonb);
  v_guess := COALESCE(v_answers->'guess', '{}'::jsonb);
  v_left_original := COALESCE(v_original->(v_member_ids[1]::text), '{}'::jsonb);
  v_right_original := COALESCE(v_original->(v_member_ids[2]::text), '{}'::jsonb);
  v_left_guess := COALESCE(v_guess->(v_member_ids[1]::text), '{}'::jsonb);
  v_right_guess := COALESCE(v_guess->(v_member_ids[2]::text), '{}'::jsonb);

  FOR v_question_id IN SELECT id FROM (VALUES
    ('comfort-food'), ('perfect-date'), ('love-language'), ('stress-reset'), ('sweet-memory')
  ) AS questions(id) LOOP
    IF NOT (v_left_original ? v_question_id AND v_right_original ? v_question_id
      AND v_left_guess ? v_question_id AND v_right_guess ? v_question_id) THEN
      RETURN jsonb_build_object('success', false, 'error', 'Kedua pemain harus menyelesaikan semua tebakan dulu.');
    END IF;

    v_left_match := lower(trim(v_left_guess->>v_question_id)) = lower(trim(v_right_original->>v_question_id));
    v_right_match := lower(trim(v_right_guess->>v_question_id)) = lower(trim(v_left_original->>v_question_id));
    v_total := v_total + 2;
    v_matches := v_matches + v_left_match::int + v_right_match::int;
    v_rounds := v_rounds || jsonb_build_object(v_question_id, jsonb_build_object(
      'matches', v_left_match::int + v_right_match::int, 'total', 2,
      'left_match', v_left_match, 'right_match', v_right_match));
  END LOOP;
  v_score := ROUND((v_matches::numeric / v_total::numeric) * 100);

  UPDATE public.activity_sessions
  SET status = 'completed', ended_at = timezone('utc'::text, now()),
      state = COALESCE(state, '{}'::jsonb) || jsonb_build_object('result', jsonb_build_object(
        'score', v_score, 'matches', v_matches, 'total', v_total,
        'rounds', v_rounds, 'finished_by', v_user_id,
        'finished_at', timezone('utc'::text, now())))
  WHERE id = p_session_id RETURNING * INTO v_session;

  INSERT INTO public.activity_events (session_id, user_id, event_type, payload)
  VALUES (p_session_id, v_user_id, 'quiz_completed', v_session.state->'result');
  RETURN jsonb_build_object('success', true, 'session_id', v_session.id, 'state', v_session.state,
    'result', v_session.state->'result');
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.submit_couples_quiz_answer(UUID, TEXT, TEXT, TEXT) IS 'Stores original or guessed Couples Quiz answer for auth.uid()';
COMMENT ON FUNCTION public.finish_couples_quiz(UUID) IS 'Completes Couples Quiz by scoring reciprocal guesses against original answers';

DROP FUNCTION IF EXISTS public.submit_couples_quiz_answer(UUID, TEXT, TEXT);
GRANT EXECUTE ON FUNCTION public.submit_couples_quiz_answer(UUID, TEXT, TEXT, TEXT) TO authenticated;
