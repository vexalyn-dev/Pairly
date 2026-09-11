-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0004_activities.sql
-- Purpose: Catalog of available interactive Pairly activities and mini-games.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Category constraint
  CONSTRAINT chk_activities_category CHECK (
    category IN ('game', 'quiz', 'canvas', 'moment', 'watch')
  )
);

-- Indexes for activities catalog queries
CREATE INDEX IF NOT EXISTS idx_activities_slug ON public.activities(slug);
CREATE INDEX IF NOT EXISTS idx_activities_category ON public.activities(category);
CREATE INDEX IF NOT EXISTS idx_activities_is_active ON public.activities(is_active);

COMMENT ON TABLE public.activities IS 'Catalog of all Pairly interactive activities, games, quizzes, and experiences';
COMMENT ON COLUMN public.activities.slug IS 'Unique URL-friendly and programmatic identifier for the activity';
