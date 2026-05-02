-- ============================================================
-- NOVA UNPLUGGED — Migration 007: Events RLS Policies
-- ============================================================

-- Enable RLS on events table
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- 1. Anyone can view active events
DROP POLICY IF EXISTS "Anyone can view active events" ON public.events;
CREATE POLICY "Anyone can view active events" 
  ON public.events FOR SELECT 
  USING (is_active = true);

-- 2. Admins can view all events (including inactive ones)
DROP POLICY IF EXISTS "Admins can view all events" ON public.events;
CREATE POLICY "Admins can view all events" 
  ON public.events FOR SELECT 
  USING (public.get_my_role_level() >= 4);

-- 3. Admins can create events
DROP POLICY IF EXISTS "Admins can create events" ON public.events;
CREATE POLICY "Admins can create events" 
  ON public.events FOR INSERT 
  WITH CHECK (public.get_my_role_level() >= 4);

-- 4. Admins can update events
DROP POLICY IF EXISTS "Admins can update events" ON public.events;
CREATE POLICY "Admins can update events" 
  ON public.events FOR UPDATE 
  USING (public.get_my_role_level() >= 4)
  WITH CHECK (public.get_my_role_level() >= 4);

-- 5. Admins can delete events
DROP POLICY IF EXISTS "Admins can delete events" ON public.events;
CREATE POLICY "Admins can delete events" 
  ON public.events FOR DELETE 
  USING (public.get_my_role_level() >= 4);
