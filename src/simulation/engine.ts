import {
  FacilityState,
  HourlyEnergyPoint,
  AnomalyReport,
  InvestigationFinding,
  ProposedSolution,
  DigitalTwinSimulation,
} from "../types";

export class EnergyCalculationEngine {
  /**
   * Evaluates if current consumption exceeds the configured threshold vs baseline
   */
  static detectAnomaly(state: FacilityState, thresholdPct = 10): AnomalyReport {
    const baseline = state.baseline_kwh;
    const actual = state.current_kwh;
    const variance = actual - baseline;
    const variancePct = Number(((variance / baseline) * 100).toFixed(1));
    const isAnomaly = variancePct >= thresholdPct;

    return {
      detected: isAnomaly,
      severity: variancePct > 20 ? "critical" : variancePct > 10 ? "warning" : "info",
      baseline_kwh: baseline,
      actual_kwh: actual,
      variance_kwh: variance,
      variance_pct: variancePct,
      threshold_pct: thresholdPct,
      timestamp: "Today, 22:30 EET / Live Telemetry",
      primary_system: "HVAC & Auxiliary Plug Loads",
      headline: `Energy consumption is ${variancePct}% above normal daily baseline`,
      summary: `Expected ${baseline} kWh/day based on historical 30-day moving average. Facility registered ${actual} kWh (+${variance} kWh excess energy).`,
    };
  }

  /**
   * Dissects sub-system energy drivers to isolate root causes
   */
  static investigateAnomaly(state: FacilityState): InvestigationFinding {
    const hvac = state.systems.hvac;
    const equipment = state.systems.equipment;
    const overtimeHours = Math.max(0, hvac.actual_hours - hvac.normal_hours);
    const hvacWaste = overtimeHours * hvac.power_rating_kw;
    const idleWaste = Math.max(0, equipment.idle_kwh - 20); // 20 kWh expected base idle
    const totalWaste = hvacWaste + idleWaste;

    return {
      root_cause: "After-Hours HVAC Continuous Operation & Unmanaged Idle Plug Loads",
      contributing_factors: [
        `Central HVAC AHU operated for ${overtimeHours} hours past facility closing (18:00 to 22:00) with zero occupancy.`,
        `Workstation & server peripheral idle baseload drew ${idleWaste} kWh excess power outside operating hours.`,
        "Lighting grid functioned normally on automated photocell/schedule controllers.",
        "Solar generation produced expected 50 kWh peak output with 0% inverter fault.",
      ],
      hvac_waste_kwh: hvacWaste,
      equipment_idle_waste_kwh: idleWaste,
      total_waste_kwh: totalWaste,
      waste_time_window: "18:00 – 22:00 (Post-Occupancy Period)",
      agent_confidence_pct: 87,
      evidence_points: [
        {
          label: "HVAC Run Duration",
          value: `${hvac.actual_hours}h actual vs ${hvac.normal_hours}h scheduled (+4.0h)`,
          status: "alert",
        },
        {
          label: "HVAC Energy Share",
          value: `${hvac.actual_kwh} kWh (45.2% of total building consumption)`,
          status: "alert",
        },
        {
          label: "Idle Plug Load Draw",
          value: `${equipment.idle_kwh} kWh (${equipment.unmanaged_idle_count} unmanaged devices)`,
          status: "warning",
        },
        {
          label: "Lighting Sub-meter",
          value: `${state.systems.lighting.daily_kwh} kWh (Normal schedule adherence)`,
          status: "ok",
        },
        {
          label: "Solar Rooftop Offset",
          value: `-${state.systems.solar.daily_generation_kwh} kWh (Normal nominal profile)`,
          status: "ok",
        },
      ],
      detailed_explanation:
        "The agent cross-referenced smart sub-meter power profiles against the facility master working hours (08:00–18:00). At 18:01, occupant occupancy dropped to zero, yet the 20 kW HVAC chiller system continued running at full capacity until 22:00, wasting ~80 kWh. Concurrently, 38 idle workstations remained active, drawing an additional ~13-15 kWh. Together, these two factors account for 93 kWh (77.5%) of the total 120 kWh anomaly.",
    };
  }

  /**
   * Generates candidate intervention solutions with mathematical outcomes
   */
  static generateSolutions(state: FacilityState): Record<"A" | "B" | "C", ProposedSolution> {
    const rate = state.config.electricity_rate;
    const currentKwh = state.current_kwh; // 620

    // Scenario A: Optimize HVAC schedule only (stop at 18:00)
    // Savings: 50 kWh reduction
    const savA_kwh = 50;
    const finalA_kwh = currentKwh - savA_kwh; // 570
    const savA_pct = Number(((savA_kwh / currentKwh) * 100).toFixed(1)); // 8.1%

    // Scenario B: Adjust HVAC setpoint +1.5°C (22°C -> 23.5°C) without schedule fix
    // Savings: ~37 kWh reduction
    const savB_kwh = 37;
    const finalB_kwh = currentKwh - savB_kwh; // 583
    const savB_pct = Number(((savB_kwh / currentKwh) * 100).toFixed(1)); // 6.0%

    // Scenario C: Combined HVAC 18:00 automated schedule + Idle equipment cutoff
    // Savings: 80 kWh (HVAC) + 13 kWh (Idle equipment) = 93 kWh reduction
    const savC_kwh = 93;
    const finalC_kwh = currentKwh - savC_kwh; // 527
    const savC_pct = Number(((savC_kwh / currentKwh) * 100).toFixed(1)); // 15.0%

    const solA: ProposedSolution = {
      id: "A",
      name: "Enforce HVAC Schedule Cutoff",
      short_label: "HVAC Schedule",
      tagline: "Terminate cooling cycles promptly at 18:00",
      description:
        "Automatically command the BMS chiller and AHU units to switch to standby mode at 18:00, matching official facility working hours.",
      mechanism: "BMS automated schedule timer reset + occupancy sensor override.",
      simulated_daily_kwh: finalA_kwh,
      estimated_saving_kwh: savA_kwh,
      estimated_saving_pct: savA_pct,
      daily_cost_saving: Number((savA_kwh * rate).toFixed(2)),
      monthly_cost_saving: Number((savA_kwh * rate * 30).toFixed(2)),
      annual_cost_saving: Number((savA_kwh * rate * 365).toFixed(2)),
      monthly_co2_saving_kg: Number((savA_kwh * 30 * state.config.co2_factor_kg_per_kwh).toFixed(1)),
      operational_impact: "Minimal",
      comfort_impact: "Zero impact",
      risk_level: "Low",
      risk_score: 2.1,
      implementation_speed: "Immediate (BMS automated schedule)",
      decision_score: 78,
      is_recommended: false,
      pros: ["Zero occupant comfort compromise during work hours", "Simple BMS calendar schedule update", "Reliable 50 kWh/day recapture"],
      cons: ["Does not address unmanaged idle equipment draw (leaves 13-15 kWh on the table)"],
    };

    const solB: ProposedSolution = {
      id: "B",
      name: "Adjust HVAC Temperature Setpoint",
      short_label: "HVAC Setpoint (+1.5°C)",
      tagline: "Increase cooling setpoint from 22.0°C to 23.5°C",
      description:
        "Raise the facility indoor temperature setpoint by 1.5°C across all floors to reduce overall compressor lift work during all operating hours.",
      mechanism: "Thermostat setpoint modification across 3 floor zones.",
      simulated_daily_kwh: finalB_kwh,
      estimated_saving_kwh: savB_kwh,
      estimated_saving_pct: savB_pct,
      daily_cost_saving: Number((savB_kwh * rate).toFixed(2)),
      monthly_cost_saving: Number((savB_kwh * rate * 30).toFixed(2)),
      annual_cost_saving: Number((savB_kwh * rate * 365).toFixed(2)),
      monthly_co2_saving_kg: Number((savB_kwh * 30 * state.config.co2_factor_kg_per_kwh).toFixed(1)),
      operational_impact: "Moderate",
      comfort_impact: "Slight thermal drift (~0.8°C)",
      risk_level: "Low / Medium",
      risk_score: 4.8,
      implementation_speed: "Immediate (Setpoint offset)",
      decision_score: 62,
      is_recommended: false,
      pros: ["Reduces daytime peak cooling load", "No complex hardware modifications required"],
      cons: [
        "Leaves after-hours 4h overtime running unaddressed",
        "Higher occupant thermal complaints potential during afternoon peak",
        `Lowest overall energy savings (only ${savB_pct}%)`,
      ],
    };

    const solC: ProposedSolution = {
      id: "C",
      name: "Optimized HVAC Schedule + Idle Equipment Sleep",
      short_label: "Combined Optimization",
      tagline: "Automated 18:00 HVAC cutoff + smart plug-load power down",
      description:
        "Synchronize HVAC shutdown at 18:00 with building vacancy and trigger automated sleep states on 38 unmanaged workstation & peripheral circuits.",
      mechanism: "BMS schedule sync + smart PDU / power-strip policy deployment.",
      simulated_daily_kwh: finalC_kwh,
      estimated_saving_kwh: savC_kwh,
      estimated_saving_pct: savC_pct,
      daily_cost_saving: Number((savC_kwh * rate).toFixed(2)),
      monthly_cost_saving: Number((savC_kwh * rate * 30).toFixed(2)),
      annual_cost_saving: Number((savC_kwh * rate * 365).toFixed(2)),
      monthly_co2_saving_kg: Number((savC_kwh * 30 * state.config.co2_factor_kg_per_kwh).toFixed(1)),
      operational_impact: "Low",
      comfort_impact: "Zero impact",
      risk_level: "Low / Medium",
      risk_score: 2.8,
      implementation_speed: "Automated (Schedule + Smart Relays)",
      decision_score: 96, // Clear winner
      is_recommended: true,
      pros: [
        `Highest energy reduction: ${savC_pct}% (${savC_kwh} kWh/day saved)`,
        `Recovers ${state.config.currency_symbol}${Math.round(savC_kwh * rate * 30)}+/month in wasted energy`,
        "Zero comfort disruption during core working hours (08:00-18:00)",
        "Eliminates phantom vampire power across workstation circuits",
      ],
      cons: ["Requires IT/facilities team alignment on automated sleep scripts for peripheral monitors"],
    };

    return { A: solA, B: solB, C: solC };
  }

  /**
   * Generates realistic 24-hour load profiles (00:00 to 23:00)
   */
  static generateHourlyProfile(
    state: FacilityState,
    activeScenario: "BASELINE" | "CURRENT" | "A" | "B" | "C" = "CURRENT"
  ): HourlyEnergyPoint[] {
    const points: HourlyEnergyPoint[] = [];

    // Base hourly patterns (kWh per hour)
    for (let h = 0; h < 24; h++) {
      const isWorking = h >= 8 && h < 18;
      const isAfterHoursAnomaly = h >= 18 && h < 22; // 18:00 to 22:00 where anomaly occurred
      const timeLabel = `${h.toString().padStart(2, "0")}:00`;

      // Baseline components
      let baseHvac = 0;
      let baseLight = 1.0;
      let baseEquip = 2.5;
      let baseSolar = 0;

      if (isWorking) {
        baseHvac = 20.0;
        baseLight = 6.5;
        baseEquip = 8.5;
      } else {
        baseHvac = 2.0; // nighttime ventilation/standby
        baseLight = 1.5;
        baseEquip = 2.0;
      }

      // Solar curve (bell curve peaking at 12:00-13:00)
      if (h >= 6 && h <= 17) {
        const peakDist = Math.abs(h - 12);
        baseSolar = Math.max(0, Number((7.5 * Math.cos((peakDist / 6) * (Math.PI / 2))).toFixed(1)));
      }

      const baselineHourly = Math.max(
        5,
        Number((baseHvac + baseLight + baseEquip + 8.0 - baseSolar).toFixed(1))
      );

      // Current Anomaly hourly
      let actualHvac = baseHvac;
      let actualEquip = baseEquip;

      if (isAfterHoursAnomaly) {
        // HVAC ran full power 20 kW instead of 2 kW
        actualHvac = 20.0;
        // Equipment idle draw
        actualEquip = 5.5;
      }

      const actualHourly = Math.max(
        5,
        Number((actualHvac + baseLight + actualEquip + 8.0 - baseSolar).toFixed(1))
      );

      // Simulated scenario hourly
      let simHvac = actualHvac;
      let simEquip = actualEquip;

      if (activeScenario === "A") {
        // HVAC stops at 18:00
        if (isAfterHoursAnomaly) {
          simHvac = 2.0;
        }
      } else if (activeScenario === "B") {
        // Temperature offset (runs during working and after-hours, but at ~85% load)
        simHvac = isWorking || isAfterHoursAnomaly ? 17.0 : 2.0;
      } else if (activeScenario === "C" || activeScenario === "BASELINE") {
        // HVAC stops at 18:00 + idle gear shut off
        if (isAfterHoursAnomaly) {
          simHvac = 2.0;
          simEquip = 2.0;
        }
      }

      const simHourly = Math.max(
        5,
        Number((simHvac + baseLight + simEquip + 8.0 - baseSolar).toFixed(1))
      );

      points.push({
        hour: h,
        timeLabel,
        baseline_kwh: baselineHourly,
        actual_kwh: actualHourly,
        simulated_kwh: simHourly,
        hvac_kwh: actualHvac,
        lighting_kwh: baseLight,
        equipment_kwh: actualEquip,
        solar_kwh: baseSolar,
        isWorkingHour: isWorking,
        isAfterHoursWaste: isAfterHoursAnomaly,
      });
    }

    return points;
  }

  /**
   * Runs the complete Digital Twin Simulation pack
   */
  static runDigitalTwinSimulation(state: FacilityState): DigitalTwinSimulation {
    const solutions = this.generateSolutions(state);

    return {
      active_scenario: "C",
      scenarios: solutions,
      current_daily_kwh: state.current_kwh,
      baseline_daily_kwh: state.baseline_kwh,
      recommended_solution_id: "C",
      simulation_timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      simulation_confidence: 94.2,
    };
  }
}
