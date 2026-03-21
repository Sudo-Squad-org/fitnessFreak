import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { workoutService } from "@/services/workoutService";
import { nutritionService } from "@/services/nutritionService";
import { healthService } from "@/services/healthService";
import { FadeIn } from "@/components/common/FadeIn";
import { Button } from "@/components/ui/button";
import { WeekProgressBar } from "./components/WeekProgressBar";
import { DayCard } from "./components/DayCard";
import { WorkoutModal } from "./components/WorkoutModal";
import {
  Loader2, RefreshCw, Dumbbell, HeartPulse, AlertTriangle, Wind,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Workout = () => {
  const { toast } = useToast();

  // "loading" | "generating" | "no_profile" | "ready" | "error"
  const [pageState, setPageState] = useState("loading");
  const [plan, setPlan] = useState(null);
  const [weekProgress, setWeekProgress] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toggling, setToggling] = useState(new Set());
  const [regenerating, setRegenerating] = useState(false);
  const [readiness, setReadiness] = useState(null);

  const fetchProgress = useCallback(async () => {
    try {
      const res = await workoutService.getWeekProgress();
      setWeekProgress(res.data);
    } catch {
      // progress fetch failing is non-fatal
    }
  }, []);

  const loadPlan = useCallback(async () => {
    setPageState("loading");
    try {
      // Try saved plan first
      const savedRes = await workoutService.getSavedPlan();
      setPlan(savedRes.data);
      await fetchProgress();
      setPageState("ready");
      // Fire-and-forget — readiness is optional enrichment
      healthService.getReadinessToday()
        .then((r) => setReadiness(r.data))
        .catch(() => {});
    } catch (savedErr) {
      if (savedErr?.response?.status === 404) {
        // No saved plan — try to auto-generate from nutrition profile
        try {
          const profileRes = await nutritionService.getProfile();
          if (!profileRes.data) throw new Error("no_profile");
        } catch {
          setPageState("no_profile");
          return;
        }
        setPageState("generating");
        try {
          const genRes = await workoutService.getPlanFromProfile();
          setPlan(genRes.data);
          await fetchProgress();
          setPageState("ready");
          // Fire-and-forget — readiness is optional enrichment
          healthService.getReadinessToday()
            .then((r) => setReadiness(r.data))
            .catch(() => {});
        } catch (genErr) {
          if (genErr?.response?.status === 424) {
            setPageState("no_profile");
          } else {
            setPageState("error");
          }
        }
      } else {
        setPageState("error");
      }
    }
  }, [fetchProgress]);

  useEffect(() => {
    loadPlan();
  }, [loadPlan]);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await workoutService.getPlanFromProfile();
      setPlan(res.data);
      setWeekProgress(null);
      await fetchProgress();
      toast({ title: "New plan generated", description: "Your workout plan has been refreshed." });
    } catch {
      toast({ title: "Could not regenerate", description: "Please try again.", variant: "destructive" });
    } finally {
      setRegenerating(false);
    }
  };

  const handleToggle = async (dayNumber, exerciseId) => {
    setToggling((prev) => new Set(prev).add(exerciseId));
    try {
      const res = await workoutService.toggleExercise({ day_number: dayNumber, exercise_id: exerciseId });
      const { completed_exercise_ids, now_completed, day_completed } = res.data;

      if (day_completed) {
        toast({ title: "Day complete!", description: "Workout logged and your progress has been updated." });
      }

      // Optimistically update weekProgress
      setWeekProgress((prev) => {
        if (!prev) return prev;
        const days = prev.days.map((d) => {
          if (d.day_number !== dayNumber) return d;
          return { ...d, completed: completed_exercise_ids.length, completed_exercise_ids };
        });
        const totalCompleted = days.reduce((sum, d) => sum + d.completed, 0);
        const pct = prev.total_exercises > 0
          ? Math.round((totalCompleted / prev.total_exercises) * 100 * 10) / 10
          : 0;
        return { ...prev, days, completed_exercises: totalCompleted, completion_pct: pct };
      });

      // Also update selectedDay context for modal
      if (selectedDay?.day_number === dayNumber) {
        setSelectedDay((prev) => prev ? { ...prev } : prev);
      }
    } catch {
      toast({ title: "Could not save", description: "Progress not saved. Try again.", variant: "destructive" });
    } finally {
      setToggling((prev) => {
        const next = new Set(prev);
        next.delete(exerciseId);
        return next;
      });
    }
  };

  const handleOpenModal = (day) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  // ── Render states ─────────────────────────────────────────────────────────

  if (pageState === "loading" || pageState === "generating") {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {pageState === "generating"
            ? "Building your personalized workout plan…"
            : "Loading your workout plan…"}
        </p>
      </div>
    );
  }

  if (pageState === "no_profile") {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="h-14 w-14 rounded-2xl bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
              <Dumbbell className="h-7 w-7 text-sky-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Unlock Your Workout Plan</h1>
              <p className="mt-2 text-muted-foreground max-w-sm mx-auto">
                Complete your nutrition profile first — we'll use your goal, activity level, and health conditions to build a personalized 4-day plan.
              </p>
            </div>
            <Button asChild size="lg">
              <Link to="/nutrition">Set up nutrition profile</Link>
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (pageState === "error") {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <AlertTriangle className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground">Something went wrong loading your plan.</p>
            <Button variant="outline" onClick={loadPlan}>Try again</Button>
          </div>
        </main>
      </div>
    );
  }

  // ── Ready state ───────────────────────────────────────────────────────────

  const progressByDay = Object.fromEntries(
    (weekProgress?.days ?? []).map((d) => [d.day_number, d])
  );

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">

          {/* Header */}
          <FadeIn>
            <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  Your Workout Plan
                </h1>
                <p className="mt-1 text-base text-muted-foreground">
                  {plan?.goal?.replace("_", " ")} · {plan?.activity_level?.replace(/_/g, " ")} · {plan?.recommended_intensity} intensity
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerating}
                className="self-start sm:self-center mt-3 sm:mt-0 gap-2 shrink-0"
              >
                {regenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Regenerate
              </Button>
            </div>
          </FadeIn>

          {/* Week progress bar */}
          {weekProgress && (
            <FadeIn delay={0.05}>
              <WeekProgressBar
                completed={weekProgress.completed_exercises}
                total={weekProgress.total_exercises}
                pct={weekProgress.completion_pct}
                weekStart={weekProgress.week_start}
              />
            </FadeIn>
          )}

          {/* Low-readiness callout */}
          {readiness?.score < 5.0 && (
            <FadeIn delay={0.08}>
              <div className="rounded-2xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 p-4 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Wind className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">Low readiness today ({readiness.score}/10)</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Consider a lighter session. Breathing techniques can help support recovery.
                    </p>
                  </div>
                </div>
                <Button asChild variant="outline" size="sm" className="shrink-0">
                  <Link to="/wellness">Recovery →</Link>
                </Button>
              </div>
            </FadeIn>
          )}

          {/* 4-day card grid */}
          <FadeIn delay={0.1}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plan?.weekly_plan?.map((day) => (
                <DayCard
                  key={day.day_number}
                  day={day}
                  progress={progressByDay[day.day_number]}
                  onClick={() => handleOpenModal(day)}
                />
              ))}
            </div>
          </FadeIn>

          {/* Focus areas */}
          {plan?.focus_areas?.length > 0 && (
            <FadeIn delay={0.15}>
              <div className="flex flex-wrap gap-2">
                {plan.focus_areas.map((area) => (
                  <span
                    key={area}
                    className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </FadeIn>
          )}

          {/* Coach note */}
          {plan?.coach_notes?.[0] && (
            <FadeIn delay={0.2}>
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-2 mb-2">
                  <HeartPulse className="h-4 w-4 text-rose-500 shrink-0" />
                  <p className="text-sm font-semibold text-foreground">Coach note</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {plan.coach_notes[0]}
                </p>
                {plan.avoid?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-3">
                    <span className="font-medium text-foreground">Avoid: </span>
                    {plan.avoid.join("; ")}
                  </p>
                )}
              </div>
            </FadeIn>
          )}

          {/* Disclaimer */}
          {plan?.medical_disclaimer && (
            <FadeIn delay={0.25}>
              <p className="text-xs text-muted-foreground text-center leading-relaxed px-4">
                {plan.medical_disclaimer}
              </p>
            </FadeIn>
          )}

        </div>
      </main>

      {/* Exercise modal */}
      <WorkoutModal
        open={isModalOpen}
        onClose={handleCloseModal}
        day={selectedDay}
        progress={selectedDay ? progressByDay[selectedDay.day_number] : null}
        onToggle={handleToggle}
        toggling={toggling}
      />
    </div>
  );
};

export default Workout;
