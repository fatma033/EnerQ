import React, { useState } from "react";
import { X, Sliders, DollarSign, Clock, Building, Save, RotateCcw } from "lucide-react";
import { FacilityState } from "../types";
import { getTranslation } from "../i18n";

interface FacilitySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: FacilityState;
  onSave: (rate: number, currency: string, symbol: string) => void;
  t: ReturnType<typeof getTranslation>;
}

export const FacilitySettingsModal: React.FC<FacilitySettingsModalProps> = ({
  isOpen,
  onClose,
  facility,
  onSave,
  t,
}) => {
  const s = t.settings;
  const [rate, setRate] = useState<number>(facility.config.electricity_rate);
  const [currency, setCurrency] = useState<string>(facility.config.currency);
  const [symbol, setSymbol] = useState<string>(facility.config.currency_symbol);

  if (!isOpen) return null;

  const handleCurrencyChange = (curr: string) => {
    setCurrency(curr);
    if (curr === "OMR") {
      setSymbol("OMR ");
      setRate(0.054);
    } else if (curr === "AED" || curr === "SAR") {
      setSymbol(curr + " ");
      setRate(0.38);
    } else if (curr === "EUR") {
      setSymbol("€");
      setRate(0.18);
    } else if (curr === "GBP") {
      setSymbol("£");
      setRate(0.22);
    } else {
      setSymbol("$");
      setRate(0.14);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(rate, currency, symbol);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-800">
          <Sliders className="w-5 h-5 text-teal-400" />
          <h3 className="text-base font-bold text-white">{s.title}</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Facility Name (Read only) */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">{s.facilityProfile}</label>
            <input
              type="text"
              disabled
              value={t.facility.name}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-300 text-xs opacity-75"
            />
          </div>

          {/* Currency Selector */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">{s.tariffCurrency}</label>
            <div className="grid grid-cols-4 gap-2">
              {["USD", "OMR", "AED", "EUR"].map((curr) => (
                <button
                  type="button"
                  key={curr}
                  onClick={() => handleCurrencyChange(curr)}
                  className={`py-1.5 rounded-lg font-semibold text-xs border transition-colors ${
                    currency === curr
                      ? "bg-teal-600 text-white border-teal-500"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* Electricity Rate */}
          <div>
            <label className="block text-slate-400 mb-1 font-medium">
              {s.electricityTariff(symbol)}
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.001"
                min="0.01"
                max="10"
                value={rate}
                onChange={(e) => setRate(parseFloat(e.target.value) || 0.14)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-teal-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {s.tariffNote}
            </p>
          </div>

          {/* Working Hours Info */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5 text-[11px] text-slate-400">
            <div className="flex items-center justify-between text-slate-300">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-teal-400" /> {s.workingSchedule}
              </span>
              <span className="font-semibold text-white">
                {s.workingHoursValue(facility.config.working_hours.start, facility.config.working_hours.end)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>{s.expectedBaseline}</span>
              <span className="font-semibold text-slate-200">{facility.baseline_kwh} kWh/day</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              {s.cancel}
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{s.applyParameters}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
