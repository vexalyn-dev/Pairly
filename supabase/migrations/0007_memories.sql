-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0007_memories.sql
-- Purpose: Store shared romantic moments, scrapbooks, and references to media files.
-- ==============================================================================

-- 1. Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  memory_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Ensure title is not an empty string
  CONSTRAINT chk_memories_title_not_empty CHECK (char_length(trim(title)) > 0)
);

-- Indexes for memories
CREATE INDEX IF NOT EXISTS idx_memories_room_id ON public.memories(room_id);
CREATE INDEX IF NOT EXISTS idx_memories_created_by ON public.memories(created_by);
CREATE INDEX IF NOT EXISTS idx_memories_memory_date ON public.memories(memory_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_room_date ON public.memories(room_id, memory_date DESC);

COMMENT ON TABLE public.memories IS 'Shared journal, milestones, and photo album memories between two partners';

-- 2. Create memory_media table (references files stored in Supabase Storage)
CREATE TABLE IF NOT EXISTS public.memory_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  media_type TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),

  -- Media type constraint
  CONSTRAINT chk_memory_media_type CHECK (
    media_type IN ('image', 'video', 'audio')
  ),

  -- Ensure storage path is not empty
  CONSTRAINT chk_memory_media_path_not_empty CHECK (char_length(trim(storage_path)) > 0)
);

-- Indexes for memory_media
CREATE INDEX IF NOT EXISTS idx_memory_media_memory_id ON public.memory_media(memory_id);
CREATE INDEX IF NOT EXISTS idx_memory_media_type ON public.memory_media(media_type);

COMMENT ON TABLE public.memory_media IS 'Metadata and Supabase Storage paths for media attachments associated with a memory';
COMMENT ON COLUMN public.memory_media.storage_path IS 'Relative path within the private memories storage bucket (e.g. {room_id}/{memory_id}/{filename})';
