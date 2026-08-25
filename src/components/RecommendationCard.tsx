import React from "react";
import {
  Sparkles,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  TrendingDown,
  DollarSign,
  Leaf,
  Calendar,
  SlidersHorizontal,
  ThumbsUp,
  RotateCcw,
  Bell,
  BellRing,
  AlertOctagon,
  UserCheck,
  Zap,
} from "lucide-react";
import { ProposedSolution, FacilityState, FollowUpState } from "../types";
import { AutonomyMode } from "../agent/orchestrator";

interface RecommendationCardProps {
  solution: ProposedSolution;
  facility: FacilityState;
  followUp: FollowUpState;
  autonomyMode: AutonomyMode;
  onApprove: () => void;
  onReviewAlternatives: () => void;
  isVerified?: boolean;
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  solution,
  facility,
  followUp,
  autonomyMode,
  onApprove,
  onReviewAlternatives,
  isVerified,
}) => {
  const currencySymbol = facility.config.currency_symbol;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-500" />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left: Recommendation Content */}
        <div className="space-y-4 max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500 text-slate-950 shadow-sm shadow-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              EnerQ AI Recommendation
            </span>
            <span className="text-xs text-slate-400">
              Multi-Criteria Decision Engine Score: <strong className="text-emerald-400">{solution.decision_score}/100</strong>
            </span>
          </div>

          {!isVerified && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                Notified: {followUp.responsibleTeam}
              </span>
              {followUp.status === "reminded" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-950/60 border border-amber-700/60 text-amber-300 animate-pulse">
                  <BellRing className="w-3.5 h-3.5" />
                  Reminder Sent — Action Still Pending
                </span>
              )}
              {followUp.status === "escalated" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-950/60 border border-red-700/60 text-red-300 animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  Escalated to Management
                </span>
              )}
            </div>
          )}

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {solution.name}
            </h3>
            <p className="text-sm font-medium text-emerald-400 mt-0.5">
              {solution.tagline}
            </p>
          </div>

          {/* Detailed Reason Why */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Why does EnerQ recommend this action?</span>
            </div>
            <p>
              Digital Twin simulation proved this intervention achieves the <strong className="text-emerald-300">highest energy reduction ({solution.estimated_saving_pct}% / {solution.estimated_saving_kwh} kWh/day)</strong> by addressing both the after-hours HVAC overtime and unmanaged workstation idle draw identified during investigation.
            </p>
            <p className="text-slate-400">
              Occupant comfort during standard working hours (08:00–18:00) is 100% preserved with zero thermal drift penalty.
            </p>
          </div>

          {/* Dynamic Calculated Financial & Energy Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Daily Reduction</div>
              <div className="text-lg font-bold text-emerald-400">
                -{solution.estimated_saving_kwh} kWh <span className="text-xs font-normal text-slate-400">(-{solution.estimated_saving_pct}%)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Monthly Savings</div>
              <div className="text-lg font-bold text-white">
                {currencySymbol}{solution.monthly_cost_saving}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Annual Recaptured</div>
              <div className="text-lg font-bold text-teal-300">
                {currencySymbol}{solution.annual_cost_saving}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Carbon Offset</div>
              <div className="text-lg font-bold text-emerald-400">
                {solution.monthly_co2_saving_kg} <span className="text-xs font-normal text-slate-400">kg/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Approval CTAs */}
        <div className="flex flex-col gap-3 lg:w-64 shrink-0 justify-center">
          {isVerified ? (
            <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/50 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-sm font-bold text-emerald-300">
                Recommendation Implemented
              </div>
              <p className="text-xs text-slate-300">
                Virtual facility verified at {facility.current_kwh} kWh/day.
              </p>
            </div>
          ) : autonomyMode === "autonomous" ? (
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-600/50 text-center space-y-2">
              <div className="w-6 h-6 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 fill-current" />
                Executing Autonomously
              </div>
              <p className="text-xs text-slate-300">
                Level 3 authorization — no manual approval required. Implementing now.
              </p>
            </div>
          ) : (
            <>
              <button
                id="btn-approve-recommendation"
                onClick={onApprove}
                className="w-full py-3.5 px-4 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 active:scale-98"
              >
                <ThumbsUp className="w-4 h-4 fill-current" />
                <span>Approve Recommendation</span>
              </button>

              <button
                id="btn-review-alternatives"
                onClick={onReviewAlternatives}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                <span>Review Alternatives</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-tight">
                Approval triggers simulated virtual facility implementation and automatic verification.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
