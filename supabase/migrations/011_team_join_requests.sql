-- ============================================================
-- NOVA UNPLUGGED — Migration 011: Team Join Requests & Team Status
-- ============================================================

-- ─── STEP 1: Add dissolved status to teams ──────────────────
ALTER TABLE public.teams 
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
  CHECK (status IN ('active', 'dissolved'));

-- ─── STEP 2: Create team_join_requests table ────────────────
CREATE TABLE IF NOT EXISTS public.team_join_requests (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    UUID        NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id    UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

-- Auto-update updated_at
DROP TRIGGER IF EXISTS trg_team_requests_updated_at ON public.team_join_requests;
CREATE TRIGGER trg_team_requests_updated_at
  BEFORE UPDATE ON public.team_join_requests
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── STEP 3: RLS for team_join_requests ─────────────────────
ALTER TABLE public.team_join_requests ENABLE ROW LEVEL SECURITY;

-- Users can see their own requests
DROP POLICY IF EXISTS "Users can see own join requests" ON public.team_join_requests;
CREATE POLICY "Users can see own join requests" ON public.team_join_requests 
  FOR SELECT USING (auth.uid() = user_id);

-- Team leaders can see requests for their teams
DROP POLICY IF EXISTS "Leaders can see team join requests" ON public.team_join_requests;
CREATE POLICY "Leaders can see team join requests" ON public.team_join_requests 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_id AND teams.leader_id = auth.uid())
  );

-- Users can create a join request for themselves
DROP POLICY IF EXISTS "Users can create join requests" ON public.team_join_requests;
CREATE POLICY "Users can create join requests" ON public.team_join_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Team leaders can update (accept/reject) requests for their teams
DROP POLICY IF EXISTS "Leaders can respond to join requests" ON public.team_join_requests;
CREATE POLICY "Leaders can respond to join requests" ON public.team_join_requests 
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.teams WHERE teams.id = team_id AND teams.leader_id = auth.uid())
  );

-- Admins can manage all requests
DROP POLICY IF EXISTS "Admins can manage join requests" ON public.team_join_requests;
CREATE POLICY "Admins can manage join requests" ON public.team_join_requests 
  FOR ALL USING (public.get_my_role_level() >= 4);
