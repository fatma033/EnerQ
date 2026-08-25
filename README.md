# EnerQ — Autonomous AI Energy Agent MVP

> **Positioning**: EnerQ — Your AI Energy Expert  
> **Core Value Proposition**: From Energy Data to Intelligent Action

EnerQ is an autonomous AI Energy Agent that detects energy waste, investigates its causes, tests possible solutions through a simulated facility Digital Twin, and recommends the best action before implementation.

---

## 1. The Problem EnerQ Solves

Traditional energy monitoring systems only inform managers: *"Energy consumption increased."*
However, seeing higher consumption does not tell businesses:
- What caused the increase?
- Which system is responsible?
- Is the increase normal or abnormal?
- How much energy is being wasted?
- What action should be taken?
- Which solution provides the best savings with lowest operational risk?

**EnerQ goes beyond passive alerts.** It acts as an autonomous digital energy manager:
> *"Energy consumption increased by 24% because the HVAC system operated 4 hours after working hours. I investigated the root causes, tested 3 candidate interventions in the Digital Twin, and recommend changing the HVAC schedule alongside smart idle equipment sleep because it delivers 15% energy savings at low operational risk."*

---

## 2. The 9-Stage AI Agent Workflow

EnerQ implements a clear, deterministic state machine orchestrated with LLM reasoning:

1. **OBSERVE**: Continuously ingests smart sub-meter power telemetry, baseline averages (500 kWh/day), and facility operating schedules (08:00–18:00).
2. **DETECT**: Computes daily consumption variance (+24.0% / 120 kWh excess) and triggers anomaly diagnostics when exceeding thresholds.
3. **INVESTIGATE**: Decomposes sub-meter profiles (HVAC, Lighting, Plug Loads, Solar). Isolates 4 hours of post-occupancy HVAC chiller operation (+80 kWh) and unmanaged idle workstation draw (+13 kWh) with 87% agent confidence.
4. **GENERATE SOLUTIONS**: Synthesizes candidate interventions:
   - **Solution A**: Enforce 18:00 HVAC Schedule Cutoff (-8.1% / 50 kWh saved).
   - **Solution B**: Adjust Thermostat Setpoint to 23.5°C (-6.0% / 37 kWh saved).
   - **Solution C**: Combined HVAC Schedule + Idle Equipment Sleep (-15.0% / 93 kWh saved).
5. **SIMULATE (Digital Twin)**: Executes virtual facility thermal and electrical physics for all 3 scenarios.
6. **COMPARE**: Multi-criteria evaluation weighing energy savings, cost recapture, occupant thermal comfort, and operational risk.
7. **DECIDE**: Selects Solution C as the optimal winner (Score: 96/100).
8. **RECOMMEND**: Presents an actionable executive recommendation with transparent ROI and comfort guarantees.
9. **VERIFY**: Upon user approval, simulates implementation in the virtual facility, confirming daily reduction from **620 kWh → 527 kWh/day (-15.0%)**.

---

## 3. Digital Twin Simulation Engine

The Digital Twin provides a transparent virtual facility model including:
- **Central Rooftop AHU & Chiller Plant** (20 kW continuous load)
- **3-Floor Facility Zones** (Open workstations, Tech lab, Executive suites)
- **Intelligent Scheduled LED Lighting Grid** (80 kWh/day)
- **Workstation & Plug Loads** (Active vs Unmanaged Idle baseload)
- **Rooftop Solar PV Array** (15 kWp, 50 kWh daily generation)

Users can toggle live between **Current Anomaly**, **Scenario A**, **Scenario B**, **Scenario C**, and **Baseline Target** to inspect real-time hourly load curves and sub-circuit impacts.

---

## 4. How to Demonstrate the MVP (2-Minute Walkthrough)

1. **Open the Application**: Notice the immediate anomaly alert (+24% variance, 620 kWh vs 500 kWh baseline).
2. **Click "Run EnerQ Analysis"**: Watch the Agent autonomously advance through all 9 stages on the live timeline with real-time reasoning logs in the terminal.
3. **Inspect the Investigation**: View the 24-hour load curve highlighting the red after-hours waste window (18:00–22:00).
4. **Explore the Digital Twin**: Click the Scenario tabs (A, B, C) to observe simulated power flows, zone temperatures, and monthly cost recapture.
5. **Approve Recommendation**: Click **"Approve Recommendation"** on the hero card. The system updates the virtual facility and presents verified simulation results (527 kWh/day, -15% reduction).
6. **Ask EnerQ**: Open the "Ask Agent" drawer to query the AI about payback periods, comfort risks, or tariff variations.
7. **Export Brief**: Open the "Audit Report" modal to view or print an executive-ready action plan.

---

## 5. Technical Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Lucide React, Motion.
- **Backend & Simulation**: Express Node.js server calling a local **Ollama** LLM (`llama3.2:3b` by default, via Ollama's OpenAI-compatible API) for contextual energy reasoning + a deterministic fallback calculation engine (the app runs and demos fully even with Ollama not running — no API key or internet connection required at all).
- **RAG Knowledge Layer**: A small, transparent energy-management knowledge base (`src/knowledge/energyPlaybook.ts`) with a dependency-free lexical retriever (`src/knowledge/retriever.ts`). Before the agent reasons at the INVESTIGATE and RECOMMEND stages (and in the Ask Agent chat), it retrieves the most relevant playbook entries and grounds the LLM's response in them — every AI-generated explanation in the UI shows its cited sources.
- **Data Model**: Configurable facility parameters, customizable electricity tariff rate ($/kWh, OMR, AED, EUR), and 24-hour load profiles.

### Environment Setup

```bash
# 1. Install & start Ollama (https://ollama.com), then pull the light model:
ollama pull llama3.2:3b

# 2. Install app dependencies
npm install
cp .env.example .env   # defaults already point at local Ollama — edit only if you changed the model/port

# 3. Run
npm run dev             # starts the Express + Vite dev server on http://localhost:3000
```

If Ollama isn't installed or isn't running, EnerQ still runs fully — the agent automatically falls back to its deterministic reasoning engine (same citations, same UI, template narration instead of live LLM text).
