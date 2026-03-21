import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { bookingService } from "@/services/bookingService";
import { nutritionService } from "@/services/nutritionService";
import { workoutService } from "@/services/workoutService";
import { healthService } from "@/services/healthService";
import { goalsService } from "@/services/goalsService";
import { BookingList } from "./components/BookingList";
import { ClassCard } from "./components/ClassCard";
import { FadeIn } from "@/components/common/FadeIn";
import { CheckInCard } from "@/pages/wellness/components/CheckInCard";
import {
  Loader2, ArrowRight, Salad, Flame, Beef, Wheat, Droplets,
  Dumbbell, Moon, Smile, Zap, Target, Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const MOOD_EMOJIS = { 1: "😞", 2: "😕", 3: "😐", 4: "🙂", 5: "😁" };

const scoreColor = (score) => {
  if (!score) return "text-muted-foreground";
  if (score >= 7.5) return "text-emerald-600 dark:text-emerald-400";
  if (score >= 5.0) return "text-amber-600 dark:text-amber-400";
  return "text-rose-600 dark:text-rose-400";
};

const Dashboard = () => {
  const { currentUser } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [nutritionProfile, setNutritionProfile] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [todaySleep, setTodaySleep] = useState(null);
  const [todayMood, setTodayMood] = useState(null);
  const [readiness, setReadiness] = useState(null);
  const [activeGoals, setActiveGoals] = useState([]);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [checkInLoading, setCheckInLoading] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];

      // Core data — always needed
      const [bookingsRes, classesRes] = await Promise.allSettled([
        bookingService.getMyBookings(),
        bookingService.getClasses(),
      ]);
      if (bookingsRes.status === "fulfilled") setBookings(bookingsRes.value.data);
      if (classesRes.status === "fulfilled") setClasses(classesRes.value.data.slice(0, 3));

      // All service calls in parallel — none should block
      const [
        profileRes, summaryRes, planRes, statsRes,
        sleepRes, moodRes, goalRes, weekRes,
      ] = await Promise.allSettled([
        nutritionService.getProfile(),
        nutritionService.getDailySummary(today),
        workoutService.getSavedPlan(),
        workoutService.getStats(),
        healthService.getSleepToday(),
        healthService.getMoodToday(),
        goalsService.listGoals("active"),
        goalsService.weeklySummary(),
      ]);

      if (profileRes.status === "fulfilled") setNutritionProfile(profileRes.value.data);
      if (summaryRes.status === "fulfilled") setNutritionSummary(summaryRes.value.data);
      if (planRes.status === "fulfilled") setWorkoutPlan(planRes.value.data);
      if (statsRes.status === "fulfilled") setWorkoutStats(statsRes.value.data);

      const sleep = sleepRes.status === "fulfilled" ? sleepRes.value.data : null;
      const mood  = moodRes.status  === "fulfilled" ? moodRes.value.data  : null;
      setTodaySleep(sleep);
      setTodayMood(mood);
      setShowCheckIn(!sleep || !mood);

      if (goalRes.status === "fulfilled") setActiveGoals(goalRes.value.data.slice(0, 3));
      if (weekRes.status === "fulfilled") setWeeklySummary(weekRes.value.data);

      if (sleep && mood) {
        try {
          const rd = await healthService.getReadinessToday();
          setReadiness(rd.data);
        } catch { /* not yet logged */ }
      }

      setLoading(false);
    };
    run();
  }, [currentUser]);

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
      toast({ title: "Morning check-in saved!" });
      try {
        const rd = await healthService.getReadinessToday();
        setReadiness(rd.data);
      } catch { /* ok */ }
    } catch {
      toast({ title: "Could not save check-in", variant: "destructive" });
    } finally {
      setCheckInLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] w-full flex-col items-center justify-center gap-3">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        <p className="text-sm text-muted-foreground">Preparing your dashboard…</p>
      </div>
    );
  }

  const calories = nutritionSummary?.totals?.calories ?? 0;
  const calTarget = nutritionProfile?.target_calories ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">

          {/* Welcome */}
          <FadeIn>
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"},&nbsp;
              {currentUser?.user?.name?.split(" ")[0] || "there"}
            </h1>
            <p className="mt-1 text-base text-muted-foreground">Here's your health overview for today.</p>
          </FadeIn>

          {/* Morning check-in prompt */}
          {showCheckIn && (
            <FadeIn delay={0.05}>
              <CheckInCard onSubmit={handleCheckIn} loading={checkInLoading} />
            </FadeIn>
          )}

          {/* 6-widget health hub */}
          <FadeIn delay={0.08}>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">

              {/* Calories */}
              <Link to="/nutrition" className="group rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex flex-col gap-2">
                <div className="h-7 w-7 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center">
                  <Flame className="h-3.5 w-3.5 text-indigo-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Calories</p>
                <p className="text-xl font-bold tabular-nums text-foreground leading-none">
                  {Math.round(calories)}
                </p>
                {calTarget > 0 && (
                  <>
                    <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min((calories / calTarget) * 100, 100)}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">of {Math.round(calTarget)} kcal</p>
                  </>
                )}
                {!calTarget && <p className="text-[10px] text-muted-foreground">Set up nutrition →</p>}
              </Link>

              {/* Workouts this week */}
              <Link to="/workouts" className="group rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex flex-col gap-2">
                <div className="h-7 w-7 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                  <Dumbbell className="h-3.5 w-3.5 text-sky-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Workouts</p>
                <p className="text-xl font-bold tabular-nums text-foreground leading-none">
                  {workoutStats?.totalWorkouts ?? "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {workoutStats?.streak ? `${workoutStats.streak}d streak` : "View plan →"}
                </p>
              </Link>

              {/* Sleep */}
              <Link to="/wellness" className="group rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex flex-col gap-2">
                <div className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                  <Moon className="h-3.5 w-3.5 text-violet-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Sleep</p>
                <p className="text-xl font-bold tabular-nums text-foreground leading-none">
                  {todaySleep ? `${todaySleep.duration_hrs}h` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {todaySleep ? `${todaySleep.quality}★ quality` : "Log sleep →"}
                </p>
              </Link>

              {/* Mood */}
              <Link to="/wellness" className="group rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex flex-col gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                  <Smile className="h-3.5 w-3.5 text-amber-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Mood</p>
                <p className="text-2xl leading-none">
                  {todayMood ? MOOD_EMOJIS[todayMood.mood] : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {todayMood ? `Stress ${todayMood.stress_level}/5` : "Check in →"}
                </p>
              </Link>

              {/* Readiness */}
              <Link to="/wellness" className="group rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex flex-col gap-2">
                <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                  <Zap className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Readiness</p>
                <p className={`text-xl font-bold tabular-nums leading-none ${scoreColor(readiness?.score)}`}>
                  {readiness ? `${readiness.score}/10` : "—"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {readiness
                    ? (readiness.score >= 7.5 ? "High — train hard" : readiness.score >= 5 ? "Moderate" : "Rest today")
                    : "Log mood & sleep →"}
                </p>
              </Link>

              {/* Active goal */}
              <Link to="/goals" className="group rounded-2xl border border-border bg-card p-4 hover:shadow-sm transition-shadow flex flex-col gap-2">
                <div className="h-7 w-7 rounded-lg bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center">
                  <Target className="h-3.5 w-3.5 text-rose-500" />
                </div>
                <p className="text-[11px] text-muted-foreground">Active Goal</p>
                {activeGoals.length > 0 ? (
                  <>
                    <p className="text-sm font-semibold text-foreground capitalize leading-tight">
                      {activeGoals[0].type?.replace("_", " ")}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {activeGoals[0].min_target}–{activeGoals[0].max_target} / {activeGoals[0].period}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-bold text-foreground leading-none">—</p>
                    <p className="text-[10px] text-muted-foreground">Set a goal →</p>
                  </>
                )}
              </Link>

            </div>
          </FadeIn>

          {/* Insight banner */}
          {weeklySummary?.insight && (
            <FadeIn delay={0.12}>
              <div className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
                <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-foreground leading-relaxed">{weeklySummary.insight}</p>
              </div>
            </FadeIn>
          )}

          {/* Nutrition macros */}
          <FadeIn delay={0.15}>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center">
                    <Salad className="h-4 w-4 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Today's Nutrition</p>
                    <p className="text-xs text-muted-foreground">
                      {nutritionProfile ? `Goal: ${nutritionProfile.goal?.replace("_", " ")}` : "Set up your nutrition profile"}
                    </p>
                  </div>
                </div>
                <Button asChild variant="link" size="sm" className="px-0 h-auto font-semibold gap-1">
                  <Link to="/nutrition">Track <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>

              {nutritionProfile && nutritionSummary ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Calories", current: nutritionSummary.totals.calories, target: nutritionProfile.target_calories, unit: "kcal", color: "text-indigo-500", icon: Flame, barColor: "bg-indigo-500" },
                    { label: "Protein",  current: nutritionSummary.totals.protein_g, target: nutritionProfile.target_protein_g, unit: "g",    color: "text-emerald-500", icon: Beef,  barColor: "bg-emerald-500" },
                    { label: "Carbs",    current: nutritionSummary.totals.carbs_g,   target: nutritionProfile.target_carbs_g,   unit: "g",    color: "text-amber-500",  icon: Wheat, barColor: "bg-amber-500" },
                    { label: "Fat",      current: nutritionSummary.totals.fat_g,     target: nutritionProfile.target_fat_g,     unit: "g",    color: "text-rose-500",   icon: Droplets, barColor: "bg-rose-500" },
                  ].map((m) => {
                    const pct = m.target > 0 ? Math.min((m.current / m.target) * 100, 100) : 0;
                    return (
                      <div key={m.label} className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">{m.label}</span>
                          <span className={`text-xs font-medium ${m.color}`}>
                            {m.unit === "kcal" ? Math.round(m.current) : Math.round(m.current * 10) / 10}{m.unit}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${m.barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{Math.round(m.target ?? 0)}{m.unit} target</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-5 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Set up your nutrition profile to start tracking macros.</p>
                  <Button asChild variant="outline" size="sm"><Link to="/nutrition">Get started</Link></Button>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Workout plan preview */}
          <FadeIn delay={0.18}>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">This Week's Workouts</p>
                    <p className="text-xs text-muted-foreground">
                      {workoutPlan ? `${workoutPlan.goal?.replace("_", " ")} · ${workoutPlan.recommended_intensity} intensity` : "No plan yet"}
                    </p>
                  </div>
                </div>
                <Button asChild variant="link" size="sm" className="px-0 h-auto font-semibold gap-1">
                  <Link to="/workouts">View plan <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>

              {workoutPlan ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {workoutPlan.weekly_plan?.map((day) => (
                    <Link
                      to="/workouts" key={day.day_number}
                      className="rounded-xl border border-border p-3 hover:shadow-sm transition-shadow"
                    >
                      <p className="text-[11px] text-muted-foreground mb-1">{day.day}</p>
                      <p className="font-semibold text-xs text-foreground leading-snug">{day.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{day.exercises?.length ?? 0} exercises · {day.duration}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-5 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">Complete your nutrition profile to generate a workout plan.</p>
                  <Button asChild variant="outline" size="sm"><Link to="/workouts">Generate plan</Link></Button>
                </div>
              )}
            </div>
          </FadeIn>

          {/* Bookings + Suggested classes */}
          <FadeIn delay={0.2}>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-2">
              <div className="lg:col-span-2">
                <BookingList bookings={bookings} />
              </div>
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold tracking-tight text-foreground">Suggested For You</h2>
                  <Button asChild variant="link" size="sm" className="px-0 h-auto font-semibold">
                    <Link to="/classes" className="flex items-center gap-1">See all <ArrowRight className="h-3 w-3" /></Link>
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-4">
                  {classes.length > 0 ? (
                    classes.map((cls, j) => (
                      <FadeIn key={cls.id} delay={0.22 + j * 0.04} yOffset={8}>
                        <ClassCard cls={cls} />
                      </FadeIn>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No classes available at the moment.</p>
                  )}
                </div>
              </div>
            </div>
          </FadeIn>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
