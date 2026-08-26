import React from "react";

interface MiniTrendChartProps {
  label: string;
  points: number[]; // oldest first
  unit: string;
  colorClass?: string; // e.g. "stroke-emerald-400"
  dotColorClass?: string; // e.g. "fill-emerald-400"
}

/**
 * A small sparkline-style trend chart -- same hand-built SVG approach as
 * LoadCurveChart.tsx, no charting library. Used for the small-multiples
 * trend panels on the Digital Twin dashboard.
 */
export const MiniTrendChart: React.FC<MiniTrendChartProps> = ({ label, points, unit, colorClass = "stroke-emerald-400", dotColorClass = "fill-emerald-400" }) => {
  const width = 220;
  const height = 60;
  const padding = 6;
  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = max - min || 1;

  const getX = (i: number) => padding + (i / (points.length - 1)) * (width - padding * 2);
  const getY = (v: number) => height - padding - ((v - min) / range) * (height - padding * 2);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p)}`).join(" ");
  const last = points[points.length - 1];

  return (
    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="text-xs font-bold text-white tabular-nums">{last.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{unit}</span></span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <path d={path} fill="none" className={colorClass} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={getX(points.length - 1)} cy={getY(last)} r={3} className={dotColorClass} />
      </svg>
    </div>
  );
};
