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

interface AgentStatusTimelineProps {
  currentStage: AgentStage;
  onSelectStage?: (stage: AgentStage) => void;
  isRunning: boolean;
}

interface StepItem {
  key: AgentStage;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  description: string;
}

export const AgentStatusTimeline: React.FC<AgentStatusTimelineProps> = ({
  currentStage,
  onSelectStage,
  isRunning,
}) => {
  const steps: StepItem[] = [
    {
      key: "OBSERVE",
      label: "Observe",
      shortLabel: "1. Observe",
      icon: <Eye className="w-3.5 h-3.5" />,
      description: "Ingest meter telemetry & facility schedules",
    },
    {
      key: "DETECT",
      label: "Detect",
      shortLabel: "2. Detect",
      icon: <ScanSearch className="w-3.5 h-3.5" />,
      description: "Evaluate variance against baseline (+24%)",
    },
    {
      key: "INVESTIGATE",
      label: "Investigate",
      shortLabel: "3. Investigate",
      icon: <Microscope className="w-3.5 h-3.5" />,
      description: "Isolate sub-system cause (HVAC 4h overtime)",
    },
    {
      key: "GENERATE_SOLUTIONS",
      label: "Generate",
      shortLabel: "4. Generate",
      icon: <Lightbulb className="w-3.5 h-3.5" />,
      description: "Formulate candidate interventions (A, B, C)",
    },
    {
      key: "SIMULATE",
      label: "Simulate",
      shortLabel: "5. Simulate",
      icon: <Cpu className="w-3.5 h-3.5" />,
      description: "Test scenarios in facility Digital Twin",
    },
    {
      key: "COMPARE",
      label: "Compare",
      shortLabel: "6. Compare",
      icon: <Scale className="w-3.5 h-3.5" />,
      description: "Multi-criteria tradeoff evaluation",
    },
    {
      key: "DECIDE",
      label: "Decide",
      shortLabel: "7. Decide",
      icon: <BrainCircuit className="w-3.5 h-3.5" />,
      description: "Select highest-value safe intervention",
    },
    {
      key: "RECOMMEND",
      label: "Recommend",
      shortLabel: "8. Recommend",
      icon: <Sparkles className="w-3.5 h-3.5" />,
      description: "Present actionable plan with ROI breakdown",
    },
    {
      key: "VERIFY",
      label: "Verify",
      shortLabel: "9. Verify",
      icon: <ShieldCheck className="w-3.5 h-3.5" />,
      description: "Simulate post-approval implementation (-15%)",
    },
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
            EnerQ AI Agent Workflow
          </h2>
          <span className="text-xs text-slate-400 font-normal hidden sm:inline">
            Autonomous Decision & Verification Pipeline
          </span>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-2">
          {isRunning ? (
            <span className="inline-flex items-center gap-1.5 text-amber-300 bg-amber-950/60 border border-amber-800/60 px-2.5 py-0.5 rounded-full font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Autonomous Reasoning Active
            </span>
          ) : currentStage === "COMPLETED" ? (
            <span className="inline-flex items-center gap-1 text-emerald-300 bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-0.5 rounded-full font-medium">
              <CheckCircle className="w-3.5 h-3.5" />
              Workflow Completed & Verified
            </span>
          ) : (
            <span className="text-slate-400">Step {Math.max(1, Math.min(9, currentIndex))} of 9</span>
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
