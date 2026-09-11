-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0008_notifications.sql
-- Purpose: In-app notifications for partner actions, invites, and system updates.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Notification type constraint
  CONSTRAINT chk_notifications_type CHECK (
    type IN (
      'room_invite',
      'activity_start',
      'memory_added',
      'reaction',
      'partner_joined',
      'system'
    )
  )
);

-- Indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications(user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

COMMENT ON TABLE public.notifications IS 'Application-level notifications for room invites, activity sessions, and partner events';
COMMENT ON COLUMN public.notifications.read_at IS 'Timestamp when user marked notification as read (NULL = unread)';
