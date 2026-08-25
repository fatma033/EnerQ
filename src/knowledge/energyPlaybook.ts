/**
 * EnerQ Knowledge Base — the grounding corpus for the agent's RAG layer.
 *
 * These are structured energy-management playbook entries (facility ops
 * best practices, decision heuristics, and M&V protocol notes) that the
 * agent retrieves from before reasoning with the LLM, so recommendations
 * are traceable to a source rather than freely generated.
 */

export interface KnowledgeChunk {
  id: string;
  title: string;
  category: "hvac" | "plug-loads" | "decision-making" | "verification" | "change-management" | "solar" | "lighting";
  tags: string[];
  content: string;
}

export const ENERGY_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: "hvac-schedule-lockout",
    title: "HVAC After-Hours Schedule Lockout",
    category: "hvac",
    tags: ["hvac", "after-hours", "schedule", "chiller", "ahu", "overtime"],
    content:
      "The single highest-leverage HVAC fix in commercial buildings is enforcing a hard schedule cutoff tied to occupancy hours. A rooftop AHU/chiller plant left running past closing time consumes near-full load (typically 90%+ of daytime draw) for zero occupant benefit. BMS-level schedule locks with a short (10-20 minute) thermal coasting buffer recover the vast majority of this waste with zero comfort impact, since no one is present to notice the earlier cutoff. This is a Low risk, immediate-implementation intervention and should be evaluated before touching setpoints.",
  },
  {
    id: "hvac-setpoint-tradeoff",
    title: "Setpoint Offset vs. Schedule Fix Trade-off",
    category: "hvac",
    tags: ["hvac", "setpoint", "temperature", "comfort", "thermal drift"],
    content:
      "Raising a cooling setpoint (e.g. +1.0 to +1.5C) reduces compressor lift work across all operating hours, including times the building IS occupied, so it introduces real thermal-comfort risk and often yields smaller total savings than fixing a scheduling gap. Setpoint changes are best used as a secondary, complementary lever after schedule-based waste is eliminated, not as the primary fix for an after-hours anomaly.",
  },
  {
    id: "plug-load-vampire-power",
    title: "Unmanaged Idle / Vampire Plug Load",
    category: "plug-loads",
    tags: ["plug load", "idle", "workstation", "vampire power", "equipment"],
    content:
      "Workstations, monitors, and auxiliary peripherals left powered outside working hours ('vampire power') typically account for 5-15% of total idle-period draw in office facilities. Smart PDU/power-strip sleep policies or OS-level wake-on-LAN shutdown scripts are low-risk, low-cost interventions that combine well with an HVAC schedule fix because they attack the same after-hours time window without touching climate control.",
  },
  {
    id: "combined-intervention-principle",
    title: "Combined Interventions Compound Savings at Low Marginal Risk",
    category: "decision-making",
    tags: ["combined", "solution", "risk", "savings", "multi-criteria"],
    content:
      "When two waste sources occupy the same time window (e.g. after-hours HVAC + after-hours idle equipment), combining their fixes into one intervention captures both savings pools without materially increasing operational risk, because the fixes act on independent systems. In multi-criteria decision analysis, a combined solution should generally outrank a single-system fix whenever its risk score does not increase proportionally to its added savings.",
  },
  {
    id: "mcda-scoring",
    title: "Multi-Criteria Decision Analysis for Facility Interventions",
    category: "decision-making",
    tags: ["decision", "score", "risk", "comfort", "mcda", "ranking"],
    content:
      "A defensible facility-optimization recommendation should weigh at least three axes: (1) energy/cost savings magnitude, (2) occupant comfort or operational disruption, and (3) implementation risk and reversibility. A solution with a smaller savings percentage but materially lower comfort/risk cost can still be the wrong recommendation if a combined alternative achieves both higher savings and an acceptable (not necessarily zero) risk delta — the agent should recommend the pareto-best option, not simply the largest single number.",
  },
  {
    id: "ipmvp-verification",
    title: "Measurement & Verification (M&V) Protocol",
    category: "verification",
    tags: ["verification", "m&v", "ipmvp", "actual vs expected", "savings confirmation"],
    content:
      "Following the IPMVP-style verification principle, a savings claim is only credible after comparing actual post-intervention consumption against the pre-intervention baseline under equivalent conditions, not merely against the simulated expectation. A gap between expected and actual savings (e.g. expected 15% vs 12.5% actual) is normal and should be reported transparently rather than hidden, with the residual gap flagged for a follow-up investigation cycle.",
  },
  {
    id: "employee-notification-escalation",
    title: "Responsible-Party Notification & Escalation Cadence",
    category: "change-management",
    tags: ["notification", "escalation", "responsible", "reminder", "accountability"],
    content:
      "Autonomous energy agents should not silently act without a named responsible owner for each piece of equipment. Best practice is a three-step cadence: (1) initial notification with quantified cost impact and a deadline, (2) a single reminder if unresolved that restates accumulating cost, (3) an escalation after a defined SLA (commonly 7-14 days) that surfaces cumulative waste to management. This keeps the human accountable while the agent keeps the issue from being forgotten.",
  },
  {
    id: "digital-twin-simulation-value",
    title: "Why Simulate Before Acting",
    category: "decision-making",
    tags: ["digital twin", "simulation", "test before act", "physics model"],
    content:
      "Testing a candidate intervention in a Digital Twin before real-world deployment lets the agent quantify expected savings and comfort impact without any operational risk. This is especially important for combined interventions, where the interaction between two changed systems (e.g. HVAC schedule + plug-load sleep) is not always the simple sum of their individual effects and benefits from an explicit simulated check.",
  },
  {
    id: "solar-self-consumption",
    title: "On-Site Solar Generation and Anomaly Isolation",
    category: "solar",
    tags: ["solar", "pv", "generation", "baseline"],
    content:
      "When diagnosing a consumption anomaly, on-site solar generation should be checked independently from the load side. A facility can show a net-consumption spike purely from increased load with completely normal solar output, or the anomaly could stem from a generation shortfall (inverter fault, panel soiling). Ruling out the generation side first prevents mis-attributing a load-side waste problem to a solar issue, or vice versa.",
  },
  {
    id: "lighting-schedule-baseline",
    title: "Scheduled Lighting as a Low-Priority Investigation Target",
    category: "lighting",
    tags: ["lighting", "schedule", "photocell", "baseline"],
    content:
      "Facilities with photocell- or schedule-controlled LED lighting rarely contribute to sudden anomalies, since their draw is deterministic and bounded by fixture count. When investigating a consumption spike, lighting sub-meters that track their expected schedule closely can be deprioritized quickly, focusing investigative effort on systems with variable or occupancy-dependent draw such as HVAC and plug loads.",
  },
];
