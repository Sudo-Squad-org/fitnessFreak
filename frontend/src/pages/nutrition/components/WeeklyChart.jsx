import React from "react";
import { FadeIn } from "@/components/common/FadeIn";

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const WeeklyChart = ({ days = [], targetCalories }) => {
  const maxCal = Math.max(...days.map((d) => d.calories), targetCalories || 0, 1);

  const formatDay = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00");
    return DAY_LABELS[d.getDay()];
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-bold text-foreground">Weekly Overview</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Calories consumed over the last 7 days</p>
        </div>
        {targetCalories && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div className="h-px w-6 border-t-2 border-dashed border-muted-foreground" />
            Target {Math.round(targetCalories)} kcal
          </div>
        )}
      </div>

      <div className="flex items-end gap-3 h-44">
        {days.map((day, i) => {
          const barPct = (day.calories / maxCal) * 100;
          const targetPct = targetCalories ? (targetCalories / maxCal) * 100 : null;
          const isToday = day.date === today;
          const hasData = day.calories > 0;

          return (
            <FadeIn key={day.date} delay={i * 0.05} className="flex-1 flex flex-col items-center gap-1 h-full">
              <div className="relative flex-1 w-full flex items-end">
                {/* Target line */}
                {targetPct && (
                  <div
                    className="absolute w-full border-t-2 border-dashed border-muted-foreground/30 pointer-events-none"
                    style={{ bottom: `${targetPct}%` }}
                  />
                )}
                {/* Bar */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-700 ${
                    isToday
                      ? "bg-foreground"
                      : hasData
                      ? "bg-muted-foreground/40"
                      : "bg-muted/50"
                  }`}
                  style={{ height: hasData ? `${Math.max(barPct, 4)}%` : "4px" }}
                  title={`${formatDay(day.date)}: ${Math.round(day.calories)} kcal`}
                />
              </div>
              <span className={`text-xs font-medium ${isToday ? "text-foreground" : "text-muted-foreground"}`}>
                {formatDay(day.date)}
              </span>
              {hasData && (
                <span className="text-[10px] text-muted-foreground">
                  {Math.round(day.calories)}
                </span>
              )}
            </FadeIn>
          );
        })}
      </div>

      {/* Macro breakdown averages */}
      {days.some((d) => d.calories > 0) && (
        <div className="mt-6 pt-5 border-t border-border grid grid-cols-3 gap-4 text-center">
          {[
            { label: "Avg Protein", value: Math.round(days.reduce((s, d) => s + d.protein_g, 0) / 7), unit: "g", color: "text-emerald-500" },
            { label: "Avg Carbs", value: Math.round(days.reduce((s, d) => s + d.carbs_g, 0) / 7), unit: "g", color: "text-amber-500" },
            { label: "Avg Fat", value: Math.round(days.reduce((s, d) => s + d.fat_g, 0) / 7), unit: "g", color: "text-rose-500" },
          ].map((m) => (
            <div key={m.label}>
              <p className={`text-xl font-bold ${m.color}`}>{m.value}<span className="text-sm font-normal text-muted-foreground ml-0.5">{m.unit}</span></p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
