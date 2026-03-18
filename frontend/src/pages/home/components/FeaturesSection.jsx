import React from "react";
import { FadeIn } from "@/components/common/FadeIn";
import { Activity, Users, CalendarDays, LineChart, Zap, Shield } from "lucide-react";

const features = [
  {
    icon: Activity,
    title: "Live Classes",
    description: "Join high-energy sessions led by industry experts in real time.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
  },
  {
    icon: Users,
    title: "Expert Trainers",
    description: "Every instructor is verified and brings years of professional experience.",
    color: "text-emerald-500",
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
  },
  {
    icon: CalendarDays,
    title: "Flexible Schedule",
    description: "Book sessions that fit your calendar — mornings, evenings, weekends.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    icon: LineChart,
    title: "Progress Tracking",
    description: "See your streaks, completed classes, and growth from your dashboard.",
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
  },
  {
    icon: Zap,
    title: "Multiple Formats",
    description: "Live online, on-demand recordings, or in-person at your nearest center.",
    color: "text-violet-500",
    bg: "bg-violet-50 dark:bg-violet-500/10",
  },
  {
    icon: Shield,
    title: "Cancel Anytime",
    description: "Booked something you can't attend? Cancel instantly with one tap.",
    color: "text-sky-500",
    bg: "bg-sky-50 dark:bg-sky-500/10",
  },
];

export const FeaturesSection = () => {
  return (
    <section className="border-t border-border bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 mb-3">Platform</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Everything you need to crush your goals
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            One platform built around your fitness life — not the other way around.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, i) => (
            <FadeIn key={feature.title} delay={0.07 * i}>
              <div className="group relative rounded-2xl border border-border bg-card p-6 transition-all hover:shadow-md hover:-translate-y-0.5">
                <div className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-base font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
