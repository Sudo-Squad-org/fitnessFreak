import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ArrowRight, Zap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export const HeroSection = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate(currentUser ? "/dashboard" : "/login");
  };

  const stats = [
    { value: "12+", label: "Class types" },
    { value: "50+", label: "Expert trainers" },
    { value: "10k+", label: "Active members" },
  ];

  return (
    <section className="relative flex min-h-[92vh] items-center justify-center overflow-hidden bg-background px-6 py-24 text-center">
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,#000_60%,transparent_100%)] opacity-60" />

      {/* Glow */}
      <div className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[600px] w-[600px] rounded-full bg-indigo-500/8 dark:bg-indigo-500/12 blur-[120px]" />

      <div className="relative z-10 mx-auto max-w-4xl">
        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-background px-4 py-1.5 text-xs font-medium text-muted-foreground shadow-sm"
        >
          <span className="flex h-2 w-2 rounded-full bg-emerald-500">
            <span className="animate-ping absolute h-2 w-2 rounded-full bg-emerald-400 opacity-75" />
          </span>
          Live classes available now
        </motion.div>

        {/* Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl font-black tracking-tight text-foreground sm:text-7xl lg:text-8xl leading-none"
        >
          Train smarter.
          <br />
          <span className="text-indigo-500">Live stronger.</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground"
        >
          Book expert-led live classes, track your progress, and build the habit that lasts — all in one platform.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Button size="lg" onClick={handleGetStarted} className="h-12 w-full rounded-full px-8 text-sm font-semibold sm:w-auto gap-2">
            Get Started Free
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 w-full rounded-full px-8 text-sm font-semibold sm:w-auto">
            <Link to="/classes">Browse Classes</Link>
          </Button>
        </motion.div>

        {/* Stats row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-16 flex items-center justify-center gap-8"
        >
          {stats.map((stat, i) => (
            <React.Fragment key={stat.label}>
              {i > 0 && <div className="h-8 w-px bg-border" />}
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
              </div>
            </React.Fragment>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
