-- Launch setup: plan_prices table with real Stripe (live) price IDs.
-- Note: onboarding_requests, referrals, and convert_referral() were already
-- applied directly via Lovable's SQL editor before this migration.

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
  ('base','Base','Diagnóstico + dashboard + checklist + recordatorios automáticos','A', 8.00,'price_1TNCrKItZ2JYsIV9ivWa8uq7', true),
  ('base','Base','Diagnóstico + dashboard + checklist + recordatorios automáticos','B', 5.00,'price_1TNCrKItZ2JYsIV9dGoXv7PM', true),
  ('base','Base','Diagnóstico + dashboard + checklist + recordatorios automáticos','C', 2.00,'price_1TNCrJItZ2JYsIV9Brk8PkZr', true),
  -- Acompañamiento: platform + assigned specialist lawyer
  ('acompanamiento','Acompañamiento','Todo lo de Base + abogado especialista asignado a tu caso migratorio','A',29.00,'price_1TiayyItZ2JYsIV96xSQMsdQ', true),
  ('acompanamiento','Acompañamiento','Todo lo de Base + abogado especialista asignado a tu caso migratorio','B',15.00,'price_1TiayzItZ2JYsIV9sFsvvly7', true),
  ('acompanamiento','Acompañamiento','Todo lo de Base + abogado especialista asignado a tu caso migratorio','C', 8.00,'price_1Tiaz0ItZ2JYsIV9eTkPLRV7', true),
  -- Onboarding: one-time diagnostic session
  ('onboarding','Sesión de Diagnóstico','Llamada 45 min + informe escrito con tu mejor ruta y primeros 5 pasos','A',29.00,'price_1Tiaz1ItZ2JYsIV9DKdd4hvb', false),
  ('onboarding','Sesión de Diagnóstico','Llamada 45 min + informe escrito con tu mejor ruta y primeros 5 pasos','B',15.00,'price_1Tiaz1ItZ2JYsIV9WtnBwjvE', false),
  ('onboarding','Sesión de Diagnóstico','Llamada 45 min + informe escrito con tu mejor ruta y primeros 5 pasos','C', 7.00,'price_1Tiaz2ItZ2JYsIV91OiS8ZaW', false)
ON CONFLICT (plan_slug, pricing_tier) DO NOTHING;
