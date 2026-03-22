import React from "react";
import { FadeIn } from "@/components/common/FadeIn";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Danielle M.",
    role: "Member since 2024",
    avatar: "DM",
    quote:
      "The personalized workout plan actually accounts for my PCOS. That's something no other app has done for me. I've been consistent for 10 weeks straight.",
    stars: 5,
  },
  {
    name: "Marcus P.",
    role: "Member since 2023",
    avatar: "MP",
    quote:
      "The buddy system changed everything. Having a matched partner with the same muscle-gain goal keeps me accountable in a way leaderboards never did.",
    stars: 5,
  },
  {
    name: "Chloe S.",
    role: "Member since 2025",
    avatar: "CS",
    quote:
      "I track my sleep, log my meals, and check my readiness score every morning. It's the first app that actually connects all of that in one place.",
    stars: 5,
  },
];

const avatarColors = [
  "from-indigo-400 to-violet-500",
  "from-emerald-400 to-teal-500",
  "from-rose-400 to-pink-500",
];

export const Testimonials = () => {
  return (
    <section className="bg-muted/40 border-y border-border py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="text-center mb-16">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 mb-3">Testimonials</p>
          <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Real members. Remarkable results.
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Across workouts, nutrition, sleep, and community — here's what they say.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <FadeIn key={i} delay={0.12 * i}>
              <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-7 shadow-sm">
                {/* Stars */}
                <div className="flex gap-1 mb-5">
                  {Array.from({ length: review.stars }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-indigo-500 text-indigo-500" />
                  ))}
                </div>

                {/* Quote */}
                <p className="flex-1 text-[15px] leading-7 text-foreground">
                  "{review.quote}"
                </p>

                {/* Author */}
                <div className="mt-7 flex items-center gap-3 border-t border-border pt-5">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${avatarColors[i]} text-white text-xs font-bold shrink-0`}>
                    {review.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{review.name}</p>
                    <p className="text-xs text-muted-foreground">{review.role}</p>
                  </div>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
