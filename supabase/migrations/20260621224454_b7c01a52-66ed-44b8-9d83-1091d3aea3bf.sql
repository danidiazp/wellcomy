CREATE TABLE public.consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'reserved',
  is_free boolean NOT NULL DEFAULT false,
  stripe_session_id text,
  stripe_payment_intent_id text,
  amount_eur numeric,
  environment text NOT NULL DEFAULT 'sandbox',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX consultations_user_id_idx ON public.consultations(user_id);
CREATE INDEX consultations_status_idx ON public.consultations(status);

GRANT SELECT, INSERT ON public.consultations TO authenticated;
GRANT ALL ON public.consultations TO service_role;

ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own consultations"
  ON public.consultations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert their own consultations"
  ON public.consultations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);