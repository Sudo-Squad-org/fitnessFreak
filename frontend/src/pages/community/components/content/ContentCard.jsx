import React from "react";
import { BookOpen, Dumbbell, Salad, Star, Lock } from "lucide-react";

const TYPE_ICON = {
  article:      BookOpen,
  workout_plan: Dumbbell,
  meal_plan:    Salad,
};

export function ContentCard({ content, onOpen }) {
  const Icon = TYPE_ICON[content.content_type] ?? BookOpen;

  return (
    <div
      className="rounded-xl border border-border p-5 cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={onOpen}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted shrink-0">
          <Icon className="h-4.5 w-4.5 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start gap-2">
            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug flex-1">
              {content.title}
            </h3>
            {content.is_paid && (
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-0.5" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 capitalize">
            {content.content_type.replace("_", " ")}
            {content.fitness_level && ` · ${content.fitness_level}`}
          </p>
        </div>
      </div>

      {content.avg_rating != null && (
        <div className="flex items-center gap-1">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="text-xs text-muted-foreground">{content.avg_rating.toFixed(1)}</span>
        </div>
      )}
    </div>
  );
}
