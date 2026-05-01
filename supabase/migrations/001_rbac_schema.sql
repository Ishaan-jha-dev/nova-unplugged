-- ============================================================
-- NOVA UNPLUGGED — Migration 001: Perfected RBAC Schema (RE-RUNNABLE)
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── user_types ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_types (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  description TEXT
);

INSERT INTO public.user_types (name, description) VALUES
  ('iimb_student', 'Standard student participant'),
  ('iimb_faculty', 'Faculty or Staff member')
ON CONFLICT (name) DO NOTHING;

-- ─── user_roles ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_roles (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL UNIQUE,
  permissions_level INT  NOT NULL CHECK (permissions_level BETWEEN 1 AND 5)
);

INSERT INTO public.user_roles (name, permissions_level) VALUES
  ('student',     1),
  ('volunteer',   2),
  ('oc_team',     3),
  ('admin',       4),
  ('super_admin', 5)
ON CONFLICT (name) DO NOTHING;

-- ─── users ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name      TEXT NOT NULL,
  email          TEXT NOT NULL UNIQUE,
  phone          TEXT,
  pincode        TEXT,
  state          TEXT,
  city           TEXT,
  batch          TEXT,
  zone           TEXT,
  type_id        UUID REFERENCES public.user_types(id),
  role_id        UUID REFERENCES public.user_roles(id),
  payment_status TEXT NOT NULL DEFAULT 'pending'
                   CHECK (payment_status IN ('pending', 'approved', 'rejected')),
  entry_code     UUID UNIQUE,
  entry_status   TEXT NOT NULL DEFAULT 'not_approved'
                   CHECK (entry_status IN ('not_approved', 'approved', 'scanned')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ─── Helper Functions ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_my_role_level()
RETURNS INT AS $$
  SELECT ur.permissions_level
  FROM public.users u
  JOIN public.user_roles ur ON ur.id = u.role_id
  WHERE u.id = auth.uid()
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- ─── Other Tables ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.payment_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  utr_number      TEXT NOT NULL,
  screenshot_url  TEXT,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note      TEXT,
  reviewed_by     UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.events (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title               TEXT NOT NULL,
  description         TEXT,
  banner_url          TEXT,
  category            TEXT NOT NULL DEFAULT 'other'
                        CHECK (category IN ('cultural', 'technical', 'sports', 'fun', 'other')),
  participation_type  TEXT NOT NULL DEFAULT 'individual'
                        CHECK (participation_type IN ('individual', 'team')),
  team_size_min       INT,
  team_size_max       INT,
  rulebook_url        TEXT,
  organizer_name      TEXT,
  organizer_contact   TEXT,
  group_join_link     TEXT,
  venue               TEXT,
  start_time          TIMESTAMPTZ,
  end_time            TIMESTAMPTZ,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_by          UUID REFERENCES public.users(id),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.teams (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  join_code  TEXT UNIQUE,
  leader_id  UUID NOT NULL REFERENCES public.users(id),
  is_open    BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team join code trigger logic
CREATE OR REPLACE FUNCTION public.set_team_join_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.join_code IS NULL THEN
    NEW.join_code := UPPER(SUBSTRING(gen_random_uuid()::TEXT, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safety: Drop trigger if it exists before creating
DROP TRIGGER IF EXISTS trg_team_join_code ON public.teams;
CREATE TRIGGER trg_team_join_code
  BEFORE INSERT ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.set_team_join_code();

CREATE TABLE IF NOT EXISTS public.team_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (team_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  event_id   UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  team_id    UUID REFERENCES public.teams(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, event_id)
);

CREATE TABLE IF NOT EXISTS public.announcements (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title      TEXT NOT NULL,
  body       TEXT NOT NULL,
  posted_by  UUID NOT NULL REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.scanner_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_code     TEXT NOT NULL,
  scanned_by     UUID NOT NULL REFERENCES public.users(id),
  scan_result    TEXT NOT NULL CHECK (scan_result IN ('valid', 'already_scanned', 'invalid')),
  target_user_id UUID REFERENCES public.users(id),
  scanned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Automation: Payment Approval
CREATE OR REPLACE FUNCTION public.handle_payment_approval()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'approved' AND (OLD.payment_status IS NULL OR OLD.payment_status != 'approved') THEN
    NEW.entry_code   := gen_random_uuid();
    NEW.entry_status := 'approved';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_approval ON public.users;
CREATE TRIGGER trg_payment_approval
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  WHEN (NEW.payment_status IS DISTINCT FROM OLD.payment_status)
  EXECUTE FUNCTION public.handle_payment_approval();

-- Automation: New User Sync
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_type_id UUID;
  v_role_id UUID;
BEGIN
  SELECT id INTO v_type_id FROM public.user_types WHERE name = COALESCE(NEW.raw_user_meta_data->>'user_type', 'iimb_student');
  SELECT id INTO v_role_id  FROM public.user_roles  WHERE name = 'student';

  INSERT INTO public.users (
    id, full_name, email, phone, pincode, state, city, batch, zone, type_id, role_id
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'pincode',
    NEW.raw_user_meta_data->>'state',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'batch',
    NEW.raw_user_meta_data->>'zone',
    v_type_id,
    v_role_id
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_new_user ON auth.users;
CREATE TRIGGER trg_new_user
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW 
  WHEN (NEW.email_confirmed_at IS NOT NULL)
  EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
CREATE POLICY "Users can view own profile" ON public.users FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.users;
CREATE POLICY "Admins can view all profiles" ON public.users FOR SELECT USING (public.get_my_role_level() >= 4);

-- Payment Submissions RLS
ALTER TABLE public.payment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own payment" ON public.payment_submissions;
CREATE POLICY "Users can insert own payment" ON public.payment_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own payment" ON public.payment_submissions;
CREATE POLICY "Users can view own payment" ON public.payment_submissions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payment_submissions;
CREATE POLICY "Admins can view all payments" ON public.payment_submissions FOR SELECT USING (public.get_my_role_level() >= 4);

DROP POLICY IF EXISTS "Admins can update payments" ON public.payment_submissions;
CREATE POLICY "Admins can update payments" ON public.payment_submissions FOR UPDATE USING (public.get_my_role_level() >= 4);
