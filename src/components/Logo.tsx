import { Link } from "react-router-dom";

export const Logo = ({ className = "" }: { className?: string }) => (
  <Link to="/" className={`inline-flex items-center gap-2.5 group ${className}`}>
    <div className="relative h-9 w-9 rounded-xl bg-secondary shadow-elegant grid place-items-center overflow-hidden">
      <svg viewBox="0 0 48 48" className="h-5 w-5 text-primary" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 30c4-6 13-10 21-8 2-6 10-12 18-10-3 5-9 9-15 9 3 5 2 11-4 14-2-5-7-8-12-7-3 1-6 2-8 2z" />
        <circle cx="37" cy="15" r="1.8" fill="currentColor" stroke="none" />
      </svg>
    </div>
    <div className="flex flex-col leading-none">
      <span className="font-display text-lg font-semibold tracking-tight text-foreground">Wellcomy</span>
      <span className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-0.5">Orientación migratoria</span>
    </div>
  </Link>
);
