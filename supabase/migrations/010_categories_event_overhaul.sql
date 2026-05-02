-- ============================================================
-- NOVA UNPLUGGED — Migration 010: Categories & Event Schema Overhaul
-- ============================================================
-- IMPORTANT: Run this only after backing up or clearing old event data.
-- This migration:
--   1. Creates the `categories` table
--   2. Seeds 5 default categories
--   3. Adds `category_id` FK to events
--   4. Removes old `category TEXT` column
--   5. Replaces TIMESTAMPTZ start/end fields with DATE + TIME split
--   6. Adds `deadline TIMESTAMPTZ`

-- ─── STEP 1: Create categories table ────────────────────────
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT        NOT NULL UNIQUE,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── STEP 2: Seed default categories ────────────────────────
INSERT INTO public.categories (title, status) VALUES
  ('Cultural',  'active'),
  ('Technical', 'active'),
  ('Sports',    'active'),
  ('Fun',       'active'),
  ('Other',     'active')
ON CONFLICT (title) DO NOTHING;

-- ─── STEP 3: RLS for categories ─────────────────────────────
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL
  USING (public.get_my_role_level() >= 4)
  WITH CHECK (public.get_my_role_level() >= 4);

-- ─── STEP 4: Add category_id to events (nullable FK) ────────
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL;

-- ─── STEP 5: Drop old category TEXT column ──────────────────
-- (User confirmed old event data will be deleted — safe to drop directly)
ALTER TABLE public.events DROP COLUMN IF EXISTS category;

-- ─── STEP 6: Overhaul date/time fields on events ────────────
-- Drop old TIMESTAMPTZ fields
ALTER TABLE public.events DROP COLUMN IF EXISTS start_time;
ALTER TABLE public.events DROP COLUMN IF EXISTS end_time;

-- Add new split fields
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS event_date DATE;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS start_time TIME;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS end_time TIME;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

-- ─── STEP 7: Auto-update updated_at on categories ───────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
