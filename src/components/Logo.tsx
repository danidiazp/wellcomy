import { Link } from "react-router-dom";
import logo from "@/assets/logo.png";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`inline-flex items-center gap-2.5 group ${className}`}>
    <img src={logo} alt="Wellcomy" className="h-9 w-9 rounded-xl shadow-elegant object-cover" />
    <div className="flex flex-col leading-none">
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">Wellcomy</span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">Orientación migratoria</span>
    </div>
  </Link>
);
