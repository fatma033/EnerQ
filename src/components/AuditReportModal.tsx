import React from "react";
import {
  X,
  FileText,
  Printer,
  Download,
  Building2,
  Calendar,
  CheckCircle2,
  TrendingDown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { AgentContext } from "../agent/orchestrator";
import { getTranslation } from "../i18n";

interface AuditReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: AgentContext;
  t: ReturnType<typeof getTranslation>;
}

export const AuditReportModal: React.FC<AuditReportModalProps> = ({
  isOpen,
  onClose,
  context,
  t,
}) => {
  if (!isOpen) return null;

  const ar = t.auditReportModal;
  const { facility, anomalyReport, investigation, solutions, chosenSolution, verification } = context;
  const config = facility.config;
  const symbol = config.currency_symbol;
  const solC = solutions?.C;
  const currentKwh = anomalyReport?.actual_kwh ?? facility.current_kwh;
  const baselineKwh = anomalyReport?.baseline_kwh ?? facility.baseline_kwh;
  const varianceKwh = anomalyReport?.variance_kwh ?? currentKwh - baselineKwh;
  const variancePct = anomalyReport?.variance_pct ?? Number(((varianceKwh / baselineKwh) * 100).toFixed(1));
  const annualEnergyAvoidedKwh = solC ? solC.estimated_saving_kwh * 365 : null;
  const annualCo2OffsetKg = solC
    ? Math.round(solC.estimated_saving_kwh * 365 * config.co2_factor_kg_per_kwh)
    : null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                {ar.title}
              </h3>
              <p className="text-[11px] text-slate-400">
                {ar.generatedBy(`ENERQ-${new Date().toISOString().slice(0, 7).replace("-", "")}`)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{ar.print}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable / Viewable Report Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300 font-sans leading-relaxed">
          {/* Facility Header Section */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                {ar.targetFacility}
              </div>
              <h4 className="text-base font-bold text-white mt-0.5">{t.facility.name}</h4>
              <p className="text-slate-400 text-xs mt-0.5">
                {t.facility.type} • {t.facility.location} • {ar.area} {config.area_sqm} m²
              </p>
            </div>

            <div className="text-left sm:text-right space-y-0.5 text-xs">
              <div>
                <span className="text-slate-500">{ar.workingHoursLabel}</span>{" "}
                <span className="text-slate-200 font-medium">
                  {config.working_hours.start} – {config.working_hours.end}
                </span>
              </div>
              <div>
                <span className="text-slate-500">{ar.tariffRate}</span>{" "}
                <span className="text-slate-200 font-medium">
                  {symbol}{config.electricity_rate} / kWh
                </span>
              </div>
              <div>
                <span className="text-slate-500">{ar.status}</span>{" "}
                <span className="text-emerald-400 font-bold">
                  {verification ? ar.verifiedOptimized : ar.anomalyIdentified}
                </span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-slate-200 border-b border-slate-800 pb-1">
              {ar.section1Title}
            </h5>
            <p className="text-slate-300">
              {ar.section1Body1(currentKwh, variancePct, varianceKwh, baselineKwh)}
            </p>
            <p className="mt-2 text-slate-300">
              {ar.section1Body2}
            </p>
          </div>

          {/* Section 2: Multi-Criteria Scenarios */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-slate-200 border-b border-slate-800 pb-1">
              {ar.section2Title}
            </h5>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border border-slate-800">
                <thead className="bg-slate-950 text-slate-400 font-semibold">
                  <tr>
                    <th className="p-2 border-b border-slate-800">{ar.tableOption}</th>
                    <th className="p-2 border-b border-slate-800">{ar.tableIntervention}</th>
                    <th className="p-2 border-b border-slate-800">{ar.tableDailyKwh}</th>
                    <th className="p-2 border-b border-slate-800">{ar.tableReduction}</th>
                    <th className="p-2 border-b border-slate-800">{ar.tableMonthlyRecapture}</th>
                    <th className="p-2 border-b border-slate-800">{ar.tableRiskScore}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-slate-300">A</td>
                    <td className="p-2">{ar.interventionA}</td>
                    <td className="p-2">{solutions?.A.simulated_daily_kwh} kWh</td>
                    <td className="p-2 text-emerald-400 font-semibold">-{solutions?.A.estimated_saving_pct}% ({solutions?.A.estimated_saving_kwh} kWh)</td>
                    <td className="p-2">{symbol}{solutions?.A.monthly_cost_saving}</td>
                    <td className="p-2">{solutions?.A.risk_level} ({solutions?.A.decision_score}/100)</td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-2 font-bold text-slate-300">B</td>
                    <td className="p-2">{ar.interventionB}</td>
                    <td className="p-2">{solutions?.B.simulated_daily_kwh} kWh</td>
                    <td className="p-2 text-teal-400 font-semibold">-{solutions?.B.estimated_saving_pct}% ({solutions?.B.estimated_saving_kwh} kWh)</td>
                    <td className="p-2">{symbol}{solutions?.B.monthly_cost_saving}</td>
                    <td className="p-2">{solutions?.B.risk_level} ({solutions?.B.decision_score}/100)</td>
                  </tr>
                  <tr className="bg-emerald-950/40 font-semibold text-white">
                    <td className="p-2 text-emerald-400 font-bold">C ({ar.best})</td>
                    <td className="p-2">{ar.interventionC}</td>
                    <td className="p-2">{solC?.simulated_daily_kwh} kWh</td>
                    <td className="p-2 text-emerald-400 font-bold">-{solC?.estimated_saving_pct}% ({solC?.estimated_saving_kwh} kWh)</td>
                    <td className="p-2 font-bold text-emerald-300">{symbol}{solC?.monthly_cost_saving}</td>
                    <td className="p-2 text-emerald-400 font-bold">{solC?.risk_level} ({solC?.decision_score}/100)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Recommended Action Plan */}
          <div>
            <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-2 text-slate-200 border-b border-slate-800 pb-1">
              {ar.section3Title}
            </h5>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
              {ar.roadmap.map((step, i) => (
                <li key={i}>
                  <strong>{step.title}</strong>: {step.body}
                </li>
              ))}
            </ol>
          </div>

          {/* Section 4: Verified ROI Summary */}
          <div className="p-4 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div>
              <div className="text-emerald-300 font-bold uppercase text-[10px] tracking-wider">
                {ar.section4Title}
              </div>
              <div className="text-xl font-extrabold text-white mt-0.5">
                {symbol}{solC?.annual_cost_saving} {ar.perYear}
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                {ar.annualEnergyAvoided}
              </div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {annualEnergyAvoidedKwh?.toLocaleString() ?? "—"} kWh {ar.perYear}
              </div>
            </div>

            <div>
              <div className="text-slate-400 font-medium uppercase text-[10px] tracking-wider">
                {ar.co2Offset}
              </div>
              <div className="text-lg font-bold text-teal-300 mt-0.5">
                {annualCo2OffsetKg?.toLocaleString() ?? "—"} kg CO₂ {ar.perYear}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            {ar.footerNote}
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            {ar.close}
          </button>
        </div>
      </div>
    </div>
  );
};
