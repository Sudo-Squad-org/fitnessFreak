import React from "react";
import { FadeIn } from "@/components/common/FadeIn";
import { Layers, Flame, Brain, Users, Watch, CheckCircle2, Clock } from "lucide-react";

const phases = [
  {
    label: "MVP",
    title: "Core Platform",
    icon: Layers,
    iconBg: "bg-indigo-500/20",
    iconColor: "text-indigo-400",
    status: "done",
    statusLabel: "Shipped",
    chipStyle: "bg-indigo-500/15 text-indigo-400 border border-indigo-500/20",
    features: [
      "Auth & JWT roles",
      "Live class booking",
      "Condition-aware workouts",
      "Nutrition & TDEE tracking",
    ],
  },
  {
    label: "Phase 1",
    title: "Retention Foundation",
    icon: Flame,
    iconBg: "bg-emerald-500/20",
    iconColor: "text-emerald-400",
    status: "done",
    statusLabel: "Shipped",
    chipStyle: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20",
    features: [
      "Interactive onboarding",
      "Flexible weekly goals",
      "Badges & streaks",
      "Smart notifications",
    ],
  },
  {
    label: "Phase 2",
    title: "Wellness Intelligence",
    icon: Brain,
    iconBg: "bg-violet-500/20",
    iconColor: "text-violet-400",
    status: "done",
    statusLabel: "Shipped",
    chipStyle: "bg-violet-500/15 text-violet-400 border border-violet-500/20",
    features: [
      "Sleep & recovery tracking",
      "Mood & mental wellness",
      "Readiness scores (1–10)",
      "Integrated health dashboard",
    ],
  },
  {
    label: "Phase 3",
    title: "Community & Growth",
    icon: Users,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-400",
    status: "done",
    statusLabel: "Shipped",
    chipStyle: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
    features: [
      "Buddy matching system",
      "Group challenges",
      "Community feed",
      "Pro content hub",
    ],
  },
  {
    label: "Next",
    title: "Wearable Integration",
    icon: Watch,
    iconBg: "bg-zinc-700/60",
    iconColor: "text-zinc-400",
    status: "upcoming",
    statusLabel: "Coming Soon",
    chipStyle: "bg-zinc-700/40 text-zinc-400 border border-zinc-700",
    features: [
      "Apple Health sync",
      "Fitbit integration",
      "Auto heart rate logging",
      "Activity import",
    ],
  },
];

export const RoadmapSection = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950 dark:bg-zinc-900 py-24 sm:py-32">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-indigo-500/15 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        {/* Header */}
        <FadeIn className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-400 mb-3">Roadmap</p>
          <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Built in public. Shipping fast.
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Every phase represents real shipped features — not promises.
          </p>
        </FadeIn>

        {/* Phase grid */}
        <div className="relative grid grid-cols-1 gap-10 lg:grid-cols-5">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-7 left-[10%] right-[10%] h-px bg-white/10" />

          {phases.map((phase, i) => (
            <FadeIn key={phase.label} delay={0.1 * i}>
              <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left gap-3">
                {/* Icon circle */}
                <div className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-full ${phase.iconBg}`}>
                  <phase.icon className={`h-6 w-6 ${phase.iconColor}`} />
                </div>

                {/* Status chip */}
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full ${phase.chipStyle}`}>
                  {phase.status === "done"
                    ? <CheckCircle2 className="h-3 w-3" />
                    : <Clock className="h-3 w-3" />}
                  {phase.statusLabel}
                </span>

                {/* Phase label */}
                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">{phase.label}</p>

                {/* Title */}
                <h3 className="text-sm font-bold text-white leading-snug">{phase.title}</h3>

                {/* Feature list */}
                <ul className="space-y-1 mt-1">
                  {phase.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-zinc-400 justify-center lg:justify-start">
                      <span className="h-1 w-1 rounded-full bg-zinc-600 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
