import React from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  Search,
  CheckCircle2,
  TrendingUp,
  Cpu,
  Sun,
  Lightbulb,
  Fan,
} from "lucide-react";
import { FacilityState, AnomalyReport, ProposedSolution, VerificationResult } from "../types";
import { getTranslation } from "../i18n";

interface AnomalyBannerProps {
  facility: FacilityState;
  anomaly: AnomalyReport | null;
  recommendedSolution: ProposedSolution;
  verification: VerificationResult | null;
  onInvestigate: () => void;
  onSimulate: () => void;
  isVerified?: boolean;
  t: ReturnType<typeof getTranslation>;
}

export const AnomalyBanner: React.FC<AnomalyBannerProps> = ({
  facility,
  anomaly,
  recommendedSolution,
  verification,
  onInvestigate,
  onSimulate,
  isVerified,
  t,
}) => {
  const currentKwh = facility.current_kwh;
  const baselineKwh = facility.baseline_kwh;
  const varianceKwh = currentKwh - baselineKwh;
  const variancePct = Number(((varianceKwh / baselineKwh) * 100).toFixed(1));
  const potentialSavingsKwh = recommendedSolution.estimated_saving_kwh;
  const potentialSavingsPct = recommendedSolution.estimated_saving_pct;
  const currencySymbol = facility.config.currency_symbol;
  const dailyCostWaste = Number((varianceKwh * facility.config.electricity_rate).toFixed(2));
  const monthlyRecapture = recommendedSolution.monthly_cost_saving;

  if (isVerified && verification) {
    return (
      <div className="bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-emerald-900/80 text-emerald-300 border border-emerald-700/60">
                  {t.anomalyBanner.verifiedBadge}
                </span>
                <span className="text-xs text-slate-400">{t.anomalyBanner.verifiedTwinState}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {t.anomalyBanner.verifiedTitle}
              </h3>
              <p className="text-sm text-slate-300 mt-0.5">
                {t.anomalyBanner.verifiedSummary(verification.initial_consumption_kwh, verification.verified_consumption_kwh, verification.actual_reduction_pct, currencySymbol, verification.monthly_cost_saved)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-900/90 border border-emerald-800/60 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{t.anomalyBanner.dailyReduction}</div>
              <div className="text-lg font-bold text-emerald-400">-{verification.actual_reduction_kwh} kWh</div>
            </div>
            <div className="bg-slate-900/90 border border-emerald-800/60 rounded-xl px-4 py-2.5 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{t.anomalyBanner.netEfficiency}</div>
              <div className="text-lg font-bold text-emerald-400">+{verification.actual_reduction_pct}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Main Anomaly Callout Card */}
      <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          {/* Left: Anomaly Details */}
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <AlertTriangle className="w-7 h-7 animate-pulse" />
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-amber-900/80 text-amber-300 border border-amber-700/60 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  {t.anomalyBanner.detectedBadge}
                </span>
                <span className="text-xs text-slate-400">
                  {t.anomalyBanner.exceedsThreshold(variancePct)}
                </span>
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">
                {t.anomalyBanner.spikeTitle(varianceKwh)}
              </h2>

              <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                {t.anomalyBanner.spikeSummaryPrefix} <strong className="text-amber-300 font-semibold">{t.anomalyBanner.spikeDriver}</strong> {t.anomalyBanner.spikeSummarySuffix}
              </p>
            </div>
          </div>

          {/* Right: Quick KPI Blocks & Action CTA */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 shrink-0">
            {/* Measured vs Expected Mini KPIs */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 min-w-[110px] text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{t.anomalyBanner.actualToday}</div>
              <div className="text-xl font-bold text-amber-400">{currentKwh} <span className="text-xs font-normal text-slate-400">kWh</span></div>
              <div className="text-[10px] text-red-400 font-medium flex items-center justify-center gap-0.5 mt-0.5">
                <TrendingUp className="w-3 h-3" /> +{variancePct}%
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 min-w-[110px] text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{t.anomalyBanner.expectedBaseline}</div>
              <div className="text-xl font-bold text-slate-200">{baselineKwh} <span className="text-xs font-normal text-slate-400">kWh</span></div>
              <div className="text-[10px] text-slate-400 mt-0.5">{t.anomalyBanner.thirtyDayAvg}</div>
            </div>

            <div className="bg-emerald-950/40 border border-emerald-800/50 rounded-xl p-3 min-w-[120px] text-center">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">{t.anomalyBanner.recoverable}</div>
              <div className="text-xl font-bold text-emerald-300">{potentialSavingsKwh} <span className="text-xs font-normal text-slate-400">kWh</span></div>
              <div className="text-[10px] text-emerald-400 font-medium mt-0.5">-{potentialSavingsPct}% {t.anomalyBanner.target}</div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                id="btn-investigate-anomaly"
                onClick={onInvestigate}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{t.anomalyBanner.investigateCause}</span>
              </button>

              <button
                id="btn-simulate-twin-quick"
                onClick={onSimulate}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
              >
                <Cpu className="w-3.5 h-3.5 text-teal-400" />
                <span>{t.anomalyBanner.runDigitalTwin}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Subsystems Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* HVAC */}
        <div className="bg-slate-900/80 border border-red-900/40 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-950/70 text-red-400 border border-red-800/50 shrink-0">
            <Fan className="w-4 h-4 animate-spin" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{t.anomalyBanner.hvacChiller}</span>
              <span className="text-[10px] font-bold text-red-400 bg-red-950 px-1.5 py-0.2 rounded border border-red-800/60">
                ⚠ {t.anomalyBanner.hvacAbnormal}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.anomalyBanner.hvacActive(facility.systems.hvac.actual_hours, facility.systems.hvac.normal_hours, facility.systems.hvac.actual_kwh)}
            </p>
            <p className="text-[11px] text-red-400/90 font-medium truncate mt-0.5">
              {t.anomalyBanner.hvacPost18}
            </p>
          </div>
        </div>

        {/* Equipment */}
        <div className="bg-slate-900/80 border border-amber-900/40 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-amber-950/70 text-amber-400 border border-amber-800/50 shrink-0">
            <Cpu className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{t.anomalyBanner.plugLoads}</span>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950 px-1.5 py-0.2 rounded border border-amber-800/60">
                ⚠ {t.anomalyBanner.idleLoadBadge}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.anomalyBanner.draw(facility.systems.equipment.total_kwh)}
            </p>
            <p className="text-[11px] text-amber-400/90 font-medium truncate mt-0.5">
              {t.anomalyBanner.workstationsIdle}
            </p>
          </div>
        </div>

        {/* Lighting */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/70 text-emerald-400 border border-emerald-800/50 shrink-0">
            <Lightbulb className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{t.anomalyBanner.ledLighting}</span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-800/60">
                ✓ {t.anomalyBanner.normal}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.anomalyBanner.daily(facility.systems.lighting.daily_kwh)}
            </p>
            <p className="text-[11px] text-emerald-400/90 font-medium truncate mt-0.5">
              {t.anomalyBanner.photocellAdhered}
            </p>
          </div>
        </div>

        {/* Solar */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-teal-950/70 text-teal-400 border border-teal-800/50 shrink-0">
            <Sun className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">{t.anomalyBanner.rooftopSolar}</span>
              <span className="text-[10px] font-bold text-teal-400 bg-teal-950 px-1.5 py-0.2 rounded border border-teal-800/60">
                ✓ {t.anomalyBanner.normalSolar}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {t.anomalyBanner.peak(facility.systems.solar.peak_output_kw)}
            </p>
            <p className="text-[11px] text-teal-400/90 font-medium truncate mt-0.5">
              {t.anomalyBanner.solarNominal}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
