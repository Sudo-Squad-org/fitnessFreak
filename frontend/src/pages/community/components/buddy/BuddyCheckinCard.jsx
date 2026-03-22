import React, { useState } from "react";
import { communityService } from "@/services/communityService";
import { ThumbsUp, ThumbsDown, ChevronRight } from "lucide-react";

const DIFFICULTY_OPTIONS = [
  { value: "easy",   label: "Easy",        emoji: "😊" },
  { value: "medium", label: "Just Right",  emoji: "💪" },
  { value: "hard",   label: "Tough",       emoji: "🔥" },
];

export function BuddyCheckinCard({ checkin, partnerAlias, onRespond }) {
  const [step, setStep]           = useState(1); // 1 = workout?, 2 = difficulty, 3 = note
  const [response, setResponse]   = useState(null);
  const [difficulty, setDiff]     = useState(null);
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);

  const weekLabel = new Date(checkin.week_start).toLocaleDateString(undefined, {
    month: "short", day: "numeric",
  });

  const submit = async () => {
    setLoading(true);
    try {
      await communityService.respondCheckin(checkin.id, { response, difficulty, note: note.trim() || null });
      onRespond();
    } catch {/* */} finally {
      setLoading(false);
    }
  };

  const partnerEmoji = checkin.their_response === "thumbs_up" ? "👍" : checkin.their_response === "thumbs_down" ? "👎" : null;
  const diffLabel    = DIFFICULTY_OPTIONS.find(d => d.value === checkin.their_difficulty);

  // Already responded — show summary card
  if (checkin.my_response) {
    return (
      <div className="rounded-lg border border-border px-4 py-3 space-y-1.5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-foreground">
              Did {partnerAlias ?? "your buddy"} complete their workouts?
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Week of {weekLabel}</p>
          </div>
          <span className="text-lg">{checkin.my_response === "thumbs_up" ? "👍" : "👎"}</span>
        </div>
        {/* Partner's response */}
        {(partnerEmoji || checkin.their_difficulty || checkin.their_note) && (
          <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground space-y-0.5">
            <p className="font-medium text-foreground/70">{partnerAlias ?? "Buddy"}'s update:</p>
            {partnerEmoji && (
              <p>{partnerEmoji} {checkin.their_response === "thumbs_up" ? "On track" : "Off track"}
                {diffLabel ? ` · ${diffLabel.emoji} ${diffLabel.label}` : ""}
              </p>
            )}
            {checkin.their_note && <p className="italic">"{checkin.their_note}"</p>}
          </div>
        )}
        {!partnerEmoji && (
          <p className="text-xs text-muted-foreground">Waiting for {partnerAlias ?? "buddy"}'s response…</p>
        )}
      </div>
    );
  }

  // Step wizard — hasn't responded yet
  return (
    <div className="rounded-lg border border-border px-4 py-3 space-y-3">
      <div>
        <p className="text-xs font-medium text-foreground">
          Did {partnerAlias ?? "your buddy"} complete their workouts this week?
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">Week of {weekLabel} · Step {step} of 3</p>
      </div>

      {/* Step 1: Workout completion */}
      {step === 1 && (
        <div className="flex gap-2">
          <button
            onClick={() => { setResponse("thumbs_up"); setStep(2); }}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ThumbsUp className="h-3.5 w-3.5" /> On track
          </button>
          <button
            onClick={() => { setResponse("thumbs_down"); setStep(2); }}
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
          >
            <ThumbsDown className="h-3.5 w-3.5" /> Off track
          </button>
        </div>
      )}

      {/* Step 2: Difficulty */}
      {step === 2 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">How was your week?</p>
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => { setDiff(d.value); setStep(3); }}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs transition-colors ${
                  difficulty === d.value
                    ? "border-foreground text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                {d.emoji} {d.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => { setDiff(null); setStep(3); }}
            className="mt-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Skip →
          </button>
        </div>
      )}

      {/* Step 3: Note */}
      {step === 3 && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Leave a note for {partnerAlias ?? "your buddy"} (optional)</p>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={100}
            placeholder="e.g. Tough week but pushed through!"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <div className="flex justify-end">
            <button
              onClick={submit}
              disabled={loading}
              className="flex items-center gap-1 rounded-lg bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              Submit <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
