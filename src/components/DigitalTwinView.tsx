import React, { useState, useMemo } from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import {
  Cpu,
  Thermometer,
  Fan,
  Sun,
  Lightbulb,
  Building,
  RotateCw,
  Sparkles,
  Info,
  Play,
  SlidersHorizontal,
  RotateCcw,
} from "lucide-react";
import { AgentStage, FacilityState, ProposedSolution } from "../types";
import { EnergyCalculationEngine } from "../simulation/engine";
import { getTranslation, getSolutionText } from "../i18n";
import { RadialGauge } from "./digitalTwin/RadialGauge";
import { MiniTrendChart } from "./digitalTwin/MiniTrendChart";
import { EquipmentSchematic } from "./digitalTwin/EquipmentSchematic";

const DEFAULT_CUTOFF_HOUR = 18;
const DEFAULT_SETPOINT_OFFSET = 1.5;

const STAGE_ORDER: AgentStage[] = [
  "IDLE", "OBSERVE", "DETECT", "INVESTIGATE", "GENERATE_SOLUTIONS",
  "SIMULATE", "COMPARE", "DECIDE", "RECOMMEND", "VERIFY", "COMPLETED",
];

interface DigitalTwinViewProps {
  facility: FacilityState;
  solutions: Record<"A" | "B" | "C", ProposedSolution> | null;
  activeScenario: "BASELINE" | "CURRENT" | "A" | "B" | "C";
  onSelectScenario: (scenario: "BASELINE" | "CURRENT" | "A" | "B" | "C") => void;
  onRunSimulation: () => void;
  isSimulating: boolean;
  isVerified?: boolean;
  t: ReturnType<typeof getTranslation>;
  language: "en" | "ar";
  /** Drives the compact process strip at the top of the page -- the Digital
   *  Twin leads its own process instead of sending the user elsewhere to
   *  watch the pipeline advance. */
  currentStage: AgentStage;
  isRunningAutonomous: boolean;
}

export const DigitalTwinView: React.FC<DigitalTwinViewProps> = ({
  facility,
  solutions,
  activeScenario,
  onSelectScenario,
  onRunSimulation,
  isSimulating,
  isVerified,
  t,
  language,
  currentStage,
  isRunningAutonomous,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<1 | 2 | 3>(2);
  const currencySymbol = facility.config.currency_symbol;
  const rate = facility.config.electricity_rate;
  const dt = t.digitalTwin;

  // Institute-tunable levers: an institute's actual BMS cutoff schedule or
  // acceptable thermal drift may differ from the demo defaults. Adjusting
  // these recomputes A/B/C live through the same EnergyCalculationEngine
  // used everywhere else -- this is a local "what-if" preview scoped to the
  // Digital Twin, it doesn't change the agent's own recommendation upstream.
  const [customCutoffHour, setCustomCutoffHour] = useState(DEFAULT_CUTOFF_HOUR);
  const [customSetpointOffset, setCustomSetpointOffset] = useState(DEFAULT_SETPOINT_OFFSET);
  const [customIdleSleep, setCustomIdleSleep] = useState(true);
  const isCustomized =
    customCutoffHour !== DEFAULT_CUTOFF_HOUR || customSetpointOffset !== DEFAULT_SETPOINT_OFFSET || !customIdleSleep;

  const customSolutions = useMemo(
    () =>
      EnergyCalculationEngine.generateSolutions(facility, {
        cutoffHour: customCutoffHour,
        setpointOffsetC: customSetpointOffset,
        idleSleepEnabled: customIdleSleep,
      }),
    [facility, customCutoffHour, customSetpointOffset, customIdleSleep]
  );

  // Falls back to the prop (the agent's own computed solutions) unless the
  // user has actually moved a slider -- so nothing changes for anyone who
  // never touches customization.
  const effectiveSolutions = isCustomized ? customSolutions : solutions;
  const resetCustomization = () => {
    setCustomCutoffHour(DEFAULT_CUTOFF_HOUR);
    setCustomSetpointOffset(DEFAULT_SETPOINT_OFFSET);
    setCustomIdleSleep(true);
  };

  // Compute metrics based on active scenario
  let simulatedKwh = facility.current_kwh;
  let simulatedHvacKwh = facility.systems.hvac.actual_kwh;
  let simulatedEquipKwh = facility.systems.equipment.total_kwh;
  let simulatedZoneTemp = 21.8;
  let savingsKwh = 0;
  let savingsPct = 0;
  let hvacHours = facility.systems.hvac.actual_hours;
  let scenarioLabel = dt.scenarioLabels.current;

  // Energy totals (kWh, savings) are read from the same EnergyCalculationEngine
  // solutions used everywhere else in the app, not re-derived here, so the
  // Digital Twin can never drift out of sync with the rest of the UI.
  // Zone temperature / equipment-state flavor is still scenario-specific
  // physical-model detail that only lives in this view.
  if (activeScenario === "BASELINE") {
    simulatedKwh = facility.baseline_kwh;
    simulatedHvacKwh = 200;
    simulatedEquipKwh = 100;
    simulatedZoneTemp = 22.0;
    savingsKwh = facility.current_kwh - facility.baseline_kwh;
    savingsPct = Number(((savingsKwh / facility.current_kwh) * 100).toFixed(1));
    hvacHours = 10;
    scenarioLabel = dt.scenarioLabels.baseline;
  } else if (activeScenario === "CURRENT") {
    simulatedKwh = facility.current_kwh;
    simulatedHvacKwh = facility.systems.hvac.actual_kwh;
    simulatedEquipKwh = facility.systems.equipment.total_kwh;
    simulatedZoneTemp = 21.8;
    savingsKwh = 0;
    savingsPct = 0;
    hvacHours = facility.systems.hvac.actual_hours;
    scenarioLabel = dt.scenarioLabels.current;
  } else if (activeScenario === "A" && effectiveSolutions) {
    simulatedKwh = effectiveSolutions.A.simulated_daily_kwh;
    simulatedHvacKwh = isCustomized
      ? facility.systems.hvac.base_kwh + (customCutoffHour - 18) * facility.systems.hvac.power_rating_kw
      : 230;
    simulatedEquipKwh = facility.systems.equipment.total_kwh;
    simulatedZoneTemp = 22.2;
    savingsKwh = effectiveSolutions.A.estimated_saving_kwh;
    savingsPct = effectiveSolutions.A.estimated_saving_pct;
    hvacHours = customCutoffHour - 8;
    scenarioLabel = dt.scenarioLabels.A;
  } else if (activeScenario === "B" && effectiveSolutions) {
    simulatedKwh = effectiveSolutions.B.simulated_daily_kwh;
    simulatedHvacKwh = 243;
    simulatedEquipKwh = facility.systems.equipment.total_kwh;
    simulatedZoneTemp = facility.systems.hvac.temp_setpoint_c + customSetpointOffset;
    savingsKwh = effectiveSolutions.B.estimated_saving_kwh;
    savingsPct = effectiveSolutions.B.estimated_saving_pct;
    hvacHours = facility.systems.hvac.actual_hours;
    scenarioLabel = dt.scenarioLabels.B(facility.systems.hvac.temp_setpoint_c.toFixed(1), (facility.systems.hvac.temp_setpoint_c + customSetpointOffset).toFixed(1));
  } else if (activeScenario === "C" && effectiveSolutions) {
    simulatedKwh = effectiveSolutions.C.simulated_daily_kwh;
    simulatedHvacKwh = isCustomized
      ? facility.systems.hvac.base_kwh + (customCutoffHour - 18) * facility.systems.hvac.power_rating_kw
      : 200;
    simulatedEquipKwh = customIdleSleep ? 105 : facility.systems.equipment.total_kwh;
    simulatedZoneTemp = 22.2;
    savingsKwh = effectiveSolutions.C.estimated_saving_kwh;
    savingsPct = effectiveSolutions.C.estimated_saving_pct;
    hvacHours = customCutoffHour - 8;
    scenarioLabel = dt.scenarioLabels.C;
  }

  const dailyCost = Number((simulatedKwh * rate).toFixed(2));
  const dailyCostSaving = Number((savingsKwh * rate).toFixed(2));
  const monthlyCostSaving = Number((savingsKwh * rate * 30).toFixed(2));

  const currentStageIndex = STAGE_ORDER.indexOf(currentStage);
  const isPipelineActive = isRunningAutonomous || isSimulating;

  // Industrial dashboard metrics: efficiency (how close to the ideal
  // baseline this scenario runs) and health score (the same decision score
  // driving the agent's own recommendation when a solution is active, or a
  // fixed diagnostic-confidence figure otherwise).
  const efficiencyPct = Math.min(100, Math.round((facility.baseline_kwh / simulatedKwh) * 100));
  const activeSolutionScore =
    (activeScenario === "A" || activeScenario === "B" || activeScenario === "C") && effectiveSolutions
      ? effectiveSolutions[activeScenario].decision_score
      : activeScenario === "BASELINE"
      ? 100
      : 76;

  const tempDeviation = Math.abs(simulatedZoneTemp - 22.0);
  const riskRows: { label: string; value: string; status: "ok" | "warning" | "alert" }[] = [
    {
      label: dt.riskHvacOvertime,
      value: `${hvacHours}h/day`,
      status: hvacHours <= 10 ? "ok" : hvacHours <= 12 ? "warning" : "alert",
    },
    {
      label: dt.riskIdleEquipment,
      value: activeScenario === "C" && customIdleSleep ? dt.riskManaged : activeScenario === "BASELINE" ? dt.riskManaged : dt.riskUnmanaged,
      status: (activeScenario === "C" && customIdleSleep) || activeScenario === "BASELINE" ? "ok" : activeScenario === "A" || activeScenario === "B" ? "warning" : "alert",
    },
    {
      label: dt.riskComfort,
      value: `${simulatedZoneTemp.toFixed(1)}°C`,
      status: tempDeviation <= 0.3 ? "ok" : tempDeviation <= 1.0 ? "warning" : "alert",
    },
    {
      label: dt.riskConfidence,
      value: `${activeSolutionScore}/100`,
      status: activeSolutionScore >= 80 ? "ok" : activeSolutionScore >= 60 ? "warning" : "alert",
    },
  ];

  // 7-day illustrative trend: this demo has one day of real telemetry, not
  // a week of it, so these are a plausible gradual build-up to today's
  // actual measured numbers (the last point is always the real value) --
  // not fabricated as if they were measured, and labeled as illustrative
  // in the panel footnote below.
  const consumptionTrend = [500, 504, 498, 512, 545, 583, facility.current_kwh];
  const hvacRuntimeTrend = [10, 10, 10, 11, 12, 13, facility.systems.hvac.actual_hours];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-md">
      {/* Compact Process Strip: the Digital Twin leads its own process --
          shows the same 9-stage pipeline progress the Dashboard timeline
          does, condensed to one row, so running a simulation here doesn't
          require leaving the page to see it happening. */}
      <div className={`mb-4 p-3 rounded-xl border flex items-center gap-3 transition-colors ${
        isPipelineActive ? "bg-amber-950/30 border-amber-800/50" : "bg-slate-950/60 border-slate-800/80"
      }`}>
        <div className="flex items-center gap-1.5 shrink-0">
          {isPipelineActive ? (
            <RotateCw className="w-3.5 h-3.5 text-amber-400 animate-spin" />
          ) : (
            <span className={`w-2 h-2 rounded-full ${currentStage === "COMPLETED" ? "bg-emerald-400" : "bg-slate-600"}`} />
          )}
          <span className={`text-[11px] font-semibold uppercase tracking-wider ${isPipelineActive ? "text-amber-300" : "text-slate-400"}`}>
            {dt.processLabel}
          </span>
        </div>
        <div className="flex-1 flex items-center gap-1 min-w-0 overflow-x-auto scrollbar-none">
          {STAGE_ORDER.slice(1, 10).map((stage, i) => {
            const stepIndex = i + 1;
            const done = currentStage === "COMPLETED" || currentStageIndex > stepIndex;
            const active = currentStageIndex === stepIndex;
            return (
              <span
                key={stage}
                title={t.stages[stage as keyof typeof t.stages]?.label}
                className={`h-1.5 rounded-full transition-all shrink-0 ${
                  active ? "w-6 bg-amber-400" : done ? "w-3 bg-emerald-500" : "w-3 bg-slate-700"
                }`}
              />
            );
          })}
        </div>
        <span className="text-[11px] font-medium text-slate-300 shrink-0">
          {currentStage === "COMPLETED"
            ? t.workflowCompleted
            : t.stages[currentStage as keyof typeof t.stages]?.label ?? currentStage}
        </span>
      </div>

      {/* Header with Title & Disclaimer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              {dt.title}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold uppercase text-[10px] tracking-wider px-1.5 py-0.2 bg-emerald-950/80 border border-emerald-800/60 rounded">
              {dt.estimatedBadge}
            </span>
            <span>{dt.modelNote}</span>
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
              <span>{dt.simulating}</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{dt.runSimulation}</span>
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
          {dt.currentAnomaly(facility.current_kwh)}
        </button>

        <button
          onClick={() => onSelectScenario("A")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeScenario === "A"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {dt.scenarioACutoff(solutions?.A.simulated_daily_kwh ?? "—")}
        </button>

        <button
          onClick={() => onSelectScenario("B")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
            activeScenario === "B"
              ? "bg-emerald-500 text-slate-950 shadow-sm"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {dt.scenarioBSetpoint(solutions?.B.simulated_daily_kwh ?? "—")}
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
          <span>{dt.scenarioCRecommended(solutions?.C.simulated_daily_kwh ?? "—")}</span>
        </button>

        <button
          onClick={() => onSelectScenario("BASELINE")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activeScenario === "BASELINE"
              ? "bg-slate-700 text-white"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          {dt.baselineReference(facility.baseline_kwh)}
        </button>
      </div>

      {/* Customization Panel: tune the two adjustable levers instead of
          accepting the demo defaults. Only meaningful for A/B/C, and only
          shown for those so BASELINE/CURRENT stay simple read-only states. */}
      {(activeScenario === "A" || activeScenario === "B" || activeScenario === "C") && (
        <div className="mt-3 p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/90">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
              <SlidersHorizontal className="w-3.5 h-3.5 text-teal-400" />
              {dt.customizeTitle}
            </span>
            {isCustomized && (
              <button
                onClick={resetCustomization}
                className="flex items-center gap-1 text-[10px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {dt.customizeReset}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {(activeScenario === "A" || activeScenario === "C") && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>{dt.customizeCutoffLabel}</span>
                  <span className="font-semibold text-teal-300 tabular-nums">{customCutoffHour.toString().padStart(2, "0")}:00</span>
                </div>
                <input
                  type="range"
                  min={18}
                  max={22}
                  step={1}
                  value={customCutoffHour}
                  onChange={(e) => setCustomCutoffHour(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>
            )}

            {activeScenario === "B" && (
              <div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                  <span>{dt.customizeSetpointLabel}</span>
                  <span className="font-semibold text-teal-300 tabular-nums">+{customSetpointOffset.toFixed(1)}°C</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={3.0}
                  step={0.1}
                  value={customSetpointOffset}
                  onChange={(e) => setCustomSetpointOffset(Number(e.target.value))}
                  className="w-full accent-teal-500"
                />
              </div>
            )}

            {activeScenario === "C" && (
              <label className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={customIdleSleep}
                  onChange={(e) => setCustomIdleSleep(e.target.checked)}
                  className="accent-teal-500 w-3.5 h-3.5"
                />
                {dt.customizeIdleLabel}
              </label>
            )}
          </div>

          {isCustomized && (
            <p className="text-[10px] text-amber-400/90 mt-2.5 flex items-center gap-1">
              <Info className="w-3 h-3" />
              {dt.customizeNote}
            </p>
          )}
        </div>
      )}

      {/* Industrial Digital-Twin Dashboard: annotated equipment schematic +
          operational parameters + risk assessment, matching the monitoring-
          dashboard convention (labeled equipment diagram, gauges, risk
          table, trend charts) rather than a walkthrough render. */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.3fr_1fr_1fr] gap-4">
        <EquipmentSchematic
          title={dt.schematicTitle}
          isRunning={hvacHours > 10}
          callouts={[
            {
              label: "DISCHARGE TEMP",
              value: `${simulatedZoneTemp.toFixed(1)}°C`,
              status: tempDeviation <= 0.3 ? "ok" : tempDeviation <= 1.0 ? "warning" : "alert",
              anchor: [155, 65],
              box: [15, 25],
              align: "right",
            },
            {
              label: "RUNTIME",
              value: `${hvacHours}h/day`,
              status: hvacHours <= 10 ? "ok" : hvacHours <= 12 ? "warning" : "alert",
              anchor: [245, 65],
              box: [385, 25],
              align: "left",
            },
            {
              label: "POWER DRAW",
              value: `${Math.round(simulatedHvacKwh)} kWh`,
              status: "ok",
              anchor: [155, 155],
              box: [15, 195],
              align: "right",
            },
            {
              label: "STATUS",
              value: hvacHours > 10 ? "OVERRUN" : "NORMAL",
              status: hvacHours > 10 ? "alert" : "ok",
              anchor: [245, 155],
              box: [385, 195],
              align: "left",
            },
          ]}
        />

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">{dt.paramsTitle}</div>
          <div className="space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{dt.operatingHours}</span>
              <span className="font-semibold text-white tabular-nums">{(hvacHours * 365).toLocaleString()} {dt.hoursPerYear}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{dt.periodCost}</span>
              <span className="font-semibold text-white tabular-nums">{currencySymbol}{(dailyCost * 365).toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">{dt.co2Factor}</span>
              <span className="font-semibold text-white tabular-nums">{facility.config.co2_factor_kg_per_kwh} {dt.kgPerKwh}</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-3">{dt.riskTitle}</div>
          <div className="space-y-2.5 text-xs">
            {riskRows.map((row) => (
              <div key={row.label} className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      row.status === "ok" ? "bg-emerald-400" : row.status === "warning" ? "bg-amber-400" : "bg-red-400"
                    }`}
                  />
                  {row.label}
                </span>
                <span className="font-semibold text-white tabular-nums">{row.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gauges */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex justify-center">
          <RadialGauge value={efficiencyPct} label={dt.efficiencyLabel} colorClass="stroke-teal-400" />
        </div>
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex justify-center">
          <RadialGauge value={activeSolutionScore} label={dt.healthScoreLabel} colorClass="stroke-emerald-400" />
        </div>
      </div>

      {/* Trend charts + Recommendations */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-4">
        <div>
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">{dt.trendsTitle}</div>
          <div className="grid grid-cols-2 gap-3">
            <MiniTrendChart label={dt.trendConsumption} points={consumptionTrend} unit="kWh" colorClass="stroke-amber-400" dotColorClass="fill-amber-400" />
            <MiniTrendChart label={dt.trendHvacRuntime} points={hvacRuntimeTrend} unit="h" colorClass="stroke-red-400" dotColorClass="fill-red-400" />
          </div>
          <p className="text-[10px] text-slate-500 mt-2 flex items-start gap-1">
            <Info className="w-3 h-3 mt-0.5 shrink-0" />
            {dt.trendNote}
          </p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2.5">{dt.recommendationsTitle}</div>
          {effectiveSolutions && (
            <ul className="space-y-1.5 text-xs text-slate-300">
              {getSolutionText(language, effectiveSolutions.C, currencySymbol).pros.map((pro, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                  <span>{pro}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Main Digital Twin Grid: Visual Schematic + Real-time Calculated Twin Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-4">
        {/* Left 7 Cols: Interactive Building Isometric Schematic */}
        <div className="lg:col-span-7 bg-slate-950/90 border border-slate-800 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden">
          {/* Top Floor Controls */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-teal-400" />
              {t.facility.name} ({dt.floorZoneModel})
            </span>

            <div className="flex items-center gap-1 text-[11px]">
              <span className="text-slate-400 mr-1 font-medium">{dt.floorZone}</span>
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
                  <div className="font-semibold text-slate-200 text-[11px] flex items-center gap-1.5">
                    {dt.pvArray}
                    <span className="text-[9px] font-normal text-teal-400 bg-teal-950 px-1.5 py-0.1 rounded border border-teal-800/60">{dt.rooftopBadge}</span>
                  </div>
                  <div className="text-[10px] text-teal-300">{dt.generating}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded">{dt.activeSolar}</span>
            </div>

            {/* Middle: Floor Zones with Dynamic State Indicator — highlights to match the Floor Zone selector above */}
            <div className="grid grid-cols-3 gap-2 my-2">
              {/* Zone A: Open Workstations — Floor 1 */}
              <div
                className={`p-2.5 rounded-lg bg-slate-900/90 border text-left transition-transform duration-200 ${
                  selectedFloor === 1 ? "border-teal-500 ring-1 ring-teal-500/50 scale-[1.03]" : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>{dt.zoneAName} <span className="text-slate-600 font-normal">· L1</span></span>
                  <span className="text-emerald-400 font-bold text-[10px]">{simulatedZoneTemp}°C</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                  <Thermometer className="w-3 h-3 text-teal-400" />
                  <span>{dt.setpoint(activeScenario === "B" ? "23.5°C" : "22.0°C")}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {dt.occupancy} <span className="text-slate-300 font-medium">{dt.occupancyValue}</span>
                </div>
              </div>

              {/* Zone B: Tech Lab & Servers — Floor 2 */}
              <div
                className={`p-2.5 rounded-lg bg-slate-900/90 border text-left transition-transform duration-200 ${
                  selectedFloor === 2 ? "border-teal-500 ring-1 ring-teal-500/50 scale-[1.03]" : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>{dt.zoneBName} <span className="text-slate-600 font-normal">· L2</span></span>
                  <span className="text-teal-400 font-bold text-[10px]">21.5°C</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {dt.plugLoad} <span className="text-amber-300 font-medium">{activeScenario === "C" ? dt.sleepEnabled : dt.activeCount}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {dt.criticalServers} <span className="text-slate-300">{dt.protected}</span>
                </div>
              </div>

              {/* Zone C: Executive Suites — Floor 3 */}
              <div
                className={`p-2.5 rounded-lg bg-slate-900/90 border text-left transition-transform duration-200 ${
                  selectedFloor === 3 ? "border-teal-500 ring-1 ring-teal-500/50 scale-[1.03]" : "border-slate-800"
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>{dt.zoneCName} <span className="text-slate-600 font-normal">· L3</span></span>
                  <span className="text-emerald-400 font-bold text-[10px]">{simulatedZoneTemp}°C</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {dt.lighting} <span className="text-emerald-300 font-medium">{dt.lightingOff}</span>
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {dt.vavDamper} <span className="text-slate-300">{hvacHours > 10 ? dt.damperOpen : dt.damperClosed}</span>
                </div>
              </div>
            </div>

            {/* Bottom: Central HVAC AHU Plant Loop */}
            <div
              className={`flex items-center justify-between p-2 rounded-lg text-xs border transition-colors duration-300 ${
                hvacHours > 10
                  ? "bg-red-950/40 border-red-800/60 text-red-300 animate-pulse"
                  : "bg-emerald-950/40 border-emerald-800/60 text-emerald-300"
              }`}
            >
              <div className="flex items-center gap-2">
                <Fan className={`w-4 h-4 ${hvacHours > 10 ? "text-red-400 animate-spin" : "text-emerald-400"}`} />
                <div>
                  <div className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                    {dt.ahu}
                    <span className="text-[9px] font-normal text-slate-300 bg-slate-900/80 px-1.5 py-0.1 rounded border border-slate-700/60">{dt.plantRoomBadge}</span>
                  </div>
                  <div className="text-[10px]">
                    {dt.serves(hvacHours, hvacHours > 10 ? dt.overtimeRuntime : dt.standbyRuntime)}
                  </div>
                </div>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                hvacHours > 10 ? "bg-red-900 text-red-200" : "bg-emerald-900 text-emerald-200"
              }`}>
                {dt.hoursPerDay(hvacHours)}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 mt-2 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-slate-400" />
              {dt.floorArea(facility.config.area_sqm)}
            </span>
            <span className="font-medium text-slate-300">{scenarioLabel}</span>
          </div>
        </div>

        {/* Right 5 Cols: Digital Twin Simulation Live Calculations */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
          {/* Simulated Total Daily Energy */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              {dt.simulatedConsumption}
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <AnimatedNumber value={simulatedKwh} className="text-3xl font-extrabold text-white tabular-nums" />
              <span className="text-sm font-semibold text-slate-400">{dt.kwhPerDay}</span>
            </div>

            {/* Comparison vs current measured consumption */}
            <div className="mt-2.5 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">{dt.varianceVsCurrent(facility.current_kwh)}</span>
              {savingsKwh > 0 ? (
                <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                  -{savingsKwh} kWh (-{savingsPct}%)
                </span>
              ) : (
                <span className="text-amber-400 font-semibold">{dt.overBaseline(facility.current_kwh - facility.baseline_kwh)}</span>
              )}
            </div>
          </div>

          {/* Subsystem Power Breakdown in Simulated State */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-300 pb-1 border-b border-slate-800 flex items-center justify-between">
              <span>{dt.subCircuitBreakdown}</span>
              <span className="text-[10px] text-slate-400 font-normal">{dt.simulatedMode}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Fan className="w-3.5 h-3.5 text-teal-400" /> {dt.hvacSystem} <span className="text-slate-600">{dt.rooftopParen}</span>
              </span>
              <span className="font-semibold text-slate-200 tabular-nums"><AnimatedNumber value={simulatedHvacKwh} /> {dt.kwhPerDay}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" /> {dt.lightingBreakdown} <span className="text-slate-600">{dt.allFloorsParen}</span>
              </span>
              <span className="font-semibold text-slate-200 tabular-nums"><AnimatedNumber value={facility.systems.lighting.daily_kwh} /> {dt.kwhPerDay}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> {dt.equipment} <span className="text-slate-600">{dt.zoneBParen}</span>
              </span>
              <span className="font-semibold text-slate-200 tabular-nums"><AnimatedNumber value={simulatedEquipKwh} /> {dt.kwhPerDay}</span>
            </div>

            <div className="flex items-center justify-between text-teal-400">
              <span className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-amber-400" /> {dt.solar} <span className="text-slate-600">{dt.rooftopArrayParen}</span>
              </span>
              <span className="font-semibold tabular-nums">-<AnimatedNumber value={facility.systems.solar.daily_generation_kwh} /> {dt.kwhPerDay}</span>
            </div>
          </div>

          {/* Financial Recapture Summary */}
          <div className="bg-gradient-to-br from-emerald-950/30 to-slate-900 border border-emerald-800/40 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                {dt.projectedMonthlySavings}
              </div>
              <div className="text-lg font-bold text-white mt-0.5">
                {savingsKwh > 0 ? `${currencySymbol}${monthlyCostSaving}` : `${currencySymbol}0.00`}
                <span className="text-[11px] font-normal text-slate-400"> {dt.perMonth}</span>
              </div>
            </div>

            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold">
                {dt.operationalRisk}
              </div>
              <div className="text-sm font-semibold text-emerald-400 mt-0.5">
                {activeScenario === "C" ? dt.risk.C : activeScenario === "A" ? dt.risk.A : activeScenario === "B" ? dt.risk.B : dt.risk.current}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
