import React from "react";
import { Zap, Moon, Smile, Wind } from "lucide-react";

const scoreColor = (score) => {
  if (score >= 7.5) return { ring: "stroke-emerald-500", text: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" };
  if (score >= 5.0) return { ring: "stroke-amber-400", text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" };
  return { ring: "stroke-rose-400", text: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" };
};

const scoreLabel = (score) => {
  if (score >= 7.5) return "High";
  if (score >= 5.0) return "Moderate";
  return "Low";
};

export const ReadinessWidget = ({ readiness }) => {
  if (!readiness) return null;
  const { score, recommendation, breakdown } = readiness;
  const colors = scoreColor(score);
  const circumference = 2 * Math.PI * 42;
  const offset = circumference - (score / 10) * circumference;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colors.bg}`}>
          <Zap className={`h-4 w-4 ${colors.text}`} />
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">Today's Readiness</p>
          <p className={`text-xs font-medium ${colors.text}`}>{scoreLabel(score)}</p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative h-24 w-24 shrink-0">
          <svg className="-rotate-90 h-24 w-24">
            <circle cx="48" cy="48" r="42" fill="none" strokeWidth="7" className="stroke-muted" />
            <circle
              cx="48" cy="48" r="42" fill="none" strokeWidth="7"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={`${colors.ring} transition-all duration-700`}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold tabular-nums ${colors.text}`}>{score}</span>
            <span className="text-[10px] text-muted-foreground">/10</span>
          </div>
        </div>

        {/* Breakdown */}
        <div className="flex-1 space-y-2">
          {[
            { icon: Moon, label: "Sleep quality", value: breakdown.sleep_quality, max: 5, unit: "★" },
            { icon: Moon, label: "Duration", value: breakdown.sleep_duration_hrs, max: 9, unit: "h" },
            { icon: Smile, label: "Mood", value: breakdown.mood, max: 5, unit: "/5" },
            { icon: Wind, label: "Stress", value: 6 - breakdown.stress_level, max: 5, unit: "" },
          ].map(({ icon: Icon, label, value, max, unit }) => (
            <div key={label} className="flex items-center gap-2">
              <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
              <div className="flex-1 h-1 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full"
                  style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground w-8 text-right tabular-nums">
                {value}{unit}
              </span>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
        {recommendation}
      </p>
    </div>
  );
};
