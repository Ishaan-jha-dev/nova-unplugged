-- ============================================================
-- NOVA UNPLUGGED — Migration 002: JWT Custom Claims
-- Injects role_level and payment_status into JWT app_metadata
-- so middleware can read them without a DB round-trip.
-- ============================================================

-- This function is called by a Supabase Auth Hook (custom access token hook).
-- Set it up in: Supabase Dashboard → Authentication → Hooks → Custom Access Token Hook
-- Point it to: public.custom_access_token_hook

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event JSONB)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  claims        JSONB;
  v_role_level  INT;
  v_payment     TEXT;
  v_user_id     UUID;
BEGIN
  v_user_id := (event->>'user_id')::UUID;
  claims     := event->'claims';

  -- Fetch user's role level and payment status
  SELECT
    ur.permissions_level,
    u.payment_status
  INTO v_role_level, v_payment
  FROM public.users u
  LEFT JOIN public.user_roles ur ON ur.id = u.role_id
  WHERE u.id = v_user_id;

  -- Set defaults if no record found yet
  v_role_level := COALESCE(v_role_level, 1);
  v_payment    := COALESCE(v_payment, 'pending');

  -- Inject into app_metadata (these appear in JWT)
  claims := jsonb_set(claims, '{app_metadata}',
    COALESCE(claims->'app_metadata', '{}')
    || jsonb_build_object(
         'role_level',      v_role_level,
         'payment_status',  v_payment
       )
  );

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant execute permission to supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;
