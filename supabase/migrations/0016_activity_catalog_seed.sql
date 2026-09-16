-- ==============================================================================
-- 💗 PAIRLY DATABASE MIGRATION: 0016_activity_catalog_seed.sql
-- Purpose: Idempotent Phase 4 activity catalog seed for already-migrated projects.
-- ==============================================================================

INSERT INTO public.activities (slug, name, description, icon, category, is_active, is_premium)
VALUES
  (
    'couples-quiz',
    'Couples Quiz',
    'Kuis seru untuk menguji seberapa dalam kamu mengenal satu sama lain.',
    '🎲',
    'quiz',
    true,
    false
  ),
  (
    'photobooth',
    'Retro Photobooth',
    'Ambil strip foto bergaya retro berdua dengan frame romantis.',
    '📸',
    'moment',
    true,
    false
  ),
  (
    'shared-canvas',
    'Shared Canvas',
    'Menggambar dan corat-coret bersama di kanvas realtime.',
    '🎨',
    'canvas',
    true,
    false
  ),
  (
    'memories-timeline',
    'Romantic Memories',
    'Abadikan timeline perjalanan cinta, tanggal jadian, dan jurnal berdua.',
    '💌',
    'moment',
    true,
    false
  ),
  (
    'truth-or-dare',
    'Truth or Dare',
    'Pertanyaan intim dan tantangan manis untuk mendekatkan hati.',
    '🔥',
    'game',
    true,
    false
  ),
  (
    'heartbeat-sync',
    'Heartbeat Sync',
    'Sinkronisasi detak jantung dan sentuhan virtual jarak jauh.',
    '💓',
    'watch',
    true,
    false
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    category = EXCLUDED.category,
    is_active = EXCLUDED.is_active,
    is_premium = EXCLUDED.is_premium;
