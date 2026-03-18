import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, User, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/common/FadeIn";
import { Badge } from "@/components/ui/badge";

const previewClasses = [
  {
    title: "Morning Yoga Flow",
    instructor: "Priya Sharma",
    time: "07:00 AM",
    duration: "60 min",
    category: "Yoga",
    gradient: "from-emerald-400/80 to-teal-500/80",
    badge: "Beginner",
  },
  {
    title: "HIIT Core Blast",
    instructor: "Arjun Mehta",
    time: "12:00 PM",
    duration: "45 min",
    category: "HIIT",
    gradient: "from-orange-400/80 to-red-500/80",
    badge: "Advanced",
  },
  {
    title: "Strength Training",
    instructor: "Rohan Verma",
    time: "05:30 PM",
    duration: "60 min",
    category: "Strength",
    gradient: "from-blue-400/80 to-indigo-500/80",
    badge: "Intermediate",
  },
  {
    title: "Zumba Dance Fitness",
    instructor: "Neha Kapoor",
    time: "07:00 PM",
    duration: "50 min",
    category: "Dance",
    gradient: "from-pink-400/80 to-rose-500/80",
    badge: "Beginner",
  },
];

export const ClassesPreview = () => {
  return (
    <section className="bg-background py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <FadeIn className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end mb-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-500 mb-3">Classes</p>
            <h2 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Popular right now
            </h2>
            <p className="mt-3 text-lg text-muted-foreground max-w-md">
              Handpicked sessions loved by our community this week.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full gap-2 shrink-0">
            <Link to="/classes">
              View all classes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {previewClasses.map((cls, i) => (
            <FadeIn key={cls.title} delay={0.08 * i}>
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-lg"
              >
                {/* Gradient banner */}
                <div className={`relative h-36 w-full bg-gradient-to-br ${cls.gradient} flex items-end p-4`}>
                  <Badge className="bg-white/20 text-white border-none backdrop-blur-sm text-xs">
                    {cls.badge}
                  </Badge>
                  <span className="ml-auto text-xs font-medium text-white/80 bg-black/20 px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {cls.category}
                  </span>
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col gap-3 p-5">
                  <h3 className="font-semibold text-foreground leading-snug group-hover:text-indigo-500 transition-colors">
                    {cls.title}
                  </h3>
                  <div className="space-y-1.5 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <User className="h-3.5 w-3.5 shrink-0" />
                      <span>{cls.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 shrink-0" />
                      <span>{cls.time} · {cls.duration}</span>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <Button asChild size="sm" className="w-full rounded-xl text-xs">
                      <Link to="/classes">Book Now</Link>
                    </Button>
                  </div>
                </div>
              </motion.div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
};
