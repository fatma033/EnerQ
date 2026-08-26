import React from "react";
import { Fan, Lightbulb, Cpu, Sun, Radio } from "lucide-react";

interface SystemNode {
  key: string;
  label: string;
  icon: React.ReactNode;
  connected: boolean;
}

interface SystemConnectionsProps {
  title: string;
  liveLabel: string;
  nodes: SystemNode[];
}

/**
 * Shows the Digital Twin as an actual control hub -- every building system
 * as a node with an animated link back to the center, not just a static
 * diagram. This is what makes "connected to everything" visible: each
 * link pulses independently, and the center node is EnerQ itself.
 */
export const SystemConnections: React.FC<SystemConnectionsProps> = ({ title, liveLabel, nodes }) => {
  // Fixed angles around the hub so links fan out evenly regardless of node count.
  const angleStep = 360 / nodes.length;

  return (
    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">{title}</span>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          {liveLabel}
        </span>
      </div>

      <div className="relative flex items-center justify-center py-6">
        {/* Center hub */}
        <div className="relative z-10 flex flex-col items-center justify-center w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 shadow-lg shadow-emerald-500/20">
          <Radio className="w-5 h-5 text-emerald-300" />
        </div>

        {/* Nodes arranged in a ring, each with a pulsing link line to the hub */}
        <div className="absolute inset-0 flex items-center justify-center">
          {nodes.map((node, i) => {
            const angle = angleStep * i - 90;
            const radius = 42; // percent of container
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
            return (
              <div
                key={node.key}
                className="absolute flex flex-col items-center gap-1"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full border ${
                    node.connected
                      ? "bg-slate-900 border-teal-500 text-teal-300"
                      : "bg-slate-900 border-slate-700 text-slate-600"
                  }`}
                >
                  {node.icon}
                </div>
                <span className="text-[9px] font-medium text-slate-400 whitespace-nowrap">{node.label}</span>
              </div>
            );
          })}
        </div>

        {/* Connection lines, drawn under the nodes */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {nodes.map((node, i) => {
            const angle = angleStep * i - 90;
            const radius = 42;
            const x = 50 + radius * Math.cos((angle * Math.PI) / 180);
            const y = 50 + radius * Math.sin((angle * Math.PI) / 180);
            return (
              <line
                key={node.key}
                x1={50}
                y1={50}
                x2={x}
                y2={y}
                stroke={node.connected ? "#22d3ee" : "#34564d"}
                strokeWidth="0.6"
                strokeDasharray={node.connected ? "2 1.5" : "1 1"}
                opacity={node.connected ? 0.8 : 0.4}
              >
                {node.connected && (
                  <animate attributeName="stroke-dashoffset" from="0" to="-7" dur="0.8s" repeatCount="indefinite" />
                )}
              </line>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
