import React, { useState } from "react";
import { TrendingUp, Clock, AlertCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { HourlyEnergyPoint } from "../types";

interface LoadCurveChartProps {
  hourlyData: HourlyEnergyPoint[];
  activeScenarioName: string;
}

export const LoadCurveChart: React.FC<LoadCurveChartProps> = ({
  hourlyData,
  activeScenarioName,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(19); // default hover at 19:00 (after-hours waste peak)

  // Chart dimensions & scaling
  const width = 800;
  const height = 220;
  const paddingX = 45;
  const paddingY = 25;

  const maxKwh = 45; // max scale for hourly kWh

  const getX = (index: number) => {
    return paddingX + (index / (hourlyData.length - 1)) * (width - paddingX * 2);
  };

  const getY = (kwh: number) => {
    return height - paddingY - (kwh / maxKwh) * (height - paddingY * 2);
  };

  // Generate SVG path for Baseline
  const baselinePath = hourlyData
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(pt.baseline_kwh)}`)
    .join(" ");

  // Generate SVG path for Actual Anomaly
  const actualPath = hourlyData
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(pt.actual_kwh)}`)
    .join(" ");

  // Generate SVG path for Simulated Scenario
  const simPath = hourlyData
    .map((pt, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(pt.simulated_kwh)}`)
    .join(" ");

  // Area under anomaly curve
  const actualAreaPath = `${actualPath} L ${getX(hourlyData.length - 1)} ${height - paddingY} L ${getX(0)} ${height - paddingY} Z`;

  // Anomaly waste window boundaries (18:00 to 22:00 -> index 18 to 22)
  const wasteStartX = getX(18);
  const wasteEndX = getX(22);
  const workingStartX = getX(8);
  const workingEndX = getX(18);

  const hoveredPoint = hoveredIndex !== null ? hourlyData[hoveredIndex] : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-teal-400" />
            <h3 className="text-sm font-bold text-white tracking-tight">
              24-Hour Load Profile & After-Hours Waste Analysis
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly consumption telemetry showing after-hours HVAC run vs baseline and simulated optimization
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 inline-block" />
            <span className="text-slate-400">Baseline (500 kWh)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-red-400 inline-block rounded" />
            <span className="text-red-400 font-medium">Actual Anomaly (620 kWh)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-1 bg-emerald-400 inline-block rounded" />
            <span className="text-emerald-400 font-semibold">Simulated ({activeScenarioName})</span>
          </div>
        </div>
      </div>

      {/* SVG Responsive Chart */}
      <div className="mt-4 relative overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[620px] select-none"
        >
          <defs>
            <linearGradient id="actualGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f87171" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#f87171" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="wasteZoneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
            <linearGradient id="workZoneGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines (Y-axis) */}
          {[0, 10, 20, 30, 40].map((kwh) => (
            <g key={kwh}>
              <line
                x1={paddingX}
                y1={getY(kwh)}
                x2={width - paddingX}
                y2={getY(kwh)}
                stroke="#1e293b"
                strokeDasharray="4 4"
                strokeWidth="1"
              />
              <text
                x={paddingX - 8}
                y={getY(kwh) + 3}
                fill="#64748b"
                fontSize="10"
                textAnchor="end"
                fontFamily="monospace"
              >
                {kwh} kW
              </text>
            </g>
          ))}

          {/* Background Band: Working Hours (08:00 - 18:00) */}
          <rect
            x={workingStartX}
            y={paddingY}
            width={workingEndX - workingStartX}
            height={height - paddingY * 2}
            fill="url(#workZoneGradient)"
          />
          <text
            x={(workingStartX + workingEndX) / 2}
            y={paddingY + 12}
            fill="#38bdf8"
            fontSize="9"
            textAnchor="middle"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            WORKING HOURS (08:00 – 18:00)
          </text>

          {/* Background Band: Anomaly Waste Window (18:00 - 22:00) */}
          <rect
            x={wasteStartX}
            y={paddingY}
            width={wasteEndX - wasteStartX}
            height={height - paddingY * 2}
            fill="url(#wasteZoneGradient)"
            stroke="#ef4444"
            strokeDasharray="2 2"
            strokeOpacity="0.4"
          />
          <text
            x={(wasteStartX + wasteEndX) / 2}
            y={paddingY + 12}
            fill="#f87171"
            fontSize="9"
            textAnchor="middle"
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            ⚠ AFTER-HOURS WASTE (+80 kWh)
          </text>

          {/* Area fill under Actual */}
          <path d={actualAreaPath} fill="url(#actualGradient)" />

          {/* Lines */}
          {/* Baseline (Dashed Gray) */}
          <path
            d={baselinePath}
            fill="none"
            stroke="#64748b"
            strokeWidth="1.5"
            strokeDasharray="3 3"
          />

          {/* Actual Anomaly (Red / Amber) */}
          <path
            d={actualPath}
            fill="none"
            stroke="#f87171"
            strokeWidth="2.5"
          />

          {/* Simulated Solution (Emerald Green) */}
          <path
            d={simPath}
            fill="none"
            stroke="#34d399"
            strokeWidth="2.5"
          />

          {/* Hover indicator vertical line */}
          {hoveredIndex !== null && (
            <g>
              <line
                x1={getX(hoveredIndex)}
                y1={paddingY}
                x2={getX(hoveredIndex)}
                y2={height - paddingY}
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(hourlyData[hoveredIndex].actual_kwh)}
                r="4.5"
                fill="#ef4444"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <circle
                cx={getX(hoveredIndex)}
                cy={getY(hourlyData[hoveredIndex].simulated_kwh)}
                r="4.5"
                fill="#10b981"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
            </g>
          )}

          {/* X-axis labels (Hours) */}
          {hourlyData.map((pt, i) => {
            if (i % 3 !== 0 && i !== 18 && i !== 22) return null;
            return (
              <text
                key={i}
                x={getX(i)}
                y={height - 6}
                fill={i >= 18 && i <= 22 ? "#f87171" : "#94a3b8"}
                fontSize="9"
                textAnchor="middle"
                fontWeight={i >= 18 && i <= 22 ? "bold" : "normal"}
              >
                {pt.timeLabel}
              </text>
            );
          })}

          {/* Invisible hover overlay triggers */}
          {hourlyData.map((_, i) => (
            <rect
              key={i}
              x={getX(i) - (width - paddingX * 2) / (hourlyData.length * 2)}
              y={0}
              width={(width - paddingX * 2) / hourlyData.length}
              height={height}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredIndex(i)}
            />
          ))}
        </svg>
      </div>

      {/* Hovered Time Details Panel */}
      {hoveredPoint && (
        <div className="mt-3 bg-slate-950/80 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="font-bold text-white text-sm">{hoveredPoint.timeLabel} Snapshot</span>
            {hoveredPoint.isAfterHoursWaste ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-950 text-red-300 border border-red-800">
                ⚠ After-Hours Overtime Active (+20 kW Draw)
              </span>
            ) : hoveredPoint.isWorkingHour ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-300">
                Normal Business Hours
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800 text-slate-400">
                Night Standby Mode
              </span>
            )}
          </div>

          <div className="flex items-center flex-wrap gap-4">
            <div>
              <span className="text-slate-400 mr-1">Measured Load:</span>
              <span className="font-bold text-red-400">{hoveredPoint.actual_kwh} kW</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Baseline:</span>
              <span className="font-medium text-slate-300">{hoveredPoint.baseline_kwh} kW</span>
            </div>
            <div>
              <span className="text-slate-400 mr-1">Simulated:</span>
              <span className="font-bold text-emerald-400">{hoveredPoint.simulated_kwh} kW</span>
            </div>
            {hoveredPoint.actual_kwh > hoveredPoint.simulated_kwh && (
              <div className="text-emerald-300 font-semibold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
                Savings: -{(hoveredPoint.actual_kwh - hoveredPoint.simulated_kwh).toFixed(1)} kW
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
