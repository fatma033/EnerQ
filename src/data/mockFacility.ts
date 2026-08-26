import { FacilityState } from "../types";

export const initialFacilityData: FacilityState = {
  config: {
    id: "fac-comm-092",
    name: "Sultan Qaboos Complex for Youth, Culture and Entertainment",
    type: "Youth, Culture & Entertainment Complex (3 Floors)",
    location: "Salalah, Dhofar Governorate, Oman",
    area_sqm: 3200,
    working_hours: {
      start: "08:00",
      end: "18:00",
    },
    // OMR 0.025/kWh: Oman's flat government-sector electricity tariff (25 baisas/kWh),
    // effective 1 Jan 2025 per the Authority for Public Services Regulation (APSR).
    // A public youth/culture facility like this one bills on the government tariff,
    // not the residential or commercial bands -- see FacilitySettingsModal for the
    // other sector presets (commercial, residential) if the actual host institute differs.
    electricity_rate: 0.025,
    currency: "OMR",
    currency_symbol: "OMR ",
    co2_factor_kg_per_kwh: 0.42,
  },
  baseline_kwh: 500,
  current_kwh: 620,
  systems: {
    hvac: {
      name: "Central Chilled Water Rooftop AHU & VAV",
      normal_hours: 10, // 08:00 to 18:00
      actual_hours: 14, // 08:00 to 22:00 (4 hours overtime waste)
      power_rating_kw: 20.0, // 20 kW continuous during runtime
      base_kwh: 200,
      actual_kwh: 280, // 200 + (4h * 20 kW = 80 kWh)
      temp_setpoint_c: 22.0,
      current_zone_temp_c: 21.8,
      status: "abnormal",
      alert: "Operating 4 hours past facility 18:00 closing schedule",
    },
    lighting: {
      name: "Intelligent Scheduled LED Grid",
      daily_kwh: 80,
      fixture_count: 140,
      schedule_controlled: true,
      status: "normal",
      alert: undefined,
    },
    equipment: {
      name: "Plug Loads, Workstations & Auxiliary Gear",
      active_kwh: 85,
      idle_kwh: 35, // 20 kWh normal idle + 15 kWh unmanaged left-on gear
      total_kwh: 120, // normally 100
      unmanaged_idle_count: 38,
      status: "abnormal",
      alert: "38 workstations and auxiliary monitors drawing power while unoccupied",
    },
    solar: {
      name: "Rooftop Bi-facial Solar PV Array",
      capacity_kw: 15.0,
      daily_generation_kwh: 50,
      peak_output_kw: 12.4,
      status: "normal",
    },
  },
};
