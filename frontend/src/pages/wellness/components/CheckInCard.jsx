import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Moon, Frown, Smile } from "lucide-react";

const MOOD_EMOJIS = [
  { value: 1, emoji: "😞", label: "Awful" },
  { value: 2, emoji: "😕", label: "Bad" },
  { value: 3, emoji: "😐", label: "Okay" },
  { value: 4, emoji: "🙂", label: "Good" },
  { value: 5, emoji: "😁", label: "Great" },
];

export const CheckInCard = ({ onSubmit, loading, compact = false }) => {
  const [step, setStep] = useState("sleep"); // "sleep" | "mood"
  const [sleepHrs, setSleepHrs] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(null);
  const [mood, setMood] = useState(null);
  const [stress, setStress] = useState(3);

  const canAdvance = step === "sleep" ? sleepQuality !== null : mood !== null;

  const handleSubmit = () => {
    onSubmit({ sleepHrs, sleepQuality, mood, stress });
  };

  return (
    <div className={`rounded-2xl border border-border bg-card ${compact ? "p-4" : "p-6"}`}>
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center shrink-0">
          {step === "sleep" ? (
            <Moon className="h-4 w-4 text-indigo-500" />
          ) : (
            <Smile className="h-4 w-4 text-amber-500" />
          )}
        </div>
        <div>
          <p className="font-semibold text-sm text-foreground">
            {step === "sleep" ? "How did you sleep?" : "How are you feeling?"}
          </p>
          <p className="text-xs text-muted-foreground">
            {step === "sleep" ? "Step 1 of 2 · Sleep" : "Step 2 of 2 · Mood & Stress"}
          </p>
        </div>
        {/* Progress dots */}
        <div className="ml-auto flex gap-1.5">
          <span className={`h-1.5 w-4 rounded-full transition-colors ${step === "sleep" ? "bg-foreground" : "bg-muted"}`} />
          <span className={`h-1.5 w-4 rounded-full transition-colors ${step === "mood" ? "bg-foreground" : "bg-muted"}`} />
        </div>
      </div>

      {step === "sleep" ? (
        <div className="space-y-5">
          {/* Hours slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-muted-foreground">Hours slept</label>
              <span className="text-sm font-semibold tabular-nums text-foreground">{sleepHrs}h</span>
            </div>
            <input
              type="range" min="1" max="12" step="0.5"
              value={sleepHrs}
              onChange={(e) => setSleepHrs(parseFloat(e.target.value))}
              className="w-full h-1.5 rounded-full accent-foreground cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>1h</span><span>12h</span>
            </div>
          </div>

          {/* Quality */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Sleep quality</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((q) => (
                <button
                  key={q}
                  onClick={() => setSleepQuality(q)}
                  className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors border ${
                    sleepQuality === q
                      ? "bg-foreground text-background border-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/50"
                  }`}
                >
                  {q}★
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-0.5">
              <span>Poor</span><span>Excellent</span>
            </div>
          </div>

          <Button
            className="w-full" size="sm"
            disabled={!canAdvance}
            onClick={() => setStep("mood")}
          >
            Next →
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Mood emoji */}
          <div>
            <label className="text-xs text-muted-foreground mb-2 block">Overall mood</label>
            <div className="flex gap-2">
              {MOOD_EMOJIS.map(({ value, emoji, label }) => (
                <button
                  key={value}
                  onClick={() => setMood(value)}
                  title={label}
                  className={`flex-1 flex flex-col items-center gap-1 rounded-xl py-2.5 border transition-all ${
                    mood === value
                      ? "bg-foreground border-foreground"
                      : "border-border hover:border-foreground/40"
                  }`}
                >
                  <span className="text-xl leading-none">{emoji}</span>
                  <span className={`text-[10px] font-medium ${mood === value ? "text-background" : "text-muted-foreground"}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Stress */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs text-muted-foreground">Stress level</label>
              <span className="text-xs font-medium text-foreground">
                {["", "Very low", "Low", "Moderate", "High", "Very high"][stress]}
              </span>
            </div>
            <input
              type="range" min="1" max="5" step="1"
              value={stress}
              onChange={(e) => setStress(parseInt(e.target.value))}
              className="w-full h-1.5 rounded-full accent-foreground cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span><Frown className="h-3 w-3 inline" /> Very low</span>
              <span>Very high</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setStep("sleep")} className="flex-1">
              ← Back
            </Button>
            <Button
              size="sm" className="flex-1"
              disabled={!canAdvance || loading}
              onClick={handleSubmit}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save check-in"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
