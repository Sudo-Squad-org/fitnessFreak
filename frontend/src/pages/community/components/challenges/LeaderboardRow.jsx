import React from "react";
import { CheckCircle2 } from "lucide-react";

export function LeaderboardRow({ entry, rank }) {
  return (
    <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${entry.is_mine ? "bg-muted" : ""}`}>
      <span className="w-5 text-center text-xs font-bold text-muted-foreground">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{entry.alias}</p>
          {entry.is_mine && (
            <span className="text-xs text-muted-foreground">(you)</span>
          )}
          {entry.completed && (
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
          )}
        </div>
        <div className="mt-1 h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${Math.min(100, Math.max(0, entry.pct_improvement))}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-semibold text-foreground shrink-0">
        +{entry.pct_improvement.toFixed(1)}%
      </span>
    </div>
  );
}
