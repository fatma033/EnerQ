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
// Deliberately 127.0.0.1, not "localhost": Node's fetch/undici resolves
// "localhost" to the IPv6 ::1 first, and Ollama only listens on IPv4 —
// that mismatch causes a silent ECONNREFUSED on every request even
// though `curl localhost:11434` works fine from the same machine.
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434/v1";
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
    const systemInstruction = `You are EnerQ, an autonomous AI Energy Agent and Digital Energy Manager for a commercial facility.
You reason from the facility telemetry (including per-zone and per-system detail below) and the provided knowledge-base
excerpts. Ground every claim in the data given — do NOT invent numbers, zones, or systems beyond what's provided.
If a knowledge-base excerpt supports a claim, you may reference it briefly (e.g. "per HVAC schedule best practice").

If the question names a specific zone, system, or piece of equipment (e.g. "Zone A", "the PCs", "the chiller"), answer
about THAT specific thing using the facility data below — investigate like a technician would: state what the data
actually shows for it, whether that's the likely cause, and what to check or do next. Do not deflect a specific
question with a generic building-wide answer.

Be concise. Hard limit: 80 words, 3 short sentences maximum. No preamble, no restating the question, no closing
summary — lead with the answer. This is read live during a time-boxed demo; brevity matters more than coverage.

Formatting: plain prose only. No markdown — no asterisks, no bullet characters, no headers. Write short complete
sentences separated by periods, the way you'd speak it aloud. If listing more than one item, use words like "and" or
number them inline ("first... second...") instead of a bulleted list.`;

    const userContent = `Facility Context:
- Name: ${facilityData?.name || "Commercial Tech Center"}
- Normal Working Hours: ${facilityData?.working_hours?.start || "08:00"} - ${facilityData?.working_hours?.end || "18:00"}
- Daily Normal Baseline: ${facilityData?.baseline_kwh || 500} kWh
- Current Daily Measured: ${facilityData?.current_kwh || 620} kWh (+${facilityData?.variance_pct || 24}%)
- HVAC Operating: ${facilityData?.hvac?.actual_hours || 14}h (normal: ${facilityData?.hvac?.normal_hours || 10}h), central chilled-water AHU on the rooftop, serves all 3 zones
- Zone A (Floor 1, Open Office): standard workstations, occupied 08:00-18:00, no equipment anomaly reported here
- Zone B (Floor 2, Tech Lab): 38 workstations/PCs and auxiliary monitors — THIS is the zone with the idle-power anomaly, drawing power after-hours while unoccupied; critical servers in this zone are on a separate always-on protected circuit, not part of the anomaly
- Zone C (Floor 3, Executive Rooms): lighting on automated photocell schedule, normal
- Lighting: 140 LED fixtures, automated schedule, functioning normally, not a contributor to the anomaly
- Rooftop Solar PV: 15 kWp array, ~50 kWh/day generation, functioning normally, not a contributor to the anomaly
- Candidate interventions already simulated: Solution A (HVAC schedule cutoff only, ${facilityData?.solution_a_saving_pct ?? 8.1}% saving), Solution B (setpoint offset only, ${facilityData?.solution_b_saving_pct ?? 6.0}% saving), Solution C (combined HVAC cutoff + idle equipment sleep, ${facilityData?.solution_c_saving_pct ?? 15.0}% saving — the recommended pick, highest savings with low risk)

Relevant Knowledge Base Excerpts:
${groundingContext || "(no directly relevant excerpts found)"}

Task:
${userPrompt || `Provide an autonomous agent assessment for the '${stage || "recommendation"}' stage. Explain clearly, in plain prose:
1. Why this anomaly occurred.
2. Why the combined optimization (HVAC schedule + idle equipment shutdown) represents the optimal balance of savings and low operational risk.
3. Specific actionable guidance for the facility operations team.`}`;

    const completion = await aiClient.chat.completions.create({
      model: OLLAMA_MODEL,
      temperature: 0.3,
      max_tokens: 160, // hard ceiling on generation length — keeps answers short AND fast on CPU inference
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

/**
 * Deterministic fallback for when Ollama isn't reachable. Plain prose only
 * (no markdown) since the chat UI renders this text as-is — asterisks or
 * bullet characters here would show up literally in the chat bubble.
 *
 * When a free-form userPrompt is present, this does light keyword matching
 * so a zone- or equipment-specific question ("is Zone A's problem the PCs?")
 * still gets a specific, grounded answer instead of the generic summary —
 * the same investigative behavior the live-Ollama prompt is instructed to
 * follow, just as a fixed lookup table instead of a model call.
 */
function generateDeterministicAnalysis(stage: string, facility: any, userPrompt?: string): string {
  const baselineKwh = facility?.baseline_kwh ?? 500;
  const currentKwh = facility?.current_kwh ?? 620;
  const variancePct = facility?.variance_pct ?? Number((((currentKwh - baselineKwh) / baselineKwh) * 100).toFixed(1));
  const overtimeHours = Math.max(0, (facility?.hvac?.actual_hours ?? 14) - (facility?.hvac?.normal_hours ?? 10));
  const hvacWasteKwh = Math.round(overtimeHours * (facility?.hvac?.power_rating_kw ?? 20));
  const closeTime = facility?.working_hours?.end ?? "18:00";

  if (userPrompt) {
    // Bilingual keyword matching: the deterministic fallback is what actually
    // answers chat questions on a deployment with no Ollama instance (see
    // render.yaml), so an Arabic-language question needs to route to the
    // same specific answers an English one does, not just fall through to
    // the generic summary. Zone letters stay Latin A/B/C in both languages.
    const q = userPrompt.toLowerCase();
    const mentionsZoneA = /zone\s*a|open office|المنطقة\s*a|مكتب مفتوح/.test(q);
    const mentionsZoneB = /zone\s*b|tech lab|\bpc\b|pcs|workstation|computer|المنطقة\s*b|مختبر تقني|حاسوب|حواسيب|كمبيوتر|محطة عمل|محطات عمل/.test(q);
    const mentionsZoneC = /zone\s*c|exec|المنطقة\s*c|تنفيذي/.test(q);
    const mentionsServer = /server|خادم|خوادم/.test(q);
    const mentionsLighting = /light|إضاءة|انارة|إنارة/.test(q);
    const mentionsSolar = /solar|pv|panel|شمس|لوح/.test(q);

    if (mentionsServer) {
      return `The critical servers in Zone B are on a separate, always-on protected circuit and are not part of the anomaly. They are unaffected by the HVAC or workstation shutdown policy in every simulated solution.`;
    }
    if (mentionsZoneB) {
      return `Yes — Zone B is where the anomaly is. 38 workstations and auxiliary monitors are drawing idle power outside working hours instead of sleeping, contributing roughly 13 to 15 kWh of the daily excess. That's exactly what Solution C's idle-equipment-sleep policy targets, on top of the HVAC cutoff.`;
    }
    if (mentionsZoneA) {
      return `Zone A (the open office) is not contributing to the anomaly. Its workstations follow normal 08:00 to ${closeTime} occupancy with no idle-power issue reported. The excess consumption traces to Zone B's equipment and the building-wide HVAC overtime, not Zone A.`;
    }
    if (mentionsZoneC) {
      return `Zone C (executive rooms) is operating normally — lighting follows the automated photocell schedule with no deviation. It is not a contributor to today's anomaly.`;
    }
    if (mentionsLighting) {
      return `Lighting is not a factor here. All 140 LED fixtures are tracking their automated schedule normally, drawing the expected 80 kWh per day.`;
    }
    if (mentionsSolar) {
      return `Solar generation is normal — the rooftop 15 kWp array is producing its expected ~50 kWh per day with no inverter fault, so it isn't contributing to the anomaly.`;
    }

    return `The facility consumed ${currentKwh} kWh today against an expected baseline of ${baselineKwh} kWh, a ${variancePct} percent variance. The HVAC system ran ${overtimeHours} continuous hours past the ${closeTime} occupancy cutoff, consuming roughly ${hvacWasteKwh} kWh of unneeded cooling, and Zone B's workstations stayed at full power instead of sleeping outside working hours. The combined HVAC schedule cutoff plus idle equipment sleep policy addresses both at once, for the highest available reduction with zero disruption to core business hours.`;
  }

  switch (stage) {
    case "investigate":
      return `Sub-meter audit confirms the HVAC unit ran ${overtimeHours} hours beyond its ${facility?.hvac?.normal_hours ?? 10}h scheduled runtime, drawing an estimated ${hvacWasteKwh} kWh unmonitored. Idle workstation plug-loads in Zone B contributed additional unmanaged load. Lighting and solar sub-meters track their expected schedule, ruling out those systems.`;
    case "recommend":
    default:
      return `Recommendation: implement the combined HVAC schedule cutoff alongside intelligent idle plug-load sleep. This is the highest-reduction, low-operational-risk option among the simulated candidates — see the metrics panel for exact cost figures in your configured currency.`;
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
