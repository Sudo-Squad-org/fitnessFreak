import React from "react";
import { Clock, Dumbbell, CheckCircle2 } from "lucide-react";

export const DayCard = ({ day, progress, onClick }) => {
  const total = day.exercises?.length ?? 0;
  const completed = progress?.completed ?? 0;
  const allDone = total > 0 && completed >= total;

  return (
    <button
      onClick={onClick}
      className="group w-full text-left rounded-2xl border border-border bg-card p-5
                 hover:shadow-md hover:-translate-y-0.5 active:translate-y-0
                 transition-all duration-200 cursor-pointer focus:outline-none
                 focus-visible:ring-2 focus-visible:ring-ring"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-background text-[11px] font-semibold shrink-0">
          {day.day_number}
        </span>
        {allDone ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        ) : completed > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
            {completed}/{total}
          </span>
        ) : null}
      </div>

      {/* Title */}
      <p className="font-semibold text-sm text-foreground leading-snug mb-3 group-hover:text-foreground/80 transition-colors">
        {day.title}
      </p>

      {/* Meta */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">{day.duration}</span>
        </div>
        {day.muscle_focus && (
          <div className="flex items-center gap-1.5">
            <Dumbbell className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground">{day.muscle_focus}</span>
          </div>
        )}
      </div>

      {/* Exercise count */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground">
          {total} exercises
          {completed > 0 && !allDone && (
            <span className="ml-1 text-foreground font-medium">· {completed} done</span>
          )}
        </p>
      </div>
    </button>
  );
};
