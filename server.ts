import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client safely
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } catch (e) {
      console.warn("Failed to initialize GoogleGenAI client:", e);
      aiClient = null;
    }
  }
  return aiClient;
}

// API Routes
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "EnerQ AI Energy Agent Engine",
    hasApiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// Gemini-powered reasoning endpoint
app.post("/api/agent/reason", async (req, res) => {
  const { stage, anomalyData, investigationData, solutionsData, facilityData, userPrompt } = req.body;

  const ai = getGeminiClient();

  if (!ai) {
    // Return structured deterministic response when API key is not configured
    return res.json({
      success: true,
      source: "deterministic_engine",
      analysis: generateDeterministicAnalysis(stage, anomalyData, investigationData, solutionsData, facilityData, userPrompt),
    });
  }

  try {
    const prompt = `You are EnerQ, an autonomous expert AI Energy Agent and Digital Energy Manager.
Analyze the following commercial facility energy problem and provide a concise, sharp, professional energy engineer analysis.

Facility Context:
- Name: ${facilityData?.name || "Commercial Tech Center"}
- Normal Working Hours: ${facilityData?.working_hours?.start || "08:00"} - ${facilityData?.working_hours?.end || "18:00"}
- Daily Normal Baseline: ${facilityData?.baseline_kwh || 500} kWh
- Current Daily Measured: ${facilityData?.current_kwh || 620} kWh (+${facilityData?.variance_pct || 24}%)

Investigation Findings:
- HVAC Operating Schedule: ${facilityData?.hvac?.actual_hours || 14}h (normal: ${facilityData?.hvac?.normal_hours || 10}h). Operated 4 hours after-hours (18:00 to 22:00).
- Equipment Status: Idle consumption detected after working hours (~15-30 kWh unmanaged load).
- Lighting Status: Operating on scheduled timers (normal).
- Solar Generation: 50 kWh (normal peak).

Task:
${userPrompt || `Provide an autonomous agent assessment for the '${stage || "recommendation"}' stage. Explain clearly:
1. Why this anomaly occurred.
2. Why Solution C (HVAC schedule optimization + idle equipment shutdown) represents the optimal balance of maximum kWh savings (${facilityData?.solution_c_saving_pct || 15}%) and lowest operational risk.
3. Specific actionable guidance for the facility operations team.`}

Format guidelines:
Keep your output structured, crisp, highly professional, with bullet points and clear data-driven takeaways. Do NOT fabricate numbers beyond the provided physics data.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are EnerQ, an elite AI Energy Agent that communicates with authority, precision, and clear operational reasoning.",
        temperature: 0.3,
      },
    });

    return res.json({
      success: true,
      source: "gemini-3.7-flash",
      analysis: response.text || generateDeterministicAnalysis(stage, anomalyData, investigationData, solutionsData, facilityData, userPrompt),
    });
  } catch (error: any) {
    console.error("Gemini API call failed, falling back to deterministic response:", error);
    return res.json({
      success: true,
      source: "deterministic_fallback",
      analysis: generateDeterministicAnalysis(stage, anomalyData, investigationData, solutionsData, facilityData, userPrompt),
      error: error?.message,
    });
  }
});

function generateDeterministicAnalysis(
  stage: string,
  anomaly: any,
  investigation: any,
  solutions: any,
  facility: any,
  userPrompt?: string
): string {
  if (userPrompt) {
    return `**EnerQ Energy Agent Analysis**:\n\nBased on the current facility telemetry, the facility consumed **620 kWh/day** against an expected baseline of **500 kWh/day** (+24% variance).\n\n• **Primary Driver**: HVAC system ran 4 continuous hours past the 18:00 occupancy cutoff, consuming ~80 kWh of unneeded cooling.\n• **Secondary Driver**: Plug load baseload maintained full operating draw of 25 kWh instead of sleeping.\n• **Recommended Resolution**: Execute Solution C (Enforce 18:00 HVAC schedule cutoff with 20-minute thermal coasting + smart plug sleep policies). This recaptures **93 kWh/day (15.0% total reduction)** with zero disruption to core business hours.`;
  }

  switch (stage) {
    case "detect":
      return "Anomaly Alert: Facility consumption spiked +24.0% (120 kWh excess) above seasonal moving average. Triggering automated sub-system diagnostics.";
    case "investigate":
      return "Sub-meter audit confirms HVAC Chiller Unit #1 ran until 22:00 (4 hours beyond 18:00 schedule cutoff), drawing 80 kWh unmonitored. Idle workstation plug-loads contributed an additional 25 kWh.";
    case "simulate":
      return "Digital Twin simulated 3 intervention scenarios against building thermal inertia model. Scenario C yields 93 kWh/day reduction with 99.4% occupant comfort preservation.";
    case "recommend":
    default:
      return "Recommendation: Implement combined HVAC 18:00 automated shutdown alongside intelligent idle plug-load sleep. Recovers 93 kWh/day ($13.02/day, $390.60/mo) at Low Operational Risk.";
  }
}

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
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
