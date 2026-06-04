-- Plan prices: each plan at each PPP tier (A/B/C).
-- Prices for 'acompanamiento' are placeholders — adjust before market launch.
CREATE TABLE IF NOT EXISTS public.plan_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_slug text NOT NULL,
  plan_name text NOT NULL,
  plan_description text,
  pricing_tier text NOT NULL CHECK (pricing_tier IN ('A','B','C')),
  eur_amount numeric(10,2) NOT NULL,
  stripe_price_id text,
  is_recurring boolean NOT NULL DEFAULT true,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(plan_slug, pricing_tier)
);

ALTER TABLE public.plan_prices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Plan prices are public"
  ON public.plan_prices FOR SELECT
  USING (active = true);

INSERT INTO public.plan_prices
  (plan_slug, plan_name, plan_description, pricing_tier, eur_amount, stripe_price_id, is_recurring)
VALUES
  -- Base: platform only
  ('base','Base','Diagnóstico + dashboard + checklist + recordatorios automáticos','A', 8.00,'ruta_base_tier_a_monthly', true),
  ('base','Base','Diagnóstico + dashboard + checklist + recordatorios automáticos','B', 5.00,'ruta_base_tier_b_monthly', true),
  ('base','Base','Diagnóstico + dashboard + checklist + recordatorios automáticos','C', 2.00,'ruta_base_tier_c_monthly', true),
  -- Acompañamiento: platform + assigned specialist lawyer (placeholder prices)
  ('acompanamiento','Acompañamiento','Todo lo de Base + abogado especialista asignado a tu caso migratorio','A',29.00,'ruta_acomp_tier_a_monthly', true),
  ('acompanamiento','Acompañamiento','Todo lo de Base + abogado especialista asignado a tu caso migratorio','B',15.00,'ruta_acomp_tier_b_monthly', true),
  ('acompanamiento','Acompañamiento','Todo lo de Base + abogado especialista asignado a tu caso migratorio','C', 8.00,'ruta_acomp_tier_c_monthly', true),
  -- Onboarding: one-time diagnostic session
  ('onboarding','Sesión de Diagnóstico','Llamada 45 min + informe escrito con tu mejor ruta y primeros 5 pasos','A',29.00,'ruta_onboarding_tier_a_once', false),
  ('onboarding','Sesión de Diagnóstico','Llamada 45 min + informe escrito con tu mejor ruta y primeros 5 pasos','B',15.00,'ruta_onboarding_tier_b_once', false),
  ('onboarding','Sesión de Diagnóstico','Llamada 45 min + informe escrito con tu mejor ruta y primeros 5 pasos','C', 7.00,'ruta_onboarding_tier_c_once', false)
ON CONFLICT (plan_slug, pricing_tier) DO NOTHING;
