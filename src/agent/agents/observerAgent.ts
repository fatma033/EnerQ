import { FacilityState, AnomalyReport } from "../../types";
import { EnergyCalculationEngine } from "../../simulation/engine";
import { AgentLogPayload } from "./types";

/**
 * ObserverAgent -- Stages 1-2 (OBSERVE, DETECT).
 *
 * Ingests live facility telemetry and flags whether today's consumption
 * has crossed the anomaly threshold. This is the agent that's always
 * "on" -- it's the entry point for every pipeline run and the one a
 * human would swap out first to point at a real BMS/IoT feed instead of
 * mock data (see server.ts's isOllamaReachable() pattern for how a real
 * telemetry adapter would slot in the same way).
 */
export class ObserverAgent {
  static observe(facility: FacilityState): { log: AgentLogPayload } {
    return {
      log: {
        title: "Stage 1: Ingesting Facility Telemetry",
        detail: `Observed ${facility.config.name}. Working hours ${facility.config.working_hours.start}–${facility.config.working_hours.end}. Reading live power meters.`,
        metrics: [
          { label: "30-Day Baseline", value: `${facility.baseline_kwh} kWh/day` },
          { label: "Today's Consumption", value: `${facility.current_kwh} kWh/day` },
        ],
        badge: "Telemetry Sync",
      },
    };
  }

  static detect(facility: FacilityState): { report: AnomalyReport; log: AgentLogPayload } {
    const report = EnergyCalculationEngine.detectAnomaly(facility);
    return {
      report,
      log: {
        title: "Stage 2: Anomaly Confirmed",
        detail: `Detected +${report.variance_pct}% (+${report.variance_kwh} kWh) deviation exceeding +10% alert threshold. Initiating root-cause diagnostic routine.`,
        metrics: [
          { label: "Variance", value: `+${report.variance_pct}%` },
          { label: "Excess Energy", value: `${report.variance_kwh} kWh` },
          { label: "Severity", value: report.severity.toUpperCase() },
        ],
        badge: "Anomaly Triggered",
      },
    };
  }
}
