import React from "react";

export const BadgeGrid = ({ badges, definitions }) => {
  const earnedTypes = new Set(badges.map((b) => b.badge_type));

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {Object.entries(definitions).map(([type, def]) => {
        const earned = earnedTypes.has(type);
        return (
          <div
            key={type}
            title={def.desc}
            className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-colors ${
              earned
                ? "border-border bg-card"
                : "border-border/50 bg-muted/30 opacity-40"
            }`}
          >
            <span className="text-2xl">{def.icon}</span>
            <span className="text-[10px] font-medium text-center leading-tight text-foreground">
              {def.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};
