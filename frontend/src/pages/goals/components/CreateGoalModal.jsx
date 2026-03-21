import React, { useState } from "react";
import { goalsService } from "@/services/goalsService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Loader2 } from "lucide-react";

const GOAL_TYPES = [
  { value: "workouts", label: "Workouts" },
  { value: "meals", label: "Meals logged" },
  { value: "steps", label: "Steps" },
  { value: "sleep_hrs", label: "Sleep (hrs)" },
  { value: "calories", label: "Calories" },
];

export const CreateGoalModal = ({ open, onClose, onCreated }) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    type: "workouts",
    min_target: "",
    max_target: "",
    period: "weekly",
  });
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const set = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const min = parseFloat(form.min_target);
    const max = parseFloat(form.max_target);
    if (!min || !max || max < min) {
      toast({ variant: "destructive", title: "Max target must be ≥ min target" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await goalsService.createGoal({ ...form, min_target: min, max_target: max });
      onCreated(res.data);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to create goal",
        description: err.response?.data?.detail,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold text-foreground">New Goal</h2>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type */}
          <div className="space-y-2">
            <Label>Goal type</Label>
            <div className="grid grid-cols-3 gap-2">
              {GOAL_TYPES.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => set("type", value)}
                  className={`rounded-xl border px-3 py-2 text-xs font-medium transition-colors ${
                    form.type === value
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Period */}
          <div className="space-y-2">
            <Label>Period</Label>
            <div className="flex gap-2">
              {["weekly", "daily"].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => set("period", p)}
                  className={`flex-1 rounded-xl border py-2 text-sm font-medium capitalize transition-colors ${
                    form.period === p
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Min / Max targets */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="min_target">Min target</Label>
              <Input
                id="min_target"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 3"
                value={form.min_target}
                onChange={(e) => set("min_target", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="max_target">Max target</Label>
              <Input
                id="max_target"
                type="number"
                min="0"
                step="0.1"
                placeholder="e.g. 5"
                value={form.max_target}
                onChange={(e) => set("max_target", e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-10" disabled={submitting}>
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Goal"}
          </Button>
        </form>
      </div>
    </div>
  );
};
