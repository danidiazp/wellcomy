import { useState, useEffect } from "react";
import { Copy, Check, MessageCircle, Users, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://your-spain-path.lovable.app";

interface Props {
  /** compact: inline strip for dashboard; default: card for results page */
  compact?: boolean;
}

export function ReferralShare({ compact = false }: Props) {
  const { user } = useAuth();
  const [copied, setCopied] = useState(false);
  const [credits, setCredits] = useState(0);
  const [referralCount, setReferralCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("referral_credits_months").eq("id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setCredits((data as any).referral_credits_months ?? 0); })
      .catch(() => {});
    supabase.from("referrals").select("id", { count: "exact", head: true }).eq("referrer_id", user.id)
      .then(({ count }) => { if (count != null) setReferralCount(count); })
      .catch(() => {});
  }, [user]);

  if (!user) return null;

  const link = `${BASE_URL}/?ref=${user.id}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Enlace copiado");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("No se pudo copiar. Copia manualmente:", { description: link });
    }
  };

  const whatsappText = encodeURIComponent(
    `Estoy usando esta plataforma para organizar mi mudanza a España y es muy útil. Te dejo mi enlace para que empieces gratis: ${link}`
  );
  const whatsappUrl = `https://wa.me/?text=${whatsappText}`;

  if (compact) {
    return (
      <div className="bg-card border border-border rounded-3xl p-5 lg:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-2xl bg-primary/10 grid place-items-center shrink-0">
              <Gift className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-sm">Invita a un amigo · gana 1 mes gratis</p>
              <p className="text-xs text-muted-foreground">Cuando se suscriba, te añadimos un mes de Base sin coste.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {referralCount > 0 && (
              <Badge variant="outline" className="text-xs gap-1">
                <Users className="h-3 w-3" /> {referralCount} {referralCount === 1 ? "invitado" : "invitados"}
              </Badge>
            )}
            {credits > 0 && (
              <Badge className="text-xs bg-success/15 text-success border-success/30 gap-1">
                <Check className="h-3 w-3" /> {credits} {credits === 1 ? "mes ganado" : "meses ganados"}
              </Badge>
            )}
            <Button size="sm" variant="outline" onClick={copyLink}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copiado" : "Copiar enlace"}
            </Button>
            <Button size="sm" variant="hero" asChild>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Full card variant (Results page)
  return (
    <div className="bg-gradient-hero border border-primary/20 rounded-3xl p-7 shadow-elegant space-y-5">
      <div className="flex items-start gap-4">
        <div className="h-11 w-11 rounded-2xl bg-primary/15 grid place-items-center shrink-0">
          <Gift className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display text-lg font-semibold">¿Conoces a alguien que también quiera venir a España?</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Comparte tu enlace personal. Cuando se suscriban, <strong>te regalamos 1 mes gratis</strong> del plan Base por cada persona.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 bg-secondary/60 rounded-2xl px-4 py-3 text-sm font-mono break-all">
        <span className="flex-1 text-xs">{link}</span>
        <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
          {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? "Copiado" : "Copiar"}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="hero" className="flex-1" asChild>
          <a href={whatsappUrl} target="_blank" rel="noreferrer">
            <MessageCircle className="h-4 w-4" /> Compartir por WhatsApp
          </a>
        </Button>
        <Button variant="outline" className="flex-1" onClick={copyLink}>
          {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
          {copied ? "Enlace copiado" : "Copiar enlace"}
        </Button>
      </div>

      {(referralCount > 0 || credits > 0) && (
        <div className="flex gap-3 pt-1">
          {referralCount > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Users className="h-3.5 w-3.5" /> {referralCount} {referralCount === 1 ? "persona invitada" : "personas invitadas"}
            </div>
          )}
          {credits > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-success">
              <Check className="h-3.5 w-3.5" /> {credits} {credits === 1 ? "mes ganado" : "meses ganados"}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
