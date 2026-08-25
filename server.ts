import express from "express";
import path from "path";
import OpenAI from "openai";
import dotenv from "dotenv";
import { retrieveKnowledge, buildGroundingContext, toCitations } from "./src/knowledge/retriever";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Ollama exposes an OpenAI-compatible Chat Completions API, so the same
// OpenAI SDK talks to a fully local, free, key-less LLM — nothing leaves
// the machine and there's no API billing to manage during the demo.
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434/v1";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2:3b";

app.use(express.json());

const aiClient = new OpenAI({ baseURL: OLLAMA_BASE_URL, apiKey: "ollama" }); // Ollama ignores the key; the SDK just requires a non-empty string

/**
 * Cheap local reachability check so the UI can honestly report whether
 * Ollama is actually running, rather than only discovering it on the
 * first failed completion call.
 */
async function isOllamaReachable(): Promise<boolean> {
  try {
    const tagsUrl = OLLAMA_BASE_URL.replace(/\/v1\/?$/, "") + "/api/tags";
    const resp = await fetch(tagsUrl, { signal: AbortSignal.timeout(1200) });
    return resp.ok;
  } catch {
    return false;
  }
}

// API Routes
app.get("/api/health", async (req, res) => {
  const ollamaReachable = await isOllamaReachable();
  res.json({
    status: "ok",
    service: "EnerQ AI Energy Agent Engine",
    provider: "ollama",
    model: OLLAMA_MODEL,
    hasApiKey: ollamaReachable, // kept for UI backward-compat: "is live reasoning available"
    ragKnowledgeChunks: retrieveKnowledge("hvac plug load solar lighting decision verification", 999).length,
    timestamp: new Date().toISOString(),
  });
});

/**
 * Builds a retrieval query for the knowledge base based on the current
 * agent stage and facility context, so grounding is relevant to what
 * the agent is actually reasoning about right now.
 */
function buildRetrievalQuery(stage: string | undefined, facilityData: any, userPrompt?: string): string {
  if (userPrompt) return userPrompt;

  switch (stage) {
    case "investigate":
      return "hvac after-hours schedule idle equipment plug load waste investigation root cause solar lighting baseline";
    case "recommend":
    default:
      return "combined intervention decision multi-criteria risk comfort savings recommendation verification";
  }
}

// RAG-grounded, local Ollama-powered reasoning endpoint
app.post("/api/agent/reason", async (req, res) => {
  const { stage, facilityData, userPrompt } = req.body;

  const retrievalQuery = buildRetrievalQuery(stage, facilityData, userPrompt);
  const retrieved = retrieveKnowledge(retrievalQuery, 3);
  const groundingContext = buildGroundingContext(retrieved);
  const citations = toCitations(retrieved);

  try {
    const systemInstruction = `You are EnerQ, an autonomous AI Energy Agent and Digital Energy Manager for commercial facilities.
You reason from the facility telemetry and the provided knowledge-base excerpts. Ground every claim in the data given.
Do NOT invent numbers beyond what is provided. Keep the tone crisp, professional, and structured with short bullet points.
If a knowledge-base excerpt supports a claim, you may reference it briefly (e.g. "per HVAC schedule best practice").`;

    const userContent = `Facility Context:
- Name: ${facilityData?.name || "Commercial Tech Center"}
- Normal Working Hours: ${facilityData?.working_hours?.start || "08:00"} - ${facilityData?.working_hours?.end || "18:00"}
- Daily Normal Baseline: ${facilityData?.baseline_kwh || 500} kWh
- Current Daily Measured: ${facilityData?.current_kwh || 620} kWh (+${facilityData?.variance_pct || 24}%)
- HVAC Operating: ${facilityData?.hvac?.actual_hours || 14}h (normal: ${facilityData?.hvac?.normal_hours || 10}h)

Relevant Knowledge Base Excerpts:
${groundingContext || "(no directly relevant excerpts found)"}

Task:
${userPrompt || `Provide an autonomous agent assessment for the '${stage || "recommendation"}' stage. Explain clearly:
1. Why this anomaly occurred.
2. Why the combined optimization (HVAC schedule + idle equipment shutdown) represents the optimal balance of savings and low operational risk.
3. Specific actionable guidance for the facility operations team.`}`;

    const completion = await aiClient.chat.completions.create({
      model: OLLAMA_MODEL,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userContent },
      ],
    });

    const analysis = completion.choices[0]?.message?.content?.trim();

    return res.json({
      success: true,
      source: `ollama:${OLLAMA_MODEL}`,
      analysis: analysis || generateDeterministicAnalysis(stage, facilityData, userPrompt),
      citations,
    });
  } catch (error: any) {
    const reason = error?.cause?.code === "ECONNREFUSED" ? "Ollama not running locally" : error?.message || "unknown error";
    console.warn(`Ollama unreachable (${reason}) — using deterministic fallback.`);
    return res.json({
      success: true,
      source: "deterministic_fallback",
      analysis: generateDeterministicAnalysis(stage, facilityData, userPrompt),
      citations,
      error: error?.message,
    });
  }
});

function generateDeterministicAnalysis(stage: string, facility: any, userPrompt?: string): string {
  const baselineKwh = facility?.baseline_kwh ?? 500;
  const currentKwh = facility?.current_kwh ?? 620;
  const variancePct = facility?.variance_pct ?? Number((((currentKwh - baselineKwh) / baselineKwh) * 100).toFixed(1));
  const overtimeHours = Math.max(0, (facility?.hvac?.actual_hours ?? 14) - (facility?.hvac?.normal_hours ?? 10));
  const hvacWasteKwh = Math.round(overtimeHours * (facility?.hvac?.power_rating_kw ?? 20));

  if (userPrompt) {
    return `**EnerQ Energy Agent Analysis**:\n\nBased on the current facility telemetry, the facility consumed **${currentKwh} kWh/day** against an expected baseline of **${baselineKwh} kWh/day** (+${variancePct}% variance).\n\n• **Primary Driver**: HVAC system ran ${overtimeHours} continuous hours past the ${facility?.working_hours?.end ?? "18:00"} occupancy cutoff, consuming ~${hvacWasteKwh} kWh of unneeded cooling.\n• **Secondary Driver**: Plug load baseload remained at full operating draw instead of sleeping outside working hours.\n• **Recommended Resolution**: Execute the combined HVAC schedule cutoff + idle equipment sleep policy for the highest available reduction with zero disruption to core business hours.`;
  }

  switch (stage) {
    case "investigate":
      return `Sub-meter audit confirms the HVAC unit ran ${overtimeHours} hours beyond its ${facility?.hvac?.normal_hours ?? 10}h scheduled runtime, drawing an estimated ${hvacWasteKwh} kWh unmonitored. Idle workstation plug-loads contributed additional unmanaged load. Lighting and solar sub-meters track their expected schedule, ruling out those systems.`;
    case "recommend":
    default:
      return `Recommendation: Implement combined HVAC schedule cutoff alongside intelligent idle plug-load sleep. This is the highest-reduction, low-operational-risk option among the simulated candidates — see the metrics panel for exact cost figures in your configured currency.`;
  }
}

async function startServer() {
  // Vite middleware for development — dynamically imported so the
  // production bundle never pulls Vite (a dev-only dependency) in.
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`EnerQ Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
