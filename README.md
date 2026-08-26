# EnerQ

Autonomous AI energy agent for commercial facilities. EnerQ monitors consumption, detects and investigates waste, tests candidate interventions against a facility Digital Twin, decides on the best action, and follows up until the result is verified — rather than stopping at a dashboard alert.

## How it works

EnerQ runs a nine-stage loop:

| Stage | What happens |
|---|---|
| Observe | Ingests facility telemetry, baseline averages, and operating schedules |
| Detect | Computes consumption variance against baseline and flags anomalies past threshold |
| Investigate | Decomposes sub-meter profiles (HVAC, lighting, plug loads, solar) to isolate root cause, grounded in a RAG knowledge base |
| Generate Solutions | Synthesizes candidate interventions with their projected savings and risk profile |
| Simulate | Runs each candidate through the Digital Twin's physics model |
| Compare | Scores every candidate with a weighted multi-criteria formula — savings, operational risk, occupant comfort |
| Decide | Selects the highest-scoring candidate; the selection is computed, not hardcoded |
| Recommend | Presents the decision with cost/ROI, either awaiting approval or executing autonomously depending on authorization level |
| Verify | Confirms the actual result against the initial claim after implementation |

If a recommendation is left unapproved, the agent reminds and then escalates rather than letting it sit — the same follow-through loop applies whether a human approves each action or the agent is authorized to act on its own.

## Architecture

- **Decision engine** (`src/simulation/engine.ts`): deterministic multi-criteria scoring (60% savings, 30% risk, 10% comfort) over each candidate solution. Auditable and reproducible — the same inputs always produce the same decision, and the ranking changes if the inputs do.
- **Reasoning layer**: a local LLM (Ollama, `llama3.2:3b` by default) generates the investigation and recommendation narrative, grounded by retrieval against a small energy-management knowledge base (`src/knowledge/`). Every generated explanation cites the source it drew from. No API key or external network call is required — reasoning runs entirely on-device.
- **Deterministic fallback**: if the LLM is unavailable, the same pipeline runs on templated reasoning with identical citations and UI — the agent's decisions and outputs are never dependent on the LLM being reachable.
- **Digital Twin**: a facility physics model (HVAC, lighting, plug loads, solar) used to simulate each candidate intervention before it's recommended.

## Stack

React 19 · TypeScript · Express · Vite · Tailwind CSS · Ollama (OpenAI-compatible API)

## Setup

```bash
npm install
npm run dev   # http://localhost:3000
```

Runs fully out of the box on the deterministic reasoning engine — no configuration required.

For live LLM-generated reasoning:

```bash
ollama pull llama3.2:3b
cp .env.example .env   # defaults already point at a local Ollama instance
npm run dev
```

## License

MIT — see [LICENSE](LICENSE).
