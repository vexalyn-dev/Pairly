-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0012_realtime.sql
-- Purpose: Configure Supabase Realtime publication for live multiplayer sync.
-- ==============================================================================

-- 1. Set REPLICA IDENTITY FULL so Realtime payloads include complete old & new row states
ALTER TABLE public.room_members REPLICA IDENTITY FULL;
ALTER TABLE public.activity_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.activity_events REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- 2. Add high-frequency collaborative tables to supabase_realtime publication
-- Note: Ephemeral state (cursor, typing, live presence) uses Realtime Broadcast/Presence channels,
--       while these tables power authoritative state synchronizations.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'room_members'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.room_members;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_sessions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'activity_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;
