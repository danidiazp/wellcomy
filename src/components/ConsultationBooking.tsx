import { useEffect, useState } from "react";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { CalendarClock, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BookingCalendar } from "@/components/BookingCalendar";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { getPlanBundleForCountry, PLAN_PRICE_ID } from "@/lib/pricing";
import { track } from "@/lib/analytics";
import { toast } from "sonner";

type Phase = "idle" | "checkout" | "ready";

// Flujo de reserva de consulta para usuarios premium (Acompañamiento):
// 1ª sesión del mes incluida; las siguientes con cobro único reembolsable.
// El control de cuota/pago ocurre ANTES de mostrar el calendario de Google,
// porque el embed de Google no nos notifica cuándo se reserva.
export const ConsultationBooking = () => {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("idle");
  const [freeUsed, setFreeUsed] = useState<boolean | null>(null); // null = cargando
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [priceId, setPriceId] = useState<string>(PLAN_PRICE_ID.onboarding.B);
  const [amountEur, setAmountEur] = useState<number | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { count } = await supabase
        .from("consultations")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_free", true)
        .in("status", ["reserved", "completed"])
        .gte("created_at", startOfMonth.toISOString());
      if (cancelled) return;
      setFreeUsed((count ?? 0) > 0);

      // Precio de la sesión adicional según el país del usuario.
      const { data: prof } = await supabase
        .from("profiles")
        .select("active_process_nationality, current_residence_country")
        .eq("id", user.id)
        .maybeSingle();
      const country = prof?.active_process_nationality ?? prof?.current_residence_country ?? "";
      if (country) {
        try {
          const bundle = await getPlanBundleForCountry(country);
          if (!cancelled && bundle?.onboarding) {
            setPriceId(bundle.onboarding.stripe_price_id ?? PLAN_PRICE_ID.onboarding.B);
            setAmountEur(bundle.onboarding.eur_amount);
          }
        } catch { /* usa fallback */ }
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const startBooking = async () => {
    setStarting(true);
    track("consultation_booking_started");
    try {
      const { data, error } = await supabase.functions.invoke("create-consultation-checkout", {
        body: {
          priceId,
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&plan=consultation`,
        },
      });
      if (error) throw new Error(error.message);
      if (data?.free) {
        track("consultation_booked_free");
        toast.success("Sesión incluida en tu plan");
        setPhase("ready");
      } else if (data?.clientSecret) {
        track("consultation_checkout_started");
        setClientSecret(data.clientSecret);
        setPhase("checkout");
      } else {
        throw new Error(data?.error || "No se pudo iniciar la reserva");
      }
    } catch (e: any) {
      toast.error("No se pudo iniciar la reserva", { description: e.message });
    } finally {
      setStarting(false);
    }
  };

  if (phase === "ready") return <BookingCalendar />;

  if (phase === "checkout" && clientSecret) {
    return (
      <div className="bg-card border border-border rounded-3xl p-4 sm:p-6 max-w-2xl">
        <p className="font-medium text-sm mb-4">Sesión adicional · pago reembolsable si cancelas</p>
        <EmbeddedCheckoutProvider stripe={getStripe()} options={{ clientSecret, onComplete: () => setPhase("ready") }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>
    );
  }

  // idle
  if (freeUsed === null) {
    return (
      <div className="grid place-items-center py-16">
        <div className="h-9 w-9 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  const isFree = freeUsed === false;
  return (
    <div className="rounded-3xl border border-border bg-card p-8 lg:p-10 shadow-elegant max-w-2xl relative overflow-hidden">
      <div className="absolute -top-24 -right-24 h-64 w-64 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative space-y-5">
        <div className="h-12 w-12 rounded-2xl bg-secondary border border-border grid place-items-center">
          {isFree ? <Sparkles className="h-5 w-5 text-accent" /> : <CalendarClock className="h-5 w-5 text-primary" />}
        </div>
        {isFree ? (
          <>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Incluida en tu plan</p>
              <h2 className="font-display text-2xl font-semibold mt-1">Tu sesión de este mes está incluida</h2>
            </div>
            <p className="text-muted-foreground">
              Tu plan Acompañamiento incluye una consulta de 30 minutos al mes. Resérvala sin coste y elige el hueco que mejor te venga.
            </p>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-primary font-medium">Sesión adicional</p>
              <h2 className="font-display text-2xl font-semibold mt-1">Ya usaste tu sesión incluida este mes</h2>
            </div>
            <p className="text-muted-foreground">
              Puedes reservar una consulta adicional{amountEur != null ? ` por ${amountEur} €` : ""}. El pago es{" "}
              <strong>100% reembolsable</strong> si cancelas antes de la sesión.
            </p>
          </>
        )}
        <Button variant="hero" size="lg" onClick={startBooking} disabled={starting}>
          {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {isFree ? "Reservar consulta incluida" : "Reservar y pagar"}
          {!starting && <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};
