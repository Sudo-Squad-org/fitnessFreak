import React from "react";
import { Trophy } from "lucide-react";

export const WeekProgressBar = ({ completed, total, pct, weekStart }) => {
  const weekLabel = weekStart
    ? (() => {
        const d = new Date(weekStart + "T00:00:00");
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      })()
    : null;

  const isComplete = total > 0 && completed >= total;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-foreground">Weekly Progress</p>
          {weekLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">Week of {weekLabel}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <Trophy className="h-4 w-4 text-amber-500" />
          )}
          <span className="text-sm font-semibold tabular-nums text-foreground">
            {completed}
            <span className="text-muted-foreground font-normal">/{total}</span>
          </span>
          <span className="text-xs text-muted-foreground">exercises</span>
        </div>
      </div>

      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? "bg-emerald-500" : "bg-foreground"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        {total === 0
          ? "No plan loaded yet"
          : isComplete
          ? "All exercises done this week — great work!"
          : `${Math.round(pct)}% complete — keep going!`}
      </p>
    </div>
  );
};
