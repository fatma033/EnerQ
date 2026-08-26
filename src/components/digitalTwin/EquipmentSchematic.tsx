import React from "react";

interface Callout {
  label: string;
  value: string;
  status: "ok" | "warning" | "alert";
  // Anchor point on the equipment (in the 0-400 x 0-220 viewBox) and the
  // label box position it leads to.
  anchor: [number, number];
  box: [number, number];
  align: "left" | "right";
}

interface EquipmentSchematicProps {
  title: string;
  isRunning: boolean;
  callouts: Callout[];
}

const STATUS_COLOR: Record<Callout["status"], string> = {
  ok: "#4ade80",
  warning: "#fbbf24",
  alert: "#f87171",
};

/**
 * A labeled equipment diagram with pinned sensor-readout callouts and
 * leader lines -- the visual language of an industrial digital-twin
 * dashboard (annotated equipment schematic, not a walkthrough render).
 * Hand-built SVG silhouette of a rooftop AHU/chiller unit, since there's
 * no real equipment photo to annotate here.
 */
export const EquipmentSchematic: React.FC<EquipmentSchematicProps> = ({ title, isRunning, callouts }) => {
  return (
    <div className="relative rounded-xl bg-gradient-to-b from-slate-950 via-[#061421] to-slate-950 border border-cyan-900/40 p-3 overflow-hidden">
      <div className="absolute top-2 left-3 text-[10px] font-bold text-cyan-300 uppercase tracking-wider z-10">{title}</div>
      <svg viewBox="0 0 400 220" className="w-full h-auto">
        <defs>
          <radialGradient id="glow" cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor="#0891b2" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#0891b2" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="housing" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e3a4a" />
            <stop offset="100%" stopColor="#0b1d27" />
          </linearGradient>
        </defs>

        <circle cx="200" cy="105" r="95" fill="url(#glow)" />

        {/* AHU housing */}
        <rect x="120" y="60" width="160" height="100" rx="8" fill="url(#housing)" stroke="#164e63" strokeWidth="1.5" />
        {/* Duct in/out */}
        <rect x="60" y="95" width="60" height="30" rx="4" fill="#0b1d27" stroke="#164e63" strokeWidth="1.5" />
        <rect x="280" y="95" width="60" height="30" rx="4" fill="#0b1d27" stroke="#164e63" strokeWidth="1.5" />
        {/* Fan */}
        <circle cx="200" cy="110" r="34" fill="#0b1d27" stroke="#22d3ee" strokeWidth="1.5" />
        <g className={isRunning ? "origin-center" : ""} style={isRunning ? { animation: "spin 1.4s linear infinite", transformOrigin: "200px 110px" } : undefined}>
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <rect key={deg} x="197" y="80" width="6" height="26" rx="3" fill="#22d3ee" opacity="0.85" transform={`rotate(${deg} 200 110)`} />
          ))}
        </g>
        <circle cx="200" cy="110" r="6" fill="#67e8f9" />
        {/* Coil fins */}
        {[140, 148, 156, 244, 252, 260].map((x) => (
          <line key={x} x1={x} y1="70" x2={x} y2="150" stroke="#155e75" strokeWidth="2" />
        ))}
        {/* Base */}
        <rect x="110" y="160" width="180" height="10" rx="3" fill="#0b1d27" stroke="#164e63" strokeWidth="1" />

        {/* Leader lines + callouts */}
        {callouts.map((c, i) => {
          const [ax, ay] = c.anchor;
          const [bx, by] = c.box;
          const boxW = 96;
          const boxH = 30;
          const boxX = c.align === "left" ? bx - boxW : bx;
          return (
            <g key={i}>
              <line x1={ax} y1={ay} x2={bx} y2={by} stroke={STATUS_COLOR[c.status]} strokeWidth="1" strokeDasharray="2 2" opacity="0.7" />
              <circle cx={ax} cy={ay} r="3" fill={STATUS_COLOR[c.status]} />
              <rect x={boxX} y={by - boxH / 2} width={boxW} height={boxH} rx="5" fill="#01130f" fillOpacity="0.85" stroke={STATUS_COLOR[c.status]} strokeOpacity="0.5" strokeWidth="1" />
              <text x={boxX + boxW / 2} y={by - 4} textAnchor="middle" fontSize="8" fill="#97b4ad" fontFamily="monospace">
                {c.label}
              </text>
              <text x={boxX + boxW / 2} y={by + 10} textAnchor="middle" fontSize="10" fontWeight="bold" fill={STATUS_COLOR[c.status]} fontFamily="monospace">
                {c.value}
              </text>
            </g>
          );
        })}
      </svg>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};
