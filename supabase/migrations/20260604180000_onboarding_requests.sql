-- Tracks manual contact requests and post-payment scheduling for diagnostic sessions.
CREATE TABLE IF NOT EXISTS public.onboarding_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL,
  country_code text,
  notes text,
  payment_method text NOT NULL DEFAULT 'manual', -- 'stripe' | 'manual'
  stripe_session_id text,
  status text NOT NULL DEFAULT 'pending',        -- 'pending' | 'confirmed' | 'done'
  timezone text,
  availability text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_requests ENABLE ROW LEVEL SECURITY;

-- Users can insert their own requests
CREATE POLICY "Users can insert own onboarding requests"
  ON public.onboarding_requests FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR profile_id IS NULL);

-- Users can read their own requests
CREATE POLICY "Users can read own onboarding requests"
  ON public.onboarding_requests FOR SELECT
  USING (profile_id = auth.uid());
