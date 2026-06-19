import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, Phone, ShieldCheck, Clock } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { track } from "@/lib/analytics";

// URL pública de Calendly del asesor/abogado (evento de 30 min).
// Se configura con la variable de entorno VITE_CALENDLY_URL (en Vercel /
// Lovable) o, en su defecto, con esta constante. Ejemplo:
//   https://calendly.com/wellcomy-asesor/30min
const CALENDLY_URL =
  (import.meta.env.VITE_CALENDLY_URL as string | undefined) ||
  "https://calendly.com/danioliveros050700/consulta-con-asesor-30-min";

const CALENDLY_CSS = "https://assets.calendly.com/assets/external/widget.css";
const CALENDLY_JS = "https://assets.calendly.com/assets/external/widget.js";

const HIGHLIGHTS = [
  { icon: Clock, title: "30 minutos", desc: "Una conversación enfocada para resolver tu situación." },
  { icon: Phone, title: "Te llamamos", desc: "Reserva tu hueco y el asesor te llamará al teléfono que indiques." },
  { icon: ShieldCheck, title: "Asesor especialista", desc: "Orientación experta sobre tu ruta migratoria a España." },
];

const Agenda = () => {
  const { user } = useAuth();
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    track("agenda_viewed");
  }, []);

  // Carga el widget oficial de Calendly e inicializa el calendario embebido,
  // pre-rellenando nombre/email si el usuario tiene sesión iniciada.
  useEffect(() => {
    if (!CALENDLY_URL || !widgetRef.current) return;
    const el = widgetRef.current;
    let cancelled = false;

    if (!document.querySelector(`link[href="${CALENDLY_CSS}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = CALENDLY_CSS;
      document.head.appendChild(link);
    }

    // Asegura el script de Calendly (sin duplicarlo).
    if (!document.querySelector(`script[src="${CALENDLY_JS}"]`)) {
      const script = document.createElement("script");
      script.src = CALENDLY_JS;
      script.async = true;
      document.body.appendChild(script);
    }

    const init = () => {
      const Calendly = (window as any).Calendly;
      if (cancelled || !Calendly || !el) return;
      el.innerHTML = "";
      Calendly.initInlineWidget({
        url: CALENDLY_URL,
        parentElement: el,
        prefill: user
          ? { email: user.email ?? "", name: (user.user_metadata as any)?.full_name ?? "" }
          : {},
      });
    };

    // Sondeamos window.Calendly en vez de fiarnos del evento `load`, que se
    // pierde por la carrera entre el doble montaje de React y el script ya
    // cacheado. En cuanto el SDK está disponible, inicializamos una sola vez.
    if ((window as any).Calendly) {
      init();
      return () => { cancelled = true; };
    }
    const poll = window.setInterval(() => {
      if ((window as any).Calendly) {
        window.clearInterval(poll);
        init();
      }
    }, 150);
    const stop = window.setTimeout(() => window.clearInterval(poll), 15000);
    return () => {
      cancelled = true;
      window.clearInterval(poll);
      window.clearTimeout(stop);
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <section className="container pt-12 pb-8 lg:pt-16">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary border border-border text-xs font-medium text-secondary-foreground mb-5">
            <CalendarClock className="h-3.5 w-3.5 text-accent" />
            Agenda tu consulta
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-[1.15] tracking-tight text-balance">
            Reserva 30 minutos con un asesor
          </h1>
          <p className="text-lg text-muted-foreground mt-4 text-pretty">
            Elige el hueco que mejor te venga. Verás la disponibilidad en tiempo real y
            recibirás la confirmación de tu cita al instante.
          </p>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8 max-w-3xl">
          {HIGHLIGHTS.map((h) => (
            <div key={h.title} className="bg-card border border-border rounded-2xl p-5">
              <div className="h-10 w-10 rounded-xl bg-secondary border border-border grid place-items-center mb-3">
                <h.icon className="h-4 w-4 text-primary" />
              </div>
              <p className="font-medium text-sm">{h.title}</p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{h.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container pb-20">
        {CALENDLY_URL ? (
          <div
            ref={widgetRef}
            className="calendly-inline-widget rounded-3xl overflow-hidden border border-border bg-card"
            style={{ minWidth: "320px", height: "720px" }}
            aria-label="Calendario de reservas"
          />
        ) : (
          <div className="rounded-3xl border border-dashed border-border bg-card/50 p-12 text-center max-w-2xl mx-auto">
            <CalendarClock className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">Agenda disponible muy pronto</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Estamos terminando de configurar la agenda del asesor. Mientras tanto, empieza tu
              diagnóstico gratuito para llegar a la consulta con tu caso ya preparado.
            </p>
            <Button asChild variant="hero" size="lg">
              <Link to="/diagnostico">Empezar diagnóstico</Link>
            </Button>
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
};

export default Agenda;
