import {
  AgentStage,
  FacilityState,
  AnomalyReport,
  InvestigationFinding,
  ProposedSolution,
  DigitalTwinSimulation,
  VerificationResult,
  AgentLogMessage,
  KnowledgeCitation,
  FollowUpState,
} from "../types";
import { EnergyCalculationEngine } from "../simulation/engine";
import { ObserverAgent } from "./agents/observerAgent";
import { DiagnosticAgent } from "./agents/diagnosticAgent";
import { SimulationAgent } from "./agents/simulationAgent";
import { ActionAgent } from "./agents/actionAgent";
import { fetchInsight } from "./agents/reasoningClient";
import { AgentLogPayload } from "./agents/types";

// Demo-compressed follow-up timing: in a real deployment these would be
// hours/days, not seconds. Kept short and clearly labeled so the agent's
// "does not forget about the problem" behavior is actually observable
// during a live demo instead of requiring you to wait real days.
const REMINDER_DELAY_MS = 16000;
const ESCALATION_DELAY_MS = 30000;
const AUTONOMOUS_EXECUTION_DELAY_MS = 3500;

export type AutonomyMode = "approval" | "autonomous";

export interface AgentContext {
  facility: FacilityState;
  currentStage: AgentStage;
  anomalyReport: AnomalyReport | null;
  investigation: InvestigationFinding | null;
  solutions: Record<"A" | "B" | "C", ProposedSolution> | null;
  digitalTwin: DigitalTwinSimulation | null;
  chosenSolution: ProposedSolution | null;
  verification: VerificationResult | null;
  aiExplanation: string | null;
  aiCitations: KnowledgeCitation[];
  aiSource: string | null;
  investigationInsight: string | null;
  investigationCitations: KnowledgeCitation[];
  investigationSource: string | null;
  logs: AgentLogMessage[];
  isRunningAutonomous: boolean;
  activeScenarioId: "BASELINE" | "CURRENT" | "A" | "B" | "C";
  followUp: FollowUpState;
  autonomyMode: AutonomyMode;
}

/**
 * EnerQAgentOrchestrator -- the coordinator, not a fifth agent.
 *
 * It owns the shared AgentContext (the one thing every specialist agent
 * needs to read from and write into), the pub/sub that keeps the React
 * UI in sync, and the timing/sequencing of a pipeline run. All of the
 * actual domain reasoning for each of the 9 stages lives in one of four
 * focused agents under ./agents/ -- each handles 2-3 stages:
 *
 *   ObserverAgent    -- OBSERVE, DETECT            (src/agent/agents/observerAgent.ts)
 *   DiagnosticAgent  -- INVESTIGATE, GENERATE_SOLUTIONS (diagnosticAgent.ts)
 *   SimulationAgent  -- SIMULATE, COMPARE, DECIDE   (simulationAgent.ts)
 *   ActionAgent      -- RECOMMEND, VERIFY           (actionAgent.ts)
 *
 * Splitting it this way means each agent file is small enough to read
 * end-to-end in a couple of minutes, and each one is independently
 * swappable -- e.g. ObserverAgent is the one piece you'd replace to
 * point at a real BMS/IoT feed instead of mock telemetry.
 */
export class EnerQAgentOrchestrator {
  private state: AgentContext;
  private listeners: ((context: AgentContext) => void)[] = [];
  private abortController: AbortController | null = null;
  private reminderTimer: ReturnType<typeof setTimeout> | null = null;
  private escalationTimer: ReturnType<typeof setTimeout> | null = null;
  private autoExecuteTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(initialFacility: FacilityState) {
    this.state = {
      facility: initialFacility,
      currentStage: "IDLE",
      anomalyReport: null,
      investigation: null,
      solutions: null,
      digitalTwin: null,
      chosenSolution: null,
      verification: null,
      aiExplanation: null,
      aiCitations: [],
      aiSource: null,
      investigationInsight: null,
      investigationCitations: [],
      investigationSource: null,
      logs: [],
      isRunningAutonomous: false,
      activeScenarioId: "CURRENT",
      followUp: { status: "idle", responsibleTeam: "Facilities & Operations Team", reminderCount: 0 },
      autonomyMode: "approval",
    };
  }

  public setAutonomyMode(mode: AutonomyMode) {
    this.state.autonomyMode = mode;
    this.notify();
  }

  private clearFollowUpTimers() {
    if (this.reminderTimer) {
      clearTimeout(this.reminderTimer);
      this.reminderTimer = null;
    }
    if (this.escalationTimer) {
      clearTimeout(this.escalationTimer);
      this.escalationTimer = null;
    }
    if (this.autoExecuteTimer) {
      clearTimeout(this.autoExecuteTimer);
      this.autoExecuteTimer = null;
    }
  }

  /**
   * Starts ActionAgent's follow-up loop after a recommendation is issued.
   * This is what separates EnerQ from a one-shot recommendation system:
   * if nobody acts, the agent reminds, then escalates -- it doesn't just
   * post an alert and move on.
   */
  private startFollowUp() {
    this.clearFollowUpTimers();
    this.state.followUp = {
      status: "pending",
      responsibleTeam: "Facilities & Operations Team",
      reminderCount: 0,
    };

    this.reminderTimer = setTimeout(() => {
      if (this.state.currentStage === "COMPLETED") return;
      const solC = this.state.chosenSolution || this.state.solutions?.C;
      const symbol = this.state.facility.config.currency_symbol;
      const hourlyWaste = solC ? Number((solC.daily_cost_saving / 24).toFixed(2)) : null;
      this.state.followUp = { ...this.state.followUp, status: "reminded", reminderCount: this.state.followUp.reminderCount + 1 };
      this.pushLog("RECOMMEND", "info", ActionAgent.reminderLog(this.state.followUp.responsibleTeam, hourlyWaste, symbol));
      this.notify();

      this.escalationTimer = setTimeout(() => {
        if (this.state.currentStage === "COMPLETED") return;
        const dailyWaste = solC ? `${symbol}${solC.daily_cost_saving}/day` : "accumulating waste";
        this.state.followUp = { ...this.state.followUp, status: "escalated" };
        this.pushLog("RECOMMEND", "info", ActionAgent.escalationLog(dailyWaste));
        this.notify();
      }, ESCALATION_DELAY_MS - REMINDER_DELAY_MS);
    }, REMINDER_DELAY_MS);
  }

  public subscribe(listener: (context: AgentContext) => void): () => void {
    this.listeners.push(listener);
    listener(this.state);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener({ ...this.state }));
  }

  public getContext(): AgentContext {
    return { ...this.state };
  }

  /** Merges one agent's log payload into a full, displayable AgentLogMessage. */
  private pushLog(stage: AgentStage, type: AgentLogMessage["type"], payload: AgentLogPayload) {
    const log: AgentLogMessage = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      stage,
      type,
      title: payload.title,
      detail: payload.detail,
      metrics: payload.metrics,
      badge: payload.badge,
    };
    this.state.logs = [log, ...this.state.logs];
  }

  /**
   * Resets agent state to beginning
   */
  public reset(facility?: FacilityState) {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.clearFollowUpTimers();
    this.state.followUp = { status: "idle", responsibleTeam: "Facilities & Operations Team", reminderCount: 0 };
    if (facility) {
      this.state.facility = facility;
    }
    this.state.currentStage = "IDLE";
    this.state.anomalyReport = null;
    this.state.investigation = null;
    this.state.solutions = null;
    this.state.digitalTwin = null;
    this.state.chosenSolution = null;
    this.state.verification = null;
    this.state.aiExplanation = null;
    this.state.aiCitations = [];
    this.state.aiSource = null;
    this.state.investigationInsight = null;
    this.state.investigationCitations = [];
    this.state.investigationSource = null;
    this.state.isRunningAutonomous = false;
    this.state.activeScenarioId = "CURRENT";
    this.state.logs = [];
    this.pushLog("IDLE", "info", { title: "EnerQ Agent Initialized", detail: "Standing by to observe facility energy state." });
    this.notify();
  }

  /** Stage 1 -- delegates to ObserverAgent */
  public stepObserve(): void {
    this.state.currentStage = "OBSERVE";
    this.state.activeScenarioId = "CURRENT";
    const { log } = ObserverAgent.observe(this.state.facility);
    this.pushLog("OBSERVE", "observe", log);
    this.notify();
  }

  /** Stage 2 -- delegates to ObserverAgent */
  public stepDetect(): AnomalyReport {
    this.state.currentStage = "DETECT";
    const { report, log } = ObserverAgent.detect(this.state.facility);
    this.state.anomalyReport = report;
    this.pushLog("DETECT", "detect", log);
    this.notify();
    return report;
  }

  /** Stage 3 -- delegates to DiagnosticAgent */
  public stepInvestigate(): InvestigationFinding {
    this.state.currentStage = "INVESTIGATE";
    const { finding, log } = DiagnosticAgent.investigate(this.state.facility);
    this.state.investigation = finding;
    this.pushLog("INVESTIGATE", "investigate", log);
    this.notify();

    // Fire a background RAG-grounded reasoning call so the agent's
    // root-cause narrative is traceable to the knowledge base, not
    // just deterministic template text. Non-blocking: the deterministic
    // finding above is already authoritative and displayed immediately.
    fetchInsight("investigate", {
      name: this.state.facility.config.name,
      baseline_kwh: this.state.facility.baseline_kwh,
      current_kwh: this.state.facility.current_kwh,
      variance_pct: this.state.anomalyReport?.variance_pct || 24,
      working_hours: this.state.facility.config.working_hours,
      hvac: this.state.facility.systems.hvac,
    }).then(({ text, citations, source }) => {
      this.state.investigationInsight = text;
      this.state.investigationCitations = citations;
      this.state.investigationSource = source;
      this.notify();
    });

    return finding;
  }

  /** Stage 4 -- delegates to DiagnosticAgent */
  public stepGenerateSolutions(): Record<"A" | "B" | "C", ProposedSolution> {
    this.state.currentStage = "GENERATE_SOLUTIONS";
    const { solutions, log } = DiagnosticAgent.generateSolutions(this.state.facility);
    this.state.solutions = solutions;
    this.pushLog("GENERATE_SOLUTIONS", "info", log);
    this.notify();
    return solutions;
  }

  /** Stage 5 -- delegates to SimulationAgent */
  public stepSimulate(): DigitalTwinSimulation {
    this.state.currentStage = "SIMULATE";
    const { twin, log } = SimulationAgent.simulate(this.state.facility);
    this.state.digitalTwin = twin;
    this.pushLog("SIMULATE", "simulate", log);
    this.notify();
    return twin;
  }

  /** Stage 6 -- delegates to SimulationAgent */
  public stepCompare(): void {
    this.state.currentStage = "COMPARE";
    if (!this.state.solutions) {
      this.stepGenerateSolutions();
    }
    const { log } = SimulationAgent.compare(this.state.solutions!);
    this.pushLog("COMPARE", "decide", log);
    this.notify();
  }

  /** Stage 7 -- delegates to SimulationAgent */
  public stepDecide(): ProposedSolution {
    this.state.currentStage = "DECIDE";
    if (!this.state.solutions) {
      this.stepGenerateSolutions();
    }
    const { chosen, log } = SimulationAgent.decide(this.state.solutions!);
    this.state.chosenSolution = chosen;
    this.pushLog("DECIDE", "decide", log);
    this.notify();
    return chosen;
  }

  /** Stage 8 -- delegates to ActionAgent */
  public async stepRecommend(): Promise<void> {
    this.state.currentStage = "RECOMMEND";
    if (!this.state.chosenSolution && this.state.solutions) {
      const { A, B, C } = this.state.solutions;
      this.state.chosenSolution = [A, B, C].reduce((best, s) => (s.decision_score > best.decision_score ? s : best));
    }
    const chosen = this.state.chosenSolution!;
    this.state.activeScenarioId = (chosen?.id as "A" | "B" | "C") ?? "C";

    const isAutonomous = this.state.autonomyMode === "autonomous";
    const { log, autonomousLog } = ActionAgent.recommend(
      chosen,
      this.state.facility,
      this.state.followUp.responsibleTeam,
      isAutonomous
    );
    this.pushLog("RECOMMEND", "recommend", log);

    if (isAutonomous && autonomousLog) {
      this.pushLog("RECOMMEND", "info", autonomousLog);
      this.autoExecuteTimer = setTimeout(() => {
        this.stepVerify();
      }, AUTONOMOUS_EXECUTION_DELAY_MS);
    } else {
      this.startFollowUp();
    }

    // Call server-side RAG + Ollama reasoning for rich, source-grounded explainability
    const { text, citations, source } = await fetchInsight("recommend", {
      name: this.state.facility.config.name,
      baseline_kwh: this.state.facility.baseline_kwh,
      current_kwh: this.state.facility.current_kwh,
      variance_pct: this.state.anomalyReport?.variance_pct || 24,
      working_hours: this.state.facility.config.working_hours,
      hvac: this.state.facility.systems.hvac,
    });
    if (text) {
      this.state.aiExplanation = text;
      this.state.aiCitations = citations;
      this.state.aiSource = source;
    }

    this.notify();
  }

  /** Stage 9 -- delegates to ActionAgent (triggered on approval or autonomous execution) */
  public stepVerify(): VerificationResult {
    this.clearFollowUpTimers();
    this.state.followUp = { ...this.state.followUp, status: "resolved" };
    this.state.currentStage = "VERIFY";
    const chosen = this.state.chosenSolution || this.state.solutions?.C;
    const { verification, updatedFacility, log } = ActionAgent.verify(chosen, this.state.facility);

    this.state.verification = verification;
    this.state.currentStage = "COMPLETED";
    this.state.facility = updatedFacility;
    this.pushLog("VERIFY", "verify", log);

    this.notify();
    return verification;
  }

  /**
   * Executes the complete autonomous 9-step pipeline with realistic timing,
   * handing off to each specialist agent in turn.
   */
  public async runAutonomousPipeline(speedMs = 1200): Promise<void> {
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    this.state.isRunningAutonomous = true;
    this.notify();

    const sleep = (ms: number) =>
      new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => resolve(), ms);
        signal.addEventListener("abort", () => {
          clearTimeout(timeout);
          reject(new Error("aborted"));
        });
      });

    try {
      // ObserverAgent
      this.stepObserve();
      await sleep(speedMs);
      this.stepDetect();
      await sleep(speedMs);

      // DiagnosticAgent
      this.stepInvestigate();
      await sleep(speedMs * 1.1);
      this.stepGenerateSolutions();
      await sleep(speedMs);

      // SimulationAgent
      this.stepSimulate();
      await sleep(speedMs * 1.1);
      this.stepCompare();
      await sleep(speedMs * 0.9);
      this.stepDecide();
      await sleep(speedMs * 0.9);

      // ActionAgent
      await this.stepRecommend();
      this.state.isRunningAutonomous = false;
      this.notify();
    } catch (e: any) {
      if (e.message !== "aborted") {
        console.error("Pipeline error:", e);
      }
      this.state.isRunningAutonomous = false;
      this.notify();
    }
  }

  /**
   * Sets active scenario for visualization
   */
  public setActiveScenario(scenarioId: "BASELINE" | "CURRENT" | "A" | "B" | "C") {
    this.state.activeScenarioId = scenarioId;
    this.notify();
  }

  /**
   * Update facility configuration (e.g. electricity price, currency)
   */
  public updateConfig(electricityRate: number, currency: string, currencySymbol: string) {
    this.state.facility.config.electricity_rate = electricityRate;
    this.state.facility.config.currency = currency;
    this.state.facility.config.currency_symbol = currencySymbol;

    // Recalculate solutions if present
    if (this.state.solutions) {
      this.state.solutions = EnergyCalculationEngine.generateSolutions(this.state.facility);
      if (this.state.chosenSolution) {
        this.state.chosenSolution = this.state.solutions[this.state.chosenSolution.id];
      }
    }
    if (this.state.digitalTwin) {
      this.state.digitalTwin = EnergyCalculationEngine.runDigitalTwinSimulation(this.state.facility);
    }
    this.notify();
  }
}
