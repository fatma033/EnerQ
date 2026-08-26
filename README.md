<img src="public/logo-512.png" alt="EnerQ" width="72" />

# EnerQ

**[Live demo → enerq.onrender.com](https://enerq.onrender.com)**

A multi-agent AI energy system for commercial facilities, piloted on the Sultan Qaboos Complex for Youth, Culture and Entertainment in Salalah, Oman. Five specialist agents — coordinated, not one monolithic script — observe consumption, investigate waste, simulate candidate interventions against a facility Digital Twin, decide, act, and report. EnerQ doesn't stop at a dashboard alert; it acts, and it explains itself in fluent Arabic or English.

## The agents

Each agent owns 2-3 of the pipeline's nine stages and lives in its own file under `src/agent/agents/` — a coordinator (`src/agent/orchestrator.ts`) holds the shared facility state and calls each agent in turn, but none of the actual domain reasoning lives there.

| Agent | Stages | Responsibility | File |
|---|---|---|---|
| **ObserverAgent** | Observe, Detect | Ingests telemetry, flags anomalies against baseline | [`observerAgent.ts`](src/agent/agents/observerAgent.ts) |
| **DiagnosticAgent** | Investigate, Generate Solutions | Isolates root cause, drafts candidate interventions | [`diagnosticAgent.ts`](src/agent/agents/diagnosticAgent.ts) |
| **SimulationAgent** | Simulate, Compare, Decide | Runs the Digital Twin, scores candidates, picks a winner | [`simulationAgent.ts`](src/agent/agents/simulationAgent.ts) |
| **ActionAgent** | Recommend, Verify | Hands off for approval (or executes autonomously), then confirms the result | [`actionAgent.ts`](src/agent/agents/actionAgent.ts) |
| **ReportsAgent** | — (on-demand, outside the pipeline) | Turns the verified daily reduction rate into a week/month/year/custom period report — comparison, cost/CO₂ totals, a projected savings graph, and a root-cause breakdown | [`reportsAgent.ts`](src/agent/agents/reportsAgent.ts) |

The split isn't cosmetic: each agent is independently replaceable. ObserverAgent, for instance, is the one piece you'd swap to point at a real BMS/IoT feed instead of mock telemetry — nothing else in the system needs to change.

## How the pipeline runs

| Stage | Agent | What happens |
|---|---|---|
| Observe | Observer | Ingests facility telemetry, baseline averages, and operating schedules |
| Detect | Observer | Computes consumption variance against baseline and flags anomalies past threshold |
| Investigate | Diagnostic | Decomposes sub-meter profiles (HVAC, lighting, plug loads, solar) to isolate root cause, grounded in a RAG knowledge base |
| Generate Solutions | Diagnostic | Synthesizes candidate interventions with their projected savings and risk profile |
| Simulate | Simulation | Runs each candidate through the Digital Twin's physics model |
| Compare | Simulation | Scores every candidate with a weighted multi-criteria formula — savings, operational risk, occupant comfort |
| Decide | Simulation | Selects the highest-scoring candidate; the selection is computed, not hardcoded |
| Recommend | Action | Presents the decision with cost/ROI, either awaiting approval or executing autonomously depending on authorization level |
| Verify | Action | Confirms the actual result against the initial claim after implementation |

If a recommendation is left unapproved, ActionAgent reminds and then escalates rather than letting it sit — the same follow-through loop applies whether a human approves each action or the agent is authorized to act on its own.

## Architecture

- **Coordinator** (`src/agent/orchestrator.ts`): owns the shared facility state, the pub/sub that keeps the UI in sync, and pipeline timing. Delegates every stage's actual logic to one of the agents above.
- **Decision engine** (`src/simulation/engine.ts`): deterministic multi-criteria scoring (60% savings, 30% risk, 10% comfort) over each candidate solution. Auditable and reproducible — the same inputs always produce the same decision, and the ranking changes if the inputs do. Accepts an optional customization override (HVAC cutoff time, thermostat setpoint offset, idle-sleep toggle) so a candidate solution can be tuned live from the Digital Twin instead of only using the demo defaults.
- **Reasoning layer**: an LLM behind an OpenAI-compatible API — local Ollama (`qwen2.5:3b-instruct`, chosen for its Arabic quality at a footprint safe for an 8GB-RAM, no-GPU laptop) for development, or any hosted OpenAI-compatible provider (e.g. Groq, free tier) in production — generates the investigation, recommendation, and chat-assistant narrative, grounded by retrieval against a small, bilingual energy-management knowledge base (`src/knowledge/`). Every generated explanation cites the source it drew from, and the source excerpt is one click away in the UI. `src/agent/agents/reasoningClient.ts` is the only file that talks to it, via `server.ts`'s `/api/agent/reason` endpoint.
- **RAG retrieval** (`src/knowledge/retriever.ts`): dependency-free lexical retrieval (term overlap + tag boost, no vector DB) over `src/knowledge/energyPlaybook.ts`'s knowledge chunks — bilingual title/content on every chunk, with Arabic-aware tokenization (prefix-stripping, diacritic-folding) so a question like "بأجهزة الحاسوب" still matches a chunk tagged "حاسوب".
- **Deterministic fallback**: if the LLM is unreachable, the same pipeline — and the chat assistant — runs on templated reasoning with identical citations and UI, including keyword-matched, bilingual answers to zone- and equipment-specific questions. The agents' decisions and outputs are never dependent on the LLM being reachable; this is also what powers the live demo link whenever the configured LLM provider is unreachable.
- **Digital Twin**: an industrial-monitoring-style dashboard (equipment schematic, live gauges, trend sparklines, system-connection diagram, direct HVAC control) over a facility physics model (HVAC, lighting, plug loads, solar, 3 real zones) used to simulate each candidate intervention before it's recommended.
- **Bilingual throughout** (`src/i18n.ts`): every page, agent explanation, and knowledge-base chunk exists in both Arabic and English, switchable live without losing app state.

## Stack

React 19 · TypeScript · Express · Vite · Tailwind CSS v4 · an OpenAI-compatible LLM API (Ollama locally, Groq in production)

## Setup

```bash
npm install
npm run dev   # http://localhost:3000
```

Runs fully out of the box on the deterministic reasoning engine — no configuration required.

For live LLM-generated reasoning locally:

```bash
ollama pull qwen2.5:3b-instruct
cp .env.example .env   # defaults already point at a local Ollama instance
npm run dev
```

`ollama pull` and `ollama serve` come from the [Ollama desktop app](https://ollama.com) (or its CLI) — nothing in this repo starts Ollama itself; the app just checks the standard OpenAI-compatible `/models` endpoint on `127.0.0.1:11434` and uses whatever's already running there.

## Deployment

Deployed on [Render](https://render.com) as a single Node web service — `server.ts` reads `PORT` from the environment, binds `0.0.0.0`, and serves the built frontend (`dist/`) itself, so no separate static host is needed.

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`
- **Environment variables** (optional — omit all three to run on the deterministic engine with zero setup):

| Key | Value |
|---|---|
| `OLLAMA_BASE_URL` | `https://api.groq.com/openai/v1` (or any OpenAI-compatible endpoint) |
| `OLLAMA_MODEL` | e.g. `llama-3.1-8b-instant` |
| `LLM_API_KEY` | your provider's API key |

The names `OLLAMA_BASE_URL`/`OLLAMA_MODEL` are historical (from local-Ollama-only development) but work as generic config for any OpenAI-compatible provider — see `.env.example` for details.

## License

MIT — see [LICENSE](LICENSE).
