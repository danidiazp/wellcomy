
ALTER TABLE public.assessment_results
  ADD COLUMN IF NOT EXISTS eligible_fast_track_nationality boolean;
