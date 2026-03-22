import React from "react";
import { Lock } from "lucide-react";

export function ProGateCard() {
  return (
    <div className="rounded-xl border border-dashed border-border p-6 text-center">
      <div className="flex justify-center mb-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
      </div>
      <h4 className="text-sm font-semibold text-foreground mb-1">Pro Content</h4>
      <p className="text-xs text-muted-foreground">
        This content is available for Pro members. Upgrade coming in a future release.
      </p>
    </div>
  );
}
