import React from "react";
import {
  Eye,
  ScanSearch,
  Microscope,
  Lightbulb,
  Cpu,
  Scale,
  BrainCircuit,
  CheckCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { AgentStage } from "../types";
import { getTranslation } from "../i18n";

interface AgentStatusTimelineProps {
  currentStage: AgentStage;
  onSelectStage?: (stage: AgentStage) => void;
  isRunning: boolean;
  t: ReturnType<typeof getTranslation>;
}

interface StepItem {
  key: AgentStage;
  label: string;
  icon: React.ReactNode;
  description: string;
}

export const AgentStatusTimeline: React.FC<AgentStatusTimelineProps> = ({
  currentStage,
  onSelectStage,
  isRunning,
  t,
}) => {
  const steps: StepItem[] = [
    { key: "OBSERVE", icon: <Eye className="w-3.5 h-3.5" />, ...t.stages.OBSERVE },
    { key: "DETECT", icon: <ScanSearch className="w-3.5 h-3.5" />, ...t.stages.DETECT },
    { key: "INVESTIGATE", icon: <Microscope className="w-3.5 h-3.5" />, ...t.stages.INVESTIGATE },
    { key: "GENERATE_SOLUTIONS", icon: <Lightbulb className="w-3.5 h-3.5" />, ...t.stages.GENERATE_SOLUTIONS },
    { key: "SIMULATE", icon: <Cpu className="w-3.5 h-3.5" />, ...t.stages.SIMULATE },
    { key: "COMPARE", icon: <Scale className="w-3.5 h-3.5" />, ...t.stages.COMPARE },
    { key: "DECIDE", icon: <BrainCircuit className="w-3.5 h-3.5" />, ...t.stages.DECIDE },
    { key: "RECOMMEND", icon: <Sparkles className="w-3.5 h-3.5" />, ...t.stages.RECOMMEND },
    { key: "VERIFY", icon: <ShieldCheck className="w-3.5 h-3.5" />, ...t.stages.VERIFY },
  ];

  const stageOrder: AgentStage[] = [
    "IDLE",
    "OBSERVE",
    "DETECT",
    "INVESTIGATE",
    "GENERATE_SOLUTIONS",
    "SIMULATE",
    "COMPARE",
    "DECIDE",
    "RECOMMEND",
    "VERIFY",
    "COMPLETED",
  ];

  const currentIndex = stageOrder.indexOf(currentStage);

  const getStepStatus = (stepKey: AgentStage) => {
    const stepIndex = stageOrder.indexOf(stepKey);
    if (currentStage === "COMPLETED") return "completed";
    if (currentIndex === stepIndex) return "active";
    if (currentIndex > stepIndex) return "completed";
    return "pending";
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 lg:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-white tracking-wide uppercase">
            {t.timelineTitle}
          </h2>
          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
            {t.timelineSubtitle}
          </span>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              {t.reasoningActive}
            </span>
          ) : currentStage === "COMPLETED" ? (
            <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              {t.workflowCompleted}
            </span>
          ) : (
            <span className="text-slate-400">{t.stepOf(Math.max(1, Math.min(9, currentIndex)))}</span>
          )}
        </div>
      </div>

      {/* Horizontal Step Timeline */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-2 min-w-[760px]">
          {steps.map((step) => {
            const status = getStepStatus(step.key);
            const isCompleted = status === "completed";
            const isActive = status === "active";

            return (
              <button
                key={step.key}
                id={`timeline-step-${step.key.toLowerCase()}`}
                onClick={() => onSelectStage && onSelectStage(step.key)}
                disabled={isRunning}
                className={`relative flex flex-col items-start p-2.5 rounded-xl border text-left transition-all duration-200 ${
                  isActive
                    ? "bg-emerald-950/70 border-emerald-500 shadow-md shadow-emerald-900/30 text-white ring-1 ring-emerald-500/50"
                    : isCompleted
                    ? "bg-slate-800/80 border-emerald-800/50 text-slate-200 hover:bg-slate-800"
                    : "bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60 hover:opacity-80"
                }`}
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <div
                    className={`flex items-center justify-center w-6 h-6 rounded-lg ${
                      isActive
                        ? "bg-emerald-500 text-slate-950 font-bold"
                        : isCompleted
                        ? "bg-emerald-900/80 text-emerald-300"
                        : "bg-slate-800 text-slate-500"
                    }`}
                  >
                    {isCompleted ? <CheckCircle className="w-3.5 h-3.5 text-emerald-300" /> : step.icon}
                  </div>
                  {isCompleted && (
                    <span className="text-[10px] font-bold text-emerald-400 tracking-wider">✓</span>
                  )}
                  {isActive && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </div>

                <div className="text-xs font-semibold tracking-tight truncate w-full">
                  {step.label}
                </div>
                <div className="text-[10px] text-slate-400 line-clamp-2 leading-tight mt-0.5">
                  {step.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
