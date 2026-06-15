// Auth Email Hook de Supabase: recibe los eventos de auth (signup, magic link,
// recovery, invite, email change, reauthentication), valida la firma del hook
// con SEND_EMAIL_HOOK_SECRET (formato Standard Webhooks de Supabase) y envía
// el email vía el gateway de Resend que ya usamos en _shared/email.ts.
//
// Configurar en Cloud → Users → Auth Hooks → Send Email Hook:
//   URL: https://<project-ref>.supabase.co/functions/v1/auth-email-hook
//   Secret: el valor generado por Supabase (guardarlo como secret SEND_EMAIL_HOOK_SECRET).

import { Webhook } from "npm:standardwebhooks@1.0.0";
import { renderAuthEmail, type AuthEmailActionType } from "../_shared/auth-email-templates/index.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, webhook-id, webhook-timestamp, webhook-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const GATEWAY_RESEND_BASE = "https://connector-gateway.lovable.dev/resend";
const FROM_ADDRESS = "Wellcomy <hola@wellcomy.com>";

interface SupabaseAuthHookPayload {
  user: {
    id: string;
    email?: string;
    new_email?: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: AuthEmailActionType;
    site_url: string;
    token_new?: string;
    token_hash_new?: string;
    new_email?: string;
  };
}

function buildConfirmationUrl(payload: SupabaseAuthHookPayload): string {
  // Supabase recomienda construir el enlace de verificación así:
  // {site_url}/auth/v1/verify?token={token_hash}&type={action}&redirect_to={redirect_to}
  const { email_data } = payload;
  const base = email_data.site_url?.replace(/\/$/, "") ?? "";
  const params = new URLSearchParams({
    token: email_data.token_hash,
    type: email_data.email_action_type,
    redirect_to: email_data.redirect_to ?? "https://wellcomy.com",
  });
  return `${base}/auth/v1/verify?${params.toString()}`;
}

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const connectionApiKey = Deno.env.get("RESEND_API_KEY");
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

  if (!connectionApiKey || !lovableApiKey) {
    throw new Error("Faltan credenciales del gateway Resend/Lovable");
  }

  const res = await fetch(`${GATEWAY_RESEND_BASE}/emails`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${lovableApiKey}`,
      "X-Connection-Api-Key": connectionApiKey,
    },
    body: JSON.stringify({
      from: FROM_ADDRESS,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend error ${res.status}: ${body}`);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const hookSecret = Deno.env.get("SEND_EMAIL_HOOK_SECRET");
  if (!hookSecret) {
    console.error("SEND_EMAIL_HOOK_SECRET no configurado");
    return new Response(
      JSON.stringify({ error: "Server not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers);

  let payload: SupabaseAuthHookPayload;
  try {
    // El secret de Supabase viene con prefijo "v1,whsec_..." — quitamos el "v1,"
    // para que standardwebhooks lo acepte como base64 secret estándar.
    const normalizedSecret = hookSecret.replace(/^v1,/, "");
    const wh = new Webhook(normalizedSecret);
    payload = wh.verify(rawBody, headers) as SupabaseAuthHookPayload;
  } catch (err) {
    console.error("Firma del webhook inválida", err);
    return new Response(
      JSON.stringify({ error: "Invalid signature" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const recipient =
    payload.email_data.email_action_type === "email_change_new"
      ? payload.user.new_email ?? payload.email_data.new_email ?? payload.user.email
      : payload.user.email;

  if (!recipient) {
    return new Response(
      JSON.stringify({ error: "Missing recipient email" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  try {
    const { subject, html } = renderAuthEmail({
      actionType: payload.email_data.email_action_type,
      confirmationUrl: buildConfirmationUrl(payload),
      token: payload.email_data.token,
      email: payload.user.email,
      newEmail: payload.user.new_email ?? payload.email_data.new_email,
    });

    await sendEmail(recipient, subject, html);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error enviando email de auth", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
