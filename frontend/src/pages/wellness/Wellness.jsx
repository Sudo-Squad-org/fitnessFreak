import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { healthService } from "@/services/healthService";
import { FadeIn } from "@/components/common/FadeIn";
import { CheckInCard } from "./components/CheckInCard";
import { ReadinessWidget } from "./components/ReadinessWidget";
import { SleepChart, MoodChart, ReadinessChart } from "./components/TrendChart";
import { BreathingCard } from "./components/BreathingCard";
import { Loader2, Moon, Smile, Wind, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MOOD_LABELS = { 1: "Awful", 2: "Bad", 3: "Okay", 4: "Good", 5: "Great" };
const MOOD_EMOJIS = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😁" };

const Wellness = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo ?? null;

  const [checkInLoading, setCheckInLoading] = useState(false);
  const [todaySleep, setTodaySleep] = useState(null);   // null = not loaded yet, false = not logged
  const [todayMood, setTodayMood] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [sleepHistory, setSleepHistory] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [readinessHistory, setReadinessHistory] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [breathing, setBreathing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCheckIn, setShowCheckIn] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [sleepRes, moodRes, histRes, moodHistRes, rdHistRes, summaryRes, breathRes] = await Promise.allSettled([
      healthService.getSleepToday(),
      healthService.getMoodToday(),
      healthService.listSleep(14),
      healthService.listMood(14),
      healthService.getReadinessHistory(14),
      healthService.getWeeklySummary(),
      healthService.getBreathingExercises(),
    ]);

    const sleep = sleepRes.status === "fulfilled" ? sleepRes.value.data : false;
    const mood  = moodRes.status  === "fulfilled" ? moodRes.value.data  : false;
    setTodaySleep(sleep);
    setTodayMood(mood);
    setShowCheckIn(!sleep || !mood);

    if (histRes.status === "fulfilled") setSleepHistory(histRes.value.data);
    if (moodHistRes.status === "fulfilled") setMoodHistory(moodHistRes.value.data);
    if (rdHistRes.status === "fulfilled") setReadinessHistory(rdHistRes.value.data);
    if (summaryRes.status === "fulfilled") setWeeklySummary(summaryRes.value.data);
    if (breathRes.status === "fulfilled") setBreathing(breathRes.value.data);

    // Load readiness if both are logged
    if (sleep && mood) {
      try {
        const rdRes = await healthService.getReadinessToday();
        setReadiness(rdRes.data);
      } catch { /* partial check-in */ }
    }

    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCheckIn = async ({ sleepHrs, sleepQuality, mood, stress }) => {
    setCheckInLoading(true);
    try {
      const [sl, mo] = await Promise.all([
        healthService.logSleep({ duration_hrs: sleepHrs, quality: sleepQuality }),
        healthService.logMood({ mood, stress_level: stress }),
      ]);
      setTodaySleep(sl.data);
      setTodayMood(mo.data);
      setShowCheckIn(false);
      toast({ title: "Check-in saved!", description: "Your readiness score has been updated." });
      if (returnTo) {
        navigate(returnTo, { replace: true });
        return;
      }
      // Reload readiness + summaries
      const [rdRes, summaryRes] = await Promise.allSettled([
        healthService.getReadinessToday(),
        healthService.getWeeklySummary(),
      ]);
      if (rdRes.status === "fulfilled") setReadiness(rdRes.value.data);
      if (summaryRes.status === "fulfilled") setWeeklySummary(summaryRes.value.data);
      // Refresh histories
      const [histRes, moodHistRes, rdHistRes] = await Promise.allSettled([
        healthService.listSleep(14),
        healthService.listMood(14),
        healthService.getReadinessHistory(14),
      ]);
      if (histRes.status === "fulfilled") setSleepHistory(histRes.value.data);
      if (moodHistRes.status === "fulfilled") setMoodHistory(moodHistRes.value.data);
      if (rdHistRes.status === "fulfilled") setReadinessHistory(rdHistRes.value.data);
    } catch {
      toast({ title: "Could not save", description: "Please try again.", variant: "destructive" });
    } finally {
      setCheckInLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Loading wellness data…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">

          {/* Header */}
          <FadeIn>
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Wellness</h1>
                <p className="mt-1 text-base text-muted-foreground">Sleep, mood, and recovery — all in one place.</p>
              </div>
              {!showCheckIn && (
                <Button variant="outline" size="sm" onClick={() => setShowCheckIn(true)} className="gap-2 shrink-0 mt-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Update check-in
                </Button>
              )}
            </div>
          </FadeIn>

          {/* Post-login nudge */}
          {returnTo && showCheckIn && (
            <FadeIn delay={0.03}>
              <div className="rounded-2xl border border-sky-200 dark:border-sky-500/30 bg-sky-50 dark:bg-sky-500/10 px-4 py-3 text-sm text-sky-800 dark:text-sky-300">
                Complete today's check-in and you'll be taken straight to your dashboard.
              </div>
            </FadeIn>
          )}

          {/* Daily check-in */}
          {showCheckIn && (
            <FadeIn delay={0.05}>
              <CheckInCard onSubmit={handleCheckIn} loading={checkInLoading} />
            </FadeIn>
          )}

          {/* Today's summary pills */}
          {(todaySleep || todayMood) && !showCheckIn && (
            <FadeIn delay={0.05}>
              <div className="flex flex-wrap gap-3">
                {todaySleep && (
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                    <Moon className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-sm text-foreground font-medium">{todaySleep.duration_hrs}h sleep</span>
                    <span className="text-xs text-muted-foreground">· {todaySleep.quality}★ quality</span>
                  </div>
                )}
                {todayMood && (
                  <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
                    <span className="text-base leading-none">{MOOD_EMOJIS[todayMood.mood]}</span>
                    <span className="text-sm text-foreground font-medium">{MOOD_LABELS[todayMood.mood]}</span>
                    <span className="text-xs text-muted-foreground">· stress {todayMood.stress_level}/5</span>
                  </div>
                )}
              </div>
            </FadeIn>
          )}

          {/* Readiness */}
          {readiness && (
            <FadeIn delay={0.1}>
              <ReadinessWidget readiness={readiness} />
            </FadeIn>
          )}

          {/* Weekly insight */}
          {weeklySummary?.insight && (
            <FadeIn delay={0.12}>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Weekly Insight</p>
                <p className="text-sm text-foreground leading-relaxed">{weeklySummary.insight}</p>
                {weeklySummary.avg_sleep_hrs && (
                  <div className="mt-3 pt-3 border-t border-border grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Avg sleep", value: `${weeklySummary.avg_sleep_hrs}h` },
                      { label: "Sleep quality", value: weeklySummary.avg_sleep_quality ? `${weeklySummary.avg_sleep_quality}★` : "—" },
                      { label: "Avg mood", value: weeklySummary.avg_mood ? `${weeklySummary.avg_mood}/5` : "—" },
                      { label: "Avg readiness", value: weeklySummary.avg_readiness ? `${weeklySummary.avg_readiness}/10` : "—" },
                    ].map(({ label, value }) => (
                      <div key={label}>
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        <p className="text-sm font-semibold text-foreground">{value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FadeIn>
          )}

          {/* Readiness history */}
          {readinessHistory.length > 1 && (
            <FadeIn delay={0.14}>
              <div className="rounded-2xl border border-border bg-card p-5">
                <p className="text-sm font-semibold text-foreground mb-4">Readiness Breakdown — 14 days</p>
                <ReadinessChart data={readinessHistory} />
              </div>
            </FadeIn>
          )}

          {/* Sleep & Mood charts side by side */}
          <FadeIn delay={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {sleepHistory.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Moon className="h-4 w-4 text-indigo-500" />
                    <p className="text-sm font-semibold text-foreground">Sleep — 14 days</p>
                  </div>
                  <SleepChart data={sleepHistory} />
                </div>
              )}
              {moodHistory.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center gap-2 mb-4">
                    <Smile className="h-4 w-4 text-amber-500" />
                    <p className="text-sm font-semibold text-foreground">Mood & Stress — 14 days</p>
                  </div>
                  <MoodChart data={moodHistory} />
                </div>
              )}
            </div>
          </FadeIn>

          {/* Breathing exercises */}
          {breathing.length > 0 && (
            <FadeIn delay={0.2}>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Wind className="h-4 w-4 text-sky-500" />
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Breathing Techniques</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {breathing.map((ex) => (
                    <BreathingCard key={ex.id} exercise={ex} />
                  ))}
                </div>
              </div>
            </FadeIn>
          )}

        </div>
      </main>
    </div>
  );
};

export default Wellness;
