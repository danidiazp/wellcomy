// Llamado por un Database Webhook de Supabase al insertarse un nuevo usuario en auth.users.
// Envía el email de bienvenida de Wellcomy via Resend.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { sendTransactionalEmail } from "../_shared/email.ts";
import { welcomeEmail } from "../_shared/email-templates.ts";

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const secret = req.headers.get("x-webhook-secret");
  if (secret !== Deno.env.get("AUTH_WEBHOOK_SECRET")) {
    return new Response("Unauthorized", { status: 401 });
  }

  const payload = await req.json();
  const record = payload?.record;
  const email = record?.email as string | undefined;
  if (!email) {
    return new Response(JSON.stringify({ skipped: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  }

  const name = record?.raw_user_meta_data?.full_name as string | undefined;
  const { subject, html } = welcomeEmail(name);
  await sendTransactionalEmail({ to: email, subject, html });

  return new Response(JSON.stringify({ sent: true }), { status: 200, headers: { "Content-Type": "application/json" } });
});
