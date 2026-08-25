import React, { useEffect, useState, useMemo, useRef } from "react";
import { Header } from "./components/Header";
import { AgentStatusTimeline } from "./components/AgentStatusTimeline";
import { AnomalyBanner } from "./components/AnomalyBanner";
import { DigitalTwinView } from "./components/DigitalTwinView";
import { LoadCurveChart } from "./components/LoadCurveChart";
import { SolutionsComparison } from "./components/SolutionsComparison";
import { RecommendationCard } from "./components/RecommendationCard";
import { AgentThoughtLog } from "./components/AgentThoughtLog";
import { VerificationModal } from "./components/VerificationModal";
import { FacilitySettingsModal } from "./components/FacilitySettingsModal";
import { AgentChatDrawer } from "./components/AgentChatDrawer";
import { AuditReportModal } from "./components/AuditReportModal";
import { EnerQAgentOrchestrator, AgentContext } from "./agent/orchestrator";
import { initialFacilityData } from "./data/mockFacility";
import { EnergyCalculationEngine } from "./simulation/engine";
import { AgentStage } from "./types";
import { Sparkles, Layers, Cpu, TrendingUp, Info } from "lucide-react";

export default function App() {
  // Initialize Orchestrator instance
  const orchestrator = useMemo(() => new EnerQAgentOrchestrator(initialFacilityData), []);
  const [context, setContext] = useState<AgentContext>(orchestrator.getContext());

  // Modal & Drawer states
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isSimulatingTwin, setIsSimulatingTwin] = useState(false);
  const [engineStatus, setEngineStatus] = useState<{ provider: string; model: string; hasApiKey: boolean } | null>(null);

  // Active view tab in workspace (Overview vs Digital Twin vs Solutions Lab)
  const [activeTab, setActiveTab] = useState<"ALL" | "TWIN" | "SOLUTIONS" | "ANALYTICS">("ALL");

  useEffect(() => {
    const unsubscribe = orchestrator.subscribe((newContext) => {
      setContext(newContext);
    });

    // Auto-run initial observation on first load so user immediately sees real telemetry
    orchestrator.stepObserve();
    orchestrator.stepDetect();

    // Surface which reasoning engine is actually powering the agent
    fetch("/api/health")
      .then((r) => r.json())
      .then((data) => setEngineStatus({ provider: data.provider, model: data.model, hasApiKey: data.hasApiKey }))
      .catch(() => setEngineStatus(null));

    return () => {
      unsubscribe();
    };
  }, [orchestrator]);

  // Handler: Run full autonomous 9-step pipeline
  const handleRunFullAnalysis = () => {
    orchestrator.runAutonomousPipeline(1100);
  };

  // Handler: Reset agent state
  const handleReset = () => {
    orchestrator.reset(initialFacilityData);
    orchestrator.stepObserve();
    orchestrator.stepDetect();
  };

  // Handler: Stage selection from timeline
  const handleSelectStage = (stage: AgentStage) => {
    switch (stage) {
      case "OBSERVE":
        orchestrator.stepObserve();
        break;
      case "DETECT":
        orchestrator.stepDetect();
        break;
      case "INVESTIGATE":
        orchestrator.stepInvestigate();
        break;
      case "GENERATE_SOLUTIONS":
        orchestrator.stepGenerateSolutions();
        break;
      case "SIMULATE":
        orchestrator.stepSimulate();
        break;
      case "COMPARE":
        orchestrator.stepCompare();
        break;
      case "DECIDE":
        orchestrator.stepDecide();
        break;
      case "RECOMMEND":
        orchestrator.stepRecommend();
        break;
      case "VERIFY":
        handleApprove();
        break;
      default:
        break;
    }
  };

  // Handler: Trigger Digital Twin Simulation manually
  const handleRunTwinSimulation = () => {
    setIsSimulatingTwin(true);
    setTimeout(() => {
      orchestrator.stepSimulate();
      setIsSimulatingTwin(false);
    }, 900);
  };

  // Handler: Approve Recommendation
  const handleApprove = () => {
    orchestrator.stepVerify();
    setIsVerificationOpen(true);
  };

  // Handler: Scenario toggle
  const handleSelectScenario = (scenario: "BASELINE" | "CURRENT" | "A" | "B" | "C") => {
    orchestrator.setActiveScenario(scenario);
  };

  // 24-hour hourly profile computed dynamically
  const hourlyData = useMemo(() => {
    return EnergyCalculationEngine.generateHourlyProfile(context.facility, context.activeScenarioId);
  }, [context.facility, context.activeScenarioId]);

  // Solutions generated
  const solutions = useMemo(() => {
    return context.solutions || EnergyCalculationEngine.generateSolutions(context.facility);
  }, [context.solutions, context.facility]);

  const chosenSolution = context.chosenSolution || solutions.C;

  const isVerified = context.currentStage === "COMPLETED" || !!context.verification;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* 1. Header */}
      <Header
        context={context}
        engineStatus={engineStatus}
        onRunAnalysis={handleRunFullAnalysis}
        onReset={handleReset}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenReport={() => setIsReportOpen(true)}
        onToggleChat={() => setIsChatOpen(!isChatOpen)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* 2. Agent Workflow Timeline */}
        <section aria-label="Agent Pipeline Timeline">
          <AgentStatusTimeline
            currentStage={context.currentStage}
            onSelectStage={handleSelectStage}
            isRunning={context.isRunningAutonomous}
          />
        </section>

        {/* 3. Anomaly Callout Banner & Sub-systems Status */}
        <section aria-label="Energy Anomaly Overview">
          <AnomalyBanner
            facility={context.facility}
            anomaly={context.anomalyReport}
            onInvestigate={() => {
              orchestrator.stepInvestigate();
            }}
            onSimulate={handleRunTwinSimulation}
            isVerified={isVerified}
          />
        </section>

        {/* 4. Active Recommendation Hero Card (Visible when stage >= RECOMMEND or DECIDE) */}
        {(context.currentStage === "DECIDE" ||
          context.currentStage === "RECOMMEND" ||
          context.currentStage === "VERIFY" ||
          context.currentStage === "COMPLETED") && (
          <section aria-label="EnerQ Autonomous Recommendation">
            <RecommendationCard
              solution={chosenSolution}
              facility={context.facility}
              onApprove={handleApprove}
              onReviewAlternatives={() => setActiveTab("SOLUTIONS")}
              isVerified={isVerified}
            />
          </section>
        )}

        {/* 5. View Filter Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "ALL"
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Unified Control View
            </button>

            <button
              onClick={() => setActiveTab("TWIN")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "TWIN"
                  ? "bg-slate-800 text-teal-400 border border-teal-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Digital Twin Physics
            </button>

            <button
              onClick={() => setActiveTab("SOLUTIONS")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "SOLUTIONS"
                  ? "bg-slate-800 text-emerald-400 border border-emerald-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Solution Comparison Lab
            </button>

            <button
              onClick={() => setActiveTab("ANALYTICS")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "ANALYTICS"
                  ? "bg-slate-800 text-sky-400 border border-sky-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              24h Load Telemetry
            </button>
          </div>

          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Autonomous Facility State • Live Sync
          </span>
        </div>

        {/* 6. Main Interactive Views */}
        {(activeTab === "ALL" || activeTab === "TWIN") && (
          <section aria-label="Facility Digital Twin Model">
            <DigitalTwinView
              facility={context.facility}
              solutions={solutions}
              activeScenario={context.activeScenarioId}
              onSelectScenario={handleSelectScenario}
              onRunSimulation={handleRunTwinSimulation}
              isSimulating={isSimulatingTwin}
              isVerified={isVerified}
            />
          </section>
        )}

        {(activeTab === "ALL" || activeTab === "ANALYTICS") && (
          <section aria-label="24-Hour Hourly Load Curve Analytics">
            <LoadCurveChart
              hourlyData={hourlyData}
              activeScenarioName={
                context.activeScenarioId === "C"
                  ? "Scenario C: Recommended (-15%)"
                  : context.activeScenarioId === "A"
                  ? "Scenario A: 18:00 Cutoff (-8%)"
                  : context.activeScenarioId === "B"
                  ? "Scenario B: Setpoint Offset (-6%)"
                  : "Baseline Target"
              }
            />
          </section>
        )}

        {(activeTab === "ALL" || activeTab === "SOLUTIONS") && (
          <section aria-label="Multi-Criteria Solutions Decision Matrix">
            <SolutionsComparison
              solutions={solutions}
              selectedSolutionId={chosenSolution.id}
              onSelectSolution={(id) => {
                orchestrator.setActiveScenario(id);
              }}
              currencySymbol={context.facility.config.currency_symbol}
            />
          </section>
        )}

        {/* 7. Live Agent Activity Stream & Reasoning Terminal */}
        <section aria-label="Agent Activity Stream & Telemetry Logs">
          <AgentThoughtLog
            logs={context.logs}
            currentStage={context.currentStage}
            isRunning={context.isRunningAutonomous}
            aiExplanation={context.aiExplanation}
            aiCitations={context.aiCitations}
            aiSource={context.aiSource}
            investigationInsight={context.investigationInsight}
            investigationCitations={context.investigationCitations}
            investigationSource={context.investigationSource}
          />
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">EnerQ</span>
            <span>•</span>
            <span>Your Autonomous AI Energy Expert & Digital Twin</span>
          </div>
          <div>
            From Energy Data to Intelligent Action • Deterministic Energy Physics + OpenAI RAG Reasoning
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        verification={context.verification}
        config={context.facility.config}
      />

      <FacilitySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        facility={context.facility}
        onSave={(rate, currency, symbol) => {
          orchestrator.updateConfig(rate, currency, symbol);
        }}
      />

      <AgentChatDrawer
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        facility={context.facility}
        solutions={solutions}
      />

      <AuditReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        context={context}
      />
    </div>
  );
}
