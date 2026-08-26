import React, { useMemo, useState } from "react";
import { X, Download, FileBarChart2, Info, Wind, Cpu } from "lucide-react";
import { FacilityState, ProposedSolution } from "../types";
import { ReportsAgent, ReportPeriod } from "../agent/agents/reportsAgent";
import { getTranslation } from "../i18n";
import { PeriodTrendChart } from "./PeriodTrendChart";

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

          {/* Three-way comparison: what the facility should use, what it
              would burn through unaddressed, and what it actually uses
              with EnerQ's recommendation applied -- the actual comparison,
              not just an isolated total. */}
          <div>
            <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">{r.comparisonTitle}</h5>
            <div className="space-y-2.5">
              {([
                { label: r.baselineLabel, kwh: report.baselineTotalKwh, cost: Number((report.baselineTotalKwh * facility.config.electricity_rate).toFixed(2)), color: "bg-slate-600" },
                { label: r.withoutLabel, kwh: report.withoutEnerQTotalKwh, cost: report.withoutEnerQTotalCost, color: "bg-red-500" },
                { label: r.withLabel, kwh: report.withEnerQTotalKwh, cost: report.withEnerQTotalCost, color: "bg-emerald-500" },
              ] as const).map((row) => {
                const maxKwh = report.withoutEnerQTotalKwh || 1;
                const widthPct = Math.max(4, Math.min(100, (row.kwh / maxKwh) * 100));
                return (
                  <div key={row.label}>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-400">{row.label}</span>
                      <span className="font-semibold text-slate-200 tabular-nums">
                        {row.kwh.toLocaleString()} kWh <span className="text-slate-500">· {symbol}{row.cost.toLocaleString()}</span>
                      </span>
                    </div>
                    <div className="h-2.5 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                      <div className={`h-full rounded-full ${row.color}`} style={{ width: `${widthPct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-center">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">{r.totalEnergyAvoided}</div>
              <div className="text-xl font-extrabold text-white mt-1">{report.totalKwhAvoided.toLocaleString()} <span className="text-xs font-normal text-slate-400">kWh</span></div>
              <div className="text-[10px] text-emerald-400/90 font-medium mt-0.5">-{report.dailyReductionPct}% {r.vsWithout}</div>
            </div>
            <div className="p-4 rounded-xl bg-teal-950/40 border border-teal-800/50 text-center">
              <div className="text-[10px] uppercase tracking-wider text-teal-400 font-semibold">{r.totalCostSaved}</div>
              <div className="text-xl font-extrabold text-white mt-1">{symbol}{report.totalCostSaved.toLocaleString()}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">{r.annualizedNote(symbol, report.annualizedCostSaved)}</div>
            </div>
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/40 text-center">
              <div className="text-[10px] uppercase tracking-wider text-amber-400 font-semibold">{r.totalCo2Offset}</div>
              <div className="text-xl font-extrabold text-white mt-1">{report.totalCo2SavedKg.toLocaleString()} <span className="text-xs font-normal text-slate-400">kg CO₂</span></div>
            </div>
          </div>

          {/* Projected cumulative-savings graph -- the real "graph" the report was missing */}
          <div>
            <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">{r.trendTitle}</h5>
            <p className="text-[10px] text-slate-500 mb-2.5">{r.trendSubtitle}</p>
            <PeriodTrendChart points={report.dailyTrend} symbol={symbol} dayLabel={r.trendDayLabel} />
          </div>

          {/* Root-cause breakdown: where the avoided energy actually comes from */}
          <div>
            <h5 className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-0.5">{r.breakdownTitle}</h5>
            <p className="text-[10px] text-slate-500 mb-2.5">{r.breakdownSubtitle}</p>
            <div className="space-y-2.5">
              {report.systemBreakdown.map((row) => {
                const isHvac = row.system === "hvac";
                const label = isHvac ? t.digitalTwin.connHvac : t.digitalTwin.connEquipment;
                const Icon = isHvac ? Wind : Cpu;
                return (
                  <div
                    key={row.system}
                    className={`p-3 rounded-xl border flex items-center gap-3 ${
                      isHvac ? "bg-sky-950/30 border-sky-800/40" : "bg-purple-950/30 border-purple-800/40"
                    }`}
                  >
                    <div className={`p-2 rounded-lg shrink-0 ${isHvac ? "bg-sky-500/20 text-sky-300" : "bg-purple-500/20 text-purple-300"}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-slate-300 font-semibold">{label}</span>
                        <span className="font-bold text-white tabular-nums">
                          {row.avoidedKwh.toLocaleString()} kWh <span className="text-slate-500 font-normal">· {symbol}{row.costSaved.toLocaleString()}</span>
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-950 border border-slate-800/80 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${isHvac ? "bg-sky-400" : "bg-purple-400"}`}
                          style={{ width: `${Math.max(4, row.pct)}%` }}
                        />
                      </div>
                    </div>
                    <span className={`text-sm font-extrabold tabular-nums shrink-0 ${isHvac ? "text-sky-300" : "text-purple-300"}`}>
                      {row.pct}%
                    </span>
                  </div>
                );
              })}
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
