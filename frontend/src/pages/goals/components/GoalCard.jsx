import React, { useState } from "react";
import { ProgressRing } from "./ProgressRing";
import { goalsService } from "@/services/goalsService";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Pause, Play, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const TYPE_COLORS = {
  workouts: "#6366f1",
  meals: "#10b981",
  steps: "#f59e0b",
  sleep_hrs: "#8b5cf6",
  calories: "#ef4444",
};

const TYPE_LABELS = {
  workouts: "Workouts",
  meals: "Meals logged",
  steps: "Steps",
  sleep_hrs: "Sleep (hrs)",
  calories: "Calories",
};

export const GoalCard = ({ goal, summary, onDelete, onStatusChange, onLogAdded }) => {
  const { toast } = useToast();
  const [logValue, setLogValue] = useState("");
  const [logging, setLogging] = useState(false);
  const [showLogInput, setShowLogInput] = useState(false);

  const pct = summary?.pct ?? 0;
  const current = summary?.current ?? 0;
  const color = TYPE_COLORS[goal.type] ?? "#6366f1";

  const handleLog = async () => {
    const val = parseFloat(logValue);
    if (!val || val <= 0) return;
    setLogging(true);
    try {
      await goalsService.addLog({
        goal_id: goal.id,
        date: new Date().toISOString().split("T")[0],
        value: val,
      });
      toast({ title: "Progress logged!" });
      setLogValue("");
      setShowLogInput(false);
      onLogAdded?.();
    } catch {
      toast({ variant: "destructive", title: "Failed to log progress" });
    } finally {
      setLogging(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <ProgressRing pct={pct} size={52} stroke={5} color={color} />
          <div>
            <p className="font-semibold text-sm text-foreground">
              {TYPE_LABELS[goal.type] ?? goal.type}
            </p>
            <p className="text-xs text-muted-foreground capitalize">{goal.period}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onStatusChange(goal.id, goal.status === "active" ? "paused" : "active")}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={goal.status === "active" ? "Pause" : "Resume"}
          >
            {goal.status === "active" ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => onDelete(goal.id)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
            title="Delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Range */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Target range</span>
        <span className="font-medium text-foreground">
          {goal.min_target} – {goal.max_target}
        </span>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">This week</span>
          <span className="font-medium" style={{ color }}>
            {current} / {goal.max_target}
          </span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${pct}%`, background: color }}
          />
        </div>
      </div>

      {/* Log progress */}
      {goal.status === "active" && (
        <div>
          {showLogInput ? (
            <div className="flex gap-2">
              <Input
                type="number"
                min="0"
                step="0.1"
                placeholder="Value"
                value={logValue}
                onChange={(e) => setLogValue(e.target.value)}
                className="h-8 text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleLog()}
              />
              <Button size="sm" className="h-8 px-3" onClick={handleLog} disabled={logging}>
                Log
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2"
                onClick={() => setShowLogInput(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowLogInput(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="h-3 w-3" />
              Log progress
            </button>
          )}
        </div>
      )}
    </div>
  );
};
