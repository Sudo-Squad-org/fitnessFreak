import React, { useState } from "react";
import { Shield, Eye, Heart } from "lucide-react";
import { FEED_GOAL_FILTERS } from "@/constants";

export function FeedOptInPrompt({ onOptIn }) {
  const [goalType, setGoalType] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onOptIn({ goal_type: goalType || undefined });
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm text-center py-8 space-y-6">
      <div className="flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <Shield className="h-7 w-7 text-muted-foreground" />
        </div>
      </div>

      <div>
        <h2 className="text-base font-semibold text-foreground mb-2">Community Feed</h2>
        <p className="text-sm text-muted-foreground">
          Share workout milestones with the community. You stay anonymous — your alias is always used, never your real name.
        </p>
      </div>

      <div className="rounded-xl border border-border p-4 text-left space-y-3">
        {[
          { icon: Eye,    text: "Alias only — no real name or profile photo" },
          { icon: Heart,  text: "Milestone posts only — no life updates" },
          { icon: Shield, text: "Opt out at any time, posts deleted immediately" },
        ].map(({ icon: Icon, text }) => (
          <div key={text} className="flex items-start gap-3">
            <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <div className="text-left">
        <label className="block text-xs font-medium text-muted-foreground mb-2">Filter feed by goal (optional)</label>
        <select
          value={goalType}
          onChange={(e) => setGoalType(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        >
          {FEED_GOAL_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>{f.label}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handle}
        disabled={loading}
        className="w-full rounded-lg bg-foreground py-2.5 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
      >
        {loading ? "Joining…" : "Join Community Feed"}
      </button>
    </div>
  );
}
