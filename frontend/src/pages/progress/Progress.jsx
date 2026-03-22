import React, { useState, useEffect } from "react";
import { progressService } from "@/services/progressService";
import { workoutService } from "@/services/workoutService";
import { FadeIn } from "@/components/common/FadeIn";
import { Loader2, TrendingUp, Award, Scale, BarChart2, Plus } from "lucide-react";
import { BadgeGrid } from "./components/BadgeGrid";
import { MeasurementChart } from "./components/MeasurementChart";
import { AddMeasurementModal } from "./components/AddMeasurementModal";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const Progress = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState(null);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [badges, setBadges] = useState([]);
  const [badgeDefs, setBadgeDefs] = useState({});
  const [measurements, setMeasurements] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMeasureModal, setShowMeasureModal] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, workoutStatsRes, badgesRes, defsRes, measureRes, reportRes] = await Promise.all([
        progressService.getStats(),
        workoutService.getStats(),
        progressService.getBadges(),
        progressService.getBadgeDefinitions(),
        progressService.getMeasurements(),
        progressService.getWeeklyReport(),
      ]);
      setStats(statsRes.data);
      setWorkoutStats(workoutStatsRes.data);
      setBadges(badgesRes.data);
      setBadgeDefs(defsRes.data);
      setMeasurements(measureRes.data);
      setReport(reportRes.data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load progress" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleDeleteMeasurement = async (id) => {
    try {
      await progressService.deleteMeasurement(id);
      setMeasurements((prev) => prev.filter((m) => m.id !== id));
      toast({ title: "Measurement deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete" });
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Workouts", value: workoutStats?.totalWorkouts ?? stats?.total_workouts ?? 0, icon: TrendingUp, color: "text-indigo-500", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
    { label: "Current Streak", value: `${workoutStats?.streak ?? stats?.current_workout_streak ?? 0}d`, icon: BarChart2, color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-500/10" },
    { label: "Best Streak", value: `${stats?.longest_workout_streak ?? 0}d`, icon: Award, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
    { label: "Meals Logged", value: stats?.total_meals_logged ?? 0, icon: Scale, color: "text-rose-500", bg: "bg-rose-50 dark:bg-rose-500/10" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Progress</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Track your fitness journey, badges, and body measurements.
            </p>
          </div>
        </FadeIn>

        {/* Stats */}
        <FadeIn delay={0.05}>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            {statCards.map((s) => (
              <div key={s.label} className="rounded-2xl border border-border bg-card p-4">
                <div className={`h-8 w-8 rounded-lg ${s.bg} flex items-center justify-center mb-3`}>
                  <s.icon className={`h-4 w-4 ${s.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* Weekly report */}
        {report && (
          <FadeIn delay={0.1}>
            <div className="rounded-2xl border border-border bg-card p-5 mb-8">
              <p className="text-sm font-semibold text-foreground mb-1">Weekly Report</p>
              <p className="text-xs text-muted-foreground mb-4">
                {report.week_start} → {report.week_end}
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground text-xs">Workouts total</span>
                  <p className="font-semibold text-foreground">{workoutStats?.totalWorkouts ?? report.total_workouts}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Active streak</span>
                  <p className="font-semibold text-foreground">{workoutStats?.streak ?? report.current_streak} days</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Meals logged</span>
                  <p className="font-semibold text-foreground">{report.total_meals_logged}</p>
                </div>
                <div>
                  <span className="text-muted-foreground text-xs">Badges earned</span>
                  <p className="font-semibold text-foreground">{report.badges_count}</p>
                </div>
                {report.latest_measurement?.weight_kg && (
                  <div>
                    <span className="text-muted-foreground text-xs">Latest weight</span>
                    <p className="font-semibold text-foreground">{report.latest_measurement.weight_kg} kg</p>
                  </div>
                )}
                {report.latest_measurement?.body_fat_pct && (
                  <div>
                    <span className="text-muted-foreground text-xs">Body fat</span>
                    <p className="font-semibold text-foreground">{report.latest_measurement.body_fat_pct}%</p>
                  </div>
                )}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Badges */}
        <FadeIn delay={0.15}>
          <div className="rounded-2xl border border-border bg-card p-5 mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-4 w-4 text-muted-foreground" />
              <p className="text-sm font-semibold text-foreground">Badges</p>
              <span className="ml-auto text-xs text-muted-foreground">
                {badges.length} / {Object.keys(badgeDefs).length} earned
              </span>
            </div>
            <BadgeGrid badges={badges} definitions={badgeDefs} />
          </div>
        </FadeIn>

        {/* Body measurements */}
        <FadeIn delay={0.2}>
          <div className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Scale className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold text-foreground">Body Measurements</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 gap-1.5 text-xs"
                onClick={() => setShowMeasureModal(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Add
              </Button>
            </div>

            {measurements.length > 0 ? (
              <>
                <MeasurementChart measurements={measurements} />
                <div className="mt-4 space-y-2 max-h-60 overflow-y-auto">
                  {measurements.slice(0, 10).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between text-xs text-muted-foreground border-b border-border pb-2"
                    >
                      <span>{m.date}</span>
                      <div className="flex gap-4">
                        {m.weight_kg && <span>{m.weight_kg} kg</span>}
                        {m.body_fat_pct && <span>{m.body_fat_pct}% fat</span>}
                        {m.waist_cm && <span>{m.waist_cm}cm waist</span>}
                      </div>
                      <button
                        onClick={() => handleDeleteMeasurement(m.id)}
                        className="text-muted-foreground hover:text-destructive transition-colors ml-2"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 rounded-xl border border-dashed border-border">
                <p className="text-sm text-muted-foreground">No measurements yet.</p>
                <button
                  onClick={() => setShowMeasureModal(true)}
                  className="text-sm font-semibold text-foreground hover:underline"
                >
                  Add first measurement
                </button>
              </div>
            )}
          </div>
        </FadeIn>
      </main>

      <AddMeasurementModal
        open={showMeasureModal}
        onClose={() => setShowMeasureModal(false)}
        onAdded={(m) => {
          setMeasurements((prev) => [m, ...prev]);
          setShowMeasureModal(false);
          toast({ title: "Measurement saved!" });
        }}
      />
    </div>
  );
};

export default Progress;
