import React, { useState, useEffect, useCallback } from "react";
import { nutritionService } from "@/services/nutritionService";
import { ProfileSetup } from "./components/ProfileSetup";
import { MacroCard } from "./components/MacroCard";
import { MealSection } from "./components/MealSection";
import { WeeklyChart } from "./components/WeeklyChart";
import { FadeIn } from "@/components/common/FadeIn";
import { Button } from "@/components/ui/button";
import {
  Loader2, ChevronLeft, ChevronRight, Flame,
  Beef, Wheat, Droplets, Leaf, Settings2,
} from "lucide-react";

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().split("T")[0];
};

const formatDisplayDate = (dateStr) => {
  const d = new Date(dateStr + "T00:00:00");
  const today = todayStr();
  const yesterday = addDays(today, -1);
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
};

export const Nutrition = () => {
  const [profileState, setProfileState] = useState("loading"); // loading | missing | loaded
  const [profile, setProfile] = useState(null);
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [weeklySummary, setWeeklySummary] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  // Seed foods on first load (idempotent — backend ignores if already seeded)
  useEffect(() => {
    nutritionService.seedFoods().catch(() => {});
  }, []);

  // Load profile
  const loadProfile = useCallback(async () => {
    try {
      const res = await nutritionService.getProfile();
      setProfile(res.data);
      setProfileState("loaded");
    } catch (e) {
      if (e?.response?.status === 404) {
        setProfileState("missing");
      } else {
        setProfileState("missing");
      }
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Load daily summary
  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await nutritionService.getDailySummary(selectedDate);
      setSummary(res.data);
    } catch {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [selectedDate]);

  // Load weekly summary
  const loadWeekly = useCallback(async () => {
    try {
      const res = await nutritionService.getWeeklySummary(todayStr());
      setWeeklySummary(res.data);
    } catch {
      setWeeklySummary(null);
    }
  }, []);

  // Load Recommendations
  const loadRecommendations = useCallback(async () => {
    setRecommendationsLoading(true);
    try {
      const res = await nutritionService.getRecommendations();
      setRecommendations(res.data);
    } catch (e) {
      console.error("Recommendations error:", e);
      setRecommendations([]);
    } finally {
      setRecommendationsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (profileState === "loaded") {
      loadRecommendations();
    }
  }, [profileState, loadRecommendations]);

  useEffect(() => {
    if (profileState === "loaded") {
      loadSummary();
      loadWeekly();
    }
  }, [profileState, selectedDate, loadSummary, loadWeekly]);

  const handleProfileComplete = () => {
    setShowEditProfile(false);
    loadProfile();
    loadRecommendations();
  };

  const handleDateChange = (delta) => {
    const next = addDays(selectedDate, delta);
    if (next <= todayStr()) setSelectedDate(next);
  };

  // ── Loading ────────────────────────────────────────────────────────────────
  if (profileState === "loading") {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // ── Profile Setup ──────────────────────────────────────────────────────────
  if (profileState === "missing" || showEditProfile) {
    return (
      <div className="min-h-screen bg-background">
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
          {showEditProfile && (
            <button
              onClick={() => setShowEditProfile(false)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
          )}
          <ProfileSetup
            onComplete={handleProfileComplete}
            initialProfile={showEditProfile ? profile : null}
            mode={showEditProfile ? "edit" : "create"}
          />
        </main>
      </div>
    );
  }

  const totals = summary?.totals;
  const byMeal = summary?.by_meal;
  const isToday = selectedDate === todayStr();

  // group logs by meal
  const logsByMeal = { breakfast: [], lunch: [], dinner: [], snack: [] };
  if (summary?.logs) {
    for (const log of summary.logs) {
      logsByMeal[log.meal_type]?.push(log);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-8">

          {/* Header */}
          <FadeIn>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Nutrition Tracker</h1>
                <p className="text-muted-foreground mt-1 text-sm">
                  Goal: <span className="font-medium capitalize text-foreground">{profile?.goal?.replace("_", " ")}</span>
                  {" · "}Target: <span className="font-medium text-foreground">{Math.round(profile?.target_calories || 0)} kcal/day</span>
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditProfile(true)}
                className="gap-2 self-start sm:self-auto"
              >
                <Settings2 className="h-4 w-4" />
                Edit Profile
              </Button>
            </div>
          </FadeIn>

          {/* Date Navigation */}
          <FadeIn delay={0.05}>
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <button
                onClick={() => handleDateChange(-1)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <div className="flex-1 text-center">
                <p className="font-bold text-foreground">{formatDisplayDate(selectedDate)}</p>
                <p className="text-xs text-muted-foreground">{new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
              </div>
              <button
                onClick={() => handleDateChange(1)}
                disabled={selectedDate >= todayStr()}
                className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </FadeIn>

          <>
              {/* Macro Summary */}
              <FadeIn delay={0.1}>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative">
                  {summaryLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-2xl z-10">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  )}
                  <MacroCard
                    label="Calories"
                    current={totals?.calories || 0}
                    target={profile?.target_calories || 0}
                    unit="kcal"
                    color="text-indigo-500"
                    bgColor="bg-indigo-50 dark:bg-indigo-500/10"
                    icon={Flame}
                  />
                  <MacroCard
                    label="Protein"
                    current={totals?.protein_g || 0}
                    target={profile?.target_protein_g || 0}
                    unit="g"
                    color="text-emerald-500"
                    bgColor="bg-emerald-50 dark:bg-emerald-500/10"
                    icon={Beef}
                  />
                  <MacroCard
                    label="Carbs"
                    current={totals?.carbs_g || 0}
                    target={profile?.target_carbs_g || 0}
                    unit="g"
                    color="text-amber-500"
                    bgColor="bg-amber-50 dark:bg-amber-500/10"
                    icon={Wheat}
                  />
                  <MacroCard
                    label="Fat"
                    current={totals?.fat_g || 0}
                    target={profile?.target_fat_g || 0}
                    unit="g"
                    color="text-rose-500"
                    bgColor="bg-rose-50 dark:bg-rose-500/10"
                    icon={Droplets}
                  />
                </div>
              </FadeIn>

              {/* Calories remaining banner */}
              {isToday && summary?.calories_remaining != null && (
                <FadeIn delay={0.12}>
                  {summary.calories_remaining >= 0 ? (
                    <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-500/5 border border-emerald-200 dark:border-emerald-800 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Leaf className="h-5 w-5 text-emerald-500" />
                        <div>
                          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                            {Math.round(summary.calories_remaining)} kcal remaining
                          </p>
                          <p className="text-xs text-emerald-600 dark:text-emerald-500 mt-0.5">
                            You're within your daily target — great job!
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl">🎯</span>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-800 px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Flame className="h-5 w-5 text-rose-500" />
                        <div>
                          <p className="font-semibold text-rose-700 dark:text-rose-400">
                            {Math.abs(Math.round(summary.calories_remaining))} kcal over target
                          </p>
                          <p className="text-xs text-rose-600 dark:text-rose-500 mt-0.5">
                            Consider lighter meals for the rest of the day.
                          </p>
                        </div>
                      </div>
                      <span className="text-2xl">⚡</span>
                    </div>
                  )}
                </FadeIn>
              )}

              {/* Food Recommendations */}
              <FadeIn delay={0.14}>
                <div className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-bold text-foreground text-sm">Recommended Foods</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Personalized using your goal and food preferences
                      </p>
                    </div>
                  </div>

                  {recommendationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : recommendations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No recommendations available yet.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {recommendations.map((food) => (
                        <div key={food.id} className="rounded-xl border border-border bg-background p-4 space-y-3">
                          <h4 className="font-semibold text-sm text-foreground leading-tight">{food.name}</h4>
                          <div className="grid grid-cols-4 gap-2 text-center">
                            {[
                              { label: "Cal",  value: food.calories_per_100g ?? food.calories, unit: "kcal", color: "text-indigo-500" },
                              { label: "Pro",  value: food.protein_per_100g  ?? food.protein,  unit: "g",    color: "text-emerald-500" },
                              { label: "Carb", value: food.carbs_per_100g   ?? food.carbs,    unit: "g",    color: "text-amber-500" },
                              { label: "Fat",  value: food.fat_per_100g     ?? food.fat,      unit: "g",    color: "text-rose-500" },
                            ].map((m) => (
                              <div key={m.label}>
                                <p className={`text-sm font-bold ${m.color}`}>{m.value}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5">{m.label}</p>
                              </div>
                            ))}
                          </div>
                          {food.tags?.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {food.tags.slice(0, 3).map((tag) => (
                                <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>

              {/* Meal sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {["breakfast", "lunch", "dinner", "snack"].map((meal, i) => (
                  <FadeIn key={meal} delay={0.15 + i * 0.05}>
                    <MealSection
                      mealType={meal}
                      logs={logsByMeal[meal]}
                      logDate={selectedDate}
                      onRefresh={() => { loadSummary(); loadWeekly(); }}
                    />
                  </FadeIn>
                ))}
              </div>

              {/* Fiber info */}
              {(totals?.fiber_g || 0) > 0 && (
                <FadeIn delay={0.3}>
                  <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 px-5 py-3">
                    <Leaf className="h-4 w-4 text-emerald-500 shrink-0" />
                    <p className="text-sm text-muted-foreground">
                      Fiber today: <span className="font-semibold text-foreground">{Math.round(totals.fiber_g * 10) / 10}g</span>
                      <span className="text-xs ml-1">(recommended: 25–38g/day)</span>
                    </p>
                  </div>
                </FadeIn>
              )}

              {/* Weekly Chart */}
              {weeklySummary && (
                <FadeIn delay={0.35}>
                  <WeeklyChart
                    days={weeklySummary.days}
                    targetCalories={profile?.target_calories}
                  />
                </FadeIn>
              )}

              {/* Weekly averages */}
              {weeklySummary && (
                <FadeIn delay={0.4}>
                  <div className="rounded-2xl border border-border bg-card p-5">
                    <h3 className="font-bold text-foreground mb-4 text-sm">7-Day Averages</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Avg Calories", value: `${Math.round(weeklySummary.avg_calories ?? 0)} kcal`, color: "text-indigo-500" },
                        { label: "Avg Protein", value: `${Math.round(weeklySummary.avg_protein_g ?? 0)}g`, color: "text-emerald-500" },
                        { label: "Avg Carbs", value: `${Math.round(weeklySummary.avg_carbs_g ?? 0)}g`, color: "text-amber-500" },
                        { label: "Avg Fat", value: `${Math.round(weeklySummary.avg_fat_g ?? 0)}g`, color: "text-rose-500" },
                      ].map((item) => (
                        <div key={item.label} className="text-center">
                          <p className={`text-xl font-bold ${item.color}`}>{item.value}</p>
                          <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>
              )}
          </>
        </div>
      </main>
    </div>
  );
};

export default Nutrition;
