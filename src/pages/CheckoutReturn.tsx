// Página de retorno tras Stripe Checkout. Refresca la suscripción del usuario
// (los webhooks pueden tardar 1–5 segundos) y muestra el estado real.
// Si plan=onboarding en la query, muestra formulario de agenda tras el pago.
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, ArrowRight, Loader2, Sparkles, AlertCircle, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const MAX_POLLS = 6;
const POLL_INTERVAL_MS = 2000;

const TIMEZONES = [
  "America/Caracas (Venezuela, UTC-4)",
  "America/Bogota (Colombia, UTC-5)",
  "America/Lima (Perú, UTC-5)",
  "America/Mexico_City (México, UTC-6)",
  "America/Buenos_Aires (Argentina, UTC-3)",
  "America/Santiago (Chile, UTC-3)",
  "Europe/Madrid (España, UTC+1/+2)",
  "Otro",
];

function formatDate(d: Date) {
  return d.toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });
}

const SchedulingForm = ({ sessionId, profileId }: { sessionId: string | null; profileId: string | undefined }) => {
  const [timezone, setTimezone] = useState("");
  const [availability, setAvailability] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timezone) { toast.error("Selecciona tu zona horaria"); return; }
    if (!availability.trim()) { toast.error("Indica tu disponibilidad"); return; }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("onboarding_requests").insert({
        profile_id: profileId ?? null,
        name: "",
        email: "",
        payment_method: "stripe",
        stripe_session_id: sessionId,
        timezone,
        availability: availability.trim(),
        notes: notes.trim() || null,
        status: "confirmed",
      });
      if (error) throw error;
      setDone(true);
      toast.success("¡Perfecto! Te contactamos en menos de 24h.");
    } catch (e: any) {
      toast.error("No pudimos guardar tu disponibilidad", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="mx-auto h-14 w-14 rounded-full bg-success/15 grid place-items-center">
          <CheckCircle2 className="h-7 w-7 text-success" />
        </div>
        <h2 className="font-display text-xl font-semibold">¡Todo listo!</h2>
        <p className="text-muted-foreground text-sm">
          Recibirás un mensaje en menos de 24h para confirmar el horario de tu llamada.
        </p>
        <Button asChild variant="hero" size="lg">
          <Link to="/dashboard">Ir a mi dashboard <ArrowRight className="h-4 w-4" /></Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
          <Clock className="inline h-3 w-3 mr-1" /> Tu zona horaria
        </label>
        <Select value={timezone} onValueChange={setTimezone} required>
          <SelectTrigger className="h-11 rounded-xl">
            <SelectValue placeholder="Selecciona tu zona horaria…" />
          </SelectTrigger>
          <SelectContent>
            {TIMEZONES.map((tz) => (
              <SelectItem key={tz} value={tz}>{tz}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
          <Calendar className="inline h-3 w-3 mr-1" /> ¿Cuándo puedes hablar? (días y horarios)
        </label>
        <Textarea
          placeholder="Ej: lunes y miércoles por la mañana (9–12h), o cualquier tarde a partir de las 17h"
          value={availability}
          onChange={(e) => setAvailability(e.target.value)}
          rows={3}
          className="resize-none"
          required
        />
      </div>
      <div>
        <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
          Algo que debamos saber antes de la llamada (opcional)
        </label>
        <Textarea
          placeholder="Tu situación actual, dudas principales, fechas importantes…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="resize-none"
        />
      </div>
      <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
        {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : <>Confirmar disponibilidad <ArrowRight className="h-4 w-4" /></>}
      </Button>
    </form>
  );
};

const CheckoutReturn = () => {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const isOnboarding = params.get("plan") === "onboarding";

  const { user } = useAuth();
  const { subscription, accessSource, isActive, refresh, loading } = useSubscription();
  const [polls, setPolls] = useState(0);
  const [waiting, setWaiting] = useState(!isOnboarding);

  useEffect(() => {
    if (isOnboarding) { setWaiting(false); return; }
    if (isActive && accessSource === "paid") { setWaiting(false); return; }
    if (polls >= MAX_POLLS) { setWaiting(false); return; }
    const t = setTimeout(async () => {
      await refresh();
      setPolls((p) => p + 1);
    }, POLL_INTERVAL_MS);
    return () => clearTimeout(t);
  }, [polls, isActive, accessSource, refresh, isOnboarding]);

  const isStripeTrial = subscription?.status === "trialing";
  const periodEnd = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  const ready = isActive && accessSource === "paid";

  // ── Onboarding (one-time payment) flow ──────────────────────────────────
  if (isOnboarding) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1 container py-16 max-w-xl space-y-8">
          <div className="text-center space-y-3">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/15 grid place-items-center">
              <CheckCircle2 className="h-8 w-8 text-success" />
            </div>
            <h1 className="font-display text-3xl font-semibold">¡Pago confirmado!</h1>
            <p className="text-muted-foreground">
              Tu sesión de diagnóstico está reservada. Ahora dinos cuándo puedes hablar.
            </p>
          </div>
          <div className="bg-card border border-border rounded-3xl p-7 shadow-elegant">
            <h2 className="font-display text-lg font-semibold mb-5 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" /> Agenda tu llamada
            </h2>
            <SchedulingForm sessionId={sessionId} profileId={user?.id} />
          </div>
          {sessionId && (
            <p className="text-center text-[11px] text-muted-foreground font-mono opacity-60">
              Ref: {sessionId.slice(0, 18)}…
            </p>
          )}
        </main>
        <SiteFooter />
      </div>
    );
  }

  // ── Subscription flow ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container py-20 max-w-xl text-center space-y-6">
        {(loading || waiting) && !ready ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-secondary grid place-items-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Confirmando tu pago…</h1>
            <p className="text-muted-foreground">
              Estamos activando tu acceso. Esto suele tardar solo unos segundos.
            </p>
          </>
        ) : ready ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-success/15 grid place-items-center">
              {isStripeTrial ? <Sparkles className="h-8 w-8 text-accent" /> : <CheckCircle2 className="h-8 w-8 text-success" />}
            </div>
            <h1 className="font-display text-3xl font-semibold">
              {isStripeTrial ? "¡Tu prueba de 7 días está activa!" : "¡Suscripción activada!"}
            </h1>
            <p className="text-muted-foreground">
              Hemos activado tu acceso completo a tu dashboard, checklist y recordatorios.
            </p>
            {periodEnd && (
              <div className="rounded-2xl bg-secondary/60 border border-border p-4 text-sm text-left max-w-sm mx-auto">
                {isStripeTrial ? (
                  <p><span className="text-muted-foreground">Primer cobro: </span><strong>{formatDate(periodEnd)}</strong>. Cancela cuando quieras antes de esa fecha.</p>
                ) : (
                  <p><span className="text-muted-foreground">Próxima renovación: </span><strong>{formatDate(periodEnd)}</strong>.</p>
                )}
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="hero" size="lg"><Link to="/dashboard">Ir a mi dashboard <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button asChild variant="outline" size="lg"><Link to="/perfil">Ver mi suscripción</Link></Button>
            </div>
          </>
        ) : (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-warning/15 grid place-items-center">
              <AlertCircle className="h-8 w-8 text-warning" />
            </div>
            <h1 className="font-display text-3xl font-semibold">Tu pago se está procesando</h1>
            <p className="text-muted-foreground">
              Stripe ya tiene tu confirmación, pero la activación puede tardar un par de minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button asChild variant="hero" size="lg"><Link to="/dashboard">Ir a mi dashboard <ArrowRight className="h-4 w-4" /></Link></Button>
              <Button onClick={() => { setPolls(0); setWaiting(true); }} variant="outline" size="lg">Comprobar de nuevo</Button>
            </div>
          </>
        )}
        {sessionId && (
          <p className="text-[11px] text-muted-foreground font-mono opacity-70">Ref: {sessionId.slice(0, 18)}…</p>
        )}
      </main>
      <SiteFooter />
    </div>
  );
};

export default CheckoutReturn;
