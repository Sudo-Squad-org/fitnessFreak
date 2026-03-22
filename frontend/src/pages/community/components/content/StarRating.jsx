import React, { useState } from "react";
import { Star } from "lucide-react";

export function StarRating({ value, onChange, readOnly = false }) {
  const [hover, setHover] = useState(0);
  const display = hover || value || 0;

  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => !readOnly && onChange?.(n)}
          onMouseEnter={() => !readOnly && setHover(n)}
          onMouseLeave={() => !readOnly && setHover(0)}
          className={`transition-colors ${readOnly ? "cursor-default" : "cursor-pointer"}`}
        >
          <Star
            className={`h-5 w-5 ${
              n <= display ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
            }`}
          />
        </button>
      ))}
    </div>
  );
}
