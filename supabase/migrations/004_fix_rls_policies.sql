-- ============================================================
-- NOVA UNPLUGGED — Migration 004: Fix Missing RLS Policies
-- ============================================================
-- PROBLEM: The users table was missing UPDATE/DELETE policies for admins.
-- This caused payment approval to silently fail when updating payment_status
-- via the anon client (RLS blocked it without error in some SDK versions).
-- 
-- FIX: Add admin UPDATE policy on users, and admin full-access on payment_submissions.
-- NOTE: The app now uses a server-side API route with service_role key for payment
-- approval (bypasses RLS entirely), but these policies are added as a safety net.

-- ─── users: Allow admins to update any user ──────────────────
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
CREATE POLICY "Admins can update users"
  ON public.users
  FOR UPDATE
  USING (public.get_my_role_level() >= 4)
  WITH CHECK (public.get_my_role_level() >= 4);

-- ─── payment_submissions: Allow admins to update any submission ──
-- (already exists but re-running to ensure correct WITH CHECK clause)
DROP POLICY IF EXISTS "Admins can update payments" ON public.payment_submissions;
CREATE POLICY "Admins can update payments"
  ON public.payment_submissions
  FOR UPDATE
  USING (public.get_my_role_level() >= 4)
  WITH CHECK (public.get_my_role_level() >= 4);
