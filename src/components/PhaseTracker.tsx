import { Check, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import type { RoadmapStep } from "./RoadmapStages";

const PHASES = [
  { key: "origen",    label: "En tu país",           short: "Origen" },
  { key: "consulado", label: "Consulado",             short: "Consulado" },
  { key: "espana",    label: "En España",             short: "España" },
  { key: "post",      label: "Trámites posteriores",  short: "Post" },
];

function resolvePhaseKey(stageLocation: string | null): string {
  const k = (stageLocation ?? "").toLowerCase();
  if (k.includes("origen")) return "origen";
  if (k.includes("consul")) return "consulado";
  if (k.includes("españ") || k === "espana") return "espana";
  if (k.includes("post")) return "post";
  return "origen";
}

interface Props {
  steps: RoadmapStep[];
  completedStepIds: Set<string>;
}

export function PhaseTracker({ steps, completedStepIds }: Props) {
  if (steps.length === 0) return null;

  // Group steps by phase
  const byPhase = new Map<string, RoadmapStep[]>();
  for (const s of steps) {
    const k = resolvePhaseKey(s.stage_location);
    if (!byPhase.has(k)) byPhase.set(k, []);
    byPhase.get(k)!.push(s);
  }

  // Current phase = phase of the first incomplete step
  const firstIncomplete = steps.find((s) => !completedStepIds.has(s.id));
  const currentPhaseKey = firstIncomplete ? resolvePhaseKey(firstIncomplete.stage_location) : "post";

  const phases = PHASES.filter((p) => byPhase.has(p.key));
  const currentIdx = phases.findIndex((p) => p.key === currentPhaseKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
      className="bg-card border border-border rounded-3xl p-5 lg:p-6 shadow-elegant"
    >
      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground font-medium mb-4">
        Tu fase actual
      </p>
      <div className="flex items-center gap-0">
        {phases.map((phase, idx) => {
          const group = byPhase.get(phase.key) ?? [];
          const done = group.filter((s) => completedStepIds.has(s.id)).length;
          const total = group.length;
          const pct = total ? Math.round((done / total) * 100) : 0;

          const isCompleted = done === total && total > 0;
          const isActive = idx === currentIdx;
          const isPast = idx < currentIdx;
          const isFuture = idx > currentIdx;

          return (
            <div key={phase.key} className="flex items-center flex-1 min-w-0">
              {/* Phase node */}
              <div className="flex flex-col items-center flex-1 min-w-0 gap-2">
                <div className={`h-10 w-10 rounded-2xl grid place-items-center shrink-0 transition-all ${
                  isCompleted || isPast
                    ? "bg-success/15 text-success"
                    : isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {isCompleted || isPast ? (
                    <Check className="h-4 w-4" />
                  ) : isActive ? (
                    <MapPin className="h-4 w-4" />
                  ) : (
                    <span className="text-xs font-semibold">{idx + 1}</span>
                  )}
                </div>
                <div className="text-center min-w-0 px-1">
                  <p className={`text-xs font-medium truncate ${
                    isActive ? "text-foreground" : isFuture ? "text-muted-foreground" : "text-foreground/70"
                  }`}>
                    <span className="hidden sm:inline">{phase.label}</span>
                    <span className="sm:hidden">{phase.short}</span>
                  </p>
                  {isActive && total > 0 && (
                    <p className="text-[10px] text-primary mt-0.5">{done}/{total} pasos</p>
                  )}
                  {(isCompleted || isPast) && total > 0 && (
                    <p className="text-[10px] text-success mt-0.5">{pct}%</p>
                  )}
                </div>
              </div>
              {/* Connector line */}
              {idx < phases.length - 1 && (
                <div className="h-0.5 flex-shrink-0 w-4 sm:w-6 mx-0.5 rounded-full overflow-hidden bg-secondary self-start mt-5">
                  <div
                    className={`h-full transition-all ${
                      isPast || isCompleted ? "bg-success w-full" : isActive ? "bg-primary w-1/2" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
