import { Link } from "react-router-dom";
import { Logo } from "./Logo";

const OFFICIAL_SOURCES = [
  { name: "Ministerio de Asuntos Exteriores", url: "https://www.exteriores.gob.es" },
  { name: "Portal de Inmigración", url: "https://extranjeros.inclusion.gob.es" },
  { name: "Sede Electrónica AGE", url: "https://sede.administracion.gob.es" },
  { name: "Policía Nacional", url: "https://www.policia.es" },
  { name: "Ministerio de Justicia", url: "https://www.mjusticia.gob.es" },
];

export const SiteFooter = () => (
  <footer className="border-t border-border/60 mt-24 bg-card/50">
    <div className="container py-12 grid gap-10 md:grid-cols-4">
      <div className="md:col-span-2 space-y-4">
        <Logo />
        <p className="text-sm text-muted-foreground max-w-sm">
          Plataforma digital de orientación para personas que quieren mudarse a España. Información clara, accionable y basada en fuentes oficiales.
        </p>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold mb-3">Rutas</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/rutas/estudios" className="hover:text-foreground">Estudios</Link></li>
          <li><Link to="/rutas/trabajo" className="hover:text-foreground">Trabajo</Link></li>
          <li><Link to="/rutas/reagrupacion-familiar" className="hover:text-foreground">Reagrupación familiar</Link></li>
        </ul>
      </div>
      <div>
        <h4 className="font-display text-sm font-semibold mb-3">Plataforma</h4>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li><Link to="/diagnostico" className="hover:text-foreground">Diagnóstico</Link></li>
          <li><Link to="/precios" className="hover:text-foreground">Precios</Link></li>
          <li><Link to="/recursos" className="hover:text-foreground">Recursos oficiales</Link></li>
          <li><Link to="/auth" className="hover:text-foreground">Crear cuenta</Link></li>
        </ul>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-8">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-[0.18em] mb-4">
          Fuentes oficiales consultadas
        </p>
        <div className="flex flex-wrap gap-x-3 gap-y-2">
          {OFFICIAL_SOURCES.map((s) => (
            <a
              key={s.name}
              href={s.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs px-3.5 py-1.5 rounded-full bg-secondary border border-border text-secondary-foreground hover:border-primary hover:text-primary transition-colors"
            >
              {s.name}
            </a>
          ))}
        </div>
      </div>
    </div>
    <div className="border-t border-border/60">
      <div className="container py-5 flex flex-col sm:flex-row justify-between gap-3 text-xs text-muted-foreground">
        <p>© {new Date().getFullYear()} Wellcomy. Información orientativa, no sustituye asesoramiento jurídico.</p>
        <p>Datos basados en fuentes oficiales del Gobierno de España.</p>
      </div>
    </div>
  </footer>
);
