-- Fix: plan_prices.stripe_price_id must hold Stripe *lookup_keys*, not price_xxx IDs.
-- The checkout/get-stripe-price edge functions resolve via stripe.prices.list({lookup_keys:[...]}).
-- The 3 existing "base" Stripe prices had lookup_key 'ruta_tier_a/b/c_monthly'; they were
-- updated in Stripe to 'ruta_base_tier_a/b/c_monthly' to match this convention.

UPDATE public.plan_prices SET stripe_price_id = 'ruta_base_tier_a_monthly' WHERE plan_slug = 'base' AND pricing_tier = 'A';
UPDATE public.plan_prices SET stripe_price_id = 'ruta_base_tier_b_monthly' WHERE plan_slug = 'base' AND pricing_tier = 'B';
UPDATE public.plan_prices SET stripe_price_id = 'ruta_base_tier_c_monthly' WHERE plan_slug = 'base' AND pricing_tier = 'C';

UPDATE public.plan_prices SET stripe_price_id = 'ruta_acomp_tier_a_monthly' WHERE plan_slug = 'acompanamiento' AND pricing_tier = 'A';
UPDATE public.plan_prices SET stripe_price_id = 'ruta_acomp_tier_b_monthly' WHERE plan_slug = 'acompanamiento' AND pricing_tier = 'B';
UPDATE public.plan_prices SET stripe_price_id = 'ruta_acomp_tier_c_monthly' WHERE plan_slug = 'acompanamiento' AND pricing_tier = 'C';

UPDATE public.plan_prices SET stripe_price_id = 'ruta_onboarding_tier_a_once' WHERE plan_slug = 'onboarding' AND pricing_tier = 'A';
UPDATE public.plan_prices SET stripe_price_id = 'ruta_onboarding_tier_b_once' WHERE plan_slug = 'onboarding' AND pricing_tier = 'B';
UPDATE public.plan_prices SET stripe_price_id = 'ruta_onboarding_tier_c_once' WHERE plan_slug = 'onboarding' AND pricing_tier = 'C';
