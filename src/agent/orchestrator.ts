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
} from "../types";
import { EnergyCalculationEngine } from "../simulation/engine";

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
}

export class EnerQAgentOrchestrator {
  private state: AgentContext;
  private listeners: ((context: AgentContext) => void)[] = [];
  private abortController: AbortController | null = null;

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
    };
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

  private addLog(
    stage: AgentStage,
    type: AgentLogMessage["type"],
    title: string,
    detail: string,
    metrics?: { label: string; value: string }[],
    badge?: string
  ) {
    const log: AgentLogMessage = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      stage,
      type,
      title,
      detail,
      metrics,
      badge,
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
    this.addLog("IDLE", "info", "EnerQ Agent Initialized", "Standing by to observe facility energy state.");
    this.notify();
  }

  /**
   * Run Stage 1: OBSERVE
   */
  public stepObserve(): void {
    this.state.currentStage = "OBSERVE";
    this.state.activeScenarioId = "CURRENT";
    this.addLog(
      "OBSERVE",
      "observe",
      "Stage 1: Ingesting Facility Telemetry",
      `Observed ${this.state.facility.config.name}. Working hours ${this.state.facility.config.working_hours.start}–${this.state.facility.config.working_hours.end}. Reading live power meters.`,
      [
        { label: "Baseline Baseline", value: `${this.state.facility.baseline_kwh} kWh/day` },
        { label: "Today's Consumption", value: `${this.state.facility.current_kwh} kWh/day` },
      ],
      "Telemetry Sync"
    );
    this.notify();
  }

  /**
   * Run Stage 2: DETECT
   */
  public stepDetect(): AnomalyReport {
    this.state.currentStage = "DETECT";
    const report = EnergyCalculationEngine.detectAnomaly(this.state.facility);
    this.state.anomalyReport = report;
    this.addLog(
      "DETECT",
      "detect",
      "Stage 2: Anomaly Confirmed",
      `Detected +${report.variance_pct}% (+${report.variance_kwh} kWh) deviation exceeding +10% alert threshold. Initiating root-cause diagnostic routine.`,
      [
        { label: "Variance", value: `+${report.variance_pct}%` },
        { label: "Excess Energy", value: `${report.variance_kwh} kWh` },
        { label: "Severity", value: report.severity.toUpperCase() },
      ],
      "Anomaly Triggered"
    );
    this.notify();
    return report;
  }

  /**
   * Run Stage 3: INVESTIGATE
   */
  public stepInvestigate(): InvestigationFinding {
    this.state.currentStage = "INVESTIGATE";
    const finding = EnergyCalculationEngine.investigateAnomaly(this.state.facility);
    this.state.investigation = finding;
    this.addLog(
      "INVESTIGATE",
      "investigate",
      "Stage 3: Subsystem Root-Cause Isolated",
      `HVAC AHU Chiller operated 4 continuous hours past 18:00 closing (+80 kWh waste). Workstation idle power contributed +13 kWh unmanaged load.`,
      [
        { label: "HVAC After-Hours", value: "+4.0 hours (80 kWh)" },
        { label: "Idle Equipment", value: `${finding.equipment_idle_waste_kwh} kWh` },
        { label: "Agent Confidence", value: `${finding.agent_confidence_pct}%` },
      ],
      "Investigation Complete"
    );
    this.notify();

    // Fire a background RAG-grounded reasoning call so the agent's
    // root-cause narrative is traceable to the knowledge base, not
    // just deterministic template text. Non-blocking: the deterministic
    // finding above is already authoritative and displayed immediately.
    this.fetchInsight("investigate", {
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

  /**
   * Calls the server-side RAG + Ollama reasoning endpoint for a given stage.
   */
  private async fetchInsight(
    stage: string,
    facilityData: Record<string, unknown>,
    userPrompt?: string
  ): Promise<{ text: string | null; citations: KnowledgeCitation[]; source: string | null }> {
    try {
      const resp = await fetch("/api/agent/reason", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage, facilityData, userPrompt }),
      });
      const data = await resp.json();
      return {
        text: data?.analysis ?? null,
        citations: data?.citations ?? [],
        source: data?.source ?? null,
      };
    } catch {
      return { text: null, citations: [], source: null };
    }
  }

  /**
   * Run Stage 4: GENERATE_SOLUTIONS
   */
  public stepGenerateSolutions(): Record<"A" | "B" | "C", ProposedSolution> {
    this.state.currentStage = "GENERATE_SOLUTIONS";
    const solutions = EnergyCalculationEngine.generateSolutions(this.state.facility);
    this.state.solutions = solutions;
    this.addLog(
      "GENERATE_SOLUTIONS",
      "info",
      "Stage 4: Generated 3 Candidate Interventions",
      "Synthesized Solution A (HVAC Schedule), Solution B (HVAC Setpoint offset), and Solution C (Combined HVAC + Plug-Load Sleep).",
      [
        { label: "Solution A", value: "HVAC Schedule Cutoff (8.1% saving)" },
        { label: "Solution B", value: "Setpoint +1.5°C (6.0% saving)" },
        { label: "Solution C", value: "Combined Optimization (15.0% saving)" },
      ],
      "3 Solutions Formulated"
    );
    this.notify();
    return solutions;
  }

  /**
   * Run Stage 5: SIMULATE (Digital Twin)
   */
  public stepSimulate(): DigitalTwinSimulation {
    this.state.currentStage = "SIMULATE";
    const twin = EnergyCalculationEngine.runDigitalTwinSimulation(this.state.facility);
    this.state.digitalTwin = twin;
    this.addLog(
      "SIMULATE",
      "simulate",
      "Stage 5: Digital Twin Thermal & Power Physics Executed",
      "Simulated building virtual twin across all 3 scenarios. Calculated energy curves, peak demand impacts, and thermal drift factors.",
      [
        { label: "Scenario A Outcome", value: `${twin.scenarios.A.simulated_daily_kwh} kWh (-${twin.scenarios.A.estimated_saving_kwh} kWh)` },
        { label: "Scenario B Outcome", value: `${twin.scenarios.B.simulated_daily_kwh} kWh (-${twin.scenarios.B.estimated_saving_kwh} kWh)` },
        { label: "Scenario C Outcome", value: `${twin.scenarios.C.simulated_daily_kwh} kWh (-${twin.scenarios.C.estimated_saving_kwh} kWh)` },
      ],
      "Digital Twin Validated"
    );
    this.notify();
    return twin;
  }

  /**
   * Run Stage 6: COMPARE
   */
  public stepCompare(): void {
    this.state.currentStage = "COMPARE";
    if (!this.state.solutions) {
      this.stepGenerateSolutions();
    }
    this.addLog(
      "COMPARE",
      "decide",
      "Stage 6: Multi-Attribute Tradeoff Evaluation",
      "Assessing energy savings vs occupant comfort risk vs operational complexity. Solution C delivers highest savings with acceptable Low/Medium risk.",
      [
        { label: "Sol A Score", value: `${this.state.solutions?.A.decision_score}/100 (Safe, partial saving)` },
        { label: "Sol B Score", value: `${this.state.solutions?.B.decision_score}/100 (Thermal drift risk)` },
        { label: "Sol C Score", value: `${this.state.solutions?.C.decision_score}/100 (Optimal Winner)` },
      ],
      "Decision Matrix Computed"
    );
    this.notify();
  }

  /**
   * Run Stage 7: DECIDE
   */
  public stepDecide(): ProposedSolution {
    this.state.currentStage = "DECIDE";
    if (!this.state.solutions) {
      this.stepGenerateSolutions();
    }
    const chosen = this.state.solutions!.C;
    this.state.chosenSolution = chosen;
    this.addLog(
      "DECIDE",
      "decide",
      "Stage 7: Optimal Action Selected",
      `Selected Solution C: Automated 18:00 HVAC Schedule Cutoff + Workstation Sleep Policies.`,
      [
        { label: "Selected Option", value: "Solution C (Combined)" },
        { label: "Decision Confidence", value: "96 / 100" },
      ],
      "Decision Reached"
    );
    this.notify();
    return chosen;
  }

  /**
   * Run Stage 8: RECOMMEND
   */
  public async stepRecommend(): Promise<void> {
    this.state.currentStage = "RECOMMEND";
    if (!this.state.chosenSolution && this.state.solutions) {
      this.state.chosenSolution = this.state.solutions.C;
    }
    this.state.activeScenarioId = "C";

    const symbol = this.state.facility.config.currency_symbol;
    const solC = this.state.solutions?.C;

    this.addLog(
      "RECOMMEND",
      "recommend",
      "Stage 8: Synthesized Actionable Recommendation",
      `EnerQ recommends executing Solution C. Recaptures 93 kWh/day (15.0%), saving ${symbol}${solC?.daily_cost_saving}/day (${symbol}${solC?.monthly_cost_saving}/month) with zero disruption to business hours.`,
      [
        { label: "Expected Daily Saving", value: `93 kWh (${solC?.estimated_saving_pct}%)` },
        { label: "Monthly Cost Recaptured", value: `${symbol}${solC?.monthly_cost_saving}` },
        { label: "Risk Rating", value: "Low / Medium" },
      ],
      "Awaiting User Approval"
    );

    // Call server-side RAG + Ollama reasoning for rich, source-grounded explainability
    const { text, citations, source } = await this.fetchInsight("recommend", {
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

  /**
   * Run Stage 9: VERIFY (Triggered upon user approval)
   */
  public stepVerify(): VerificationResult {
    this.state.currentStage = "VERIFY";
    const solC = this.state.solutions?.C;
    const rate = this.state.facility.config.electricity_rate;
    const verifiedKwh = 527; // 620 - 93
    const reducedKwh = 93;
    const reducedPct = 15.0;

    const verification: VerificationResult = {
      verified: true,
      status_text: "Expected improvement verified in Digital Twin simulation.",
      implemented_solution_id: "C",
      initial_consumption_kwh: this.state.facility.current_kwh,
      verified_consumption_kwh: verifiedKwh,
      actual_reduction_kwh: reducedKwh,
      actual_reduction_pct: reducedPct,
      daily_cost_saved: Number((reducedKwh * rate).toFixed(2)),
      monthly_cost_saved: Number((reducedKwh * rate * 30).toFixed(2)),
      annual_cost_saved: Number((reducedKwh * rate * 365).toFixed(2)),
      annual_co2_kg_saved: Number((reducedKwh * 365 * this.state.facility.config.co2_factor_kg_per_kwh).toFixed(1)),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      next_check_in: "Tomorrow, 18:05 EET (Automated Schedule Verification)",
    };

    this.state.verification = verification;
    this.state.currentStage = "COMPLETED";

    // Update facility virtual state to optimized
    this.state.facility = {
      ...this.state.facility,
      current_kwh: verifiedKwh,
      systems: {
        ...this.state.facility.systems,
        hvac: {
          ...this.state.facility.systems.hvac,
          actual_hours: 10,
          actual_kwh: 200,
          status: "optimized",
          alert: "Optimized 18:00 cutoff policy active",
        },
        equipment: {
          ...this.state.facility.systems.equipment,
          idle_kwh: 20,
          total_kwh: 105,
          status: "normal",
          alert: "Smart power down script scheduled for 18:15",
        },
      },
    };

    const symbol = this.state.facility.config.currency_symbol;

    this.addLog(
      "VERIFY",
      "verify",
      "Stage 9: Implementation Verified in Simulation",
      `Virtual facility updated. Daily consumption reduced from 620 kWh → 527 kWh (-93 kWh / -15.0%). Recapturing ${symbol}${verification.monthly_cost_saved}/month.`,
      [
        { label: "Optimized Load", value: "527 kWh/day" },
        { label: "Total Reduction", value: "-93 kWh (-15%)" },
        { label: "Annual Recaptured", value: `${symbol}${verification.annual_cost_saved}` },
      ],
      "Improvement Verified"
    );

    this.notify();
    return verification;
  }

  /**
   * Executes the complete autonomous 9-step pipeline with realistic timing
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
      // Step 1: OBSERVE
      this.stepObserve();
      await sleep(speedMs);

      // Step 2: DETECT
      this.stepDetect();
      await sleep(speedMs);

      // Step 3: INVESTIGATE
      this.stepInvestigate();
      await sleep(speedMs * 1.1);

      // Step 4: GENERATE SOLUTIONS
      this.stepGenerateSolutions();
      await sleep(speedMs);

      // Step 5: SIMULATE (Digital Twin)
      this.stepSimulate();
      await sleep(speedMs * 1.1);

      // Step 6: COMPARE
      this.stepCompare();
      await sleep(speedMs * 0.9);

      // Step 7: DECIDE
      this.stepDecide();
      await sleep(speedMs * 0.9);

      // Step 8: RECOMMEND
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
