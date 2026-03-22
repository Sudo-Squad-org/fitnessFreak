import React, { useState } from "react";
import { communityService } from "@/services/communityService";
import { CONTENT_TYPES, COMMUNITY_GOALS, FITNESS_LEVELS } from "@/constants";

export function CreateContentForm({ onCreated, onCancel }) {
  const [form, setForm] = useState({
    content_type:  "article",
    title:         "",
    body:          "",
    goal_type:     "",
    fitness_level: "",
    video_url:     "",
    is_paid:       false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await communityService.createContent({
        ...form,
        goal_type:     form.goal_type     || undefined,
        fitness_level: form.fitness_level || undefined,
        video_url:     form.video_url     || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Error creating content.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs text-muted-foreground mb-1">Type</label>
        <div className="flex gap-2 flex-wrap">
          {CONTENT_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => set("content_type", t)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                form.content_type === t
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <input
        required
        maxLength={200}
        placeholder="Title"
        value={form.title}
        onChange={(e) => set("title", e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <textarea
        required
        rows={6}
        placeholder="Content body…"
        value={form.body}
        onChange={(e) => set("body", e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Goal (optional)</label>
          <select
            value={form.goal_type}
            onChange={(e) => set("goal_type", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Any</option>
            {COMMUNITY_GOALS.map((g) => <option key={g} value={g}>{g.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Level (optional)</label>
          <select
            value={form.fitness_level}
            onChange={(e) => set("fitness_level", e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">Any</option>
            {FITNESS_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
      </div>

      <input
        type="url"
        placeholder="YouTube URL (optional)"
        value={form.video_url}
        onChange={(e) => set("video_url", e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />

      <div className="flex items-center gap-2">
        <input
          id="is_paid"
          type="checkbox"
          checked={form.is_paid}
          onChange={(e) => set("is_paid", e.target.checked)}
          className="h-4 w-4 rounded border-border accent-foreground"
        />
        <label htmlFor="is_paid" className="text-xs text-muted-foreground">Pro / paid content</label>
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
