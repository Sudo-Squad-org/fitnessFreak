import React, { useState } from "react";
import { Send } from "lucide-react";

export function BuddyCandidateCard({ candidate, onSend }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      await onSend();
      setSent(true);
    } catch {
      /* already sent or error — show as sent */
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  const scorePct = Math.min(100, Math.round((candidate.score / 6) * 100));

  return (
    <div className="flex items-center justify-between rounded-xl border border-border p-4">
      <div className="min-w-0 flex-1 mr-4">
        <p className="text-sm font-medium text-foreground">{candidate.alias}</p>
        <p className="text-xs text-muted-foreground mt-0.5 capitalize">
          {candidate.fitness_level} · {candidate.goal.replace("_", " ")}
        </p>
        <div className="mt-2 h-1.5 w-full max-w-32 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-foreground transition-all"
            style={{ width: `${scorePct}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-1">Match score: {candidate.score}/6</p>
      </div>
      <button
        onClick={handle}
        disabled={sent || loading}
        className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
          sent
            ? "bg-muted text-muted-foreground cursor-default"
            : "bg-foreground text-background hover:opacity-80"
        }`}
      >
        <Send className="h-3.5 w-3.5" />
        {sent ? "Sent" : "Request"}
      </button>
    </div>
  );
}
