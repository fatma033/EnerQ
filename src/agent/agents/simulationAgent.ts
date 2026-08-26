import { DigitalTwinSimulation, FacilityState, ProposedSolution } from "../../types";
import { EnergyCalculationEngine } from "../../simulation/engine";
import { AgentLogPayload } from "./types";

type Solutions = Record<"A" | "B" | "C", ProposedSolution>;

/**
 * SimulationAgent -- Stages 5-7 (SIMULATE, COMPARE, DECIDE).
 *
 * Runs every candidate through the facility's Digital Twin physics
 * model, scores them on the same weighted multi-criteria formula (60%
 * savings / 30% risk / 10% comfort — see engine.ts), and picks a winner.
 * This is the agent that actually decides -- DECIDE never hardcodes a
 * winner, it always takes whichever candidate scored highest.
 */
export class SimulationAgent {
  static simulate(facility: FacilityState): { twin: DigitalTwinSimulation; log: AgentLogPayload } {
    const twin = EnergyCalculationEngine.runDigitalTwinSimulation(facility);
    return {
      twin,
      log: {
        title: "Stage 5: Digital Twin Thermal & Power Physics Executed",
        detail: "Simulated building virtual twin across all 3 scenarios. Calculated energy curves, peak demand impacts, and thermal drift factors.",
        metrics: [
          { label: "Scenario A Outcome", value: `${twin.scenarios.A.simulated_daily_kwh} kWh (-${twin.scenarios.A.estimated_saving_kwh} kWh)` },
          { label: "Scenario B Outcome", value: `${twin.scenarios.B.simulated_daily_kwh} kWh (-${twin.scenarios.B.estimated_saving_kwh} kWh)` },
          { label: "Scenario C Outcome", value: `${twin.scenarios.C.simulated_daily_kwh} kWh (-${twin.scenarios.C.estimated_saving_kwh} kWh)` },
        ],
        badge: "Digital Twin Validated",
      },
    };
  }

  static compare(solutions: Solutions): { leader: ProposedSolution; log: AgentLogPayload } {
    const { A, B, C } = solutions;
    const leader = [A, B, C].reduce((best, s) => (s.decision_score > best.decision_score ? s : best));
    return {
      leader,
      log: {
        title: "Stage 6: Multi-Attribute Tradeoff Evaluation",
        detail: `Weighted scoring across energy savings (60%), operational risk (30%), and occupant comfort (10%). Solution ${leader.id} scores highest at ${leader.decision_score}/100.`,
        metrics: [
          { label: "Sol A Score", value: `${A.decision_score}/100${A.id === leader.id ? " (Leading)" : ""}` },
          { label: "Sol B Score", value: `${B.decision_score}/100${B.id === leader.id ? " (Leading)" : ""}` },
          { label: "Sol C Score", value: `${C.decision_score}/100${C.id === leader.id ? " (Leading)" : ""}` },
        ],
        badge: "Decision Matrix Computed",
      },
    };
  }

  static decide(solutions: Solutions): { chosen: ProposedSolution; log: AgentLogPayload } {
    const { A, B, C } = solutions;
    // Actually select the highest-scoring candidate -- not hardcoded to any
    // particular id -- so the decision follows whatever the multi-criteria
    // engine computed for the current facility/solution parameters.
    const chosen = [A, B, C].reduce((best, s) => (s.decision_score > best.decision_score ? s : best));
    return {
      chosen,
      log: {
        title: "Stage 7: Optimal Action Selected",
        detail: `Selected Solution ${chosen.id}: ${chosen.name}.`,
        metrics: [
          { label: "Selected Option", value: `Solution ${chosen.id} (${chosen.short_label})` },
          { label: "Decision Confidence", value: `${chosen.decision_score} / 100` },
        ],
        badge: "Decision Reached",
      },
    };
  }
}
