import React from "react";
import { Trophy, Users, Calendar } from "lucide-react";

const METRIC_LABELS = {
  workouts_count: "Workouts",
  active_days:    "Active Days",
  meals_logged:   "Meals Logged",
};

export function ChallengeCard({ challenge, onOpen }) {
  const daysLeft = Math.max(0, Math.ceil(
    (new Date(challenge.ends_at) - Date.now()) / 86400000
  ));

  return (
    <div
      className="rounded-xl border border-border p-5 cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="text-sm font-semibold text-foreground leading-snug line-clamp-2">{challenge.title}</h3>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {METRIC_LABELS[challenge.metric_type] ?? challenge.metric_type}
        </span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" /> {challenge.member_count}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" /> {daysLeft}d left
        </span>
        <span className="flex items-center gap-1">
          <Trophy className="h-3.5 w-3.5" /> Target: {challenge.target_value}
        </span>
      </div>

      {challenge.is_member && (
        <span className="mt-3 inline-block rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-medium text-foreground">
          Joined
        </span>
      )}
    </div>
  );
}
