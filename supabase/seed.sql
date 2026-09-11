-- ==============================================================================
-- 💗 PAIRLY DATABASE SEED DATA: supabase/seed.sql
-- Purpose: Initial catalog activities for Pairly. Safe to run repeatedly (Idempotent).
-- ==============================================================================

INSERT INTO public.activities (slug, name, description, icon, category, is_active, is_premium)
VALUES
  (
    'couples-quiz',
    'Couples Quiz',
    'How well do you really know each other? Answer fun romantic and trivia questions together in realtime.',
    'HelpCircle',
    'quiz',
    true,
    false
  ),
  (
    'photobooth',
    'Retro Photobooth',
    'Snap live photos together, apply cute stickers, and create instant printable digital photo strips.',
    'Camera',
    'moment',
    true,
    false
  ),
  (
    'draw-together',
    'Draw Together',
    'A shared live collaborative canvas. Doodle, sketch, leave sweet notes, and watch each other draw in realtime.',
    'Palette',
    'canvas',
    true,
    false
  ),
  (
    'memories',
    'Memory Lane',
    'Keep your favorite milestones, romantic dates, love letters, and photo albums safe forever in your private space.',
    'BookOpen',
    'moment',
    true,
    false
  ),
  (
    'truth-or-dare',
    'Truth or Dare',
    'Spice up your conversation with tailored relationship prompts, spicy dares, and deep intimate questions.',
    'Sparkles',
    'game',
    true,
    false
  ),
  (
    'couples-court',
    'Couples Court',
    'A lighthearted playful court where you and your partner can playfully debate whose turn it is to wash dishes or pick dinner.',
    'Scale',
    'game',
    true,
    false
  ),
  (
    'mini-games',
    'Cozy Mini Games',
    'A collection of quick turn-based mini-games like Tic-Tac-Toe, Connect Four, and cute 2-player arcade challenges.',
    'Gamepad2',
    'game',
    true,
    false
  )
ON CONFLICT (slug) DO UPDATE
SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  category = EXCLUDED.category,
  is_active = EXCLUDED.is_active,
  is_premium = EXCLUDED.is_premium;
