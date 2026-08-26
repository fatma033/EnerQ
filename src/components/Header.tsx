import React from "react";
import {
  Play,
  RotateCcw,
  Sliders,
  FileText,
  MessageSquare,
  Sparkles,
  Building2,
  CheckCircle2,
  AlertTriangle,
  BrainCircuit,
  Handshake,
  Zap as ZapAuto,
  Sun,
  Moon,
  Languages,
} from "lucide-react";
import { AgentContext, AutonomyMode } from "../agent/orchestrator";
import { Language, getTranslation } from "../i18n";

interface HeaderProps {
  context: AgentContext;
  engineStatus: { provider: string; model: string; hasApiKey: boolean } | null;
  onRunAnalysis: () => void;
  onReset: () => void;
  onOpenSettings: () => void;
  onOpenReport: () => void;
  onToggleChat: () => void;
  onSetAutonomyMode: (mode: AutonomyMode) => void;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  t: ReturnType<typeof getTranslation>;
  language: Language;
  onToggleLanguage: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  context,
  engineStatus,
  onRunAnalysis,
  onReset,
  onOpenSettings,
  onOpenReport,
  onToggleChat,
  onSetAutonomyMode,
  theme,
  onToggleTheme,
  t,
  language,
  onToggleLanguage,
}) => {
  const { facility, currentStage, isRunningAutonomous, autonomyMode } = context;
  const currencySymbol = facility.config.currency_symbol;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 px-4 lg:px-8 py-3.5 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Left: Brand & Facility Context */}
        <div className="flex items-center gap-3.5">
          <div className="relative flex items-center justify-center w-10 h-10 shrink-0">
            <img src="/logo.svg" alt="EnerQ" className="w-10 h-10 rounded-xl shadow-lg shadow-emerald-500/20" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-slate-900"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-1.5">
                EnerQ <span className="text-emerald-400 font-semibold text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-800/60 uppercase tracking-wider">{t.tagline}</span>
              </h1>
              <span className="text-slate-500 text-xs hidden sm:inline">•</span>
              <span className="text-slate-400 text-xs font-medium hidden sm:inline flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                {facility.config.name}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span>{t.subtitle}</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-400 hidden sm:inline">{t.rate}: {currencySymbol}{facility.config.electricity_rate}/kWh</span>
            </p>
          </div>
        </div>

        {/* Right: Actions & Agent Controls */}
        <div className="flex items-center flex-wrap gap-2 sm:gap-3">
          {/* Run Autonomous Analysis Button — the primary action, first and brightest */}
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
                <span>{t.runningAnalysis}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{t.runAnalysis}</span>
              </>
            )}
          </button>

          {/* Reset button */}
          <button
            id="btn-reset-agent"
            onClick={onReset}
            title={t.resetTooltip}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Status cluster: quieter than the primary action — informational, not the first thing to scan */}
          <div className="hidden lg:flex items-center gap-1.5 pl-2 border-l border-slate-800">
            {/* Autonomy Level Toggle */}
            <div
              title="Controls what happens after EnerQ decides on a recommendation: wait for human approval, or execute autonomously for pre-authorized low-risk actions."
              className="flex items-center gap-0.5 p-0.5 rounded-md bg-slate-800/60"
            >
              <button
                onClick={() => onSetAutonomyMode("approval")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  autonomyMode === "approval"
                    ? "bg-teal-700/70 text-teal-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Handshake className="w-3 h-3" />
                <span>{t.approval}</span>
              </button>
              <button
                onClick={() => onSetAutonomyMode("autonomous")}
                className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
                  autonomyMode === "autonomous"
                    ? "bg-amber-700/70 text-amber-100"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <ZapAuto className="w-3 h-3 fill-current" />
                <span>{t.autonomous}</span>
              </button>
            </div>

            {/* Reasoning Engine Transparency Badge */}
            {engineStatus && (
              <div
                title={engineStatus.hasApiKey ? "Live local Ollama reasoning, grounded in the RAG knowledge base" : "Deterministic reasoning engine (start Ollama locally for live LLM synthesis)"}
                className="hidden xl:flex items-center gap-1 px-2 py-1 rounded-md text-[10px] text-slate-500"
              >
                <BrainCircuit className={`w-3 h-3 ${engineStatus.hasApiKey ? "text-emerald-500" : "text-slate-500"}`} />
                <span className={engineStatus.hasApiKey ? "text-emerald-500" : "text-slate-500"}>
                  {engineStatus.hasApiKey ? `Ollama ${engineStatus.model}` : "Deterministic"}
                </span>
              </div>
            )}

            {/* Agent Activity Badge */}
            <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] text-slate-500">
              {isRunningAutonomous ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span className="text-amber-400">Active: {currentStage}</span>
                </>
              ) : currentStage === "COMPLETED" ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                  <span className="text-emerald-500">Verified</span>
                </>
              ) : currentStage !== "IDLE" ? (
                <>
                  <AlertTriangle className="w-3 h-3 text-amber-500" />
                  <span>Stage: {currentStage}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3 h-3 text-slate-500" />
                  <span>Observer Ready</span>
                </>
              )}
            </div>
          </div>

          {/* Ask AI Agent Chat Drawer */}
          <button
            id="btn-open-chat"
            onClick={onToggleChat}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
            <span className="hidden sm:inline">{t.askAgent}</span>
          </button>

          {/* Executive Audit Report */}
          <button
            id="btn-open-report"
            onClick={onOpenReport}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">{t.auditReport}</span>
          </button>

          {/* Facility Settings */}
          <button
            id="btn-open-settings"
            onClick={onOpenSettings}
            title={t.settingsTooltip}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Language Toggle */}
          <button
            id="btn-toggle-language"
            onClick={onToggleLanguage}
            title={t.langToggle}
            className="flex items-center gap-1.5 px-2.5 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            <Languages className="w-4 h-4" />
            <span className="hidden sm:inline">{t.langToggle}</span>
          </button>

          {/* Theme Toggle */}
          <button
            id="btn-toggle-theme"
            onClick={onToggleTheme}
            title={theme === "dark" ? t.themeToLight : t.themeToDark}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 hover:bg-slate-700/80 border border-slate-700/60 rounded-lg transition-colors"
          >
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </header>
  );
};
