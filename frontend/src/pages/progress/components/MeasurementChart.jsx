import React, { useMemo } from "react";

const CHART_H = 120;
const CHART_W = 560;
const PAD = { top: 10, right: 10, bottom: 24, left: 36 };

export const MeasurementChart = ({ measurements }) => {
  const sorted = useMemo(
    () => [...measurements].filter((m) => m.weight_kg != null).sort((a, b) => a.date.localeCompare(b.date)),
    [measurements]
  );

  if (sorted.length < 2) {
    return (
      <p className="text-xs text-muted-foreground text-center py-4">
        Add at least 2 weight measurements to see the chart.
      </p>
    );
  }

  const values = sorted.map((m) => m.weight_kg);
  const minV = Math.min(...values);
  const maxV = Math.max(...values);
  const range = maxV - minV || 1;

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const pts = sorted.map((m, i) => {
    const x = PAD.left + (i / (sorted.length - 1)) * innerW;
    const y = PAD.top + innerH - ((m.weight_kg - minV) / range) * innerH;
    return { x, y, ...m };
  });

  const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L${pts[pts.length - 1].x},${PAD.top + innerH} L${pts[0].x},${PAD.top + innerH} Z`;

  // Y-axis labels
  const yLabels = [minV, (minV + maxV) / 2, maxV].map((v, i) => ({
    y: PAD.top + innerH - (i / 2) * innerH,
    label: v.toFixed(1),
  }));

  // X-axis labels (first and last)
  const xLabels = [
    { x: pts[0].x, label: sorted[0].date.slice(5) },
    { x: pts[pts.length - 1].x, label: sorted[sorted.length - 1].date.slice(5) },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${CHART_W} ${CHART_H}`}
        className="w-full"
        style={{ minWidth: 280 }}
      >
        {/* Grid lines */}
        {yLabels.map((yl) => (
          <line
            key={yl.label}
            x1={PAD.left}
            y1={yl.y}
            x2={CHART_W - PAD.right}
            y2={yl.y}
            stroke="currentColor"
            strokeOpacity={0.1}
            strokeWidth={1}
            className="text-muted-foreground"
          />
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="#6366f1" fillOpacity={0.08} />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {pts.map((p) => (
          <circle key={p.id} cx={p.x} cy={p.y} r={3} fill="#6366f1" />
        ))}

        {/* Y-axis labels */}
        {yLabels.map((yl) => (
          <text
            key={yl.label}
            x={PAD.left - 4}
            y={yl.y + 4}
            textAnchor="end"
            fontSize={8}
            fill="currentColor"
            className="text-muted-foreground"
            fillOpacity={0.6}
          >
            {yl.label}
          </text>
        ))}

        {/* X-axis labels */}
        {xLabels.map((xl, i) => (
          <text
            key={i}
            x={xl.x}
            y={CHART_H - 4}
            textAnchor={i === 0 ? "start" : "end"}
            fontSize={8}
            fill="currentColor"
            className="text-muted-foreground"
            fillOpacity={0.6}
          >
            {xl.label}
          </text>
        ))}
      </svg>
    </div>
  );
};
