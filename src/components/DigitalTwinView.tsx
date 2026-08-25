import React, { useState } from "react";
import {
  Cpu,
  Layers,
  Thermometer,
  Zap,
  Fan,
  Sun,
  Lightbulb,
  Building,
  RotateCw,
  Sparkles,
  ArrowRight,
  Info,
  CheckCircle2,
  AlertTriangle,
  Play,
} from "lucide-react";
import { FacilityState, ProposedSolution } from "../types";

interface DigitalTwinViewProps {
  facility: FacilityState;
  solutions: Record<"A" | "B" | "C", ProposedSolution> | null;
  activeScenario: "BASELINE" | "CURRENT" | "A" | "B" | "C";
  onSelectScenario: (scenario: "BASELINE" | "CURRENT" | "A" | "B" | "C") => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  isVerified?: boolean;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  facility,
  solutions,
  activeScenario,
  onSelectScenario,
  onRunSimulation,
  isSimulating,
  isVerified,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<1 | 2 | 3>(2);
  const currencySymbol = facility.config.currency_symbol;
  const rate = facility.config.electricity_rate;

  // Compute metrics based on active scenario
  let simulatedKwh = facility.current_kwh;
  let simulatedHvacKwh = facility.systems.hvac.actual_kwh;
  let simulatedEquipKwh = facility.systems.equipment.total_kwh;
  let simulatedZoneTemp = 21.8;
  let savingsKwh = 0;
  let savingsPct = 0;
  let hvacHours = facility.systems.hvac.actual_hours;
  let scenarioLabel = "Current Telemetry State (Uncontrolled 4h Overtime)";

  if (activeScenario === "BASELINE") {
    simulatedKwh = 500;
    simulatedHvacKwh = 200;
    simulatedEquipKwh = 100;
    simulatedZoneTemp = 22.0;
    savingsKwh = 120;
    savingsPct = 19.4;
    hvacHours = 10;
    scenarioLabel = "Historical Baseline Target (Ideal Schedule)";
  } else if (activeScenario === "CURRENT") {
    simulatedKwh = 620;
    simulatedHvacKwh = 280;
    simulatedEquipKwh = 120;
    simulatedZoneTemp = 21.8;
    savingsKwh = 0;
    savingsPct = 0;
    hvacHours = 14;
    scenarioLabel = "Current Uncontrolled Anomaly (HVAC 08:00–22:00)";
  } else if (activeScenario === "A") {
    simulatedKwh = 570;
    simulatedHvacKwh = 230;
    simulatedEquipKwh = 120;
    simulatedZoneTemp = 22.2;
    savingsKwh = 50;
    savingsPct = 8.1;
    hvacHours = 10;
    scenarioLabel = "Scenario A: Enforced 18:00 HVAC Cutoff";
  } else if (activeScenario === "B") {
    simulatedKwh = 583;
    simulatedHvacKwh = 243;
    simulatedEquipKwh = 120;
    simulatedZoneTemp = 23.5;
    savingsKwh = 37;
    savingsPct = 6.0;
    hvacHours = 14;
    scenarioLabel = "Scenario B: Thermostat Offset +1.5°C (22.0°C → 23.5°C)";
  } else if (activeScenario === "C") {
    simulatedKwh = 527;
    simulatedHvacKwh = 200;
    simulatedEquipKwh = 105;
    simulatedZoneTemp = 22.2;
    savingsKwh = 93;
    savingsPct = 15.0;
    hvacHours = 10;
    scenarioLabel = "Scenario C: Recommended Combined (18:00 Cutoff + Idle Sleep)";
  }

  const dailyCost = Number((simulatedKwh * rate).toFixed(2));
  const dailyCostSaving = Number((savingsKwh * rate).toFixed(2));
  const monthlyCostSaving = Number((savingsKwh * rate * 30).toFixed(2));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
      {/* Header with Title & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Facility Digital Twin — Physics & Energy Simulation
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-wider px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-800/60 rounded">
              Digital Twin Simulation — Estimated
            </span>
            <span>Virtual building thermal inertia & sub-circuit load model</span>
          </p>
        </div>

        {/* Run Simulation Trigger */}
        <button
          id="btn-trigger-twin-sim"
          onClick={onRunSimulation}
          disabled={isSimulating}
          className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-teal-600 hover:bg-teal-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50"
        >
          {isSimulating ? (
            <>
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              <span>Simulating Thermal Model...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Run Digital Twin Simulation</span>
            </>
          )}
        </button>
      </div>

      {/* Scenario Selector Tabs */}
      <div className="mt-4 flex flex-wrap items-center gap-2 p-1 bg-slate-950/80 border border-slate-800 rounded-xl">
        <button
          onClick={() => onSelectScenario("CURRENT")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeScenario === "CURRENT"
              ? "bg-amber-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Current Anomaly (620 kWh)
        </button>

        <button
          onClick={() => onSelectScenario("A")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeScenario === "A"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Scenario A: 18:00 Cutoff (570 kWh)
        </button>

        <button
          onClick={() => onSelectScenario("B")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeScenario === "B"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Scenario B: Setpoint +1.5°C (583 kWh)
        </button>

        <button
          onClick={() => onSelectScenario("C")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
            activeScenario === "C"
              ? "bg-emerald-500 text-slate-950 shadow-sm ring-1 ring-emerald-400"
              : "text-emerald-400 hover:text-emerald-300 font-medium"
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Scenario C: Recommended (527 kWh)</span>
        </button>

        <button
          onClick={() => onSelectScenario("BASELINE")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeScenario === "BASELINE"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Baseline Reference (500 kWh)
        </button>
      </div>

      {/* Main Digital Twin Grid: Visual Schematic + Real-time Calculated Twin Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left 7 Cols: Interactive Building Isometric Schematic */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          {/* Top Floor Controls */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-400" />
              {facility.config.name} (3-Floor Zone Model)
            </span>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400 mr-1 font-medium">Floor Zone:</span>
              {[1, 2, 3].map((floor) => (
                <button
                  key={floor}
                  onClick={() => setSelectedFloor(floor as 1 | 2 | 3)}
                  className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                    selectedFloor === floor
                      ? "bg-teal-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  L{floor}
                </button>
              ))}
            </div>
          </div>

          {/* Schematic Canvas Diagram */}
          <div className="relative w-full h-64 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 rounded-xl border border-slate-800/80 p-3 flex flex-col justify-between">
            {/* Rooftop Solar Array */}
            <div className="flex items-center justify-between p-2 rounded-lg bg-teal-950/50 border border-teal-800/40 text-xs">
              <div className="flex items-center gap-2">
                <Sun className="w-4 h-4 text-amber-400 animate-spin" />
                <div>
                  <div className="font-semibold text-slate-200 text-[11px]">Rooftop Bi-Facial PV Array (15 kWp)</div>
                  <div className="text-[10px] text-teal-300">Generating +50.0 kWh/day • Peak 12.4 kW</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">Active Solar</span>
            </div>

            {/* Middle: Floor Zones with Dynamic State Indicator */}
            <div className="grid grid-cols-3 gap-2 my-2">
              {/* Zone A: Open Workstations */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-left">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Zone A: Open Office</span>
                  <span className="text-emerald-400 font-bold text-[10px]">{simulatedZoneTemp}°C</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-teal-400" />
                  <span>Setpoint: {activeScenario === "B" ? "23.5°C" : "22.0°C"}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Occupancy: <span className="text-slate-300 font-medium">08:00–18:00 (Vacant Now)</span>
                </div>
              </div>

              {/* Zone B: Tech Lab & Servers */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-left">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Zone B: Tech Lab</span>
                  <span className="text-teal-400 font-bold text-[10px]">21.5°C</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Plug Load: <span className="text-amber-300 font-medium">{activeScenario === "C" ? "Sleep Enabled" : "38 Active"}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Critical Servers: <span className="text-slate-300">100% Protected</span>
                </div>
              </div>

              {/* Zone C: Executive Suites */}
              <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-left">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>Zone C: Exec Rooms</span>
                  <span className="text-emerald-400 font-bold text-[10px]">{simulatedZoneTemp}°C</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  Lighting: <span className="text-emerald-300 font-medium">Off (Photocell)</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  VAV Damper: <span className="text-slate-300">{hvacHours > 10 ? "Open (Active)" : "Closed (Night)"}</span>
                </div>
              </div>
            </div>

            {/* Bottom: Central HVAC AHU Plant Loop */}
            <div className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
              hvacHours > 10
                ? "bg-red-950/40 border-red-800/60 text-red-300"
                : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
            }`}>
              <div className="flex items-center gap-2">
                <Fan className={`w-4 h-4 ${hvacHours > 10 ? "text-red-400 animate-spin" : "text-emerald-400"}`} />
                <div>
                  <div className="font-semibold text-white text-[11px]">
                    Central Rooftop AHU & Chilled Water Loop (20 kW)
                  </div>
                  <div className="text-[10px]">
                    Runtime Mode: {hvacHours > 10 ? "Extended Overtime (until 22:00)" : "Scheduled 18:00 Night Standby"}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                hvacHours > 10 ? "bg-red-900 text-red-200" : "bg-emerald-900 text-emerald-200"
              }`}>
                {hvacHours} Hours / Day
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              Building Floor Area: {facility.config.area_sqm} m² • Thermal Time Constant τ = 4.2h
            </span>
            <span className="font-medium text-slate-300">{scenarioLabel}</span>
          </div>
        </div>

        {/* Right 5 Cols: Digital Twin Simulation Live Calculations */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          {/* Simulated Total Daily Energy */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Simulated Daily Consumption
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-white">{simulatedKwh}</span>
              <span className="text-sm font-semibold text-slate-400">kWh / day</span>
            </div>

            {/* Comparison vs Current 620 */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Variance vs Current (620 kWh):</span>
              {savingsKwh > 0 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  -{savingsKwh} kWh (-{savingsPct}%)
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">+120 kWh over baseline</span>
              )}
            </div>
          </div>

          {/* Subsystem Power Breakdown in Simulated State */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
              <span>Sub-Circuit Breakdown</span>
              <span className="text-[10px] text-slate-400 font-normal">Simulated Mode</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Fan className="w-3.5 h-3.5 text-teal-400" /> HVAC System:
              </span>
              <span className="font-semibold text-slate-200">{simulatedHvacKwh} kWh/day</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> Lighting:
              </span>
              <span className="font-semibold text-slate-200">{facility.systems.lighting.daily_kwh} kWh/day</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Equipment & Plug Loads:
              </span>
              <span className="font-semibold text-slate-200">{simulatedEquipKwh} kWh/day</span>
            </div>

            <div className="flex items-center justify-between text-teal-400">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> Solar Generation:
              </span>
              <span className="font-semibold">-{facility.systems.solar.daily_generation_kwh} kWh/day</span>
            </div>
          </div>

          {/* Financial Recapture Summary */}
          <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-800/40 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                Projected Monthly Savings
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                {savingsKwh > 0 ? `${currencySymbol}${monthlyCostSaving}` : `${currencySymbol}0.00`}
                <span className="text-[11px] font-normal text-slate-400"> / mo</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                Operational Risk
              </div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                {activeScenario === "C" ? "Low / Medium" : activeScenario === "A" ? "Low" : activeScenario === "B" ? "Medium" : "High (Waste)"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
