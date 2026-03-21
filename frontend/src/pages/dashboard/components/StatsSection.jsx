import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { FadeIn } from "@/components/common/FadeIn";
import { CalendarCheck, Award, Flame } from "lucide-react";

export const StatsSection = ({ bookingsCount }) => {
  // Simple streak logic placeholder based on presence of bookings
  const streak = bookingsCount > 0 ? 3 : 0; 
  
  const stats = [
    {
      title: "Total Bookings",
      value: bookingsCount.toString(),
      icon: CalendarCheck,
      color: "text-blue-500",
      bg: "bg-blue-50 dark:bg-blue-500/10"
    },
    {
      title: "Completed Classes",
      value: Math.max(0, bookingsCount - 1).toString(), // Mocking historical completion
      icon: Award,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-500/10"
    },
    {
      title: "Active Streak",
      value: `${streak} Days`,
      icon: Flame,
      color: "text-orange-500",
      bg: "bg-orange-50 dark:bg-orange-500/10"
    }
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6 mt-8">
      {stats.map((stat, i) => (
        <FadeIn key={i} delay={0.1 * i} yOffset={10}>
          <Card className="border border-border shadow-none bg-card">
            <CardContent className="flex items-center gap-4 p-6">
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      ))}
    </div>
  );
};
