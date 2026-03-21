import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Check, Clock, Dumbbell } from "lucide-react";

export const WorkoutModal = ({ open, onClose, day, progress, onToggle, toggling }) => {
  if (!day) return null;

  const completedIds = new Set(progress?.completed_exercise_ids ?? []);
  const total = day.exercises?.length ?? 0;
  const completed = completedIds.size;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg w-full max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Fixed header */}
        <div className="px-6 pt-6 pb-4 border-b border-border shrink-0">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground">
              {day.day}: {day.title}
            </DialogTitle>
          </DialogHeader>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">{day.duration}</span>
            </div>
            {day.muscle_focus && (
              <div className="flex items-center gap-1.5">
                <Dumbbell className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{day.muscle_focus}</span>
              </div>
            )}
          </div>

          {/* Progress fraction */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-muted-foreground">
                {completed} / {total} exercises completed
              </span>
              <span className="text-xs font-medium text-foreground">
                {total > 0 ? Math.round((completed / total) * 100) : 0}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  completed >= total && total > 0 ? "bg-emerald-500" : "bg-foreground"
                }`}
                style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Scrollable exercise list */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {day.exercises?.map((exercise) => {
            const isChecked = completedIds.has(exercise.id);
            const isToggling = toggling.has(exercise.id);

            return (
              <div
                key={exercise.id}
                className="flex items-start gap-3 py-4 border-b border-border last:border-0"
              >
                {/* Checkbox */}
                <button
                  onClick={() => onToggle(day.day_number, exercise.id)}
                  disabled={isToggling}
                  className={`mt-0.5 h-5 w-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    isToggling
                      ? "opacity-50 cursor-not-allowed border-border"
                      : isChecked
                      ? "bg-foreground border-foreground"
                      : "border-border hover:border-foreground/50"
                  }`}
                  aria-label={`Mark ${exercise.name} as ${isChecked ? "undone" : "done"}`}
                >
                  {isToggling ? (
                    <Loader2 className="h-3 w-3 text-muted-foreground animate-spin" />
                  ) : isChecked ? (
                    <Check className="h-3 w-3 text-background" />
                  ) : null}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={`text-sm font-medium leading-snug transition-colors ${
                        isChecked
                          ? "line-through text-muted-foreground"
                          : "text-foreground"
                      }`}
                    >
                      {exercise.name}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0 font-mono tabular-nums mt-0.5">
                      {exercise.sets_reps}
                    </span>
                  </div>
                  {exercise.muscle_group && (
                    <p className="text-[11px] text-muted-foreground/70 mt-0.5">
                      {exercise.muscle_group}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                    {exercise.how_to}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0">
          {completed >= total && total > 0 ? (
            <p className="text-sm text-center text-emerald-600 dark:text-emerald-400 font-medium">
              All exercises completed — great work!
            </p>
          ) : (
            <p className="text-xs text-center text-muted-foreground">
              Tap each exercise to mark it done. Your progress is saved automatically.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
