import React from "react";
import { FadeIn } from "@/components/common/FadeIn";
import {
  Dumbbell, UtensilsCrossed, CalendarDays, Moon,
  Target, TrendingUp, Heart, Users,
} from "lucide-react";

const features = [
  {
    icon: Dumbbell,
    title: "Personalized Workouts",
    description: "Health-condition-aware plans generated for your body, goals, and fitness level.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
    route: "/workouts",
  },
  {
    icon: UtensilsCrossed,
    title: "Nutrition Tracking",
    description: "TDEE-calculated macros, food logging, and condition-aware meal recommendations.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    route: "/nutrition",
  },
  {
    icon: CalendarDays,
    title: "Live Classes",
    description: "Expert-led sessions in 10+ formats — live online, on-demand, or in-person.",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
    route: "/classes",
  },
  {
    icon: Moon,
    title: "Sleep & Recovery",
    description: "Sleep tracking, guided breathing, and a daily readiness score (1–10).",
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-500/10",
    route: "/wellness",
  },
  {
    icon: Target,
    title: "Goals System",
    description: "Flexible weekly goals with min/max ranges — built to flex around real life.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
    route: "/goals",
  },
  {
    icon: TrendingUp,
    title: "Progress & Badges",
    description: "Milestone badges, streaks, body measurements, and weekly report cards.",
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
    route: "/progress",
  },
  {
    icon: Heart,
    title: "Mood & Wellness",
    description: "Daily mood check-ins, mental wellness signals, and trend tracking over time.",
    color: "text-pink-500",
    bg: "bg-pink-50 dark:bg-pink-500/10",
    route: "/wellness",
  },
  {
    icon: Users,
    title: "Community",
    description: "Buddy matching, group challenges, a community feed, and a pro content hub.",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-500/10",
    route: "/community",
  },
];

export const PlatformModules = () => {
  return (
    <section className="border-t border-border bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 mb-3">Platform</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            One OS. Every dimension of your health.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Nine deeply integrated modules — each one built, each one live.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={0.07 * i}>
              <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
                <p className="mt-3 text-xs text-muted-foreground font-mono">→ {feature.route}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
