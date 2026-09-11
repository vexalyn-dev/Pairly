-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0011_rls.sql
-- Purpose: Enable and enforce Row Level Security (RLS) on all 10 application tables.
-- ==============================================================================

-- ==========================================
-- 1. TABLE: profiles
-- ==========================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ==========================================
-- 2. TABLE: rooms
-- ==========================================
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members and creators can view their rooms"
  ON public.rooms FOR SELECT
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_room_member(id)
  );

CREATE POLICY "Authenticated users can create rooms"
  ON public.rooms FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Members can update their room"
  ON public.rooms FOR UPDATE
  TO authenticated
  USING (public.is_room_member(id) OR created_by = auth.uid())
  WITH CHECK (public.is_room_member(id) OR created_by = auth.uid());

CREATE POLICY "Owners can delete their room"
  ON public.rooms FOR DELETE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_room_owner(id));

-- ==========================================
-- 3. TABLE: room_members
-- ==========================================
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view members of their room"
  ON public.room_members FOR SELECT
  TO authenticated
  USING (public.is_room_member(room_id));

CREATE POLICY "Users can join rooms as themselves"
  ON public.room_members FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can update their own membership details"
  ON public.room_members FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can leave or owner can remove"
  ON public.room_members FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_room_owner(room_id));

-- ==========================================
-- 4. TABLE: activities (Catalog)
-- ==========================================
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view active activities"
  ON public.activities FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Note: Mutations on activities are restricted to admin/service_role (no insert/update/delete policies for authenticated)

-- ==========================================
-- 5. TABLE: activity_sessions
-- ==========================================
ALTER TABLE public.activity_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view activity sessions"
  ON public.activity_sessions FOR SELECT
  TO authenticated
  USING (public.is_room_member(room_id));

CREATE POLICY "Room members can start activity sessions"
  ON public.activity_sessions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_room_member(room_id));

CREATE POLICY "Room members can update activity sessions"
  ON public.activity_sessions FOR UPDATE
  TO authenticated
  USING (public.is_room_member(room_id))
  WITH CHECK (public.is_room_member(room_id));

CREATE POLICY "Room members can delete activity sessions"
  ON public.activity_sessions FOR DELETE
  TO authenticated
  USING (public.is_room_member(room_id));

-- ==========================================
-- 6. TABLE: activity_events (Audit / Milestone Log)
-- ==========================================
ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view activity events"
  ON public.activity_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.activity_sessions s
      WHERE s.id = activity_events.session_id
        AND public.is_room_member(s.room_id)
    )
  );

CREATE POLICY "Users can only insert events as themselves within their session"
  ON public.activity_events FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (
      SELECT 1 FROM public.activity_sessions s
      WHERE s.id = activity_events.session_id
        AND public.is_room_member(s.room_id)
    )
  );

-- ==========================================
-- 7. TABLE: memories
-- ==========================================
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view memories"
  ON public.memories FOR SELECT
  TO authenticated
  USING (public.is_room_member(room_id));

CREATE POLICY "Room members can create memories"
  ON public.memories FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = created_by AND public.is_room_member(room_id)
  );

CREATE POLICY "Room members can update memories"
  ON public.memories FOR UPDATE
  TO authenticated
  USING (public.is_room_member(room_id))
  WITH CHECK (public.is_room_member(room_id));

CREATE POLICY "Creators or room owners can delete memories"
  ON public.memories FOR DELETE
  TO authenticated
  USING (
    created_by = auth.uid() OR public.is_room_owner(room_id)
  );

-- ==========================================
-- 8. TABLE: memory_media
-- ==========================================
ALTER TABLE public.memory_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view memory media"
  ON public.memory_media FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_media.memory_id
        AND public.is_room_member(m.room_id)
    )
  );

CREATE POLICY "Room members can attach media to memory"
  ON public.memory_media FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_media.memory_id
        AND public.is_room_member(m.room_id)
    )
  );

CREATE POLICY "Room members can delete memory media"
  ON public.memory_media FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.memories m
      WHERE m.id = memory_media.memory_id
        AND public.is_room_member(m.room_id)
    )
  );

-- ==========================================
-- 9. TABLE: notifications
-- ==========================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can create notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Users can update their own notifications (mark read)"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ==========================================
-- 10. TABLE: reports
-- ==========================================
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view only their own submitted reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);
