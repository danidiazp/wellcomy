import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, Phone, FileText, Clock, Globe, ArrowRight, Loader2,
  MessageCircle, AlertCircle, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getCountryFlag, getCountryName } from "@/lib/countries";
import {
  getPlanBundleForCountry, convertEurTo, formatLocal,
  type PlanBundle, PLAN_PRICE_ID,
} from "@/lib/pricing";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { toast } from "sonner";

const WHAT_YOU_GET = [
  "Llamada de 45 minutos con el fundador",
  "Análisis de tu perfil exacto (estudios, trabajo, familia)",
  "Identificamos la ruta migratoria más rápida para ti",
  "Primeros 5 pasos concretos con enlaces oficiales",
  "Informe escrito personalizado entregado en 48h",
  "Resolución de tus dudas más urgentes",
];

const HOW_IT_WORKS = [
  { step: "1", title: "Paga una vez", desc: "Sin suscripción. Precio adaptado a tu país." },
  { step: "2", title: "Agenda la llamada", desc: "Te escribimos en menos de 24h para fijar la hora." },
  { step: "3", title: "Recibes tu informe", desc: "Entregado por escrito en 48h tras la llamada." },
];

const FALLBACK_EUR = 15;

const SessionOnboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const nav = useNavigate();

  const [country, setCountry] = useState("");
  const [bundle, setBundle] = useState<PlanBundle | null>(null);
  const [localApprox, setLocalApprox] = useState<string | null>(null);
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [creating, setCreating] = useState(false);

  // Manual contact form
  const [showManual, setShowManual] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualNotes, setManualNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase.from("profiles").select("active_process_nationality, primary_nationality").eq("id", user.id).maybeSingle();
        const def = data?.active_process_nationality ?? data?.primary_nationality ?? "";
        if (def) setCountry(def);
      } catch { /* noop */ }
    })();
  }, [user]);

  useEffect(() => {
    if (!country) { setBundle(null); setLocalApprox(null); return; }
    let cancelled = false;
    (async () => {
      setLoadingPrice(true);
      try {
        const bd = await getPlanBundleForCountry(country);
        if (cancelled) return;
        if (bd) {
          setBundle(bd);
          const cd = await import("@/lib/pricing").then((m) => m.getPricingForCountry(country));
          if (!cancelled && cd?.local_currency && cd.local_currency !== "EUR") {
            const local = await convertEurTo(cd.local_currency, bd.onboarding.eur_amount);
            if (!cancelled && local != null) setLocalApprox(formatLocal(local, cd.local_currency));
          }
        }
      } catch { /* use null bundle → fallback price */ }
      finally { if (!cancelled) setLoadingPrice(false); }
    })();
    return () => { cancelled = true; };
  }, [country]);

  const eurAmount = bundle?.onboarding.eur_amount ?? FALLBACK_EUR;
  const priceId = bundle?.onboarding.stripe_price_id ?? PLAN_PRICE_ID.onboarding.B;

  const handlePayCard = () => {
    if (!user) { nav(`/auth?redirect=/sesion-diagnostico`); return; }
    setShowCheckout(true);
  };

  const fetchClientSecret = async (): Promise<string> => {
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: {
          priceId,
          selectedPricingCountry: country || "XX",
          environment: getStripeEnvironment(),
          returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}&plan=onboarding`,
        },
      });
      if (error || !data?.clientSecret) throw new Error(error?.message || "No se pudo iniciar el pago");
      return data.clientSecret;
    } catch (e: any) {
      toast.error("Error iniciando el pago", { description: e.message });
      setShowCheckout(false);
      throw e;
    } finally {
      setCreating(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim() || !manualEmail.trim()) {
      toast.error("Rellena tu nombre y correo");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("onboarding_requests").insert({
        profile_id: user?.id ?? null,
        name: manualName.trim(),
        email: manualEmail.trim(),
        country_code: country || null,
        notes: manualNotes.trim() || null,
        payment_method: "manual",
        status: "pending",
      });
      if (error) throw error;
      setSubmitted(true);
      toast.success("¡Solicitud recibida! Te escribiremos en menos de 24h.");
    } catch (e: any) {
      toast.error("No pudimos enviar la solicitud", { description: e.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="flex-1">

        {/* Hero */}
        <section className="container max-w-4xl py-14 lg:py-20 text-center space-y-5">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Badge variant="outline" className="mb-4 text-xs px-3 py-1">
              <Phone className="h-3 w-3 mr-1.5" /> Pago único · sin suscripción
            </Badge>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-balance mb-4">
              Sesión de<br /><span className="text-primary">Diagnóstico Personalizada</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              45 minutos para analizar tu caso exacto y un informe escrito con tu mejor ruta y los primeros 5 pasos concretos.
            </p>
          </motion.div>
        </section>

        {/* What you get + How it works */}
        <section className="container max-w-4xl pb-14 grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-border rounded-3xl p-7 shadow-elegant">
            <h2 className="font-display text-xl font-semibold mb-5">Qué incluye</h2>
            <ul className="space-y-3">
              {WHAT_YOU_GET.map((f) => (
                <li key={f} className="flex items-start gap-3 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h2 className="font-display text-xl font-semibold">Cómo funciona</h2>
            {HOW_IT_WORKS.map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4 items-start">
                <div className="h-9 w-9 rounded-2xl bg-primary text-primary-foreground grid place-items-center shrink-0 font-display font-bold text-sm">
                  {step}
                </div>
                <div>
                  <p className="font-medium text-sm">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Price + Checkout */}
        <section className="container max-w-xl pb-16 space-y-5">
          {/* Country selector */}
          <div className="space-y-2">
            <label className="text-xs uppercase tracking-wider text-muted-foreground block">
              <Globe className="inline h-3 w-3 mr-1" /> Tu país de origen (precio adaptado)
            </label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger className="h-12 rounded-xl">
                <SelectValue placeholder="Selecciona tu país…" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="mr-2">{c.flag}</span> {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Price display */}
          <div className="bg-gradient-primary rounded-3xl p-7 text-primary-foreground text-center shadow-deep">
            {loadingPrice ? (
              <div className="flex items-center justify-center gap-2 opacity-70 h-16">
                <Loader2 className="h-5 w-5 animate-spin" /> Calculando tu precio…
              </div>
            ) : (
              <>
                <p className="text-xs uppercase tracking-[0.18em] opacity-70 mb-2">Pago único</p>
                <div className="flex items-baseline justify-center gap-1.5 mb-1">
                  <span className="font-display text-5xl font-semibold">{eurAmount} €</span>
                </div>
                {localApprox && (
                  <p className="text-sm opacity-70">≈ {localApprox} en tu moneda</p>
                )}
                {country && (
                  <p className="text-xs opacity-50 mt-1">{getCountryFlag(country)} Precio para {getCountryName(country)}</p>
                )}
              </>
            )}
          </div>

          {!showCheckout ? (
            <div className="space-y-3">
              <Button variant="hero" className="w-full h-13 text-base" size="lg" onClick={handlePayCard} disabled={authLoading || creating}>
                <FileText className="h-5 w-5" /> Reservar mi sesión con tarjeta <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setShowManual((v) => !v)}>
                <MessageCircle className="h-4 w-4" />
                ¿Prefieres pagar por otro método?
                {showManual ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </Button>
            </div>
          ) : (
            <div className="bg-card border border-border rounded-3xl p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="font-medium text-sm">Sesión de Diagnóstico · {eurAmount} € único</p>
                <Button variant="ghost" size="sm" onClick={() => setShowCheckout(false)}>Cancelar</Button>
              </div>
              <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
              {creating && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5"><Loader2 className="h-3 w-3 animate-spin" /> Creando sesión segura…</p>}
            </div>
          )}

          {/* Manual contact form */}
          {showManual && !showCheckout && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-6 space-y-4">
              <div>
                <h3 className="font-display text-base font-semibold">Contacto directo</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Déjanos tus datos. Te escribimos en menos de 24h con instrucciones de pago por transferencia o cualquier otra vía.
                </p>
              </div>
              {submitted ? (
                <div className="flex items-center gap-2 text-success text-sm py-2">
                  <Check className="h-4 w-4" /> ¡Solicitud enviada! Te contactamos pronto.
                </div>
              ) : (
                <form onSubmit={handleManualSubmit} className="space-y-3">
                  <Input
                    placeholder="Tu nombre completo"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />
                  <Input
                    type="email"
                    placeholder="Tu correo electrónico"
                    value={manualEmail}
                    onChange={(e) => setManualEmail(e.target.value)}
                    required
                  />
                  <Textarea
                    placeholder="Cuéntanos brevemente tu situación (opcional)"
                    value={manualNotes}
                    onChange={(e) => setManualNotes(e.target.value)}
                    rows={3}
                    className="resize-none"
                  />
                  <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <>Enviar solicitud <ArrowRight className="h-4 w-4" /></>}
                  </Button>
                </form>
              )}
            </motion.div>
          )}

          <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
            <AlertCircle className="h-3 w-3" /> Pago único, no es una suscripción. Sin compromiso posterior.
          </p>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
};

export default SessionOnboarding;
