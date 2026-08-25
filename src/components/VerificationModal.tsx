import React, { useEffect } from "react";
import {
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Sparkles,
  X,
  Building2,
  Calendar,
  Zap,
  Leaf,
  FileCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { VerificationResult, FacilityConfig } from "../types";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  verification: VerificationResult | null;
  config: FacilityConfig;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  verification,
  config,
}) => {
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ["#10b981", "#34d399", "#38bdf8", "#fbbf24"],
        });
      } catch {
        // Safe fallback
      }
    }
  }, [isOpen]);

  if (!isOpen || !verification) return null;

  const symbol = config.currency_symbol;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-emerald-500/50 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                Action Implemented — Simulation
              </span>
              <span className="text-[11px] text-slate-400 font-mono">{verification.timestamp}</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight mt-0.5">
              Simulated Improvement Verified
            </h3>
          </div>
        </div>

        {/* Core Verification Statement */}
        <div className="p-4 rounded-xl bg-slate-950/90 border border-emerald-900/50 space-y-2 text-xs">
          <p className="text-slate-200 leading-relaxed">
            The virtual facility has been updated with the approved policy: <strong className="text-emerald-300">Automated 18:00 HVAC Cutoff + Workstation Idle Sleep</strong>.
          </p>
          <div className="flex items-center gap-2 text-emerald-400 font-semibold pt-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Expected 15.0% energy reduction successfully verified.</span>
          </div>
        </div>

        {/* Before vs After Metric Comparison */}
        <div className="grid grid-cols-2 gap-3 my-4">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-medium">Before Implementation</div>
            <div className="text-2xl font-bold text-red-400 line-through mt-0.5">
              {verification.initial_consumption_kwh} <span className="text-xs font-normal text-slate-400">kWh/d</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">Uncontrolled Overtime</div>
          </div>

          <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-500/40 text-center">
            <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">After Implementation</div>
            <div className="text-2xl font-extrabold text-emerald-300 mt-0.5">
              {verification.verified_consumption_kwh} <span className="text-xs font-normal text-slate-400">kWh/d</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-bold mt-1">
              -{verification.actual_reduction_kwh} kWh (-{verification.actual_reduction_pct}%)
            </div>
          </div>
        </div>

        {/* Financial & Environmental ROI */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Monthly Recaptured Value:</span>
            <span className="font-bold text-white text-sm">
              {symbol}{verification.monthly_cost_saved} / month
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Annual Recaptured Value:</span>
            <span className="font-bold text-teal-300">
              {symbol}{verification.annual_cost_saved} / year
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Annual CO₂ Offset:</span>
            <span className="font-bold text-emerald-400">
              {verification.annual_co2_kg_saved} kg CO₂ / year
            </span>
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Next Autonomous Audit:</span>
            <span className="font-medium text-slate-300">{verification.next_check_in}</span>
          </div>
        </div>

        {/* Disclaimer Note */}
        <p className="text-[11px] text-slate-500 text-center mt-3">
          Note: This is a verified Digital Twin simulation outcome based on the facility energy model.
        </p>

        {/* Action Button */}
        <button
          id="btn-close-verification"
          onClick={onClose}
          className="w-full mt-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-colors cursor-pointer"
        >
          Done & Return to Live Agent Center
        </button>
      </div>
    </div>
  );
};
