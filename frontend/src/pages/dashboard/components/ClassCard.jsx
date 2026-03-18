import React from "react";
import { Link } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, User, Armchair } from "lucide-react";

export const ClassCard = ({ cls }) => {
  return (
    <Card className="flex flex-col h-full overflow-hidden border-none shadow-sm transition-all hover:shadow-md dark:bg-zinc-900/50 group">
      <div className="relative h-32 w-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden">
        {/* Placeholder for class type image or icon */}
        <div className="absolute inset-0 bg-gradient-to-br from-zinc-500/10 to-transparent"></div>
        <Armchair className="h-12 w-12 text-zinc-300 dark:text-zinc-700 relative z-10" />
        <div className="absolute top-3 right-3">
          <Badge variant="outline" className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur-sm border-zinc-200 dark:border-zinc-800">
             Live
          </Badge>
        </div>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg line-clamp-1 group-hover:text-indigo-500 transition-colors">
          {cls.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-3 pb-4">
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <User className="h-4 w-4 shrink-0" />
          <span className="truncate">{cls.instructor_name}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500">
          <Clock className="h-4 w-4 shrink-0" />
          <span>{new Date(cls.schedule_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {cls.duration_minutes}m</span>
        </div>
        <div className="pt-2 flex items-center justify-between text-xs font-medium border-t border-zinc-100 dark:border-zinc-800">
          <span className="text-zinc-400">Available Seats</span>
          <span className={cls.available_seats < 5 ? "text-rose-500" : "text-emerald-500 uppercase"}>
            {cls.available_seats} remaining
          </span>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button asChild className="w-full rounded-xl" size="sm">
          <Link to="/classes">Book Now</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};
