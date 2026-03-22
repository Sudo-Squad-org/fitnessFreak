import React, { useState } from "react";
import { communityService } from "@/services/communityService";
import { CHALLENGE_METRICS } from "@/constants";

export function CreateChallengeForm({ onCreated, onCancel }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title:         "",
    description:   "",
    metric_type:   "workouts_count",
    duration_days: 30,
    target_value:  20,
    starts_at:     today,
    ends_at:       "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await communityService.createChallenge({
        ...form,
        duration_days: parseInt(form.duration_days),
        target_value:  parseFloat(form.target_value),
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Error creating challenge.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        required
        maxLength={100}
        placeholder="Challenge title"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <textarea
        placeholder="Description (optional)"
        rows={2}
        value={form.description}
        onChange={(e) => set("description", e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Metric</label>
          <select
            value={form.metric_type}
            onChange={(e) => set("metric_type", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {CHALLENGE_METRICS.map((m) => (
              <option key={m} value={m}>{m.replace("_", " ")}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Target value</label>
          <input
            type="number"
            min="1"
            step="any"
            value={form.target_value}
            onChange={(e) => set("target_value", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Starts</label>
          <input
            type="date"
            required
            value={form.starts_at}
            onChange={(e) => set("starts_at", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Ends</label>
          <input
            type="date"
            required
            value={form.ends_at}
            onChange={(e) => set("ends_at", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
        >
          {loading ? "Creating…" : "Create"}
        </button>
      </div>
    </form>
  );
}
