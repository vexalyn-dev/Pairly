-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0005_activity_sessions.sql
-- Purpose: Track active or completed activity sessions within a Pairly room.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.activity_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES public.activities(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'waiting',
  state JSONB NOT NULL DEFAULT '{}'::jsonb,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Status constraint
  CONSTRAINT chk_activity_sessions_status CHECK (
    status IN ('waiting', 'in_progress', 'completed', 'abandoned', 'cancelled')
  )
);

-- Indexes for session querying
CREATE INDEX IF NOT EXISTS idx_activity_sessions_room_id ON public.activity_sessions(room_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_activity_id ON public.activity_sessions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_status ON public.activity_sessions(status);
CREATE INDEX IF NOT EXISTS idx_activity_sessions_room_status ON public.activity_sessions(room_id, status);

COMMENT ON TABLE public.activity_sessions IS 'Stateful instances of activities being played within a specific Pairly room';
COMMENT ON COLUMN public.activity_sessions.state IS 'Structured persistent state for the session (e.g. current question index, scores)';
