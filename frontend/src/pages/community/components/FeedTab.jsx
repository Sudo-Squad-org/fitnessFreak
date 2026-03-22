import React, { useEffect, useState, useCallback } from "react";
import { communityService } from "@/services/communityService";
import { FeedOptInPrompt } from "./feed/FeedOptInPrompt";
import { FeedPostCard } from "./feed/FeedPostCard";
import { GoalTypeFilter } from "./feed/GoalTypeFilter";
import { Plus, Loader2, X } from "lucide-react";

const MILESTONE_TYPES = [
  "workout_completed",
  "goal_reached",
  "streak_7days",
  "streak_30days",
  "weight_milestone",
  "custom",
];

export function FeedTab() {
  const [optedIn, setOptedIn] = useState(null); // null = loading
  const [posts, setPosts] = useState([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const checkOptIn = async () => {
    try {
      await communityService.getFeedOptIn();
      setOptedIn(true);
    } catch (e) {
      if (e?.response?.status === 404) setOptedIn(false);
    }
  };

  const loadPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await communityService.getFeed({ goal_type: filter || undefined, limit: 20 });
      setPosts(res.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { checkOptIn(); }, []);
  useEffect(() => { if (optedIn) loadPosts(); }, [optedIn, loadPosts]);

  if (optedIn === null) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!optedIn) {
    return (
      <FeedOptInPrompt
        onOptIn={async (d) => {
          await communityService.optInFeed(d);
          setOptedIn(true);
        }}
      />
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <GoalTypeFilter value={filter} onChange={setFilter} />
        <button
          onClick={() => setShowCreate(true)}
          className="ml-auto flex items-center gap-1.5 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity"
        >
          <Plus className="h-3.5 w-3.5" /> Share
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : posts.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-10">
          No milestones shared yet. Be the first!
        </p>
      ) : (
        <div className="space-y-4">
          {posts.map((p) => (
            <FeedPostCard key={p.id} post={p} onRefresh={loadPosts} />
          ))}
        </div>
      )}

      {showCreate && (
        <CreatePostModal
          onCreated={() => { setShowCreate(false); loadPosts(); }}
          onCancel={() => setShowCreate(false)}
        />
      )}
    </div>
  );
}

function CreatePostModal({ onCreated, onCancel }) {
  const [form, setForm] = useState({ milestone_type: "workout_completed", message: "", goal_type: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await communityService.createPost({
        ...form,
        goal_type: form.goal_type || undefined,
        message:   form.message  || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Error posting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-background p-6 mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-foreground">Share a Milestone</h3>
          <button onClick={onCancel} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Milestone</label>
            <select
              value={form.milestone_type}
              onChange={(e) => setForm((f) => ({ ...f, milestone_type: e.target.value }))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {MILESTONE_TYPES.map((m) => (
                <option key={m} value={m}>{m.replace(/_/g, " ")}</option>
              ))}
            </select>
          </div>

          <textarea
            maxLength={280}
            placeholder="Optional message… (max 280 chars)"
            rows={3}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
          />

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
              {loading ? "Posting…" : "Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
