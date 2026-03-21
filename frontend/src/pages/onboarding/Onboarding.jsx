import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "@/context/AuthContext";
import { authService } from "@/services/authService";
import { api } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ChevronRight, ChevronLeft, Dumbbell, Salad } from "lucide-react";

const TOTAL_STEPS = 5;

const GOALS = [
  { value: "weight_loss", label: "Lose Fat", icon: "🔥", desc: "Burn calories and shed body fat" },
  { value: "muscle_gain", label: "Build Muscle", icon: "💪", desc: "Gain lean mass and strength" },
  { value: "maintain",    label: "General Health", icon: "❤️", desc: "Stay active and feel great" },
];

const ACTIVITY_LEVELS = [
  { value: "sedentary",         label: "Sedentary",           desc: "Little or no exercise" },
  { value: "lightly_active",    label: "Lightly Active",      desc: "Light exercise 1–3 days/week" },
  { value: "moderately_active", label: "Moderately Active",   desc: "Moderate exercise 3–5 days/week" },
  { value: "very_active",       label: "Very Active",         desc: "Hard exercise 6–7 days/week" },
  { value: "extra_active",      label: "Extra Active",        desc: "Very hard exercise + physical job" },
];

const HEALTH_CONDITIONS = [
  { value: "diabetes",          label: "Diabetes" },
  { value: "hypertension",      label: "Hypertension" },
  { value: "high_cholesterol",  label: "High Cholesterol" },
  { value: "hypothyroidism",    label: "Hypothyroidism" },
  { value: "pcos",              label: "PCOS" },
  { value: "heart_disease",     label: "Heart Disease" },
];

const DIET_TYPES = [
  { value: "veg",     label: "Vegetarian",    icon: "🥦" },
  { value: "vegan",   label: "Vegan",         icon: "🌱" },
  { value: "non_veg", label: "Non-Vegetarian", icon: "🍗" },
  { value: "keto",    label: "Keto",          icon: "🥑" },
];

const ProgressBar = ({ step }) => (
  <div className="mb-8">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs font-medium text-muted-foreground">
        Step {step} of {TOTAL_STEPS}
      </span>
      <span className="text-xs font-medium text-muted-foreground">
        {Math.round((step / TOTAL_STEPS) * 100)}%
      </span>
    </div>
    <div className="h-1 rounded-full bg-muted overflow-hidden">
      <div
        className="h-full rounded-full bg-foreground transition-all duration-500 ease-out"
        style={{ width: `${(step / TOTAL_STEPS) * 100}%` }}
      />
    </div>
  </div>
);

const SelectCard = ({ selected, onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
      selected
        ? "border-foreground bg-foreground text-background"
        : "border-border bg-background hover:border-foreground/30 hover:bg-muted/40"
    }`}
  >
    {children}
  </button>
);

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setOnboardingCompleted } = useContext(AuthContext);

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [quickWinData, setQuickWinData] = useState(null);

  // Form state across all steps
  const [form, setForm] = useState({
    // Step 1 — profile
    name: "",
    age: "",
    gender: "",
    weight_kg: "",
    height_cm: "",
    // Step 2 — goal + activity
    goal: "",
    activity_level: "",
    // Step 3 — health conditions
    health_conditions: [],
    // Step 4 — diet
    diet_type: "",
  });

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const toggleCondition = (val) => {
    setForm((prev) => ({
      ...prev,
      health_conditions: prev.health_conditions.includes(val)
        ? prev.health_conditions.filter((c) => c !== val)
        : [...prev.health_conditions, val],
    }));
  };

  // Step-level validation
  const canAdvance = () => {
    if (step === 1) return form.age && form.gender && form.weight_kg && form.height_cm;
    if (step === 2) return form.goal && form.activity_level;
    if (step === 3) return true; // health conditions optional
    if (step === 4) return !!form.diet_type;
    return false;
  };

  const saveStep = async (stepNum, completed = false) => {
    try {
      await authService.updateOnboarding({ step: stepNum, completed });
    } catch {
      // Non-fatal — don't block the wizard
    }
  };

  const handleNext = async () => {
    if (step < TOTAL_STEPS - 1) {
      await saveStep(step);
      setStep((s) => s + 1);
    } else if (step === TOTAL_STEPS - 1) {
      // Step 4 → Step 5: generate the quick win
      setSubmitting(true);
      await saveStep(step);
      try {
        // Create nutrition profile + fetch recommendations in parallel
        const profilePayload = {
          age: Number(form.age),
          gender: form.gender,
          weight_kg: Number(form.weight_kg),
          height_cm: Number(form.height_cm),
          activity_level: form.activity_level,
          goal: form.goal,
          health_conditions: form.health_conditions,
          diet_type: form.diet_type,
        };

        const [workoutRes, nutritionRes] = await Promise.allSettled([
          api.post("/workouts/plan", {
            goal: form.goal,
            activity_level: form.activity_level,
            health_conditions: form.health_conditions,
          }),
          api.post("/nutrition/profile", profilePayload).catch(() =>
            api.put("/nutrition/profile", profilePayload)
          ).then(() =>
            api.get("/nutrition/recommendations")
          ),
        ]);

        setQuickWinData({
          workout: workoutRes.status === "fulfilled" ? workoutRes.value.data : null,
          nutrition: nutritionRes.status === "fulfilled" ? nutritionRes.value.data : null,
        });

        // Mark onboarding complete
        await saveStep(TOTAL_STEPS, true);
        setOnboardingCompleted(true);
        setStep(TOTAL_STEPS);
      } catch (err) {
        toast({
          variant: "destructive",
          title: "Something went wrong",
          description: "We couldn't generate your plan. You can set it up from the dashboard.",
        });
        await saveStep(TOTAL_STEPS, true);
        setOnboardingCompleted(true);
        navigate("/dashboard", { replace: true });
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  // ── Step renders ──────────────────────────────────────────────────────────

  const renderStep1 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your basic profile</h2>
        <p className="mt-1 text-sm text-muted-foreground">We use this to personalise your plan.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <Label>Age</Label>
          <Input
            type="number"
            min={10} max={100}
            placeholder="e.g. 25"
            value={form.age}
            onChange={(e) => update("age", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Weight (kg)</Label>
          <Input
            type="number"
            min={20} max={300}
            placeholder="e.g. 70"
            value={form.weight_kg}
            onChange={(e) => update("weight_kg", e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <Label>Height (cm)</Label>
          <Input
            type="number"
            min={100} max={250}
            placeholder="e.g. 170"
            value={form.height_cm}
            onChange={(e) => update("height_cm", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Gender</Label>
        <div className="grid grid-cols-2 gap-3">
          {["male", "female"].map((g) => (
            <SelectCard key={g} selected={form.gender === g} onClick={() => update("gender", g)}>
              <span className="font-medium capitalize">{g}</span>
            </SelectCard>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Your primary goal</h2>
        <p className="mt-1 text-sm text-muted-foreground">What do you want to achieve?</p>
      </div>

      <div className="space-y-3">
        {GOALS.map((g) => (
          <SelectCard key={g.value} selected={form.goal === g.value} onClick={() => update("goal", g.value)}>
            <div className="flex items-center gap-3">
              <span className="text-2xl">{g.icon}</span>
              <div>
                <p className="font-semibold">{g.label}</p>
                <p className={`text-xs ${form.goal === g.value ? "text-background/60" : "text-muted-foreground"}`}>{g.desc}</p>
              </div>
            </div>
          </SelectCard>
        ))}
      </div>

      <div className="space-y-3">
        <Label className="text-base font-semibold">Activity level</Label>
        <div className="space-y-2">
          {ACTIVITY_LEVELS.map((a) => (
            <SelectCard key={a.value} selected={form.activity_level === a.value} onClick={() => update("activity_level", a.value)}>
              <p className="font-medium">{a.label}</p>
              <p className={`text-xs ${form.activity_level === a.value ? "text-background/60" : "text-muted-foreground"}`}>{a.desc}</p>
            </SelectCard>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Any health conditions?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Select all that apply — we'll adjust your plan accordingly. Skip if none.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {HEALTH_CONDITIONS.map((c) => {
          const active = form.health_conditions.includes(c.value);
          return (
            <button
              key={c.value}
              type="button"
              onClick={() => toggleCondition(c.value)}
              className={`rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                active
                  ? "border-foreground bg-foreground text-background"
                  : "border-border bg-background text-foreground hover:border-foreground/30 hover:bg-muted/40"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Diet preference</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll recommend foods that fit your diet.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {DIET_TYPES.map((d) => (
          <SelectCard key={d.value} selected={form.diet_type === d.value} onClick={() => update("diet_type", d.value)}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{d.icon}</span>
              <span className="font-medium">{d.label}</span>
            </div>
          </SelectCard>
        ))}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle2 className="mx-auto mb-3 h-12 w-12 text-green-500" />
        <h2 className="text-2xl font-bold text-foreground">Your plan is ready! 🎉</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's a personalised first-week plan just for you.
        </p>
      </div>

      {quickWinData?.workout && (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Dumbbell className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-foreground">This Week's Workout</h3>
          </div>
          <p className="mb-3 text-xs text-muted-foreground">{quickWinData.workout.summary}</p>
          <div className="space-y-2">
            {quickWinData.workout.weekly_plan?.slice(0, 3).map((day, i) => (
              <div key={i} className="flex items-start justify-between gap-2 text-sm">
                <span className="font-medium text-foreground">{day.day}: {day.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{day.duration}</span>
              </div>
            ))}
            {quickWinData.workout.weekly_plan?.length > 3 && (
              <p className="text-xs text-muted-foreground">+ {quickWinData.workout.weekly_plan.length - 3} more days</p>
            )}
          </div>
        </div>
      )}

      {quickWinData?.nutrition && Array.isArray(quickWinData.nutrition) && quickWinData.nutrition.length > 0 && (
        <div className="rounded-xl border border-border bg-muted/30 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Salad className="h-5 w-5 text-foreground" />
            <h3 className="font-semibold text-foreground">Recommended Foods Today</h3>
          </div>
          <div className="space-y-2">
            {quickWinData.nutrition.slice(0, 4).map((food, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{food.name}</span>
                <span className="text-xs text-muted-foreground">{food.calories_per_100g} kcal/100g</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <Button
        className="w-full h-11"
        onClick={() => navigate("/dashboard", { replace: true })}
      >
        Go to Dashboard
      </Button>
    </div>
  );

  const renderCurrentStep = () => {
    if (step === 1) return renderStep1();
    if (step === 2) return renderStep2();
    if (step === 3) return renderStep3();
    if (step === 4) return renderStep4();
    return renderStep5();
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <span className="text-2xl font-extrabold tracking-tight text-foreground">
            FitnessFreak
          </span>
          <p className="mt-1 text-sm text-muted-foreground">Let's set up your personalised plan</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
          <ProgressBar step={step} />

          {renderCurrentStep()}

          {step < TOTAL_STEPS && (
            <div className="mt-8 flex items-center justify-between">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 1 || submitting}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>

              <Button
                onClick={handleNext}
                disabled={!canAdvance() || submitting}
                className="gap-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Building your plan…
                  </>
                ) : step === TOTAL_STEPS - 1 ? (
                  <>Show my plan <ChevronRight className="h-4 w-4" /></>
                ) : (
                  <>Next <ChevronRight className="h-4 w-4" /></>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
