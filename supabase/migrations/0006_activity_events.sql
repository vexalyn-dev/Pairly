-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0006_activity_events.sql
-- Purpose: Persistent audit and checkpoint events for activity sessions.
-- Note: Ephemeral state (cursor, typing, presence) is handled by Realtime Broadcast,
--       NOT continuously written here.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.activity_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.activity_sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Event type length constraint
  CONSTRAINT chk_activity_events_type CHECK (char_length(event_type) >= 2 AND char_length(event_type) <= 80)
);

-- Indexes for event replay and session telemetry
CREATE INDEX IF NOT EXISTS idx_activity_events_session_id ON public.activity_events(session_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_user_id ON public.activity_events(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_events_session_created ON public.activity_events(session_id, created_at ASC);

COMMENT ON TABLE public.activity_events IS 'Persistent game/activity milestones, locked answers, and session audit logs';
COMMENT ON COLUMN public.activity_events.payload IS 'Structured payload for the event (e.g. { question: 4, answer: "B" })';
