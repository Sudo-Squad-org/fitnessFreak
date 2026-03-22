import React, { useState } from "react";
import { communityService } from "@/services/communityService";
import { FITNESS_LEVELS, COMMUNITY_GOALS, PREFERRED_DAYS } from "@/constants";

export function BuddySetupForm({ profile, onCreate }) {
  const [form, setForm] = useState({
    fitness_level:  profile?.fitness_level  ?? "beginner",
    goal:           profile?.goal           ?? "weight_loss",
    preferred_days: profile?.preferred_days ?? "mon,wed,fri",
    is_anonymous:   profile?.is_anonymous   ?? true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const toggleDay = (day) => {
    const days = form.preferred_days ? form.preferred_days.split(",").filter(Boolean) : [];
    const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
    setForm((f) => ({ ...f, preferred_days: next.join(",") }));
  };

  const selectedDays = form.preferred_days ? form.preferred_days.split(",").filter(Boolean) : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await communityService.createProfile(form);
      onCreate(res.data);
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Fitness Level</label>
        <div className="flex gap-2 flex-wrap">
          {FITNESS_LEVELS.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setForm((f) => ({ ...f, fitness_level: l }))}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                form.fitness_level === l
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Goal</label>
        <div className="flex gap-2 flex-wrap">
          {COMMUNITY_GOALS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setForm((f) => ({ ...f, goal: g }))}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                form.goal === g
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {g.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-muted-foreground mb-2">Preferred Days</label>
        <div className="flex gap-1.5 flex-wrap">
          {PREFERRED_DAYS.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => toggleDay(d)}
              className={`rounded-lg border px-2.5 py-1.5 text-xs font-medium uppercase transition-colors ${
                selectedDays.includes(d)
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="anon"
          type="checkbox"
          checked={form.is_anonymous}
          onChange={(e) => setForm((f) => ({ ...f, is_anonymous: e.target.checked }))}
          className="h-4 w-4 rounded border-border accent-foreground"
        />
        <label htmlFor="anon" className="text-xs text-muted-foreground">
          Stay anonymous (alias only, no personal info shared)
        </label>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading || selectedDays.length === 0}
        className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {loading ? "Saving…" : "Find My Buddy"}
      </button>
    </form>
  );
}
