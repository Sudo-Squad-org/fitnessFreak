import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { bookingService } from "@/services/bookingService";
import { nutritionService } from "@/services/nutritionService";
import { workoutService } from "@/services/workoutService";
import { StatsSection } from "./components/StatsSection";
import { BookingList } from "./components/BookingList";
import { ClassCard } from "./components/ClassCard";
import { FadeIn } from "@/components/common/FadeIn";
import { Loader2, ArrowRight, Salad, Flame, Beef, Wheat, Droplets, Dumbbell, HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [nutritionSummary, setNutritionSummary] = useState(null);
  const [nutritionProfile, setNutritionProfile] = useState(null);
  const [workoutPlan, setWorkoutPlan] = useState(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const today = new Date().toISOString().split("T")[0];
        const [bookingsRes, classesRes] = await Promise.all([
          bookingService.getMyBookings(),
          bookingService.getClasses(),
        ]);

        setBookings(bookingsRes.data);
        setClasses(classesRes.data.slice(0, 4));

        // Nutrition (non-blocking)
        try {
          const [profileRes, summaryRes] = await Promise.all([
            nutritionService.getProfile(),
            nutritionService.getDailySummary(today),
          ]);
          setNutritionProfile(profileRes.data);
          setNutritionSummary(summaryRes.data);

          const workoutPlanRes = await workoutService.getPlan({
            goal: profileRes.data.goal,
            activity_level: profileRes.data.activity_level,
            age: profileRes.data.age,
            health_conditions: profileRes.data.health_conditions
              ? profileRes.data.health_conditions.split(",").filter(Boolean)
              : [],
          });
          setWorkoutPlan(workoutPlanRes.data);
        } catch { /* no nutrition profile yet */ }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
        setError("Could not load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-900 dark:text-zinc-50" />
        <p className="text-sm font-medium text-zinc-500">Preparing your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">
          
          {/* Welcome Section */}
          <FadeIn>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
                Welcome back, {currentUser?.user?.name || "Fitness Freak"}!
              </h1>
              <p className="text-lg text-zinc-500 dark:text-zinc-400">
                You're doing great! Keep the momentum going.
              </p>
            </div>
          </FadeIn>

          {/* Stats Section */}
          <StatsSection bookingsCount={bookings.length} />

          {/* Nutrition Widget */}
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
                  <Link to="/nutrition">
                    {nutritionProfile ? "Track" : "Get started"} <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              {nutritionProfile && nutritionSummary ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Calories", current: nutritionSummary.totals.calories, target: nutritionProfile.target_calories, unit: "kcal", color: "text-indigo-500", icon: Flame, bg: "bg-indigo-50 dark:bg-indigo-500/10" },
                    { label: "Protein", current: nutritionSummary.totals.protein_g, target: nutritionProfile.target_protein_g, unit: "g", color: "text-emerald-500", icon: Beef, bg: "bg-emerald-50 dark:bg-emerald-500/10" },
                    { label: "Carbs", current: nutritionSummary.totals.carbs_g, target: nutritionProfile.target_carbs_g, unit: "g", color: "text-amber-500", icon: Wheat, bg: "bg-amber-50 dark:bg-amber-500/10" },
                    { label: "Fat", current: nutritionSummary.totals.fat_g, target: nutritionProfile.target_fat_g, unit: "g", color: "text-rose-500", icon: Droplets, bg: "bg-rose-50 dark:bg-rose-500/10" },
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
                          <div className={`h-full rounded-full ${m.color.replace("text-", "bg-")}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{Math.round(m.target ?? 0)}{m.unit} target</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    Set up your nutrition profile to start tracking macros.
                  </p>
                </div>
              )}
            </div>
          </FadeIn>

          <FadeIn delay={0.2}>
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-sky-50 dark:bg-sky-500/10 flex items-center justify-center">
                    <Dumbbell className="h-4 w-4 text-sky-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm text-foreground">Recommended Workout Plan</p>
                    <p className="text-xs text-muted-foreground">
                      {workoutPlan
                        ? `${workoutPlan.recommended_intensity} intensity`
                        : "Set up health conditions to personalize your plan"}
                    </p>
                  </div>
                </div>
                <Button asChild variant="link" size="sm" className="px-0 h-auto font-semibold gap-1">
                  <Link to="/nutrition">
                    {workoutPlan ? "Update profile" : "Get started"} <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>

              {workoutPlan ? (
                <div className="space-y-4">
                  <div className="rounded-xl bg-sky-50/70 dark:bg-sky-500/10 border border-sky-100 dark:border-sky-900 p-4">
                    <p className="text-sm font-medium text-foreground">{workoutPlan.summary}</p>
                    {workoutPlan.health_conditions?.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {workoutPlan.health_conditions.map((condition) => (
                          <span key={condition} className="rounded-full bg-background px-2.5 py-1 text-xs text-muted-foreground border border-border">
                            {condition.replaceAll("_", " ")}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {workoutPlan.weekly_plan?.slice(0, 4).map((item) => (
                      <div key={item.day} className="rounded-xl border border-border p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-sm text-foreground">{item.title}</p>
                          <span className="text-[11px] text-muted-foreground">{item.duration}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.day}</p>
                        <p className="text-sm text-muted-foreground mt-3">{item.details}</p>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-border p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <HeartPulse className="h-4 w-4 text-rose-500" />
                      <p className="text-sm font-semibold text-foreground">Coach note</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {workoutPlan.coach_notes?.[0]}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-6 rounded-xl border border-dashed border-border">
                  <p className="text-sm text-muted-foreground">
                    Add health conditions in your nutrition profile to unlock a safer workout plan.
                  </p>
                </div>
              )}
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-4">
            {/* Left/Middle: My Bookings */}
            <div className="lg:col-span-2">
              <BookingList bookings={bookings} />
            </div>

            {/* Right: Suggested Classes */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Suggestion For You</h2>
                <Button asChild variant="link" size="sm" className="px-0 h-auto font-semibold">
                  <Link to="/classes" className="flex items-center gap-1">
                    See all <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
              <div className="grid grid-cols-1 gap-6">
                {classes.length > 0 ? (
                  classes.map((cls, j) => (
                    <FadeIn key={cls.id} delay={0.2 + (0.05 * j)} yOffset={10}>
                      <ClassCard cls={cls} />
                    </FadeIn>
                  ))
                ) : (
                  <p className="text-sm text-zinc-500 italic">No classes available at the moment.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
