import React, { useState } from "react";
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  BrainCircuit,
  Eye,
  ScanSearch,
  Microscope,
} from "lucide-react";
import { AgentLogMessage, AgentStage, KnowledgeCitation } from "../types";

interface AgentThoughtLogProps {
  logs: AgentLogMessage[];
  currentStage: AgentStage;
  isRunning: boolean;
  aiExplanation: string | null;
  aiCitations?: KnowledgeCitation[];
  aiSource?: string | null;
  investigationInsight?: string | null;
  investigationCitations?: KnowledgeCitation[];
  investigationSource?: string | null;
}

const CitationRow: React.FC<{ citations?: KnowledgeCitation[] }> = ({ citations }) => {
  if (!citations || citations.length === 0) return null;
  return (
    <div className="mt-2 pt-2 border-t border-emerald-900/50 flex flex-wrap items-center gap-1.5">
      <span className="text-[10px] text-slate-500 uppercase tracking-wider">Grounded in:</span>
      {citations.map((c) => (
        <span
          key={c.id}
          className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950/60 border border-teal-800/60 text-teal-300"
        >
          📚 {c.title}
        </span>
      ))}
    </div>
  );
};

const SourceBadge: React.FC<{ source?: string | null }> = ({ source }) => {
  if (!source) return null;
  const isLive = source.startsWith("ollama:");
  return (
    <span
      className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded border ${
        isLive
          ? "text-emerald-300 bg-emerald-950/80 border-emerald-800/60"
          : "text-slate-400 bg-slate-800/80 border-slate-700/60"
      }`}
    >
      {isLive ? source.replace("ollama:", "Ollama · ") : "Deterministic Engine"}
    </span>
  );
};

export const AgentThoughtLog: React.FC<AgentThoughtLogProps> = ({
  logs,
  currentStage,
  isRunning,
  aiExplanation,
  aiCitations,
  aiSource,
  investigationInsight,
  investigationCitations,
  investigationSource,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [filterStage, setFilterStage] = useState<string>("ALL");

  const getStageIcon = (stage: AgentStage) => {
    switch (stage) {
      case "OBSERVE":
        return <Eye className="w-3.5 h-3.5 text-blue-400" />;
      case "DETECT":
        return <ScanSearch className="w-3.5 h-3.5 text-amber-400" />;
      case "INVESTIGATE":
        return <Microscope className="w-3.5 h-3.5 text-purple-400" />;
      case "GENERATE_SOLUTIONS":
      case "SIMULATE":
        return <Cpu className="w-3.5 h-3.5 text-teal-400" />;
      case "COMPARE":
      case "DECIDE":
        return <BrainCircuit className="w-3.5 h-3.5 text-indigo-400" />;
      case "RECOMMEND":
      case "VERIFY":
      case "COMPLETED":
        return <Sparkles className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Terminal className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredLogs = filterStage === "ALL" ? logs : logs.filter((l) => l.stage === filterStage);

  return (
    <div className="bg-slate-950/90 border border-slate-800 rounded-2xl overflow-hidden shadow-md">
      {/* Terminal Title Bar */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="text-slate-600 font-mono text-xs">|</span>
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-200">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>EnerQ Agent Activity Stream & Reasoning Log</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isRunning && (
            <span className="text-[11px] font-mono text-amber-300 flex items-center gap-1 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Thinking...
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded hover:bg-slate-800 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Terminal Content */}
      {isExpanded && (
        <div className="p-4">
          {/* Investigation Insight (RAG-grounded root-cause reasoning) */}
          {investigationInsight && (
            <div className="mb-4 p-3.5 rounded-xl bg-purple-950/30 border border-purple-500/30 text-xs text-slate-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-semibold text-purple-300">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Agent Root-Cause Reasoning</span>
                </div>
                <SourceBadge source={investigationSource} />
              </div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line font-sans text-xs">
                {investigationInsight}
              </div>
              <CitationRow citations={investigationCitations} />
            </div>
          )}

          {/* AI Reasoning Commentary Box if available */}
          {aiExplanation && (
            <div className="mb-4 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-slate-200">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 font-semibold text-emerald-400">
                  <BrainCircuit className="w-4 h-4" />
                  <span>Autonomous Agent Synthesis & Executive Reasoning</span>
                </div>
                <SourceBadge source={aiSource} />
              </div>
              <div className="text-slate-300 leading-relaxed whitespace-pre-line font-sans text-xs">
                {aiExplanation}
              </div>
              <CitationRow citations={aiCitations} />
            </div>
          )}

          {/* Log Stream */}
          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {filteredLogs.length === 0 ? (
              <div className="text-xs text-slate-500 font-mono py-4 text-center">
                Standing by. Click "Run EnerQ Analysis" or select a stage to start the autonomous pipeline.
              </div>
            ) : (
              filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800/80 text-xs font-mono transition-all hover:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1 rounded bg-slate-800">{getStageIcon(log.stage)}</div>
                      <span className="font-bold text-slate-200">{log.title}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {log.badge && (
                        <span className="text-[10px] uppercase tracking-wider font-semibold text-teal-300 bg-teal-950/80 px-2 py-0.2 rounded border border-teal-800/60">
                          {log.badge}
                        </span>
                      )}
                      <span className="text-[10px] text-slate-500">{log.timestamp}</span>
                    </div>
                  </div>

                  <p className="text-slate-300 mt-1 pl-6 leading-relaxed font-sans text-xs">
                    {log.detail}
                  </p>

                  {log.metrics && log.metrics.length > 0 && (
                    <div className="mt-2 pl-6 flex flex-wrap gap-2">
                      {log.metrics.map((metric, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-slate-300"
                        >
                          <span className="text-slate-500 mr-1">{metric.label}:</span>
                          <strong className="text-emerald-400">{metric.value}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
