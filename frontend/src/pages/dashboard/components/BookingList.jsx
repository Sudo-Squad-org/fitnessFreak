import React from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FadeIn } from "@/components/common/FadeIn";
import { Calendar, Clock, User } from "lucide-react";

export const BookingList = ({ bookings }) => {
  if (bookings.length === 0) {
    return (
      <Card className="mt-8 border-dashed border-2 bg-transparent">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Calendar className="h-12 w-12 text-zinc-300 mb-4" />
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">No bookings yet</h3>
          <p className="text-sm text-zinc-500 max-w-xs">
            Start your fitness journey by exploring our available live classes.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">My Upcoming Classes</h2>
      <div className="grid gap-4">
        {bookings.map((booking, i) => (
          <FadeIn key={booking.id} delay={0.05 * i} yOffset={10}>
            <Card className="overflow-hidden border-none shadow-sm dark:bg-zinc-900/50">
              <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-50">{booking.class_info?.title || "Fitness Class"}</h4>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-zinc-500">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{booking.class_info?.instructor_name || "TBA"}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{booking.class_info?.schedule_time ? new Date(booking.class_info.schedule_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : "TBA"}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4 self-end sm:self-center">
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-none">
                    Booked
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </FadeIn>
        ))}
      </div>
    </div>
  );
};
