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
import { getTranslation, getSolutionText } from "../i18n";

interface RecommendationCardProps {
  solution: ProposedSolution;
  facility: FacilityState;
  followUp: FollowUpState;
  autonomyMode: AutonomyMode;
  onApprove: () => void;
  onReviewAlternatives: () => void;
  isVerified?: boolean;
  t: ReturnType<typeof getTranslation>;
  language: "en" | "ar";
}

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
  solution,
  facility,
  followUp,
  autonomyMode,
  onApprove,
  onReviewAlternatives,
  isVerified,
  t,
  language,
}) => {
  const currencySymbol = facility.config.currency_symbol;
  const solText = getSolutionText(language, solution, currencySymbol);
  const r = t.recommendation;

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
              {r.badge}
            </span>
            <span className="text-xs text-slate-400">
              {r.scoreLabel(solution.decision_score)}
            </span>
          </div>

          {!isVerified && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-800/80 border border-slate-700/60 text-slate-300">
                <UserCheck className="w-3.5 h-3.5 text-teal-400" />
                {r.notified(r.responsibleTeamName)}
              </span>
              {followUp.status === "reminded" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-amber-950/60 border border-amber-700/60 text-amber-300 animate-pulse">
                  <BellRing className="w-3.5 h-3.5" />
                  {r.reminderSent}
                </span>
              )}
              {followUp.status === "escalated" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-950/60 border border-red-700/60 text-red-300 animate-pulse">
                  <AlertOctagon className="w-3.5 h-3.5" />
                  {r.escalated}
                </span>
              )}
            </div>
          )}

          <div>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">
              {solText.name}
            </h3>
            <p className="text-sm font-medium text-emerald-400 mt-0.5">
              {solText.tagline}
            </p>
          </div>

          {/* Detailed Reason Why */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1.5 leading-relaxed">
            <div className="font-semibold text-slate-200 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>{r.whyTitle}</span>
            </div>
            <p>
              {r.whyBody1(solution.estimated_saving_pct, solution.estimated_saving_kwh)}
            </p>
            <p className="text-slate-400">
              {r.whyBody2}
            </p>
          </div>

          {/* Dynamic Calculated Financial & Energy Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{r.dailyReduction}</div>
              <div className="text-lg font-bold text-emerald-400">
                -{solution.estimated_saving_kwh} kWh <span className="text-xs font-normal text-slate-400">(-{solution.estimated_saving_pct}%)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{r.monthlySavings}</div>
              <div className="text-lg font-bold text-white">
                {currencySymbol}{solution.monthly_cost_saving}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{r.annualRecaptured}</div>
              <div className="text-lg font-bold text-teal-300">
                {currencySymbol}{solution.annual_cost_saving}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-center">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">{r.carbonOffset}</div>
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
                {r.implementedTitle}
              </div>
              <p className="text-xs text-slate-300">
                {r.implementedBody(facility.current_kwh)}
              </p>
            </div>
          ) : autonomyMode === "autonomous" ? (
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-600/50 text-center space-y-2">
              <div className="w-6 h-6 mx-auto border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
              <div className="text-sm font-bold text-amber-300 flex items-center justify-center gap-1.5">
                <Zap className="w-4 h-4 fill-current" />
                {r.executingAutonomously}
              </div>
              <p className="text-xs text-slate-300">
                {r.autonomousBody}
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
                <span>{r.approve}</span>
              </button>

              <button
                id="btn-review-alternatives"
                onClick={onReviewAlternatives}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center gap-1.5 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
                <span>{r.reviewAlternatives}</span>
              </button>

              <p className="text-[11px] text-slate-400 text-center leading-tight">
                {r.approveFootnote}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
