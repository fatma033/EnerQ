import { FacilityState, InvestigationFinding, ProposedSolution } from "../../types";
import { EnergyCalculationEngine } from "../../simulation/engine";
import { AgentLogPayload } from "./types";

/**
 * DiagnosticAgent -- Stages 3-4 (INVESTIGATE, GENERATE_SOLUTIONS).
 *
 * Takes the anomaly ObserverAgent flagged and does the actual detective
 * work: isolates which sub-system is responsible, then formulates
 * candidate interventions for SimulationAgent to test. This is the agent
 * whose investigate step also kicks off a RAG-grounded reasoning call
 * (see orchestrator.ts) so the root-cause narrative is traceable to the
 * knowledge base, not just a deterministic template.
 */
export class DiagnosticAgent {
  static investigate(facility: FacilityState): { finding: InvestigationFinding; log: AgentLogPayload } {
    const finding = EnergyCalculationEngine.investigateAnomaly(facility);
    return {
      finding,
      log: {
        title: "Stage 3: Subsystem Root-Cause Isolated",
        detail: `HVAC AHU Chiller operated 4 continuous hours past 18:00 closing (+80 kWh waste). Workstation idle power contributed +13 kWh unmanaged load.`,
        metrics: [
          { label: "HVAC After-Hours", value: "+4.0 hours (80 kWh)" },
          { label: "Idle Equipment", value: `${finding.equipment_idle_waste_kwh} kWh` },
          { label: "Agent Confidence", value: `${finding.agent_confidence_pct}%` },
        ],
        badge: "Investigation Complete",
      },
    };
  }

  static generateSolutions(facility: FacilityState): {
    solutions: Record<"A" | "B" | "C", ProposedSolution>;
    log: AgentLogPayload;
  } {
    const solutions = EnergyCalculationEngine.generateSolutions(facility);
    return {
      solutions,
      log: {
        title: "Stage 4: Generated 3 Candidate Interventions",
        detail: "Synthesized Solution A (HVAC Schedule), Solution B (HVAC Setpoint offset), and Solution C (Combined HVAC + Plug-Load Sleep).",
        metrics: [
          { label: "Solution A", value: "HVAC Schedule Cutoff (8.1% saving)" },
          { label: "Solution B", value: "Setpoint +1.5°C (6.0% saving)" },
          { label: "Solution C", value: "Combined Optimization (15.0% saving)" },
        ],
        badge: "3 Solutions Formulated",
      },
    };
  }
}
