import { Link } from "react-router-dom";
import { CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";

// Página de reservas de Google Calendar (Appointment schedule) embebida.
// El parámetro `gv=true` activa el modo insertable. Configurable con
// VITE_BOOKING_URL. Componente compartido por /agenda y el dashboard.
const BOOKING_URL =
  (import.meta.env.VITE_BOOKING_URL as string | undefined) ||
  "https://calendar.google.com/calendar/appointments/schedules/AcZssZ22GSqpz55mrVOE4JLDREP4AB6G3Ylb1HPs4gKrW-wRWuuRVy040mMRv-cLsULbDHquhVI4Z4UY?gv=true";

export const BookingCalendar = () =>
  BOOKING_URL ? (
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
  );
