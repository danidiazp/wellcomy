import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check, Globe, Sparkles, ArrowRight, Loader2, AlertCircle,
  Phone, FileText, Scale, Star, Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { COUNTRIES, getCountryFlag, getCountryName } from "@/lib/countries";
import {
  getPricingForCountry, getPlanBundleForCountry,
  convertEurTo, formatLocal,
  type CountryPricing, type PlanBundle, type PlanSlug,
  PLAN_PRICE_ID,
} from "@/lib/pricing";
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from "@stripe/react-stripe-js";
import { getStripe, getStripeEnvironment } from "@/lib/stripe";
import { StartTrialButton } from "@/components/StartTrialButton";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

const BASE_FEATURES = [
  "Diagnóstico personalizado de tu caso",
  "Roadmap por etapas con tiempos orientativos",
  "Checklist documental (apostilla, traducción)",
  "Recordatorios automáticos de renovación",
  "Acceso a fuentes oficiales actualizadas",
  "Cancela cuando quieras",
];

const ACOMP_EXTRA = [
  "Todo lo incluido en Base",
  "Abogado especialista asignado a tu caso",
  "Revisión de documentación antes de presentar",
  "Acompañamiento en cada trámite clave",
  "Canal directo con tu abogado",
  "Seguimiento hasta conseguir tu permiso",
];

const ONBOARDING_FEATURES = [
  "Llamada de diagnóstico de 45 minutos",
  "Informe escrito personalizado",
  "Mejor ruta para tu perfil exacto",
  "Primeros 5 pasos concretos con enlaces",
  "Entrega en 48 horas",
  "Pago único, sin suscripción",
];

const FALLBACK_BUNDLE: PlanBundle = {
  tier: "B",
  base:           { plan_slug: "base",           plan_name: "Base",                  plan_description: "", pricing_tier: "B", eur_amount: 5,  stripe_price_id: PLAN_PRICE_ID.base.B,           is_recurring: true },
  acompanamiento: { plan_slug: "acompanamiento", plan_name: "Acompañamiento",        plan_description: "", pricing_tier: "B", eur_amount: 15, stripe_price_id: PLAN_PRICE_ID.acompanamiento.B, is_recurring: true },
  onboarding:     { plan_slug: "onboarding",     plan_name: "Sesión de Diagnóstico", plan_description: "", pricing_tier: "B", eur_amount: 15, stripe_price_id: PLAN_PRICE_ID.onboarding.B,     is_recurring: false },
};

const Pricing = () => {
  const { user, loading: authLoading } = useAuth();
  const { hasNoCardTrial, isActive, accessSource } = useSubscription();
  const nav = useNavigate();

  const [country, setCountry] = useState<string>("");
  const [countryData, setCountryData] = useState<CountryPricing | null>(null);
  const [bundle, setBundle] = useState<PlanBundle | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const [localApprox, setLocalApprox] = useState<Record<PlanSlug, string | null>>({ base: null, acompanamiento: null, onboarding: null });
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [checkoutPlan, setCheckoutPlan] = useState<PlanSlug | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const { data } = await supabase.from("profiles").select("active_process_nationality, primary_nationality").eq("id", user.id).maybeSingle();
        if (cancelled) return;
        const def = data?.active_process_nationality ?? data?.primary_nationality ?? "";
        if (def) setCountry(def);
      } catch { /* noop */ }
    })();
    return () => { cancelled = true; };
  }, [user]);

  useEffect(() => {
    if (!country) { setBundle(null); setCountryData(null); setUsedFallback(false); return; }
    let cancelled = false;
    (async () => {
      setLoadingPrice(true);
      try {
        const [cd, bd] = await Promise.all([getPricingForCountry(country), getPlanBundleForCountry(country)]);
        if (cancelled) return;
        if (cd && bd) {
          setCountryData(cd);
          setBundle(bd);
          setUsedFallback(false);
          if (cd.local_currency && cd.local_currency !== "EUR") {
            const [lBase, lAcomp, lOnboard] = await Promise.all([
              convertEurTo(cd.local_currency, bd.base.eur_amount),
              convertEurTo(cd.local_currency, bd.acompanamiento.eur_amount),
              convertEurTo(cd.local_currency, bd.onboarding.eur_amount),
            ]);
            if (!cancelled) setLocalApprox({
              base: lBase != null ? formatLocal(lBase, cd.local_currency!) : null,
              acompanamiento: lAcomp != null ? formatLocal(lAcomp, cd.local_currency!) : null,
              onboarding: lOnboard != null ? formatLocal(lOnboard, cd.local_currency!) : null,
            });
          }
        } else {
          setBundle(FALLBACK_BUNDLE);
          setUsedFallback(true);
        }
      } catch {
        if (!cancelled) { setBundle(FALLBACK_BUNDLE); setUsedFallback(true); }
      } finally {
        if (!cancelled) setLoadingPrice(false);
      }
    })();
    return () => { cancelled = true; };
  }, [country]);

  const startCheckout = (plan: PlanSlug) => {
    if (!user) { nav(`/auth?redirect=/precios`); return; }
    if (!bundle) return;
    setCheckoutPlan(plan);
  };

  const fetchClientSecret = async (): Promise<string> => {
    if (!checkoutPlan || !bundle) throw new Error("No plan selected");
    setCreating(true);
    try {
      const planData = bundle[checkoutPlan];
      const priceId = planData.stripe_price_id ?? PLAN_PRICE_ID[checkoutPlan][bundle.tier];
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { priceId, selectedPricingCountry: country || "XX", environment: getStripeEnvironment(), returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}` },
      });
      if (error || !data?.clientSecret) throw new Error(error?.message || "No se pudo iniciar el pago");
      return data.clientSecret;
    } catch (e: any) {
      toast.error("Error iniciando el pago", { description: e.message });
      setCheckoutPlan(null);
      throw e;
    } finally {
      setCreating(false);
    }
  };

  const tierLabel: Record<string, string> = { A: "Europa / Cono Sur", B: "América Latina", C: "Precio social" };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <PaymentTestModeBanner />
      <SiteHeader />
      <main className="flex-1 container py-12 lg:py-16 max-w-6xl">

        {user && accessSource === "paid" && isActive && (
          <div className="mb-8 rounded-2xl bg-success/10 border border-success/30 p-4 flex items-center justify-between gap-4 flex-wrap">
            <p className="text-sm"><strong>Ya tienes una suscripción activa.</strong> Gestiónala desde tu perfil.</p>
            <Button asChild variant="hero" size="sm"><a href="/perfil">Ir a mi suscripción <ArrowRight className="h-3.5 w-3.5" /></a></Button>
          </div>
        )}
        {user && accessSource === "trial_no_card" && (
          <div className="mb-8 rounded-2xl bg-accent/10 border border-accent/30 p-4 flex items-center gap-2 text-sm flex-wrap">
            <Sparkles className="h-4 w-4 text-accent shrink-0" />
            Tu prueba gratis está activa. Suscríbete para no perder acceso cuando termine.
          </div>
        )}

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center space-y-4 mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-card border border-border text-xs font-medium">
            <Globe className="h-3.5 w-3.5 text-primary" />
            Precio adaptado a tu país · 7 días gratis
          </div>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-balance">
            Elige cómo quieres <span className="text-primary">avanzar</span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Desde información personalizada hasta abogado especialista asignado. El precio se adapta a tu país de origen.
          </p>
        </motion.div>

        {/* Country selector */}
        <div className="max-w-xs mx-auto mb-10 space-y-2">
          <label className="text-xs uppercase tracking-wider text-muted-foreground text-center block">Tu país de origen</label>
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
          {country && bundle && !loadingPrice && (
            <p className="text-center text-xs text-muted-foreground">
              {getCountryFlag(country)} {getCountryName(country)} · {tierLabel[bundle.tier] ?? "Precio adaptado"}
            </p>
          )}
          {loadingPrice && (
            <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Calculando tu precio…
            </p>
          )}
        </div>

        {/* Plan cards */}
        <div className="grid lg:grid-cols-3 gap-5 mb-10">

          {/* BASE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="bg-card border border-border rounded-3xl p-7 flex flex-col shadow-elegant">
            <div className="mb-5">
              <div className="h-10 w-10 rounded-2xl bg-secondary grid place-items-center mb-4">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1">Plataforma</p>
              <h2 className="font-display text-2xl font-semibold">Base</h2>
              <p className="text-sm text-muted-foreground mt-1">Diagnóstico + dashboard completo. Tú llevas el proceso con toda la información.</p>
            </div>
            <div className="mb-5">
              {loadingPrice ? (
                <div className="h-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calculando…</div>
              ) : bundle ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-semibold">{bundle.base.eur_amount} €</span>
                    <span className="text-muted-foreground text-sm">/ mes</span>
                  </div>
                  {localApprox.base && <p className="text-xs text-muted-foreground mt-1">≈ {localApprox.base} en tu moneda</p>}
                </>
              ) : (
                <p className="text-sm text-muted-foreground h-10">Selecciona tu país para ver el precio</p>
              )}
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {BASE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <div className="space-y-2 mt-auto">
              <StartTrialButton fullWidth size="default" label="Empezar 7 días gratis" />
              <Button variant="outline" className="w-full" onClick={() => startCheckout("base")} disabled={!bundle || !!checkoutPlan || authLoading}>
                Suscribirme al Base <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </motion.div>

          {/* ACOMPAÑAMIENTO */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="relative bg-gradient-primary rounded-3xl p-7 flex flex-col shadow-deep text-primary-foreground">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground text-xs font-bold px-4 py-1.5 rounded-full shadow-md">
                <Star className="h-3 w-3 fill-current" /> Recomendado
              </span>
            </div>
            <div className="mb-5 pt-2">
              <div className="h-10 w-10 rounded-2xl bg-primary-foreground/15 grid place-items-center mb-4">
                <Scale className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] opacity-70 font-medium mb-1">Plataforma + Legal</p>
              <h2 className="font-display text-2xl font-semibold">Acompañamiento</h2>
              <p className="text-sm opacity-80 mt-1">Todo lo de Base y además un abogado especialista asignado a tu caso.</p>
            </div>
            <div className="mb-5">
              {loadingPrice ? (
                <div className="h-10 flex items-center gap-2 opacity-70"><Loader2 className="h-4 w-4 animate-spin" /> Calculando…</div>
              ) : bundle ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-semibold">{bundle.acompanamiento.eur_amount} €</span>
                    <span className="opacity-70 text-sm">/ mes</span>
                  </div>
                  {localApprox.acompanamiento && <p className="text-xs opacity-70 mt-1">≈ {localApprox.acompanamiento} en tu moneda</p>}
                  <p className="text-xs opacity-50 mt-1.5">Precio provisional · se ajusta antes del lanzamiento</p>
                </>
              ) : (
                <p className="text-sm opacity-70 h-10">Selecciona tu país para ver el precio</p>
              )}
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {ACOMP_EXTRA.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 shrink-0 mt-0.5 opacity-90" /> {f}
                </li>
              ))}
            </ul>
            <div className="space-y-2 mt-auto">
              <Button className="w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
                onClick={() => startCheckout("acompanamiento")} disabled={!bundle || !!checkoutPlan || authLoading}>
                Quiero Acompañamiento <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-center opacity-60">Incluye 7 días de prueba gratis</p>
            </div>
          </motion.div>

          {/* ONBOARDING */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
            className="bg-card border border-border rounded-3xl p-7 flex flex-col shadow-elegant">
            <div className="mb-5">
              <div className="h-10 w-10 rounded-2xl bg-secondary grid place-items-center mb-4">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-1">Pago único</p>
              <h2 className="font-display text-2xl font-semibold">Sesión de Diagnóstico</h2>
              <p className="text-sm text-muted-foreground mt-1">Empieza esta semana. Llamada + informe escrito personalizado.</p>
            </div>
            <div className="mb-5">
              {loadingPrice ? (
                <div className="h-10 flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Calculando…</div>
              ) : bundle ? (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-4xl font-semibold">{bundle.onboarding.eur_amount} €</span>
                    <span className="text-muted-foreground text-sm">único</span>
                  </div>
                  {localApprox.onboarding && <p className="text-xs text-muted-foreground mt-1">≈ {localApprox.onboarding} en tu moneda</p>}
                  <p className="text-xs text-muted-foreground mt-1">Sin suscripción · entrega en 48h</p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground h-10">Selecciona tu país para ver el precio</p>
              )}
            </div>
            <ul className="space-y-2.5 mb-6 flex-1">
              {ONBOARDING_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" /> {f}
                </li>
              ))}
            </ul>
            <div className="space-y-2 mt-auto">
              <Button variant="hero" className="w-full" onClick={() => startCheckout("onboarding")} disabled={!bundle || !!checkoutPlan || authLoading}>
                <FileText className="h-4 w-4" /> Reservar mi sesión <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-xs text-center text-muted-foreground">Recibirás el informe en 48h</p>
            </div>
          </motion.div>

        </div>

        {/* Embedded checkout */}
        {checkoutPlan && bundle && (
          <div className="bg-card border border-border rounded-3xl p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-display text-lg font-semibold">
                {checkoutPlan === "base" ? "Plan Base" : checkoutPlan === "acompanamiento" ? "Acompañamiento" : "Sesión de Diagnóstico"}
                {country && (
                  <span className="text-muted-foreground text-sm ml-2">
                    {getCountryFlag(country)} {bundle[checkoutPlan].eur_amount} €{bundle[checkoutPlan].is_recurring ? "/mes" : " único"}
                  </span>
                )}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setCheckoutPlan(null)}>Cancelar</Button>
            </div>
            <EmbeddedCheckoutProvider stripe={getStripe()} options={{ fetchClientSecret }}>
              <EmbeddedCheckout />
            </EmbeddedCheckoutProvider>
            {creating && <p className="text-xs text-muted-foreground mt-2">Creando sesión segura…</p>}
          </div>
        )}

        {/* FAQ */}
        <div className="mt-10 grid sm:grid-cols-3 gap-4 text-sm text-muted-foreground">
          {[
            { q: "¿Por qué hay precios distintos?", a: "Adaptamos el precio al poder adquisitivo de cada país. Mismo producto, misma calidad, precio justo." },
            { q: "¿Puedo cambiar de plan?", a: "Sí, puedes subir de Base a Acompañamiento en cualquier momento desde tu perfil." },
            { q: "¿Qué hace el abogado exactamente?", a: "Te asignamos un especialista en extranjería. Revisa tus documentos, te acompaña en cada trámite y resuelve bloqueos." },
          ].map(({ q, a }) => (
            <div key={q} className="bg-card border border-border rounded-2xl p-5">
              <p className="font-semibold text-foreground mb-1">{q}</p>
              <p>{a}</p>
            </div>
          ))}
        </div>

        {usedFallback && (
          <p className="text-center text-xs text-warning mt-6 flex items-center justify-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" /> Aplicando precio estándar internacional para tu país.
          </p>
        )}

      </main>
      <SiteFooter />
    </div>
  );
};

export default Pricing;
