import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/common/FadeIn";
import { ArrowRight, Sparkles } from "lucide-react";

export const CTASection = () => {
  return (
    <section className="relative overflow-hidden bg-zinc-950 dark:bg-zinc-900 py-24 sm:py-32">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Glow */}
      <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 h-80 w-80 rounded-full bg-indigo-500/15 blur-[100px]" />

      <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex flex-col items-center text-center gap-8 lg:flex-row lg:justify-between lg:text-left lg:items-center">
          <FadeIn className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-400 mb-6">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              No commitment required
            </div>
            <h2 className="text-4xl font-black tracking-tight text-white sm:text-5xl">
              Start your journey today.
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-lg">
              Create a free account, explore live classes, and experience the difference. No credit card needed.
            </p>
          </FadeIn>

          <FadeIn delay={0.15} className="flex flex-col items-center gap-4 sm:flex-row lg:shrink-0">
            <Button
              asChild
              size="lg"
              className="h-12 rounded-full bg-white px-8 text-zinc-900 hover:bg-zinc-100 font-semibold gap-2"
            >
              <Link to="/signup">
                Join for free
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="lg"
              className="h-12 rounded-full px-6 text-zinc-400 hover:text-white hover:bg-white/10"
            >
              <Link to="/login">Already a member? Sign in</Link>
            </Button>
          </FadeIn>
        </div>
      </div>
    </section>
  );
};
