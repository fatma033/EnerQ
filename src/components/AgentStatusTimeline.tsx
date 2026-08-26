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
  ChevronRight,
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

type AgentColor = "sky" | "purple" | "teal" | "emerald";

const COLOR_CLASSES: Record<AgentColor, { badge: string; activeBorder: string; activeBg: string; dot: string; iconActive: string }> = {
  sky: { badge: "bg-sky-950/70 text-sky-300 border-sky-800/60", activeBorder: "border-sky-500", activeBg: "bg-sky-950/70", dot: "bg-sky-400", iconActive: "bg-sky-500 text-slate-950" },
  purple: { badge: "bg-purple-950/70 text-purple-300 border-purple-800/60", activeBorder: "border-purple-500", activeBg: "bg-purple-950/70", dot: "bg-purple-400", iconActive: "bg-purple-500 text-slate-950" },
  teal: { badge: "bg-teal-950/70 text-teal-300 border-teal-800/60", activeBorder: "border-teal-500", activeBg: "bg-teal-950/70", dot: "bg-teal-400", iconActive: "bg-teal-500 text-slate-950" },
  emerald: { badge: "bg-emerald-950/70 text-emerald-300 border-emerald-800/60", activeBorder: "border-emerald-500", activeBg: "bg-emerald-950/70", dot: "bg-emerald-400", iconActive: "bg-emerald-500 text-slate-950" },
};

export const AgentStatusTimeline: React.FC<AgentStatusTimelineProps> = ({
  currentStage,
  onSelectStage,
  isRunning,
  t,
}) => {
  // Grouped by which of the 4 specialist agents (src/agent/agents/) owns
  // each stage -- this is the visual counterpart to that file split, so the
  // pipeline reads as 4 coordinated agents handing off work, not one long
  // undifferentiated strip of 9 steps.
  const agentGroups: { name: string; color: AgentColor; steps: StepItem[] }[] = [
    {
      name: t.agentNames.observer,
      color: "sky",
      steps: [
        { key: "OBSERVE", icon: <Eye className="w-3.5 h-3.5" />, ...t.stages.OBSERVE },
        { key: "DETECT", icon: <ScanSearch className="w-3.5 h-3.5" />, ...t.stages.DETECT },
      ],
    },
    {
      name: t.agentNames.diagnostic,
      color: "purple",
      steps: [
        { key: "INVESTIGATE", icon: <Microscope className="w-3.5 h-3.5" />, ...t.stages.INVESTIGATE },
        { key: "GENERATE_SOLUTIONS", icon: <Lightbulb className="w-3.5 h-3.5" />, ...t.stages.GENERATE_SOLUTIONS },
      ],
    },
    {
      name: t.agentNames.simulation,
      color: "teal",
      steps: [
        { key: "SIMULATE", icon: <Cpu className="w-3.5 h-3.5" />, ...t.stages.SIMULATE },
        { key: "COMPARE", icon: <Scale className="w-3.5 h-3.5" />, ...t.stages.COMPARE },
        { key: "DECIDE", icon: <BrainCircuit className="w-3.5 h-3.5" />, ...t.stages.DECIDE },
      ],
    },
    {
      name: t.agentNames.action,
      color: "emerald",
      steps: [
        { key: "RECOMMEND", icon: <Sparkles className="w-3.5 h-3.5" />, ...t.stages.RECOMMEND },
        { key: "VERIFY", icon: <ShieldCheck className="w-3.5 h-3.5" />, ...t.stages.VERIFY },
      ],
    },
  ];

  const stageOrder: AgentStage[] = [
    "IDLE", "OBSERVE", "DETECT", "INVESTIGATE", "GENERATE_SOLUTIONS",
    "SIMULATE", "COMPARE", "DECIDE", "RECOMMEND", "VERIFY", "COMPLETED",
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

      {/* 4 Agent Groups, each owning 2-3 stages */}
      <div className="overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
        <div className="flex items-stretch gap-2 min-w-[900px]">
          {agentGroups.map((group, gi) => {
            const colors = COLOR_CLASSES[group.color];
            const groupHasActive = group.steps.some((s) => getStepStatus(s.key) === "active");
            const groupAllDone = group.steps.every((s) => getStepStatus(s.key) === "completed");

            return (
              <React.Fragment key={group.name}>
                <div className={`flex-1 rounded-xl border p-2 ${groupHasActive ? colors.activeBorder + " " + colors.activeBg : "border-slate-800/80 bg-slate-950/40"}`}>
                  <div className={`flex items-center gap-1.5 mb-2 px-1.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border w-fit ${colors.badge}`}>
                    {groupAllDone && <CheckCircle className="w-3 h-3" />}
                    {group.name}
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {group.steps.map((step) => {
                      const status = getStepStatus(step.key);
                      const isCompleted = status === "completed";
                      const isActive = status === "active";

                      return (
                        <button
                          key={step.key}
                          id={`timeline-step-${step.key.toLowerCase()}`}
                          onClick={() => onSelectStage && onSelectStage(step.key)}
                          disabled={isRunning}
                          className={`relative flex flex-col items-start p-2 rounded-lg border text-left transition-all duration-200 ${
                            isActive
                              ? `${colors.activeBg} ${colors.activeBorder} shadow-md text-white ring-1`
                              : isCompleted
                              ? "bg-slate-800/80 border-slate-700/60 text-slate-200 hover:bg-slate-800"
                              : "bg-slate-900/50 border-slate-800/80 text-slate-500 opacity-60 hover:opacity-80"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full mb-1">
                            <div
                              className={`flex items-center justify-center w-5 h-5 rounded-md ${
                                isActive ? colors.iconActive + " font-bold" : isCompleted ? "bg-slate-700/80 text-slate-300" : "bg-slate-800 text-slate-500"
                              }`}
                            >
                              {isCompleted ? <CheckCircle className="w-3 h-3" /> : step.icon}
                            </div>
                            {isActive && <span className={`w-1.5 h-1.5 rounded-full ${colors.dot} animate-ping`} />}
                          </div>
                          <div className="text-[11px] font-semibold tracking-tight truncate w-full">
                            {step.label}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
                {gi < agentGroups.length - 1 && (
                  <div className="flex items-center justify-center shrink-0 text-slate-700">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
