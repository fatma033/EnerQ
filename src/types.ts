export type AgentStage =
  | "IDLE"
  | "OBSERVE"
  | "DETECT"
  | "INVESTIGATE"
  | "GENERATE_SOLUTIONS"
  | "SIMULATE"
  | "COMPARE"
  | "DECIDE"
  | "RECOMMEND"
  | "VERIFY"
  | "COMPLETED";

export interface FacilityWorkingHours {
  start: string; // e.g. "08:00"
  end: string;   // e.g. "18:00"
}

export interface FacilityConfig {
  id: string;
  name: string;
  type: string;
  location: string;
  area_sqm: number;
  working_hours: FacilityWorkingHours;
  electricity_rate: number; // e.g. 0.14 USD or 0.054 OMR
  currency: string;        // "$" | "OMR" | "AED" | "EUR" | "SAR" | "GBP"
  currency_symbol: string;
  co2_factor_kg_per_kwh: number; // standard 0.42 kg CO2 / kWh
}

export interface SystemTelemetry {
  hvac: {
    name: string;
    normal_hours: number;
    actual_hours: number;
    power_rating_kw: number;
    base_kwh: number;
    actual_kwh: number;
    temp_setpoint_c: number;
    current_zone_temp_c: number;
    status: "normal" | "abnormal" | "optimized";
    alert?: string;
  };
  lighting: {
    name: string;
    daily_kwh: number;
    fixture_count: number;
    schedule_controlled: boolean;
    status: "normal" | "warning";
    alert?: string;
  };
  equipment: {
    name: string;
    active_kwh: number;
    idle_kwh: number;
    total_kwh: number;
    unmanaged_idle_count: number;
    status: "normal" | "abnormal";
    alert?: string;
  };
  solar: {
    name: string;
    capacity_kw: number;
    daily_generation_kwh: number;
    peak_output_kw: number;
    status: "normal";
  };
}

export interface FacilityState {
  config: FacilityConfig;
  baseline_kwh: number;
  current_kwh: number;
  systems: SystemTelemetry;
}

export interface HourlyEnergyPoint {
  hour: number;
  timeLabel: string;
  baseline_kwh: number;
  actual_kwh: number;
  simulated_kwh: number;
  hvac_kwh: number;
  lighting_kwh: number;
  equipment_kwh: number;
  solar_kwh: number;
  isWorkingHour: boolean;
  isAfterHoursWaste: boolean;
}

export interface AnomalyReport {
  detected: boolean;
  severity: "critical" | "warning" | "info";
  baseline_kwh: number;
  actual_kwh: number;
  variance_kwh: number;
  variance_pct: number;
  threshold_pct: number;
  timestamp: string;
  primary_system: string;
  headline: string;
  summary: string;
}

export interface InvestigationFinding {
  root_cause: string;
  contributing_factors: string[];
  hvac_waste_kwh: number;
  equipment_idle_waste_kwh: number;
  total_waste_kwh: number;
  waste_time_window: string;
  agent_confidence_pct: number;
  evidence_points: {
    label: string;
    value: string;
    status: "alert" | "warning" | "neutral" | "ok";
  }[];
  detailed_explanation: string;
}

export interface ProposedSolution {
  id: "A" | "B" | "C";
  name: string;
  short_label: string;
  tagline: string;
  description: string;
  mechanism: string;
  
  // Numerical calculated outcomes
  simulated_daily_kwh: number;
  estimated_saving_kwh: number;
  estimated_saving_pct: number;
  daily_cost_saving: number;
  monthly_cost_saving: number;
  annual_cost_saving: number;
  monthly_co2_saving_kg: number;

  // Multi-attribute scoring parameters
  operational_impact: "Minimal" | "Low" | "Moderate";
  comfort_impact: "Zero impact" | "Slight thermal drift (~0.8°C)" | "Zero impact";
  risk_level: "Low" | "Low / Medium" | "Medium" | "High";
  risk_score: number; // 1 (safest) to 10 (riskiest)
  implementation_speed: "Immediate (BMS automated schedule)" | "Immediate (Setpoint offset)" | "Automated (Schedule + Smart Relays)";
  decision_score: number; // 0 to 100 calculated by multi-criteria decision engine
  is_recommended: boolean;

  pros: string[];
  cons: string[];
}

export interface DigitalTwinSimulation {
  active_scenario: "CURRENT" | "A" | "B" | "C" | "CUSTOM";
  scenarios: Record<"A" | "B" | "C", ProposedSolution>;
  current_daily_kwh: number;
  baseline_daily_kwh: number;
  recommended_solution_id: "A" | "B" | "C";
  simulation_timestamp: string;
  simulation_confidence: number;
}

export interface VerificationResult {
  verified: boolean;
  status_text: string;
  implemented_solution_id: "A" | "B" | "C";
  initial_consumption_kwh: number;
  verified_consumption_kwh: number;
  actual_reduction_kwh: number;
  actual_reduction_pct: number;
  daily_cost_saved: number;
  monthly_cost_saved: number;
  annual_cost_saved: number;
  annual_co2_kg_saved: number;
  timestamp: string;
  next_check_in: string;
}

export interface AgentLogMessage {
  id: string;
  timestamp: string;
  stage: AgentStage;
  type: "observe" | "detect" | "investigate" | "simulate" | "decide" | "recommend" | "verify" | "info";
  title: string;
  detail: string;
  metrics?: { label: string; value: string }[];
  badge?: string;
}
