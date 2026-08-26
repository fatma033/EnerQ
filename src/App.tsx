import React, { useEffect, useState, useMemo } from "react";
import { Header } from "./components/Header";
import { PageNav, PageId } from "./components/PageNav";
import { AgentChatPanel } from "./components/AgentChatPanel";
import { AgentStatusTimeline } from "./components/AgentStatusTimeline";
import { AnomalyBanner } from "./components/AnomalyBanner";
import { DigitalTwinView } from "./components/DigitalTwinView";
import { LoadCurveChart } from "./components/LoadCurveChart";
import { SolutionsComparison } from "./components/SolutionsComparison";
import { RecommendationCard } from "./components/RecommendationCard";
import { AgentThoughtLog } from "./components/AgentThoughtLog";
import { VerificationModal } from "./components/VerificationModal";
import { FacilitySettingsModal } from "./components/FacilitySettingsModal";
import { AuditReportModal } from "./components/AuditReportModal";
import { ReportsAgentModal } from "./components/ReportsAgentModal";
import { EnerQAgentOrchestrator, AgentContext } from "./agent/orchestrator";
import { initialFacilityData } from "./data/mockFacility";
import { EnergyCalculationEngine } from "./simulation/engine";
import { AgentStage } from "./types";
import { Language, getTranslation } from "./i18n";

export default function App() {
  // Initialize Orchestrator instance
  const orchestrator = useMemo(() => new EnerQAgentOrchestrator(initialFacilityData), []);
  const [context, setContext] = useState<AgentContext>(orchestrator.getContext());

  // Modal states
  const [isVerificationOpen, setIsVerificationOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isReportsAgentOpen, setIsReportsAgentOpen] = useState(false);
  const [isSimulatingTwin, setIsSimulatingTwin] = useState(false);
  const [engineStatus, setEngineStatus] = useState<{ provider: string; model: string; hasApiKey: boolean } | null>(null);

  // Page: the chat ("home") is the landing page and the one most people
  // will actually be evaluated through -- everything else is one click
  // away, not stacked underneath it on one long scrolling page. All pages
  // stay mounted (toggled via CSS, not conditional render) so chat history,
  // Digital Twin slider positions, etc. survive navigating away and back.
  const [page, setPage] = useState<PageId>("home");

  // Theme: defaults to dark (the tested, primary experience), persisted across visits
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("enerq-theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("enerq-theme", theme);
  }, [theme]);

  // Language: see src/i18n.ts for scope. Layout stays LTR in both languages.
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    return (localStorage.getItem("enerq-lang") as Language) || "en";
  });
  const t = getTranslation(language);

  useEffect(() => {
    localStorage.setItem("enerq-lang", language);
  }, [language]);

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

  // Auto-open the Verification modal whenever the pipeline reaches COMPLETED,
  // whether that came from a manual Approve click or an autonomous
  // (Level 3) auto-execution — the confirmation moment matters either way.
  useEffect(() => {
    if (context.currentStage === "COMPLETED") {
      setIsVerificationOpen(true);
    }
  }, [context.currentStage]);

  // Handler: Run full autonomous 9-step pipeline. Navigates to Dashboard
  // first -- these are header buttons reachable from every page, and
  // triggering the pipeline while looking at, say, Solutions would run it
  // invisibly with nothing on screen to show for it.
  const handleRunFullAnalysis = () => {
    setPage("dashboard");
    orchestrator.runAutonomousPipeline(1100);
  };

  // Handler: Reset agent state
  const handleReset = () => {
    setPage("dashboard");
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

  // Handler: Trigger Digital Twin Simulation manually. Stays on the Twin
  // page -- it leads its own process and shows its own progress (see the
  // compact stage strip in DigitalTwinView) rather than bouncing the user
  // away to watch it happen somewhere else.
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

  // Handler: navigate to any page, optionally revealing a specific Digital
  // Twin scenario there. This is the single entry point every "take me
  // there" affordance in the app uses -- Solutions cards, chat suggestions,
  // and the Run Simulation button all funnel through it.
  const handleNavigate = (targetPage: PageId, scenario?: "A" | "B" | "C") => {
    if (scenario) {
      orchestrator.setActiveScenario(scenario);
      setIsSimulatingTwin(true);
      setTimeout(() => setIsSimulatingTwin(false), 700);
    }
    setPage(targetPage);
  };

  // 24-hour hourly profile computed dynamically
  const hourlyData = useMemo(() => {
    return EnergyCalculationEngine.generateHourlyProfile(context.facility, context.activeScenarioId);
  }, [context.facility, context.activeScenarioId]);

  // Solutions generated
  const solutions = useMemo(() => {
    return context.solutions || EnergyCalculationEngine.generateSolutions(context.facility);
  }, [context.solutions, context.facility]);

  // The best-scoring candidate, computed — not assumed to be any particular id
  const bestSolution = useMemo(() => {
    return [solutions.A, solutions.B, solutions.C].reduce((best, s) => (s.decision_score > best.decision_score ? s : best));
  }, [solutions]);

  const chosenSolution = context.chosenSolution || bestSolution;

  const isVerified = context.currentStage === "COMPLETED" || !!context.verification;

  const show = (p: PageId) => (page === p ? "block" : "hidden");

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
        onOpenReportsAgent={() => setIsReportsAgentOpen(true)}
        onSetAutonomyMode={(mode) => orchestrator.setAutonomyMode(mode)}
        theme={theme}
        onToggleTheme={() => setTheme((prev) => (prev === "dark" ? "light" : "dark"))}
        t={t}
        language={language}
        onToggleLanguage={() => setLanguage((prev) => (prev === "en" ? "ar" : "en"))}
      />

      {/* 2. Page Navigation */}
      <PageNav page={page} onNavigate={setPage} t={t} />

      {/* 3. Pages — all mounted, toggled via CSS so state survives navigation */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col min-h-0">
        {/* Home: the chat, the star of the show. Constrained to a centered
            column (ChatGPT-style) instead of stretching edge-to-edge across
            the full 7xl container -- reads as a focused conversation, not a
            form filling the whole viewport width on a wide screen. */}
        <div className={`${show("home")} flex flex-col flex-1 min-h-[70vh] items-center`}>
          <div className="flex flex-col flex-1 w-full max-w-3xl min-h-0">
            <div className="mb-3 text-center">
              <h1 className="text-lg font-bold text-white tracking-tight">{t.home.heading}</h1>
              <p className="text-xs text-slate-400 mt-0.5">{t.home.subheading}</p>
            </div>
            <AgentChatPanel
              facility={context.facility}
              solutions={solutions}
              t={t}
              language={language}
              onNavigate={handleNavigate}
              variant="page"
            />
          </div>
        </div>

        {/* Dashboard: pipeline timeline, anomaly, recommendation, activity log */}
        <div className={`${show("dashboard")} space-y-6`}>
          <section aria-label="Agent Pipeline Timeline">
            <AgentStatusTimeline
              currentStage={context.currentStage}
              onSelectStage={handleSelectStage}
              isRunning={context.isRunningAutonomous}
              t={t}
            />
          </section>

          <section aria-label="Energy Anomaly Overview">
            <AnomalyBanner
              facility={context.facility}
              anomaly={context.anomalyReport}
              recommendedSolution={bestSolution}
              verification={context.verification}
              onInvestigate={() => orchestrator.stepInvestigate()}
              onSimulate={() => handleNavigate("twin")}
              isVerified={isVerified}
              t={t}
            />
          </section>

          {(context.currentStage === "DECIDE" ||
            context.currentStage === "RECOMMEND" ||
            context.currentStage === "VERIFY" ||
            context.currentStage === "COMPLETED") && (
            <section aria-label="EnerQ Autonomous Recommendation">
              <RecommendationCard
                solution={chosenSolution}
                facility={context.facility}
                followUp={context.followUp}
                autonomyMode={context.autonomyMode}
                onApprove={handleApprove}
                onReviewAlternatives={() => setPage("solutions")}
                isVerified={isVerified}
                t={t}
                language={language}
              />
            </section>
          )}

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
              t={t}
            />
          </section>
        </div>

        {/* Digital Twin: leads its own page, full focus */}
        <div className={show("twin")} aria-label="Facility Digital Twin Model">
          <DigitalTwinView
            facility={context.facility}
            solutions={solutions}
            activeScenario={context.activeScenarioId}
            onSelectScenario={(scenario) => orchestrator.setActiveScenario(scenario)}
            onRunSimulation={handleRunTwinSimulation}
            isSimulating={isSimulatingTwin}
            isVerified={isVerified}
            onApprove={handleApprove}
            t={t}
            language={language}
            currentStage={context.currentStage}
            isRunningAutonomous={context.isRunningAutonomous}
          />
        </div>

        {/* Solutions comparison */}
        <div className={show("solutions")} aria-label="Multi-Criteria Solutions Decision Matrix">
          <SolutionsComparison
            solutions={solutions}
            selectedSolutionId={chosenSolution.id}
            onSelectSolution={(id) => handleNavigate("twin", id)}
            currencySymbol={context.facility.config.currency_symbol}
            t={t}
            language={language}
          />
        </div>

        {/* Analytics: 24h load curve */}
        <div className={show("analytics")} aria-label="24-Hour Hourly Load Curve Analytics">
          <LoadCurveChart
            hourlyData={hourlyData}
            activeScenarioName={
              context.activeScenarioId === "C"
                ? t.loadCurve.scenarioNames.C
                : context.activeScenarioId === "A"
                ? t.loadCurve.scenarioNames.A
                : context.activeScenarioId === "B"
                ? t.loadCurve.scenarioNames.B
                : t.loadCurve.scenarioNames.baseline
            }
            t={t}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950 py-4 px-4 sm:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">EnerQ</span>
            <span>•</span>
            <span>{t.footer.tagline}</span>
          </div>
          <div>
            {t.footer.note}
          </div>
        </div>
      </footer>

      {/* Modals */}
      <VerificationModal
        isOpen={isVerificationOpen}
        onClose={() => setIsVerificationOpen(false)}
        verification={context.verification}
        config={context.facility.config}
        t={t}
      />

      <FacilitySettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        facility={context.facility}
        onSave={(rate, currency, symbol) => {
          orchestrator.updateConfig(rate, currency, symbol);
        }}
        t={t}
      />

      <AuditReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        context={context}
        t={t}
      />

      <ReportsAgentModal
        isOpen={isReportsAgentOpen}
        onClose={() => setIsReportsAgentOpen(false)}
        facility={context.facility}
        solution={chosenSolution}
        t={t}
      />
    </div>
  );
}
