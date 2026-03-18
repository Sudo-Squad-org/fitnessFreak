import React from "react";
import { UserPlus, Search, CalendarCheck, PlayCircle } from "lucide-react";
import { FadeIn } from "@/components/common/FadeIn";

const steps = [
  {
    id: "01",
    title: "Create your account",
    description: "Sign up in under 30 seconds. No credit card required to get started.",
    icon: UserPlus,
  },
  {
    id: "02",
    title: "Browse classes",
    description: "Filter by category, difficulty, and format to find your perfect workout.",
    icon: Search,
  },
  {
    id: "03",
    title: "Book your spot",
    description: "Confirm your seat instantly. Get a reminder before it starts.",
    icon: CalendarCheck,
  },
  {
    id: "04",
    title: "Join & train",
    description: "Jump in live, follow along on-demand, or head to your nearest center.",
    icon: PlayCircle,
  },
];

export const HowItWorks = () => {
  return (
    <section className="bg-muted/40 border-y border-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center mb-20">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 mb-3">How it works</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Four steps to your best workout
          </h2>
        </FadeIn>

        <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-4">
          {/* Connecting line (desktop) */}
          <div className="hidden lg:block absolute top-7 left-[calc(12.5%+1.5rem)] right-[calc(12.5%+1.5rem)] h-px bg-border" />

          {steps.map((step, i) => (
            <FadeIn key={step.id} delay={0.12 * i}>
              <div className="relative flex flex-col items-center text-center lg:items-start lg:text-left">
                {/* Step number + icon */}
                <div className="relative mb-6">
                  <span className="absolute -top-3 -left-3 text-6xl font-black text-muted/80 select-none leading-none dark:text-muted/30">
                    {step.id}
                  </span>
                  <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground text-background shadow-sm">
                    <step.icon className="h-6 w-6" />
                  </div>
                </div>

                <h3 className="text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground max-w-[220px] lg:max-w-none">
                  {step.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
