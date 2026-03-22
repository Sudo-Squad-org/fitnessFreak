import React, { useEffect, useState } from "react";
import { communityService } from "@/services/communityService";
import { LeaderboardRow } from "./LeaderboardRow";
import { X, Loader2 } from "lucide-react";

export function ChallengeDetailModal({ challengeId, onClose }) {
  const [challenge, setChallenge] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [baseline, setBaseline] = useState("");
  const [progress, setProgress] = useState("");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = async () => {
    try {
      const [cRes, lRes] = await Promise.all([
        communityService.getChallenge(challengeId),
        communityService.getLeaderboard(challengeId),
      ]);
      setChallenge(cRes.data);
      setLeaderboard(lRes.data);
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!baseline) return;
    setActionLoading(true);
    setError(null);
    try {
      await communityService.joinChallenge(challengeId, { baseline_value: parseFloat(baseline) });
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Error joining challenge.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleProgress = async (e) => {
    e.preventDefault();
    if (!progress) return;
    setActionLoading(true);
    setError(null);
    try {
      await communityService.updateProgress(challengeId, { current_value: parseFloat(progress) });
      setProgress("");
      await load();
    } catch (err) {
      setError(err?.response?.data?.detail ?? "Error updating progress.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      await communityService.leaveChallenge(challengeId);
      onClose();
    } catch {/* */} finally {
      setActionLoading(false);
    }
  };

  const myEntry = leaderboard.find((e) => e.is_mine);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-background mx-4 max-h-[85vh] overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background px-6 py-4 z-10">
          <h3 className="text-base font-semibold text-foreground">
            {challenge?.title ?? "Loading…"}
          </h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {challenge?.description && (
              <p className="text-sm text-muted-foreground">{challenge.description}</p>
            )}

            {error && <p className="text-xs text-destructive">{error}</p>}

            {!challenge?.is_member ? (
              <form onSubmit={handleJoin} className="space-y-3">
                <label className="block text-xs font-medium text-muted-foreground">
                  Your current {challenge?.metric_type?.replace("_", " ")} (baseline)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={baseline}
                    onChange={(e) => setBaseline(e.target.value)}
                    placeholder="0"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !baseline}
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    Join
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    Baseline: {myEntry?.baseline_value} → Current: {myEntry?.current_value}
                  </p>
                  <button
                    onClick={handleLeave}
                    disabled={actionLoading}
                    className="text-xs text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Leave
                  </button>
                </div>
                <form onSubmit={handleProgress} className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={progress}
                    onChange={(e) => setProgress(e.target.value)}
                    placeholder="Update current value…"
                    className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading || !progress}
                    className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-40"
                  >
                    Update
                  </button>
                </form>
              </div>
            )}

            {leaderboard.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Leaderboard — % improvement
                </h4>
                <div className="space-y-1">
                  {leaderboard.slice(0, 10).map((entry, i) => (
                    <LeaderboardRow key={entry.alias} entry={entry} rank={i + 1} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
