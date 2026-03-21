import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/common/FadeIn";
import { Calendar, Clock, User } from "lucide-react";

export const BookingList = ({ bookings }) => {
  if (bookings.length === 0) {
    return (
      <div className="mt-8 rounded-2xl border border-dashed border-border flex flex-col items-center justify-center py-12 text-center px-4">
        <Calendar className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <h3 className="text-base font-semibold text-foreground">No bookings yet</h3>
        <p className="text-sm text-muted-foreground max-w-xs mt-1">
          Start your fitness journey by exploring our available live classes.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-foreground">My Upcoming Classes</h2>
      <div className="grid gap-3">
        {bookings.map((booking, i) => (
          <FadeIn key={booking.id} delay={0.05 * i} yOffset={10}>
            <div className="rounded-2xl border border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 gap-4">
              <div className="flex items-center gap-4">
                <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{booking.class_info?.title || "Fitness Class"}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{booking.class_info?.instructor_name || "TBA"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{booking.class_info?.schedule_time ? new Date(booking.class_info.schedule_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "TBA"}</span>
                    </div>
                  </div>
                </div>
              </div>
              <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none self-end sm:self-center">
                Confirmed
              </Badge>
            </div>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};
