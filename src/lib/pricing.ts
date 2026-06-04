import { supabase } from "@/integrations/supabase/client";
import type { CountryCode } from "./countries";

export type PricingTier = "A" | "B" | "C";
export type PlanSlug = "base" | "acompanamiento" | "onboarding";

export type CountryPricing = {
  country_code: string;
  country_name: string;
  pricing_tier: PricingTier;
  reference_eur_amount: number;
  local_currency: string | null;
  local_amount: number | null;
};

export type PlanPrice = {
  plan_slug: PlanSlug;
  plan_name: string;
  plan_description: string;
  pricing_tier: PricingTier;
  eur_amount: number;
  stripe_price_id: string | null;
  is_recurring: boolean;
};

export type PlanBundle = {
  tier: PricingTier;
  base: PlanPrice;
  acompanamiento: PlanPrice;
  onboarding: PlanPrice;
};

// Stripe price IDs per plan × tier.
export const PLAN_PRICE_ID: Record<PlanSlug, Record<PricingTier, string>> = {
  base: {
    A: "ruta_base_tier_a_monthly",
    B: "ruta_base_tier_b_monthly",
    C: "ruta_base_tier_c_monthly",
  },
  acompanamiento: {
    A: "ruta_acomp_tier_a_monthly",
    B: "ruta_acomp_tier_b_monthly",
    C: "ruta_acomp_tier_c_monthly",
  },
  onboarding: {
    A: "ruta_onboarding_tier_a_once",
    B: "ruta_onboarding_tier_b_once",
    C: "ruta_onboarding_tier_c_once",
  },
};

// Legacy — kept for backward compatibility with existing checkout code.
export const TIER_PRICE_ID: Record<PricingTier, string> = {
  A: PLAN_PRICE_ID.base.A,
  B: PLAN_PRICE_ID.base.B,
  C: PLAN_PRICE_ID.base.C,
};

// Detect plan name from a Stripe price_id string.
export function getPlanNameFromPriceId(priceId: string | null | undefined): string {
  if (!priceId) return "Ruta a España";
  if (priceId.includes("acomp")) return "Acompañamiento";
  if (priceId.includes("onboarding")) return "Sesión de Diagnóstico";
  if (priceId.includes("base")) return "Base";
  return "Ruta a España";
}

export async function getPricingForCountry(code: CountryCode | string): Promise<CountryPricing | null> {
  const { data, error } = await supabase
    .from("country_pricing_tiers")
    .select("country_code, country_name, pricing_tier, reference_eur_amount, local_currency, local_amount")
    .eq("country_code", code)
    .eq("active", true)
    .maybeSingle();
  if (error || !data) return null;
  return data as CountryPricing;
}

// Returns all 3 plan prices for the given country's PPP tier.
export async function getPlanBundleForCountry(code: CountryCode | string): Promise<PlanBundle | null> {
  const country = await getPricingForCountry(code);
  if (!country) return null;

  const { data, error } = await supabase
    .from("plan_prices")
    .select("plan_slug, plan_name, plan_description, pricing_tier, eur_amount, stripe_price_id, is_recurring")
    .eq("pricing_tier", country.pricing_tier)
    .eq("active", true);

  if (error || !data || data.length === 0) return null;

  const bySlug = Object.fromEntries(data.map((p: any) => [p.plan_slug, p])) as Record<string, PlanPrice>;

  if (!bySlug.base || !bySlug.acompanamiento || !bySlug.onboarding) return null;

  return {
    tier: country.pricing_tier,
    base: bySlug.base as PlanPrice,
    acompanamiento: bySlug.acompanamiento as PlanPrice,
    onboarding: bySlug.onboarding as PlanPrice,
  };
}

export async function getAllPricing(): Promise<CountryPricing[]> {
  const { data } = await supabase
    .from("country_pricing_tiers")
    .select("country_code, country_name, pricing_tier, reference_eur_amount, local_currency, local_amount")
    .eq("active", true)
    .order("pricing_tier");
  return (data ?? []) as CountryPricing[];
}

const fxCache = new Map<string, { value: number; ts: number }>();
const FX_TTL_MS = 1000 * 60 * 60 * 6;

export async function convertEurTo(currency: string, eurAmount: number): Promise<number | null> {
  if (currency === "EUR") return eurAmount;
  const cached = fxCache.get(currency);
  if (cached && Date.now() - cached.ts < FX_TTL_MS) {
    return Math.round(eurAmount * cached.value * 100) / 100;
  }
  try {
    const { data, error } = await supabase.functions.invoke("fx-rates", {
      body: { from: "EUR", to: currency },
    });
    if (error || !data?.rate) return null;
    fxCache.set(currency, { value: data.rate, ts: Date.now() });
    return Math.round(eurAmount * data.rate * 100) / 100;
  } catch {
    return null;
  }
}

export function formatLocal(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("es", {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 100 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}
