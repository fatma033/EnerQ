import { FacilityState, ProposedSolution } from "../../types";

export type ReportPeriod = "week" | "month" | "year" | "custom";

export interface PeriodReport {
  period: ReportPeriod;
  days: number;
  totalKwhAvoided: number;
  totalCostSaved: number;
  totalCo2SavedKg: number;
  dailyReductionKwh: number;
  dailyReductionPct: number;
  // Three-way period comparison -- what the facility was designed to use,
  // what it would burn through if the anomaly stayed unaddressed for the
  // whole period, and what it actually uses once the recommended solution
  // is applied. This is what makes the report a *comparison*, not just an
  // isolated total.
  baselineTotalKwh: number;
  withoutEnerQTotalKwh: number;
  withEnerQTotalKwh: number;
  withoutEnerQTotalCost: number;
  withEnerQTotalCost: number;
  annualizedCostSaved: number;
}

/**
 * ReportsAgent -- a fifth, standalone agent focused entirely on reporting.
 * Unlike the four pipeline agents (Observer/Diagnostic/Simulation/Action),
 * it doesn't participate in the observe-to-verify loop; it's invoked
 * on demand from the Reports panel to summarize the *implication* of the
 * agent's recommended (or verified) daily reduction rate over a chosen
 * period -- a week, a month, a year, or a custom date range.
 *
 * This is a projection, not fabricated history: the demo has one day of
 * telemetry, not months of it, so ReportsAgent is explicit (both in this
 * comment and in the report's own footnote) that it extrapolates the
 * current daily rate rather than inventing day-to-day variation that
 * doesn't exist in the underlying data.
 */
export class ReportsAgent {
  static daysInPeriod(period: ReportPeriod, customStart?: string, customEnd?: string): number {
    if (period === "week") return 7;
    if (period === "month") return 30;
    if (period === "year") return 365;
    if (customStart && customEnd) {
      const start = new Date(customStart);
      const end = new Date(customEnd);
      const diff = Math.round((end.getTime() - start.getTime()) / 86400000) + 1;
      return Math.max(1, diff);
    }
    return 30;
  }

  static generate(
    facility: FacilityState,
    solution: ProposedSolution,
    period: ReportPeriod,
    customStart?: string,
    customEnd?: string
  ): PeriodReport {
    const days = this.daysInPeriod(period, customStart, customEnd);
    const rate = facility.config.electricity_rate;

    const withoutEnerQTotalKwh = Math.round(facility.current_kwh * days);
    const withEnerQTotalKwh = Math.round((facility.current_kwh - solution.estimated_saving_kwh) * days);

    return {
      period,
      days,
      totalKwhAvoided: Math.round(solution.estimated_saving_kwh * days),
      totalCostSaved: Number((solution.estimated_saving_kwh * rate * days).toFixed(2)),
      totalCo2SavedKg: Math.round(solution.estimated_saving_kwh * days * facility.config.co2_factor_kg_per_kwh),
      dailyReductionKwh: solution.estimated_saving_kwh,
      dailyReductionPct: solution.estimated_saving_pct,
      baselineTotalKwh: Math.round(facility.baseline_kwh * days),
      withoutEnerQTotalKwh,
      withEnerQTotalKwh,
      withoutEnerQTotalCost: Number((withoutEnerQTotalKwh * rate).toFixed(2)),
      withEnerQTotalCost: Number((withEnerQTotalKwh * rate).toFixed(2)),
      annualizedCostSaved: Number((solution.estimated_saving_kwh * rate * 365).toFixed(2)),
    };
  }
}
