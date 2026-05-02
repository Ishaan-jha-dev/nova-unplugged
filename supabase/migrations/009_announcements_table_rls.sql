-- ============================================================
-- NOVA UNPLUGGED — Migration 009: Announcements Table RLS
-- ============================================================

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Anyone can view announcements
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;
CREATE POLICY "Anyone can view announcements" ON public.announcements FOR SELECT USING (true);

-- Admins (Level 3+) can create/manage announcements
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" 
  ON public.announcements 
  FOR ALL 
  USING (public.get_my_role_level() >= 3)
  WITH CHECK (public.get_my_role_level() >= 3);
