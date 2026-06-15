-- Enable extensions needed for scheduled HTTP calls
CREATE EXTENSION IF NOT EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Trigger function: when a new profile row is created (which happens via handle_new_user
-- whenever a new auth.users row is inserted), POST to send-welcome-email with the same
-- payload shape Supabase Database Webhooks emit for auth.users INSERT events.
CREATE OR REPLACE FUNCTION public.notify_send_welcome_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  webhook_secret text;
  project_url text := 'https://tiujmzjzgfwoyyhdqemh.supabase.co';
BEGIN
  SELECT decrypted_secret INTO webhook_secret
  FROM vault.decrypted_secrets
  WHERE name = 'AUTH_WEBHOOK_SECRET'
  LIMIT 1;

  PERFORM net.http_post(
    url := project_url || '/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', COALESCE(webhook_secret, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'users',
      'schema', 'auth',
      'record', jsonb_build_object(
        'id', NEW.id,
        'email', NEW.email,
        'created_at', NEW.created_at,
        'raw_user_meta_data', jsonb_build_object('full_name', NEW.full_name)
      )
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block user signup if the webhook call fails
  RAISE WARNING 'notify_send_welcome_email failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_send_welcome_email() FROM anon, authenticated;

DROP TRIGGER IF EXISTS profiles_send_welcome_email ON public.profiles;
CREATE TRIGGER profiles_send_welcome_email
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.notify_send_welcome_email();