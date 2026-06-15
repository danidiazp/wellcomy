-- Restrict column-level access on billing_profiles so the internal fraud
-- 'risk_flag' (and 'pricing_review') is not exposed to end users via the Data API.
REVOKE SELECT, INSERT, UPDATE ON public.billing_profiles FROM authenticated;
REVOKE SELECT, INSERT, UPDATE ON public.billing_profiles FROM anon;

GRANT SELECT
  (id, user_id, ip_country, monthly_amount, subscription_status,
   stripe_customer_id, stripe_subscription_id, current_period_end,
   trial_end, trial_start, selected_currency, selected_pricing_country,
   created_at, updated_at)
  ON public.billing_profiles TO authenticated;

GRANT UPDATE
  (selected_currency, selected_pricing_country, ip_country)
  ON public.billing_profiles TO authenticated;

-- service_role keeps full access (used by edge functions / webhooks)
GRANT ALL ON public.billing_profiles TO service_role;