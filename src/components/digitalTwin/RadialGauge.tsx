import React from "react";

interface RadialGaugeProps {
  value: number; // 0-100
  label: string;
  colorClass?: string; // stroke color, e.g. "stroke-emerald-400"
  size?: number;
}

/**
 * A circular percentage gauge (SVG arc), the style used for the
 * Efficiency / Health Score dials on industrial digital-twin dashboards.
 * Pure SVG, no charting library -- same pattern as LoadCurveChart.tsx.
 */
export const RadialGauge: React.FC<RadialGaugeProps> = ({ value, label, colorClass = "stroke-emerald-400", size = 96 }) => {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped / 100);
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={center} cy={center} r={radius} fill="none" className="stroke-slate-800" strokeWidth={8} />
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={8}
            strokeLinecap="round"
            className={colorClass}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-lg font-extrabold text-white tabular-nums">
          {Math.round(clamped)}%
        </div>
      </div>
      <div className="mt-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-center">{label}</div>
    </div>
  );
};
