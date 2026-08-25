import React from "react";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Scale,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Shield,
  Zap,
} from "lucide-react";
import { ProposedSolution } from "../types";

interface SolutionsComparisonProps {
  solutions: Record<"A" | "B" | "C", ProposedSolution>;
  selectedSolutionId: "A" | "B" | "C";
  onSelectSolution: (id: "A" | "B" | "C") => void;
  currencySymbol: string;
}

export const SolutionsComparison: React.FC<SolutionsComparisonProps> = ({
  solutions,
  selectedSolutionId,
  onSelectSolution,
  currencySymbol,
}) => {
  const solutionList = [solutions.A, solutions.B, solutions.C];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              Candidate Interventions & Multi-Criteria Decision Matrix
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            EnerQ evaluated 3 physics-simulated scenarios balancing energy savings, occupant comfort, and operational risk
          </p>
        </div>

        <span className="text-xs text-slate-400 font-medium">
          Deterministic Simulation Output
        </span>
      </div>

      {/* Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
        {solutionList.map((sol) => {
          const isSelected = selectedSolutionId === sol.id;
          const isWinner = sol.is_recommended;

          return (
            <div
              key={sol.id}
              onClick={() => onSelectSolution(sol.id)}
              className={`relative flex flex-col justify-between rounded-xl border p-4.5 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? "bg-slate-950/90 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50"
                  : isWinner
                  ? "bg-slate-900/90 border-emerald-800/60 hover:border-emerald-700"
                  : "bg-slate-900/50 border-slate-800 hover:border-slate-700 opacity-90 hover:opacity-100"
              }`}
            >
              {/* Badges */}
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Option {sol.id}
                </span>

                {isWinner ? (
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-600/70">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    EnerQ Best Pick
                  </span>
                ) : (
                  <span className="text-[11px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Alternative
                  </span>
                )}
              </div>

              {/* Title & Tagline */}
              <div>
                <h4 className="text-base font-bold text-white tracking-tight">
                  {sol.name}
                </h4>
                <p className="text-xs text-emerald-400 font-medium mt-0.5">
                  {sol.tagline}
                </p>
                <p className="text-xs text-slate-300 mt-2 leading-relaxed line-clamp-3">
                  {sol.description}
                </p>
              </div>

              {/* Metrics Box */}
              <div className="my-3.5 p-3 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Energy Reduction:</span>
                  <span className="font-bold text-emerald-400 text-sm">
                    -{sol.estimated_saving_pct}% <span className="text-xs font-normal text-slate-400">({sol.estimated_saving_kwh} kWh/d)</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Monthly Cost Recapture:</span>
                  <span className="font-bold text-slate-100">
                    {currencySymbol}{sol.monthly_cost_saving} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Operational Risk:</span>
                  <span
                    className={`font-semibold ${
                      sol.risk_level === "Low"
                        ? "text-emerald-400"
                        : sol.risk_level === "Low / Medium"
                        ? "text-teal-400"
                        : "text-amber-400"
                    }`}
                  >
                    {sol.risk_level} (Score {sol.risk_score}/10)
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                  <span className="text-slate-400">Decision Score:</span>
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          sol.decision_score > 90
                            ? "bg-emerald-400"
                            : sol.decision_score > 70
                            ? "bg-teal-500"
                            : "bg-amber-500"
                        }`}
                        style={{ width: `${sol.decision_score}%` }}
                      />
                    </div>
                    <span className="font-bold text-white text-xs">{sol.decision_score}/100</span>
                  </div>
                </div>
              </div>

              {/* Pros / Key Highlights */}
              <div className="space-y-1 text-[11px] text-slate-300 mb-3">
                <div className="font-semibold text-slate-400 text-[10px] uppercase tracking-wider mb-1">
                  Key Trade-Offs:
                </div>
                {sol.pros.slice(0, 2).map((pro, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-slate-300">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{pro}</span>
                  </div>
                ))}
              </div>

              {/* Action Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectSolution(sol.id);
                }}
                className={`w-full py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isSelected
                    ? "bg-emerald-500 text-slate-950"
                    : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                }`}
              >
                <span>{isSelected ? "Active in Digital Twin" : "Simulate in Digital Twin"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
