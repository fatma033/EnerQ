import React from "react";

interface PeriodTrendChartProps {
  points: { dayIndex: number; cumulativeKwh: number; cumulativeCost: number }[];
  symbol: string;
  dayLabel: (day: number) => string;
}

/**
 * Cumulative-savings-over-period area chart for ReportsAgent -- same
 * hand-built SVG approach as LoadCurveChart/MiniTrendChart (no charting
 * library). Unlike those, this one carries its own axis labels and a
 * gradient fill since it stands alone as the report's main "graph" rather
 * than a small-multiples sparkline.
 */
export const PeriodTrendChart: React.FC<PeriodTrendChartProps> = ({ points, symbol, dayLabel }) => {
  const width = 640;
  const height = 200;
  const padL = 44;
  const padR = 16;
  const padT = 16;
  const padB = 28;

  const maxKwh = Math.max(...points.map((p) => p.cumulativeKwh), 1) * 1.08;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;

  const getX = (i: number) => padL + (i / (points.length - 1)) * innerW;
  const getY = (v: number) => padT + innerH - (v / maxKwh) * innerH;

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(p.cumulativeKwh)}`).join(" ");
  const areaPath = `${linePath} L ${getX(points.length - 1)} ${padT + innerH} L ${getX(0)} ${padT + innerH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const last = points[points.length - 1];
  const first = points[0];
  const mid = points[Math.floor((points.length - 1) / 2)];

  return (
    <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="reportTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4ade80" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#4ade80" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Gridlines + Y-axis kWh labels */}
        {gridLines.map((g) => {
          const y = padT + innerH - g * innerH;
          return (
            <g key={g}>
              <line x1={padL} y1={y} x2={width - padR} y2={y} stroke="#1d3a33" strokeWidth={1} />
              <text x={padL - 8} y={y + 3} textAnchor="end" className="fill-slate-500" fontSize={9}>
                {Math.round(maxKwh * g).toLocaleString()}
              </text>
            </g>
          );
        })}

        {/* Area + line */}
        <path d={areaPath} fill="url(#reportTrendFill)" />
        <path d={linePath} fill="none" stroke="#4ade80" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />

        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={getX(i)} cy={getY(p.cumulativeKwh)} r={i === points.length - 1 ? 4 : 2.5} fill="#4ade80" />
        ))}

        {/* X-axis day labels: first / mid / last only, to stay readable */}
        <text x={getX(0)} y={height - 6} textAnchor="start" className="fill-slate-500" fontSize={9}>
          {dayLabel(first.dayIndex)}
        </text>
        <text x={getX(Math.floor((points.length - 1) / 2))} y={height - 6} textAnchor="middle" className="fill-slate-500" fontSize={9}>
          {dayLabel(mid.dayIndex)}
        </text>
        <text x={getX(points.length - 1)} y={height - 6} textAnchor="end" className="fill-slate-500" fontSize={9}>
          {dayLabel(last.dayIndex)}
        </text>

        {/* Callout on the final point */}
        <text x={getX(points.length - 1) - 6} y={getY(last.cumulativeKwh) - 10} textAnchor="end" className="fill-emerald-300" fontSize={11} fontWeight={700}>
          {last.cumulativeKwh.toLocaleString()} kWh · {symbol}{last.cumulativeCost.toLocaleString()}
        </text>
      </svg>
    </div>
  );
};
