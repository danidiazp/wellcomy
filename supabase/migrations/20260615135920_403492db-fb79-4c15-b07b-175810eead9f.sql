
-- 1) Onboarding requests
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  country_code text,
  notes text,
  payment_method text NOT NULL DEFAULT 'manual',
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending',
  timezone text,
  availability text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.onboarding_requests TO authenticated;
GRANT INSERT ON public.onboarding_requests TO anon;
GRANT ALL ON public.onboarding_requests TO service_role;

ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own onboarding requests"
  ON public.onboarding_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR profile_id IS NULL);

CREATE POLICY "Users can read own onboarding requests"
  ON public.onboarding_requests FOR SELECT
  USING (profile_id = auth.uid());

-- 2) Referral system
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_credits_months integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

GRANT SELECT, INSERT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Referrer reads own referrals"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid());

CREATE POLICY "Authenticated users can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND referrer_id = auth.uid());

CREATE OR REPLACE FUNCTION public.convert_referral(p_referred_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.referrals
  SET status = 'converted', converted_at = now()
  WHERE referred_id = p_referred_id AND status = 'pending';

  UPDATE public.profiles p
  SET referral_credits_months = referral_credits_months + 1
  FROM public.referrals r
  WHERE r.referred_id = p_referred_id
    AND r.status = 'converted'
    AND r.referrer_id = p.id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.convert_referral(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.convert_referral(uuid) TO service_role;
