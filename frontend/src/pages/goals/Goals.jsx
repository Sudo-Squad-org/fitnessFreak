import React, { useState, useEffect } from "react";
import { goalsService } from "@/services/goalsService";
import { FadeIn } from "@/components/common/FadeIn";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Target, TrendingUp } from "lucide-react";
import { CreateGoalModal } from "./components/CreateGoalModal";
import { GoalCard } from "./components/GoalCard";
import { useToast } from "@/hooks/use-toast";

const Goals = () => {
  const { toast } = useToast();
  const [goals, setGoals] = useState([]);
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [activeFilter, setActiveFilter] = useState("active");

  const fetchData = async () => {
    try {
      const [goalsRes, summaryRes] = await Promise.all([
        goalsService.listGoals(activeFilter),
        goalsService.weeklySummary(),
      ]);
      setGoals(goalsRes.data);
      setSummary(summaryRes.data);
    } catch {
      toast({ variant: "destructive", title: "Failed to load goals" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [activeFilter]);

  const handleDelete = async (id) => {
    try {
      await goalsService.deleteGoal(id);
      setGoals((prev) => prev.filter((g) => g.id !== id));
      setSummary((prev) => prev.filter((s) => s.goal_id !== id));
      toast({ title: "Goal deleted" });
    } catch {
      toast({ variant: "destructive", title: "Failed to delete goal" });
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      const res = await goalsService.updateGoal(id, { status });
      setGoals((prev) => prev.map((g) => (g.id === id ? res.data : g)));
      toast({ title: `Goal ${status}` });
    } catch {
      toast({ variant: "destructive", title: "Failed to update goal" });
    }
  };

  const summaryMap = Object.fromEntries(summary.map((s) => [s.goal_id, s]));

  const FILTERS = ["active", "paused", "completed"];

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <FadeIn>
          <div className="flex items-start justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Goals</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Set flexible weekly or daily targets and track your consistency.
              </p>
            </div>
            <Button onClick={() => setShowModal(true)} className="gap-2 rounded-full">
              <Plus className="h-4 w-4" />
              New Goal
            </Button>
          </div>
        </FadeIn>

        {/* Weekly summary strip */}
        {summary.length > 0 && (
          <FadeIn delay={0.05}>
            <div className="mb-8 rounded-2xl border border-border bg-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">This week</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {summary.map((s) => (
                  <div key={s.goal_id} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="capitalize">{s.type.replace("_", " ")}</span>
                      <span className={s.on_track ? "text-emerald-500" : "text-amber-500"}>
                        {s.pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${s.on_track ? "bg-emerald-500" : "bg-amber-500"}`}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {s.current} / {s.max_target}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        )}

        {/* Filter tabs */}
        <FadeIn delay={0.1}>
          <div className="flex gap-2 mb-6">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors capitalize ${
                  activeFilter === f
                    ? "bg-foreground text-background"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </FadeIn>

        {/* Goal cards */}
        {goals.length === 0 ? (
          <FadeIn delay={0.15}>
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border py-16">
              <Target className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No {activeFilter} goals yet.{" "}
                {activeFilter === "active" && (
                  <button onClick={() => setShowModal(true)} className="font-semibold text-foreground hover:underline">
                    Create one
                  </button>
                )}
              </p>
            </div>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {goals.map((goal, i) => (
              <FadeIn key={goal.id} delay={0.1 + i * 0.04}>
                <GoalCard
                  goal={goal}
                  summary={summaryMap[goal.id]}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                  onLogAdded={fetchData}
                />
              </FadeIn>
            ))}
          </div>
        )}
      </main>

      <CreateGoalModal
        open={showModal}
        onClose={() => setShowModal(false)}
        onCreated={(newGoal) => {
          setGoals((prev) => [newGoal, ...prev]);
          setShowModal(false);
          toast({ title: "Goal created!" });
          fetchData();
        }}
      />
    </div>
  );
};

export default Goals;
