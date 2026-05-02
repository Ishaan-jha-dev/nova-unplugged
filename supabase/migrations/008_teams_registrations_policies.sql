-- ============================================================
-- NOVA UNPLUGGED — Migration 008: Teams & Registrations RLS
-- ============================================================

-- ─── TEAMS ──────────────────────────────────────────────────
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Anyone can see teams
DROP POLICY IF EXISTS "Anyone can view teams" ON public.teams;
CREATE POLICY "Anyone can view teams" ON public.teams FOR SELECT USING (true);

-- Authenticated users can create a team
DROP POLICY IF EXISTS "Users can create teams" ON public.teams;
CREATE POLICY "Users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = leader_id);

-- Leaders can update their own teams
DROP POLICY IF EXISTS "Leaders can update own teams" ON public.teams;
CREATE POLICY "Leaders can update own teams" ON public.teams FOR UPDATE USING (auth.uid() = leader_id);

-- Leaders can delete their own teams
DROP POLICY IF EXISTS "Leaders can delete own teams" ON public.teams;
CREATE POLICY "Leaders can delete own teams" ON public.teams FOR DELETE USING (auth.uid() = leader_id);


-- ─── TEAM MEMBERS ───────────────────────────────────────────
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

-- Anyone can see members
DROP POLICY IF EXISTS "Anyone can view team members" ON public.team_members;
CREATE POLICY "Anyone can view team members" ON public.team_members FOR SELECT USING (true);

-- Users can join teams (insert themselves)
DROP POLICY IF EXISTS "Users can join teams" ON public.team_members;
CREATE POLICY "Users can join teams" ON public.team_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can leave teams (delete themselves)
DROP POLICY IF EXISTS "Users can leave teams" ON public.team_members;
CREATE POLICY "Users can leave teams" ON public.team_members FOR DELETE USING (auth.uid() = user_id);


-- ─── REGISTRATIONS ──────────────────────────────────────────
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

-- Users can see their own registrations
DROP POLICY IF EXISTS "Users can view own registrations" ON public.registrations;
CREATE POLICY "Users can view own registrations" ON public.registrations FOR SELECT USING (auth.uid() = user_id);

-- Admins can see all registrations
DROP POLICY IF EXISTS "Admins can view all registrations" ON public.registrations;
CREATE POLICY "Admins can view all registrations" ON public.registrations FOR SELECT USING (public.get_my_role_level() >= 4);

-- Users can register themselves
DROP POLICY IF EXISTS "Users can register themselves" ON public.registrations;
CREATE POLICY "Users can register themselves" ON public.registrations FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can manage registrations
DROP POLICY IF EXISTS "Admins can manage registrations" ON public.registrations;
CREATE POLICY "Admins can manage registrations" ON public.registrations FOR ALL USING (public.get_my_role_level() >= 4);
