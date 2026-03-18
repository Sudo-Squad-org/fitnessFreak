import React from "react";
import { Loader2 } from "lucide-react";

export const Loader = () => {
  return (
    <div className="flex h-full w-full items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
    </div>
  );
};
