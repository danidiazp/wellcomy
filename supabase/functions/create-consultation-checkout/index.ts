import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

// Reserva de consulta de 30 min con asesor.
// Las citas son exclusivas del plan Acompañamiento (premium). La primera
// sesión de cada mes natural va incluida (gratis); a partir de la segunda
// se cobra (pago único reembolsable). El cobro se hace al reservar, en modo
// "payment" — la confirmación de la fila la marca payments-webhook.

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

// ¿El usuario tiene una suscripción Acompañamiento (premium) vigente?
async function isPremium(userId: string, env: StripeEnv): Promise<boolean> {
  const { data } = await supabase
    .from("subscriptions")
    .select("status, price_id, current_period_end")
    .eq("user_id", userId)
    .eq("environment", env)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!data) return false;
  const priceId = data.price_id ?? "";
  if (!priceId.includes("acomp")) return false;
  const validPeriod = !data.current_period_end || new Date(data.current_period_end) > new Date();
  if (["active", "trialing"].includes(data.status) && validPeriod) return true;
  if (data.status === "canceled" && data.current_period_end && new Date(data.current_period_end) > new Date()) return true;
  return false;
}

// ¿Ya usó su sesión gratis este mes natural?
async function hasUsedFreeThisMonth(userId: string): Promise<boolean> {
  const startOfMonth = new Date();
  startOfMonth.setUTCDate(1);
  startOfMonth.setUTCHours(0, 0, 0, 0);
  const { count } = await supabase
    .from("consultations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_free", true)
    .in("status", ["reserved", "completed"])
    .gte("created_at", startOfMonth.toISOString());
  return (count ?? 0) > 0;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader ?? "");
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const { priceId, environment, returnUrl } = await req.json();
    const env = (environment || "sandbox") as StripeEnv;

    // Solo premium puede reservar citas.
    if (!(await isPremium(user.id, env))) {
      return json({ error: "premium_required" }, 403);
    }

    // 1ª sesión del mes incluida → reserva gratis, sin pago.
    if (!(await hasUsedFreeThisMonth(user.id))) {
      const { error } = await supabase.from("consultations").insert({
        user_id: user.id,
        status: "reserved",
        is_free: true,
        environment: env,
      });
      if (error) return json({ error: error.message }, 500);
      return json({ free: true });
    }

    // Sesión adicional → cobro único.
    if (!priceId || typeof priceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return json({ error: "Invalid priceId" }, 400);
    }
    const stripe = createStripeClient(env);
    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) return json({ error: "Price not found" }, 404);
    const stripePrice = prices.data[0];

    const session = await stripe.checkout.sessions.create({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: "payment",
      ui_mode: "embedded",
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}&plan=consultation`,
      customer_email: user.email!,
      payment_intent_data: { metadata: { userId: user.id, type: "consultation" } },
      metadata: { userId: user.id, type: "consultation", environment: env },
    });

    // Fila provisional; payments-webhook la marca "reserved" al confirmarse el pago.
    await supabase.from("consultations").insert({
      user_id: user.id,
      status: "pending",
      is_free: false,
      stripe_session_id: session.id,
      amount_eur: (stripePrice.unit_amount ?? 0) / 100,
      environment: env,
    });

    return json({ clientSecret: session.client_secret, amountEur: (stripePrice.unit_amount ?? 0) / 100 });
  } catch (error) {
    console.error("create-consultation-checkout error", error);
    return json({ error: (error as Error).message }, 500);
  }
});
