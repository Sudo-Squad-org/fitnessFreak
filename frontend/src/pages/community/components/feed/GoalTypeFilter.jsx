import React from "react";
import { FEED_GOAL_FILTERS } from "@/constants";

export function GoalTypeFilter({ value, onChange }) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {FEED_GOAL_FILTERS.map((f) => (
        <button
          key={f.value}
          onClick={() => onChange(f.value)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
            value === f.value
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground hover:text-foreground"
          }`}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
