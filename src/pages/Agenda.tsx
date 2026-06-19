import { useEffect } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CalendarCheck, ShieldCheck, Clock } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { track } from "@/lib/analytics";

// Página de reservas de Google Calendar (Appointment schedule) embebida.
// El parámetro `gv=true` activa el modo insertable (grid view). Se puede
// sobrescribir con la variable de entorno VITE_BOOKING_URL.
const BOOKING_URL =
  (import.meta.env.VITE_BOOKING_URL as string | undefined) ||
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ22GSqpz55mrVOE4JLDREP4AB6G3Ylb1HPs4gKrW-wRWuuRVy040mMRv-cLsULbDHquhVI4Z4UY?gv=true";

const HIGHLIGHTS = [
  { icon: Clock, title: "30 minutos", desc: "Una conversación enfocada para resolver tu situación." },
  { icon: CalendarCheck, title: "Confirmación inmediata", desc: "Recibes la cita y los recordatorios en tu correo automáticamente." },
  { icon: ShieldCheck, title: "Asesor especialista", desc: "Orientación experta sobre tu ruta migratoria a España." },
];

const Agenda = () => {
  useEffect(() => {
    track("agenda_viewed");
  }, []);

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
        {BOOKING_URL ? (
          <iframe
            src={BOOKING_URL}
            title="Reserva tu consulta"
            className="w-full rounded-3xl border border-border bg-card"
            style={{ minWidth: "320px", height: "720px" }}
            frameBorder={0}
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
