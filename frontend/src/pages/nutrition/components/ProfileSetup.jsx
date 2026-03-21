import React, { useEffect, useState } from "react";
import { nutritionService } from "@/services/nutritionService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FadeIn } from "@/components/common/FadeIn";
import {
  ChevronRight, ChevronLeft, ChevronDown, Flame, Target,
  Activity, User, CheckCircle2, Heart, Utensils,
} from "lucide-react";

const ACTIVITY_OPTIONS = [
  { value: "sedentary", label: "Sedentary", desc: "Desk job, little or no exercise" },
  { value: "lightly_active", label: "Lightly Active", desc: "Light exercise 1–3 days/week" },
  { value: "moderately_active", label: "Moderately Active", desc: "Moderate exercise 3–5 days/week" },
  { value: "very_active", label: "Very Active", desc: "Hard exercise 6–7 days/week" },
  { value: "extra_active", label: "Extra Active", desc: "Physical job or 2× training/day" },
];

const GOAL_OPTIONS = [
  { value: "weight_loss", label: "Lose Weight", desc: "Calorie deficit, high protein", icon: "🔥", color: "border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-500/5" },
  { value: "maintain", label: "Maintain Weight", desc: "Balanced macros, steady energy", icon: "⚖️", color: "border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-500/5" },
  { value: "muscle_gain", label: "Build Muscle", desc: "Calorie surplus, extra protein", icon: "💪", color: "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-500/5" },
];

const HEALTH_CONDITIONS = [
  { value: "diabetes", label: "Diabetes / High Blood Sugar", icon: "🩸", desc: "Steady cardio and lower-impact progression" },
  { value: "hypertension", label: "High Blood Pressure", icon: "❤️", desc: "Moderate intensity and controlled breathing" },
  { value: "high_cholesterol", label: "High Cholesterol", icon: "🫀", desc: "More heart-healthy cardio volume" },
  { value: "hypothyroidism", label: "Hypothyroidism", icon: "🦋", desc: "Consistency-first plan with recovery in mind" },
  { value: "pcos", label: "PCOS", icon: "🌸", desc: "Blend strength and steady cardio" },
  { value: "heart_disease", label: "Heart Disease", icon: "💓", desc: "Low-impact, conservative workload" },
];

const steps = ["Personal Info", "Activity Level", "Your Goal", "Health Conditions", "Food Preferences"];

const SelectField = ({ value, onChange, children }) => (
  <div className="relative">
    <select
      value={value}
      onChange={onChange}
      className="flex h-10 w-full appearance-none rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
    >
      {children}
    </select>
    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
  </div>
);

export const ProfileSetup = ({ onComplete, initialProfile = null, mode = "create" }) => {
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
    health_conditions: [],
    diet_type: "veg",
    likes: "",
    dislikes: "",
    allergies: "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!initialProfile) return;
    setForm({
      age: initialProfile.age?.toString() || "",
      gender: initialProfile.gender || "male",
      weight_kg: initialProfile.weight_kg?.toString() || "",
      height_cm: initialProfile.height_cm?.toString() || "",
      activity_level: initialProfile.activity_level || "moderately_active",
      goal: initialProfile.goal || "maintain",
      health_conditions: initialProfile.health_conditions
        ? initialProfile.health_conditions.split(",").filter(Boolean)
        : [],
      diet_type: initialProfile.diet_type || "veg",
      likes: Array.isArray(initialProfile.likes) ? initialProfile.likes.join(", ") : "",
      dislikes: Array.isArray(initialProfile.dislikes) ? initialProfile.dislikes.join(", ") : "",
      allergies: Array.isArray(initialProfile.allergies) ? initialProfile.allergies.join(", ") : "",
    });
  }, [initialProfile]);

  const toggleCondition = (value) => {
    setForm((f) => ({
      ...f,
      health_conditions: f.health_conditions.includes(value)
        ? f.health_conditions.filter((c) => c !== value)
        : [...f.health_conditions, value],
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    try {
      const payload = {
        ...form,
        age: parseInt(form.age, 10),
        weight_kg: parseFloat(form.weight_kg),
        height_cm: parseFloat(form.height_cm),
        likes: form.likes ? form.likes.split(",").map((x) => x.trim()).filter(Boolean) : [],
        dislikes: form.dislikes ? form.dislikes.split(",").map((x) => x.trim()).filter(Boolean) : [],
        allergies: form.allergies ? form.allergies.split(",").map((x) => x.trim()).filter(Boolean) : [],
      };
      const res = mode === "edit"
        ? await nutritionService.updateProfile(payload)
        : await nutritionService.createProfile(payload);
      setResult(res.data);
    } catch (e) {
      setError(e?.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (result) {
    return (
      <FadeIn className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-5">
          <CheckCircle2 className="h-7 w-7 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">
          {mode === "edit" ? "Profile updated!" : "You're all set!"}
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm leading-relaxed">
          Your daily targets were calculated using the Mifflin-St Jeor formula
          {form.health_conditions.length > 0 ? ", with adjustments for your health conditions." : "."}
        </p>

        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mb-6">
          {[
            { label: "Calories", value: Math.round(result.target_calories), unit: "kcal", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-500/10" },
            { label: "Protein",  value: Math.round(result.target_protein_g), unit: "g",    color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
            { label: "Carbs",    value: Math.round(result.target_carbs_g),   unit: "g",    color: "text-amber-600 dark:text-amber-400",   bg: "bg-amber-50 dark:bg-amber-500/10" },
            { label: "Fat",      value: Math.round(result.target_fat_g),     unit: "g",    color: "text-rose-600 dark:text-rose-400",     bg: "bg-rose-50 dark:bg-rose-500/10" },
          ].map((item) => (
            <div key={item.label} className={`rounded-2xl border border-border ${item.bg} p-4 text-left`}>
              <p className="text-xs text-muted-foreground mb-1.5">{item.label}</p>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${item.color}`}>{item.value}</span>
                <span className="text-xs text-muted-foreground">{item.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-muted-foreground mb-6">TDEE: {Math.round(result.tdee)} kcal/day</p>
        <Button onClick={onComplete} size="lg" className="rounded-full px-10">
          Start Tracking
        </Button>
      </FadeIn>
    );
  }

  // ── Step form ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 py-8">
      {/* Progress bar */}
      <div className="w-full max-w-xl mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-muted-foreground font-medium">
            Step {step + 1} of {steps.length}
          </span>
          <span className="text-xs font-semibold text-foreground">{steps[step]}</span>
        </div>
        <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-foreground rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>

      <FadeIn key={step} className="w-full max-w-xl">

        {/* ── Step 0: Personal Info ─────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <div className="text-center mb-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted mb-4">
                <User className="h-5 w-5 text-muted-foreground" />
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
                <SelectField value={form.gender} onChange={(e) => set("gender", e.target.value)}>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </SelectField>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>
                  Weight{" "}
                  <span className="text-muted-foreground font-normal">(kg)</span>
                </Label>
                <Input type="number" placeholder="70" value={form.weight_kg} onChange={(e) => set("weight_kg", e.target.value)} min="20" max="300" />
              </div>
              <div className="space-y-2">
                <Label>
                  Height{" "}
                  <span className="text-muted-foreground font-normal">(cm)</span>
                </Label>
                <Input type="number" placeholder="175" value={form.height_cm} onChange={(e) => set("height_cm", e.target.value)} min="100" max="250" />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: Activity Level ────────────────────────── */}
        {step === 1 && (
          <div className="space-y-3">
            <div className="text-center mb-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted mb-4">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">How active are you?</h2>
              <p className="text-sm text-muted-foreground mt-1">Be honest — this directly affects your calorie targets</p>
            </div>
            {ACTIVITY_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("activity_level", opt.value)}
                className={`w-full text-left rounded-xl border px-4 py-3.5 transition-all flex items-center justify-between gap-3 ${
                  form.activity_level === opt.value
                    ? "border-foreground bg-muted"
                    : "border-border hover:border-foreground/30 hover:bg-muted/40"
                }`}
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm text-foreground">{opt.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{opt.desc}</p>
                </div>
                <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  form.activity_level === opt.value ? "border-foreground" : "border-muted-foreground/30"
                }`}>
                  {form.activity_level === opt.value && (
                    <div className="h-2 w-2 rounded-full bg-foreground" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 2: Goal ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="text-center mb-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted mb-4">
                <Target className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">What's your goal?</h2>
              <p className="text-sm text-muted-foreground mt-1">We'll adjust your macro targets accordingly</p>
            </div>
            {GOAL_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => set("goal", opt.value)}
                className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                  form.goal === opt.value
                    ? `${opt.color} border-opacity-100`
                    : "border-border hover:border-foreground/20"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-foreground">{opt.label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                  {form.goal === opt.value && (
                    <CheckCircle2 className="h-5 w-5 text-foreground shrink-0" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* ── Step 3: Health Conditions ─────────────────────── */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="text-center mb-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted mb-4">
                <Heart className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Any health conditions?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Select all that apply — we'll personalize nutrition and workouts.
              </p>
            </div>

            {HEALTH_CONDITIONS.map((cond) => {
              const selected = form.health_conditions.includes(cond.value);
              return (
                <button
                  key={cond.value}
                  onClick={() => toggleCondition(cond.value)}
                  className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                    selected
                      ? "border-indigo-400 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-500/10"
                      : "border-border hover:border-foreground/20 hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl shrink-0">{cond.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-foreground">{cond.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{cond.desc}</p>
                    </div>
                    {selected && <CheckCircle2 className="h-5 w-5 text-indigo-500 shrink-0" />}
                  </div>
                </button>
              );
            })}

            <p className="text-xs text-muted-foreground text-center pt-1">
              No conditions? Leave all unselected and continue.
            </p>
          </div>
        )}

        {/* ── Step 4: Food Preferences ──────────────────────── */}
        {step === 4 && (
          <div className="space-y-5">
            <div className="text-center mb-8">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-muted mb-4">
                <Utensils className="h-5 w-5 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold text-foreground">Food preferences</h2>
              <p className="text-sm text-muted-foreground mt-1">
                These help us personalize your meal recommendations
              </p>
            </div>

            <div className="space-y-2">
              <Label>Diet Type</Label>
              <SelectField value={form.diet_type} onChange={(e) => set("diet_type", e.target.value)}>
                <option value="veg">Vegetarian</option>
                <option value="vegan">Vegan</option>
                <option value="non_veg">Non-Vegetarian</option>
                <option value="keto">Keto</option>
              </SelectField>
            </div>

            {[
              { key: "likes",     label: "Foods you like",    placeholder: "paneer, rice, chicken" },
              { key: "dislikes",  label: "Foods you dislike", placeholder: "broccoli, mushroom" },
              { key: "allergies", label: "Allergies",         placeholder: "nuts, dairy, egg" },
            ].map((field) => (
              <div key={field.key} className="space-y-2">
                <Label>{field.label}</Label>
                <Input
                  type="text"
                  placeholder={field.placeholder}
                  value={form[field.key]}
                  onChange={(e) => set(field.key, e.target.value)}
                />
                <p className="text-xs text-muted-foreground">Separate with commas</p>
              </div>
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
              disabled={step === 0 && (!form.age || !form.weight_kg || !form.height_cm)}
            >
              Continue <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} className="flex-1 gap-2" disabled={loading}>
              {loading
                ? (mode === "edit" ? "Saving..." : "Calculating...")
                : (mode === "edit" ? "Save Changes" : "Calculate My Plan")}
              {!loading && <Flame className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </FadeIn>
    </div>
  );
};
