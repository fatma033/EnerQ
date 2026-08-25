import React from "react";
import {
  Zap,
  Play,
  RotateCcw,
  Sliders,
  FileText,
  MessageSquare,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { AgentContext } from "../agent/orchestrator";

interface HeaderProps {
  context: AgentContext;
  onRunAnalysis: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  onToggleChat: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  context,
  onRunAnalysis,
  onReset,
  onOpenSettings,
  onOpenReport,
  onToggleChat,
}) => {
  const { facility, currentStage, isRunningAutonomous } = context;
  const currencySymbol = facility.config.currency_symbol;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Brand & Facility Context */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white shadow-lg shadow-emerald-500/20">
            <Zap className="w-5 h-5 fill-white text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                EnerQ <span className="text-emerald-400 font-semibold text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 uppercase tracking-wider">AI Energy Agent</span>
              </h1>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-slate-400 text-xs font-medium hidden sm:inline flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {facility.config.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Autonomous Facility Energy Expert & Digital Twin</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">Rate: {currencySymbol}{facility.config.electricity_rate}/kWh</span>
            </p>
          </div>
        </div>

        {/* Right: Actions & Agent Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Agent Activity Badge */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/90 border border-slate-700/80 text-xs text-slate-300">
            {isRunningAutonomous ? (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-amber-300 font-medium">Agent Active: {currentStage}</span>
              </>
            ) : currentStage === "COMPLETED" ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300 font-medium">Verified Optimized (-15%)</span>
              </>
            ) : currentStage !== "IDLE" ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-slate-200 font-medium">Stage: {currentStage}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-slate-300">Autonomous Observer Ready</span>
              </>
            )}
          </div>

          {/* Run Autonomous Analysis Button */}
          <button
            id="btn-run-analysis"
            onClick={onRunAnalysis}
            disabled={isRunningAutonomous}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-all duration-150 ${
              isRunningAutonomous
                ? "bg-emerald-800/40 text-emerald-300 cursor-wait border border-emerald-700/50"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer active:scale-98"
            }`}
          >
            {isRunningAutonomous ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                <span>Running Agent Pipeline...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run EnerQ Analysis</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            id="btn-reset-agent"
            onClick={onReset}
            title="Reset to Initial Anomaly State"
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Ask AI Agent Chat Drawer */}
          <button
            id="btn-open-chat"
            onClick={onToggleChat}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">Ask Agent</span>
          </button>

          {/* Executive Audit Report */}
          <button
            id="btn-open-report"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Audit Report</span>
          </button>

          {/* Facility Settings */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            title="Facility & Tariff Settings"
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
