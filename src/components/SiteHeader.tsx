import { Link, useLocation } from "react-router-dom";
import { Logo } from "./Logo";
import { Button } from "./ui/button";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, LayoutDashboard, User, ChevronDown, CalendarClock } from "lucide-react";
import { SubscriptionStatusBadge } from "./SubscriptionStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

// Vías para venir a España — agrupadas en un único desplegable.
const ROUTES = [
  { to: "/rutas/estudios", label: "Estudios", desc: "Visado de estancia por estudios" },
  { to: "/rutas/trabajo", label: "Trabajo", desc: "Residencia y trabajo" },
  { to: "/rutas/reagrupacion-familiar", label: "Reagrupación familiar", desc: "Traer a tu familia" },
];

export const SiteHeader = () => {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();

  const navLinkClass = (active: boolean) =>
    `px-3.5 py-2 rounded-full text-sm font-medium transition-colors ${
      active
        ? "bg-secondary text-foreground"
        : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
    }`;

  const routesActive = pathname.startsWith("/rutas");

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/60">
      <div className="container flex h-16 items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-1">
          <Link to="/" className={navLinkClass(pathname === "/")}>
            Inicio
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger
              className={`${navLinkClass(routesActive)} inline-flex items-center gap-1 outline-none`}
            >
              Cómo venir a España
              <ChevronDown className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64">
              {ROUTES.map((r) => (
                <DropdownMenuItem key={r.to} asChild>
                  <Link to={r.to} className="flex flex-col items-start gap-0.5 cursor-pointer">
                    <span className="text-sm font-medium">{r.label}</span>
                    <span className="text-xs text-muted-foreground">{r.desc}</span>
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/recursos" className={navLinkClass(pathname === "/recursos")}>
            Recursos
          </Link>
          <Link to="/precios" className={navLinkClass(pathname === "/precios")}>
            Precios
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden sm:inline-flex">
                <SubscriptionStatusBadge />
              </div>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/agenda"><CalendarClock className="h-4 w-4" />Agendar</Link>
              </Button>
              <Button asChild variant="soft" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard"><LayoutDashboard className="h-4 w-4" />Dashboard</Link>
              </Button>
              <Button asChild variant="ghost" size="icon" aria-label="Mi perfil" className="hidden sm:inline-flex">
                <Link to="/perfil"><User className="h-4 w-4" /></Link>
              </Button>
              <Button variant="ghost" size="icon" onClick={signOut} aria-label="Cerrar sesión">
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Acceder</Link>
              </Button>
              <Button asChild variant="hero" size="sm">
                <Link to="/diagnostico">Empezar diagnóstico</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
