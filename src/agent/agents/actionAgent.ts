import { FacilityState, ProposedSolution, VerificationResult } from "../../types";
import { AgentLogPayload } from "./types";

/**
 * ActionAgent -- Stages 8-9 (RECOMMEND, VERIFY) plus the follow-up
 * loop that runs after a recommendation is issued.
 *
 * This is what separates EnerQ from a one-shot recommendation system:
 * depending on autonomyMode it either hands off to a human (and keeps
 * reminding/escalating if nobody acts) or, for a pre-authorized
 * low-risk action, executes on its own. Either way it's the only agent
 * that touches the virtual facility state (stepVerify's write-back).
 */
export class ActionAgent {
  static recommend(
    chosen: ProposedSolution,
    facility: FacilityState,
    responsibleTeam: string,
    isAutonomous: boolean
  ): { log: AgentLogPayload; autonomousLog?: AgentLogPayload } {
    const symbol = facility.config.currency_symbol;

    const log: AgentLogPayload = {
      title: "Stage 8: Synthesized Actionable Recommendation",
      detail: `EnerQ recommends executing Solution ${chosen.id}. Recaptures ${chosen.estimated_saving_kwh} kWh/day (${chosen.estimated_saving_pct}%), saving ${symbol}${chosen.daily_cost_saving}/day (${symbol}${chosen.monthly_cost_saving}/month) with zero disruption to business hours.`,
      metrics: [
        { label: "Expected Daily Saving", value: `${chosen.estimated_saving_kwh} kWh (${chosen.estimated_saving_pct}%)` },
        { label: "Monthly Cost Recaptured", value: `${symbol}${chosen.monthly_cost_saving}` },
        { label: "Risk Rating", value: chosen.risk_level },
        { label: "Responsible", value: responsibleTeam },
      ],
      badge: isAutonomous ? "Autonomous Execution Authorized" : "Awaiting User Approval",
    };

    if (!isAutonomous) {
      return { log };
    }

    // Level 3: for a low-risk, pre-authorized action, the agent proceeds
    // without waiting on a human -- this is the "insight -> decision ->
    // action" jump the concept explicitly calls out as what separates an
    // agent from a recommendation system. Still logged transparently.
    return {
      log,
      autonomousLog: {
        title: "Autonomous Action: No Manual Approval Required",
        detail: `Risk score ${chosen.risk_score}/10 falls within the pre-authorized autonomous-action threshold. EnerQ will implement Solution ${chosen.id} automatically shortly.`,
        metrics: [{ label: "Authorization Level", value: "Level 3 — Autonomous" }],
        badge: "Executing",
      },
    };
  }

  static reminderLog(responsibleTeam: string, hourlyWaste: number | null, symbol: string): AgentLogPayload {
    return {
      title: "Follow-Up: Reminder Sent",
      detail: `Action still pending. ${
        hourlyWaste !== null
          ? `Continuing to generate approximately ${symbol}${hourlyWaste}/hour of unnecessary energy cost.`
          : "Estimated waste continues to accumulate."
      } Notified: ${responsibleTeam}.`,
      metrics: [{ label: "Responsible", value: responsibleTeam }],
      badge: "Reminder 1",
    };
  }

  static escalationLog(dailyWaste: string): AgentLogPayload {
    return {
      title: "Follow-Up: Escalated",
      detail: `This issue has remained unresolved. Estimated ongoing waste: ${dailyWaste}. Escalating to facility management for visibility.`,
      metrics: [{ label: "Status", value: "Escalated to Management" }],
      badge: "Escalation",
    };
  }

  static verify(
    chosen: ProposedSolution | undefined,
    facility: FacilityState
  ): { verification: VerificationResult; updatedFacility: FacilityState; log: AgentLogPayload } {
    const rate = facility.config.electricity_rate;
    const initialKwh = facility.current_kwh;
    const reducedKwh = chosen?.estimated_saving_kwh ?? 0;
    const reducedPct = chosen?.estimated_saving_pct ?? 0;
    const verifiedKwh = initialKwh - reducedKwh;

    const verification: VerificationResult = {
      verified: true,
      status_text: "Expected improvement verified in Digital Twin simulation.",
      implemented_solution_id: chosen?.id ?? "C",
      initial_consumption_kwh: initialKwh,
      verified_consumption_kwh: verifiedKwh,
      actual_reduction_kwh: reducedKwh,
      actual_reduction_pct: reducedPct,
      daily_cost_saved: Number((reducedKwh * rate).toFixed(2)),
      monthly_cost_saved: Number((reducedKwh * rate * 30).toFixed(2)),
      annual_cost_saved: Number((reducedKwh * rate * 365).toFixed(2)),
      annual_co2_kg_saved: Number((reducedKwh * 365 * facility.config.co2_factor_kg_per_kwh).toFixed(1)),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      next_check_in: "Tomorrow, 18:05 EET (Automated Schedule Verification)",
    };

    const updatedFacility: FacilityState = {
      ...facility,
      current_kwh: verifiedKwh,
      systems: {
        ...facility.systems,
        hvac: {
          ...facility.systems.hvac,
          actual_hours: 10,
          actual_kwh: 200,
          status: "optimized",
          alert: "Optimized 18:00 cutoff policy active",
        },
        equipment: {
          ...facility.systems.equipment,
          idle_kwh: 20,
          total_kwh: 105,
          status: "normal",
          alert: "Smart power down script scheduled for 18:15",
        },
      },
    };

    const symbol = facility.config.currency_symbol;

    return {
      verification,
      updatedFacility,
      log: {
        title: "Stage 9: Implementation Verified in Simulation",
        detail: `Virtual facility updated. Daily consumption reduced from ${initialKwh} kWh → ${verifiedKwh} kWh (-${reducedKwh} kWh / -${reducedPct}%). Recapturing ${symbol}${verification.monthly_cost_saved}/month.`,
        metrics: [
          { label: "Optimized Load", value: `${verifiedKwh} kWh/day` },
          { label: "Total Reduction", value: `-${reducedKwh} kWh (-${reducedPct}%)` },
          { label: "Annual Recaptured", value: `${symbol}${verification.annual_cost_saved}` },
        ],
        badge: "Improvement Verified",
      },
    };
  }
}
