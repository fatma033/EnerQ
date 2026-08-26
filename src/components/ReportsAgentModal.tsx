import React, { useMemo, useState } from "react";
import { X, Download, FileBarChart2, Info } from "lucide-react";
import { FacilityState, ProposedSolution } from "../types";
import { ReportsAgent, ReportPeriod } from "../agent/agents/reportsAgent";
import { getTranslation } from "../i18n";

interface ReportsAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: FacilityState;
  solution: ProposedSolution;
  t: ReturnType<typeof getTranslation>;
}

/**
 * The visible face of ReportsAgent (src/agent/agents/reportsAgent.ts) --
 * a fifth agent, separate from the observe-to-verify pipeline, whose only
 * job is turning the recommended daily reduction rate into a period report
 * (week/month/year/custom range) in the same visual template as the rest
 * of the site, with a real PDF export.
 */
export const ReportsAgentModal: React.FC<ReportsAgentModalProps> = ({
  isOpen,
  onClose,
  facility,
  solution,
  t,
}) => {
  const r = t.reportsAgent;
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 29 * 86400000).toISOString().slice(0, 10);
  const [period, setPeriod] = useState<ReportPeriod>("month");
  const [customStart, setCustomStart] = useState(monthAgo);
  const [customEnd, setCustomEnd] = useState(today);

  const report = useMemo(
    () => ReportsAgent.generate(facility, solution, period, customStart, customEnd),
    [facility, solution, period, customStart, customEnd]
  );

  if (!isOpen) return null;

  const symbol = facility.config.currency_symbol;
  const periodLabel =
    period === "week" ? r.periodWeek : period === "month" ? r.periodMonth : period === "year" ? r.periodYear : r.periodCustom;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="audit-report-printable bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="no-print p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30">
              <FileBarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                {r.agentName}
                <span className="text-[10px] text-purple-300 font-mono bg-purple-950/70 px-1.5 py-0.2 rounded border border-purple-800/60">
                  {r.badge}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400">{r.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{r.download}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Period Selector */}
        <div className="no-print p-3.5 bg-slate-900/60 border-b border-slate-800/80 space-y-2.5">
          <div className="flex flex-wrap gap-1.5">
            {(["week", "month", "year", "custom"] as ReportPeriod[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  period === p
                    ? "bg-purple-500 text-slate-950"
                    : "bg-slate-800 text-slate-400 hover:text-slate-200"
                }`}
              >
                {p === "week" ? r.periodWeek : p === "month" ? r.periodMonth : p === "year" ? r.periodYear : r.periodCustom}
              </button>
            ))}
          </div>
          {period === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-400">{r.startDate}</label>
              <input
                type="date"
                value={customStart}
                max={customEnd}
                onChange={(e) => setCustomStart(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
              />
              <label className="text-slate-400">{r.endDate}</label>
              <input
                type="date"
                value={customEnd}
                min={customStart}
                max={today}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-white text-xs"
              />
            </div>
          )}
        </div>

        {/* Report Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300 font-sans leading-relaxed">
          <div className="print-only hidden">
            <h1 className="text-lg font-bold text-white">{r.agentName} — {periodLabel}</h1>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <img src="/logo.svg" alt="EnerQ" className="w-10 h-10 rounded-lg shrink-0" />
            <div>
              <h4 className="text-base font-bold text-white">{t.facility.name}</h4>
              <p className="text-slate-400 text-xs mt-0.5">{r.reportFor(periodLabel, report.days)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-center">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">{r.totalEnergyAvoided}</div>
              <div className="text-xl font-extrabold text-white mt-1">{report.totalKwhAvoided.toLocaleString()} <span className="text-xs font-normal text-slate-400">kWh</span></div>
            </div>
            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/50 text-center">
              <div className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold">{r.totalCostSaved}</div>
              <div className="text-xl font-extrabold text-white mt-1">{symbol}{report.totalCostSaved.toLocaleString()}</div>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">{r.totalCo2Offset}</div>
              <div className="text-xl font-extrabold text-white mt-1">{report.totalCo2SavedKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg CO₂</span></div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-slate-500 mt-0.5 shrink-0" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              {r.methodologyNote(report.dailyReductionKwh, report.dailyReductionPct, report.days)}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="no-print p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-500">{r.footerNote}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition-colors"
          >
            {r.close}
          </button>
        </div>
      </div>
    </div>
  );
};
