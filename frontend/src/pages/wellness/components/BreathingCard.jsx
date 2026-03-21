import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Play, Square, Wind } from "lucide-react";

export const BreathingCard = ({ exercise }) => {
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [cycle, setCycle] = useState(0);
  const intervalRef = useRef(null);

  const steps = exercise.steps.filter((s) => s.seconds > 0);
  const currentStep = steps[stepIdx] ?? steps[0];

  const stop = () => {
    setActive(false);
    setStepIdx(0);
    setTimeLeft(0);
    setCycle(0);
    clearInterval(intervalRef.current);
  };

  const start = () => {
    setActive(true);
    setStepIdx(0);
    setTimeLeft(steps[0]?.seconds ?? 4);
    setCycle(1);
  };

  useEffect(() => {
    if (!active) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // Advance to next step
          setStepIdx((si) => {
            const next = (si + 1) % steps.length;
            if (next === 0) setCycle((c) => c + 1);
            setTimeLeft(steps[next]?.seconds ?? 4);
            return next;
          });
          return steps[stepIdx]?.seconds ?? 4;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active, stepIdx, steps]);

  const phaseColors = {
    Inhale: "text-sky-500",
    Hold: "text-amber-500",
    Exhale: "text-indigo-500",
    "Double inhale": "text-sky-400",
    "Close right": "text-muted-foreground",
    "Switch": "text-muted-foreground",
    "Switch back": "text-muted-foreground",
  };
  const phaseColor = (phase) =>
    Object.entries(phaseColors).find(([k]) => phase?.includes(k))?.[1] ?? "text-foreground";

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <Wind className="h-4 w-4 text-sky-500" />
            <p className="font-semibold text-sm text-foreground">{exercise.name}</p>
          </div>
          <p className="text-xs text-muted-foreground">{exercise.tagline}</p>
        </div>
        <span className="text-[11px] text-muted-foreground shrink-0 mt-0.5">{exercise.duration_min} min</span>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {exercise.best_for.map((tag) => (
          <span key={tag} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-muted-foreground">
            {tag}
          </span>
        ))}
      </div>

      {/* Active timer */}
      {active ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <p className={`text-xs font-semibold uppercase tracking-widest ${phaseColor(currentStep?.phase)}`}>
            {currentStep?.phase}
          </p>
          {/* Animated circle */}
          <div
            className={`h-20 w-20 rounded-full border-4 flex items-center justify-center transition-all duration-1000 ${
              currentStep?.phase === "Inhale" || currentStep?.phase === "Double inhale"
                ? "scale-110 border-sky-400"
                : currentStep?.phase === "Exhale"
                ? "scale-90 border-indigo-400"
                : "scale-100 border-amber-400"
            }`}
          >
            <span className="text-2xl font-bold tabular-nums text-foreground">{timeLeft}</span>
          </div>
          <p className="text-xs text-center text-muted-foreground max-w-[180px] leading-relaxed">
            {currentStep?.instruction}
          </p>
          <p className="text-[11px] text-muted-foreground">Cycle {cycle}</p>
          <Button variant="outline" size="sm" onClick={stop} className="gap-2 mt-1">
            <Square className="h-3.5 w-3.5" /> Stop
          </Button>
        </div>
      ) : (
        <>
          {/* Steps preview */}
          <div className="space-y-1.5">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs">
                <span className={`font-medium w-20 shrink-0 ${phaseColor(step.phase)}`}>{step.phase}</span>
                <div className="flex-1 h-0.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-foreground/20" style={{ width: `${(step.seconds / 10) * 100}%` }} />
                </div>
                <span className="text-muted-foreground tabular-nums w-8 text-right">{step.seconds}s</span>
              </div>
            ))}
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">{exercise.benefits}</p>

          <Button size="sm" className="gap-2 w-full" onClick={start}>
            <Play className="h-3.5 w-3.5" /> Begin
          </Button>
        </>
      )}
    </div>
  );
};
