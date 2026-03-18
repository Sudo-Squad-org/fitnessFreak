import React from "react";

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

export const MacroCard = ({ label, current, target, unit = "g", color, bgColor, icon: Icon }) => {
  const pct = target > 0 ? clamp((current / target) * 100, 0, 100) : 0;
  const over = target > 0 && current > target;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-8 w-8 rounded-lg ${bgColor} flex items-center justify-center`}>
            <Icon className={`h-4 w-4 ${color}`} />
          </div>
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
        </div>
        {over && (
          <span className="text-xs font-medium text-rose-500 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded-full">
            Over
          </span>
        )}
      </div>

      <div className="flex items-end justify-between gap-2">
        <div>
          <span className={`text-3xl font-bold ${color}`}>
            {unit === "kcal" ? Math.round(current) : Math.round(current * 10) / 10}
          </span>
          <span className="text-sm text-muted-foreground ml-1">{unit}</span>
        </div>
        <div className="text-right">
          <span className="text-xs text-muted-foreground">of {unit === "kcal" ? Math.round(target) : Math.round(target)}{unit}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${over ? "bg-rose-500" : color.replace("text-", "bg-")}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {over
          ? `${Math.round(current - target)}${unit} over target`
          : `${Math.round(target - current)}${unit} remaining`}
      </p>
    </div>
  );
};
