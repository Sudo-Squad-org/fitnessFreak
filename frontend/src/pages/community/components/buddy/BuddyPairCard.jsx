import React, { useState } from "react";
import { communityService } from "@/services/communityService";
import { Users, Unlink } from "lucide-react";

export function BuddyPairCard({ pair, onDissolve }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleDissolve = async () => {
    setLoading(true);
    try {
      await communityService.dissolvePair();
      onDissolve();
    } catch {/* */} finally {
      setLoading(false);
      setConfirming(false);
    }
  };

  const matchedDate = new Date(pair.matched_at).toLocaleDateString(undefined, {
    month: "short", day: "numeric", year: "numeric",
  });

  return (
    <div className="rounded-xl border border-border p-5">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{pair.partner_alias}</p>
            <p className="text-xs text-muted-foreground">
              Matched {matchedDate}
              {pair.pair_streak > 0 && (
                <span className="ml-2 font-medium text-foreground">· 🔥 {pair.pair_streak}wk streak</span>
              )}
            </p>
          </div>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive transition-colors"
          >
            <Unlink className="h-3.5 w-3.5" /> Unmatch
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={handleDissolve}
              disabled={loading}
              className="rounded-lg bg-destructive px-3 py-1.5 text-xs font-medium text-destructive-foreground hover:opacity-80 transition-opacity"
            >
              Confirm
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
