
-- 1) Prevent deletion of billing_profiles by any non-service role
CREATE POLICY "No one can delete billing profile"
  ON public.billing_profiles
  FOR DELETE
  TO authenticated, anon
  USING (false);

-- 2) Lock down SECURITY DEFINER functions: revoke from public/anon,
--    grant only where needed.

-- start_trial_no_card: called from client by signed-in users
REVOKE ALL ON FUNCTION public.start_trial_no_card(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.start_trial_no_card(uuid) TO authenticated, service_role;

-- has_premium_access & has_active_subscription: internal helpers, not called from client
REVOKE ALL ON FUNCTION public.has_premium_access(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_premium_access(uuid, text) TO service_role;

REVOKE ALL ON FUNCTION public.has_active_subscription(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_subscription(uuid, text) TO service_role;

-- handle_new_user: trigger only
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- update_updated_at_column: trigger only
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
