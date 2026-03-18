import React, { useState } from "react";
import { nutritionService } from "@/services/nutritionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/common/FadeIn";
import {
  ChevronRight, ChevronLeft, Flame, Target,
  Activity, User, CheckCircle2, Scale,
} from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", desc: "Desk job, little or no exercise" },
  { value: "lightly_active", label: "Lightly Active", desc: "Light exercise 1–3 days/week" },
  { value: "moderately_active", label: "Moderately Active", desc: "Moderate exercise 3–5 days/week" },
  { value: "very_active", label: "Very Active", desc: "Hard exercise 6–7 days/week" },
  { value: "extra_active", label: "Extra Active", desc: "Physical job or 2x training/day" },
];

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Lose Weight", desc: "Calorie deficit, high protein", icon: "🔥", color: "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-500/5" },
  { value: "maintain", label: "Maintain Weight", desc: "Balanced macros, steady energy", icon: "⚖️", color: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-500/5" },
  { value: "muscle_gain", label: "Build Muscle", desc: "Calorie surplus, extra protein", icon: "💪", color: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/5" },
];

const steps = ["Personal Info", "Activity Level", "Your Goal"];

export const ProfileSetup = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const [form, setForm] = useState({
    age: "",
    gender: "male",
    weight_kg: "",
    height_cm: "",
    activity_level: "moderately_active",
    goal: "maintain",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await nutritionService.createProfile({
        ...form,
        age: parseInt(form.age),
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
      });
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <FadeIn className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50 mb-2">You're all set!</h2>
        <p className="text-zinc-500 mb-8 max-w-sm">
          Your daily targets have been calculated using the Mifflin-St Jeor formula.
        </p>

        <div className="grid grid-cols-2 gap-4 w-full max-w-sm mb-8">
          {[
            { label: "Daily Calories", value: `${Math.round(result.target_calories)} kcal`, color: "text-indigo-600 dark:text-indigo-400" },
            { label: "Protein", value: `${Math.round(result.target_protein_g)}g`, color: "text-emerald-600 dark:text-emerald-400" },
            { label: "Carbs", value: `${Math.round(result.target_carbs_g)}g`, color: "text-amber-600 dark:text-amber-400" },
            { label: "Fat", value: `${Math.round(result.target_fat_g)}g`, color: "text-rose-600 dark:text-rose-400" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl border border-border bg-card p-4 text-left">
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <p className="text-sm text-zinc-400 mb-6">
          TDEE: {Math.round(result.tdee)} kcal/day
        </p>
        <Button onClick={onComplete} size="lg" className="rounded-full px-10">
          Start Tracking
        </Button>
      </FadeIn>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-10">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex items-center gap-2">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? "bg-foreground text-background" :
                i === step ? "bg-foreground text-background ring-2 ring-offset-2 ring-foreground ring-offset-background" :
                "bg-muted text-muted-foreground"
              }`}>
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden sm:inline text-sm font-medium ${i === step ? "text-foreground" : "text-muted-foreground"}`}>
                {s}
              </span>
            </div>
            {i < steps.length - 1 && <div className="w-8 h-px bg-border" />}
          </React.Fragment>
        ))}
      </div>

      <FadeIn key={step} className="w-full max-w-md">
        {/* Step 0: Personal Info */}
        {step === 0 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <User className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Tell us about yourself</h2>
              <p className="text-sm text-muted-foreground mt-1">We'll use this to calculate your daily targets</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" placeholder="25" value={form.age} onChange={(e) => set("age", e.target.value)} min="10" max="100" />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <select
                  value={form.gender}
                  onChange={(e) => set("gender", e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Weight (kg)</Label>
                <Input type="number" placeholder="70" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} min="20" max="300" />
              </div>
              <div className="space-y-2">
                <Label>Height (cm)</Label>
                <Input type="number" placeholder="175" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} min="100" max="250" />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Activity Level */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Activity className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">How active are you?</h2>
              <p className="text-sm text-muted-foreground mt-1">Be honest — this affects your calorie needs</p>
            </div>
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("activity_level", opt.value)}
                className={`w-full text-left rounded-xl border p-4 transition-all ${
                  form.activity_level === opt.value
                    ? "border-foreground bg-muted"
                    : "border-border hover:border-foreground/30 hover:bg-muted/50"
                }`}
              >
                <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 2: Goal */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
                <Target className="h-6 w-6 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">What's your goal?</h2>
              <p className="text-sm text-muted-foreground mt-1">We'll adjust your macro targets accordingly</p>
            </div>
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("goal", opt.value)}
                className={`w-full text-left rounded-xl border-2 p-5 transition-all ${
                  form.goal === opt.value
                    ? `${opt.color} border-opacity-100`
                    : "border-border hover:border-foreground/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div>
                    <p className="font-bold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  {form.goal === opt.value && (
                    <CheckCircle2 className="h-5 w-5 text-foreground ml-auto" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {error && <p className="text-sm text-rose-500 text-center mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="flex-1 gap-2">
              <ChevronLeft className="h-4 w-4" /> Back
            </Button>
          )}
          {step < steps.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              className="flex-1 gap-2"
              disabled={
                step === 0 && (!form.age || !form.weight_kg || !form.height_cm)
              }
            >
              Next <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={loading}>
              {loading ? "Calculating..." : "Calculate My Plan"}
              {!loading && <Flame className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </FadeIn>
    </div>
  );
};
