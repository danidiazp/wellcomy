-- Referral system: tracks who referred whom and credits earned.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_credits_months integer NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  referred_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  referred_email text,                     -- captured before account creation
  status text NOT NULL DEFAULT 'pending',  -- 'pending' | 'converted'
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  UNIQUE(referrer_id, referred_id)
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrer can read their own referrals
CREATE POLICY "Referrer reads own referrals"
  ON public.referrals FOR SELECT
  USING (referrer_id = auth.uid());

-- Any authenticated user can insert a referral (referred user records it on signup)
CREATE POLICY "Authenticated users can insert referrals"
  ON public.referrals FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Grant 1 month credit when a referral converts (founder calls this manually or via webhook).
CREATE OR REPLACE FUNCTION public.convert_referral(p_referred_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER AS $$
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
