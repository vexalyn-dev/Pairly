-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0009_reports.sql
-- Purpose: User moderation, safety, and abuse reporting foundation.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  room_id UUID REFERENCES public.rooms(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ,

  -- Status constraint
  CONSTRAINT chk_reports_status CHECK (
    status IN ('pending', 'reviewing', 'resolved', 'dismissed')
  ),

  -- Reason constraint: ensure reason is descriptive
  CONSTRAINT chk_reports_reason_not_empty CHECK (char_length(trim(reason)) > 0)
);

-- Indexes for moderation queries
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_room_id ON public.reports(room_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_user_id ON public.reports(target_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);

COMMENT ON TABLE public.reports IS 'Moderation reports submitted by users for inappropriate behavior or violations';
COMMENT ON COLUMN public.reports.status IS 'Review status: pending, reviewing, resolved, dismissed';
