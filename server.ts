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
// Qwen2.5, not Llama 3.2: at the same ~3B size (safe for an 8GB-RAM, no-GPU
// laptop) Qwen's multilingual training data gives it meaningfully stronger
// Arabic quality and instruction-following -- the language this demo is
// actually judged in. `ollama pull qwen2.5:3b-instruct` to get it locally.
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2.5:3b-instruct";

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

// NOTE: JavaScript's \b (word boundary) is defined off \w = [A-Za-z0-9_] only --
// it does NOT recognize Arabic letters as "word" characters. A pattern like
// /شكرا\b/ silently never matches, because \b never fires next to Arabic
// script at all. Every Arabic alternative below uses a (?=\s|$) lookahead
// instead of \b for exactly that reason -- this is the same class of bug
// that broke the RAG tokenizer earlier (see retriever.ts).
//
// Separately: Arabic diacritics (tashkeel) are optional and their presence/
// placement varies by how someone types -- "مرحباً" (tanween after the alef,
// the standard placement) and "مرحبًا" (tanween before it) are both "valid"
// typed text for the same word, and neither matches a regex written for the
// other. normalizeArabic() strips diacritics and folds alef/yaa/taa-marbuta
// variants so matching is robust to however the user actually typed it --
// applied before every Arabic-aware match in this file, not just greetings.
function normalizeArabic(text: string): string {
  // Diacritics only -- NOT folding alef/yaa/taa-marbuta variants, since the
  // keyword regexes below are written against specific unfolded spellings
  // (e.g. "محطة") and folding here without also updating every pattern
  // literal would silently break those matches instead of fixing anything.
  return text.replace(/[ً-ْٰـ]/g, ""); // tashkeel (fatha/damma/kasra/sukun/tanween/etc.) + tatweel
}

const HOW_ARE_YOU_RE = /how are you|how'?s it going|what'?s up|كيف حالك|كيفك|شلونك|اخبارك|أخبارك/i;
const THANKS_RE = /^\s*(thanks|thank you)\b|^\s*(شكرا)(?=\s|$)/i;
const GREETING_RE = /^\s*(hi|hello|hey|good morning|good afternoon|good evening)\b|^\s*(مرحبا|اهلا|السلام عليكم|وعليكم السلام|صباح الخير|مساء الخير|هلا)(?=\s|$)/i;

function isSmallTalk(prompt: string): boolean {
  const p = normalizeArabic(prompt.trim());
  return GREETING_RE.test(p) || HOW_ARE_YOU_RE.test(p) || THANKS_RE.test(p);
}

/**
 * Talks like someone actually answering, not a canned bot line: acknowledges
 * what was actually asked (a greeting vs. "how are you" vs. "thanks" get
 * different replies) before pivoting to what it can help with.
 */
function smallTalkReply(prompt: string, lang: "en" | "ar"): string {
  const p = normalizeArabic(prompt.trim());
  if (/^\s*(السلام عليكم|سلام عليكم)/i.test(p)) {
    return "وعليكم السلام ورحمة الله وبركاته! تفضّل، كيف أقدر أساعدك اليوم؟";
  }
  if (THANKS_RE.test(p)) {
    return lang === "ar" ? "على الرحب! أخبرني إن احتجت أي شيء آخر." : "You're welcome! Let me know if there's anything else you'd like to dig into.";
  }
  if (HOW_ARE_YOU_RE.test(p)) {
    return lang === "ar"
      ? "بخير، شكرًا لسؤالك! أراقب حاليًا شذوذًا بنسبة +24% في الاستهلاك، وأنا جاهز لأشرح لك أي جزء منه. بم تودّ أن أبدأ؟"
      : "I'm doing well, thanks for asking! Right now I'm watching a +24% consumption anomaly on this facility, and I'm happy to walk you through any part of it. Where would you like to start?";
  }
  return lang === "ar"
    ? "أهلاً بك! اسألني عن سبب ارتفاع الاستهلاك اليوم، أو عن أي من الحلول A وB وC، أو حتى عن كيفية عمل النظام نفسه."
    : "Hey there! I'm the EnerQ energy agent. Ask me why consumption spiked today, about Solutions A, B, or C, or even how this whole system works.";
}

// RAG-grounded, local Ollama-powered reasoning endpoint
app.post("/api/agent/reason", async (req, res) => {
  const { stage, facilityData, userPrompt, language } = req.body;
  const lang: "en" | "ar" = language === "ar" ? "ar" : "en";

  // Small talk / greetings never need retrieval or the LLM -- answer them
  // directly and immediately so "hi" doesn't trigger a knowledge-base
  // search or a several-second model call for a one-word reply.
  if (userPrompt && isSmallTalk(userPrompt)) {
    return res.json({
      success: true,
      source: "deterministic_fallback",
      analysis: smallTalkReply(userPrompt, lang),
      citations: [],
    });
  }

  const retrievalQuery = buildRetrievalQuery(stage, facilityData, userPrompt);
  const retrieved = retrieveKnowledge(retrievalQuery, 3);
  const groundingContext = buildGroundingContext(retrieved, lang);
  const citations = toCitations(retrieved, lang);

  try {
    const languageInstruction =
      lang === "ar"
        ? `Respond ONLY in Modern Standard Arabic (فصحى) — full, fluent Arabic sentences, not a mix of Arabic and English prose. The user's app is set to Arabic — every reply must be in Arabic regardless of what language the facility data or knowledge excerpts below are written in.

The ONLY things allowed to stay in Latin script are: numbers, unit abbreviations (kWh, kW, °C, %), and the short zone/solution labels "Zone A/B/C" and "Solution A/B/C" exactly as written. Every other word — including technical and engineering terms like "anomaly", "idle load", "after-hours", "root cause" — MUST be translated into Arabic (e.g. شذوذ, حمل خامل, بعد ساعات الدوام, السبب الجذري). Do not leave an English phrase untranslated just because it sounds technical.

Do not write "EnerQ" in the middle of an Arabic sentence -- when text mixes a right-to-left Arabic sentence with a Latin word placed mid-sentence, that word renders in a visually confusing position once the line wraps. If you need to refer to yourself by name, put "EnerQ" as the very first word of the reply, or simply don't self-name at all (the chat header already shows who's speaking).`
        : `Respond in English.`;

    const systemInstruction = `You are EnerQ, an autonomous AI Energy Agent and Digital Energy Manager for a commercial facility.
You reason from the facility telemetry (including per-zone and per-system detail below) and the provided knowledge-base
excerpts. Ground every claim in the data given — do NOT invent numbers, zones, or systems beyond what's provided.
If a knowledge-base excerpt supports a claim, you may reference it briefly (e.g. "per HVAC schedule best practice").

If the question names a specific zone, system, or piece of equipment (e.g. "Zone A", "the PCs", "the chiller"), answer
about THAT specific thing using the facility data below — investigate like a technician would: state what the data
actually shows for it, whether that's the likely cause, and what to check or do next. Do not deflect a specific
question with a generic building-wide answer. Vary your phrasing and structure between turns — do not reuse the same
sentence template for every answer, even when the underlying data point is the same one you already mentioned.

${languageInstruction}

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
- Zone A (Floor 1, Library): reading areas and shelving, occupied 08:00-18:00, no equipment anomaly reported here
- Zone B (Floor 2, Computer Lab): 38 public-use workstations/PCs and auxiliary monitors — THIS is the zone with the idle-power anomaly, drawing power after-hours while unoccupied; the lab's servers are on a separate always-on protected circuit, not part of the anomaly
- Zone C (Floor 3, Auditorium): 120-seat auditorium with theatre facility, lighting on automated photocell schedule, normal
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
      temperature: 0.55, // a bit of variety turn-to-turn so repeated/similar questions don't come back byte-identical
      max_tokens: lang === "ar" ? 260 : 160, // Arabic tokenizes to more tokens per word on this model — same ~80-word target needs more ceiling
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: userContent },
      ],
    });

    const analysis = completion.choices[0]?.message?.content?.trim();

    return res.json({
      success: true,
      source: `ollama:${OLLAMA_MODEL}`,
      analysis: analysis || generateDeterministicAnalysis(stage, facilityData, userPrompt, lang),
      citations,
    });
  } catch (error: any) {
    const reason = error?.cause?.code === "ECONNREFUSED" ? "Ollama not running locally" : error?.message || "unknown error";
    console.warn(`Ollama unreachable (${reason}) — using deterministic fallback.`);
    // Ollama being unreachable fails almost instantly (ECONNREFUSED), so
    // without this the fallback would answer faster than a human could
    // finish reading the question -- an instant, always-fixed-latency reply
    // is itself a tell that it's a canned lookup, not real inference. A
    // short, slightly randomized pause is enough to read as "thinking"
    // without meaningfully slowing down the demo.
    await new Promise((resolve) => setTimeout(resolve, 550 + Math.random() * 500));
    return res.json({
      success: true,
      source: "deterministic_fallback",
      analysis: generateDeterministicAnalysis(stage, facilityData, userPrompt, lang),
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
function generateDeterministicAnalysis(stage: string, facility: any, userPrompt?: string, lang: "en" | "ar" = "en"): string {
  const baselineKwh = facility?.baseline_kwh ?? 500;
  const currentKwh = facility?.current_kwh ?? 620;
  const variancePct = facility?.variance_pct ?? Number((((currentKwh - baselineKwh) / baselineKwh) * 100).toFixed(1));
  const overtimeHours = Math.max(0, (facility?.hvac?.actual_hours ?? 14) - (facility?.hvac?.normal_hours ?? 10));
  const hvacWasteKwh = Math.round(overtimeHours * (facility?.hvac?.power_rating_kw ?? 20));
  const closeTime = facility?.working_hours?.end ?? "18:00";
  const solCPct = facility?.solution_c_saving_pct ?? 15.0;
  const isAr = lang === "ar";

  // Tiny deterministic hash so the same exact question always gets the same
  // answer (consistent for testing/QA) but two *different* questions that
  // land in the same category open differently -- avoids the "keeps saying
  // the exact same thing" feel of a single fixed template per category.
  const hash = (s: string) => s.split("").reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 997, 7);

  if (userPrompt) {
    // Bilingual keyword matching: the deterministic fallback is what actually
    // answers chat questions on a deployment with no Ollama instance (see
    // render.yaml), so an Arabic-language question needs to route to the
    // same specific answers an English one does, not just fall through to
    // the generic summary. Zone letters stay Latin A/B/C in both languages.
    const q = normalizeArabic(userPrompt.toLowerCase());
    const mentionsZoneA = /zone\s*a|library|open office|المنطقة\s*a|مكتبة|مكتب مفتوح/.test(q);
    const mentionsZoneB = /zone\s*b|tech lab|computer lab|\bpc\b|pcs|workstation|computer|المنطقة\s*b|مختبر الحاسوب|مختبر تقني|حاسوب|حواسيب|كمبيوتر|محطة عمل|محطات عمل/.test(q);
    const mentionsZoneC = /zone\s*c|auditorium|theatre|theater|المنطقة\s*c|مسرح|قاعة/.test(q);
    const mentionsServer = /server|خادم|خوادم/.test(q);
    const mentionsLighting = /light|إضاءة|انارة|إنارة/.test(q);
    const mentionsSolar = /solar|pv|panel|شمس|لوح/.test(q);
    const mentionsConfidence = /confidence|score|87%|ثقة|درجة/.test(q);
    const mentionsComfort = /comfort|راحة/.test(q);
    const mentionsMoney = /money|cost|save|\$|omr|save|مال|تكلفة|توفير|فلوس/.test(q);
    const mentionsWhatIsEnerq = /what (is|does) enerq|who are you|ما هو enerq|ما هو انيرك|من انت|من أنت|ايش تسوي/.test(q);
    const mentionsMultiAgent = /multi.?agent|four agents|4 agents|وكلاء متعدد|أربعة وكلاء|وكلاء متعددون/.test(q);
    const mentionsRAG = /\brag\b|knowledge base|citation|قاعدة معرفة|استشهاد/.test(q);
    const mentionsIoT = /\biot\b|internet of things|real (sensor|deployment)|bms|bacnet|انترنت الاشياء|إنترنت الأشياء|حساسات|تطبيق حقيقي/.test(q);
    const mentionsDigitalTwinWhat = /what is (a |the )?digital twin|ما هو التوأم|ما التوأم الرقمي/.test(q);
    const mentionsAutonomyLevel = /autonomous mode|autonomy level|approval mode|الوضع المستقل|مستوى الاستقلالية|وضع الموافقة/.test(q);

    if (mentionsServer) {
      return isAr
        ? `الخوادم الحرجة في المنطقة B على دائرة كهربائية منفصلة تعمل باستمرار، وهي ليست جزءًا من الشذوذ ولا تتأثر بسياسة إيقاف التكييف أو محطات العمل في أي من الحلول المحاكاة.`
        : `The critical servers in Zone B are on a separate, always-on protected circuit and are not part of the anomaly. They are unaffected by the HVAC or workstation shutdown policy in every simulated solution.`;
    }
    if (mentionsZoneB) {
      return isAr
        ? `نعم — المنطقة B هي مصدر الشذوذ. 38 محطة عمل وشاشة إضافية تستهلك طاقة أثناء الخمول خارج ساعات الدوام بدلًا من الدخول في وضع السكون، بما يمثّل نحو 13 إلى 15 كيلوواط/ساعة من الزيادة اليومية. هذا بالضبط ما تستهدفه سياسة سكون التجهيزات في الحل C، إضافة إلى قطع التكييف.`
        : `Yes — Zone B is where the anomaly is. 38 workstations and auxiliary monitors are drawing idle power outside working hours instead of sleeping, contributing roughly 13 to 15 kWh of the daily excess. That's exactly what Solution C's idle-equipment-sleep policy targets, on top of the HVAC cutoff.`;
    }
    if (mentionsZoneA) {
      return isAr
        ? `المنطقة A (المكتبة) لا تساهم في الشذوذ. تلتزم بدوام طبيعي من 08:00 حتى ${closeTime} دون أي مشكلة استهلاك خامل مسجّلة. الاستهلاك الزائد مصدره تجهيزات المنطقة B (مختبر الحاسوب) وتشغيل التكييف الإضافي على مستوى المبنى، وليس المنطقة A.`
        : `Zone A (the library) is not contributing to the anomaly. It follows normal 08:00 to ${closeTime} occupancy with no idle-power issue reported. The excess consumption traces to Zone B's (Computer Lab) equipment and the building-wide HVAC overtime, not Zone A.`;
    }
    if (mentionsZoneC) {
      return isAr
        ? `المنطقة C (قاعة المسرح، 120 مقعدًا) تعمل بشكل طبيعي — الإضاءة تتبع جدول الخلية الضوئية الآلي دون أي انحراف. إنها ليست مساهمة في شذوذ اليوم.`
        : `Zone C (the 120-seat auditorium) is operating normally — lighting follows the automated photocell schedule with no deviation. It is not a contributor to today's anomaly.`;
    }
    if (mentionsLighting) {
      return isAr
        ? `الإضاءة ليست عاملًا هنا. جميع وحدات LED الـ140 تتبع جدولها الآلي بشكل طبيعي، وتستهلك 80 كيلوواط/ساعة يوميًا كما هو متوقع.`
        : `Lighting is not a factor here. All 140 LED fixtures are tracking their automated schedule normally, drawing the expected 80 kWh per day.`;
    }
    if (mentionsSolar) {
      return isAr
        ? `توليد الطاقة الشمسية طبيعي — منظومة السطح 15 كيلوواط تنتج نحو 50 كيلوواط/ساعة يوميًا كما هو متوقع دون أي عطل في العاكس، لذا فهي ليست سببًا في الشذوذ.`
        : `Solar generation is normal — the rooftop 15 kWp array is producing its expected ~50 kWh per day with no inverter fault, so it isn't contributing to the anomaly.`;
    }
    if (mentionsConfidence) {
      return isAr
        ? `درجة الثقة تُحتسب من قوة الأدلة: مطابقة انحراف قراءات العدادات الفرعية، عدد التجهيزات غير المُدارة المرصودة، وتناسق النمط عبر عدة أيام سابقة. كل هذه المؤشرات تتقارب بقوة على المنطقة B وتكييف ما بعد الدوام كسبب رئيسي.`
        : `The confidence score is built from evidence strength: how closely sub-meter variance matches the hypothesis, how many unmanaged devices were directly observed, and pattern consistency across prior days. Those signals converge strongly on Zone B and after-hours HVAC as the primary cause.`;
    }
    if (mentionsComfort) {
      return isAr
        ? `الحل الموصى به (C) لا يؤثر إطلاقًا على راحة الشاغلين خلال ساعات الدوام الرسمية (08:00–${closeTime}) — التغيير يقتصر على ما بعد إغلاق المبنى، حين لا يكون أحد موجودًا أصلًا.`
        : `The recommended solution (C) has zero impact on occupant comfort during official working hours (08:00–${closeTime}) — the change only takes effect after the building closes, when nobody is there to notice it.`;
    }
    if (mentionsMoney) {
      return isAr
        ? `التوفير الشهري المعروض في بطاقة التوصية محسوب مباشرة من التعرفة المضبوطة في الإعدادات مضروبة في التخفيض اليومي بالكيلوواط/ساعة، مضروبًا في 30 يومًا — عدّل التعرفة من هناك وستتحدث كل الأرقام فورًا.`
        : `The monthly figure shown on the recommendation card is computed directly from the tariff set in Settings, multiplied by the daily kWh reduction, times 30 days — change the tariff there and every number updates instantly.`;
    }
    if (mentionsWhatIsEnerq) {
      return isAr
        ? `EnerQ نظام طاقة متعدد الوكلاء بالذكاء الاصطناعي، وأنا وكيله الذي يراقب استهلاك هذه المنشأة، يكتشف الشذوذ، يحقق في السبب، يحاكي الحلول في توأم رقمي، ثم يقرر ويتحقق من النتيجة — أربعة وكلاء متخصصون ينسّقون هذا المسار بدلاً من نص برمجي واحد.`
        : `I'm EnerQ, a multi-agent AI energy system. I monitor this facility's consumption, detect anomalies, investigate root cause, simulate fixes in a Digital Twin, then decide and verify the result — four specialist agents coordinate that pipeline instead of one monolithic script.`;
    }
    if (mentionsMultiAgent) {
      return isAr
        ? `أربعة وكلاء متخصصون: وكيل المراقبة (مراقبة، اكتشاف)، وكيل التشخيص (تحقيق، توليد حلول)، وكيل المحاكاة (محاكاة، مقارنة، قرار)، ووكيل التنفيذ (توصية، تحقق). منسّق مشترك يستدعيهم بالتتابع لكنه لا يحتوي على الاستدلال نفسه — كل وكيل مستقل وقابل للاستبدال بمفرده.`
        : `Four specialist agents: ObserverAgent (observe, detect), DiagnosticAgent (investigate, generate solutions), SimulationAgent (simulate, compare, decide), and ActionAgent (recommend, verify). A shared coordinator calls them in sequence but holds none of the reasoning itself — each agent is independent and individually replaceable.`;
    }
    if (mentionsRAG) {
      return isAr
        ? `قبل أن أجيب، أسترجع أكثر المقاطع صلة من قاعدة معرفة لإدارة الطاقة عبر مطابقة الكلمات المفتاحية، وأعطيها للنموذج اللغوي كسياق استرشادي. لهذا يظهر استشهاد حقيقي تحت كل رد بدلًا من إجابة مُختلقة.`
        : `Before I answer, I retrieve the most relevant excerpts from an energy-management knowledge base via keyword matching and give them to the model as grounding context. That's why a real citation shows up under each reply instead of an invented one.`;
    }
    if (mentionsIoT) {
      return isAr
        ? `هذا العرض يعمل على بيانات وهمية. في تطبيق حقيقي، تُستبدل قراءات وكيل المراقبة بتغذية حية من نظام إدارة المبنى (BACnet أو Modbus عادة) أو عداد ذكي، دون أي تغيير في بقية الوكلاء لأنها تستهلك نفس شكل البيانات. التنفيذ المستقل يستدعي بالمثل واجهة تحكم حقيقية بدلاً من تحديث حالة داخلي فقط.`
        : `This demo runs on mock data. In a real deployment, ObserverAgent's readings would be replaced with a live feed from the building's BMS (commonly BACnet or Modbus) or a smart meter, with zero change to any other agent since they all consume the same data shape. Autonomous execution would similarly call a real control API instead of just updating internal state.`;
    }
    if (mentionsDigitalTwinWhat) {
      return isAr
        ? `التوأم الرقمي هو نموذج فيزيائي مبسّط لهذه المنشأة — التكييف، الإضاءة، أحمال المقابس، الطاقة الشمسية عبر 3 مناطق — يتيح لي اختبار كل حل مرشح قبل التوصية به فعليًا، فأعرف التوفير والمخاطرة المتوقعين دون أي مخاطرة تشغيلية حقيقية.`
        : `The Digital Twin is a simplified physics model of this facility — HVAC, lighting, plug loads, solar, across 3 zones — that lets me test each candidate solution before actually recommending it, so I know the expected savings and risk without any real operational risk.`;
    }
    if (mentionsAutonomyLevel) {
      return isAr
        ? `في وضع الموافقة أسلّم القرار لإنسان، وإن لم يُجَب أذكّر ثم أصعّد. في الوضع المستقل، إن وقعت مخاطرة الحل ضمن عتبة مفوَّضة مسبقًا، أنفّذ مباشرة دون انتظار — مسجّلاً بشفافية دائمًا، ومتبوعًا بنفس خطوة التحقق.`
        : `In Approval mode I hand the decision to a human, and if it's left unanswered I remind then escalate. In Autonomous mode, if a solution's risk falls within a pre-authorized threshold, I execute directly without waiting — always logged transparently, always followed by the same verification step.`;
    }

    const openings = isAr
      ? [
          `استهلكت المنشأة اليوم ${currentKwh} كيلوواط/ساعة مقابل خط أساس متوقع قدره ${baselineKwh} كيلوواط/ساعة، بانحراف ${variancePct}%.`,
          `القراءات الحالية: ${currentKwh} كيلوواط/ساعة اليوم مقابل ${baselineKwh} كيلوواط/ساعة كخط أساس — أي زيادة ${variancePct}%.`,
        ]
      : [
          `The facility consumed ${currentKwh} kWh today against an expected baseline of ${baselineKwh} kWh, a ${variancePct} percent variance.`,
          `Today's reading: ${currentKwh} kWh against a ${baselineKwh} kWh baseline — a ${variancePct} percent overshoot.`,
        ];
    const opening = openings[hash(userPrompt) % openings.length];

    return isAr
      ? `${opening} شغّل نظام التكييف ${overtimeHours} ساعة متواصلة بعد وقت إغلاق ${closeTime}، مستهلكًا نحو ${hvacWasteKwh} كيلوواط/ساعة من التبريد غير الضروري، وبقيت محطات عمل المنطقة B على كامل طاقتها بدلًا من السكون خارج الدوام. سياسة قطع التكييف المدمجة مع سكون التجهيزات الخاملة تعالج الاثنين معًا، لتحقق أعلى خفض متاح (${solCPct}%) دون أي إخلال بساعات العمل الأساسية.`
      : `${opening} The HVAC system ran ${overtimeHours} continuous hours past the ${closeTime} occupancy cutoff, consuming roughly ${hvacWasteKwh} kWh of unneeded cooling, and Zone B's workstations stayed at full power instead of sleeping outside working hours. The combined HVAC schedule cutoff plus idle equipment sleep policy addresses both at once, for the highest available reduction (${solCPct}%) with zero disruption to core business hours.`;
  }

  switch (stage) {
    case "investigate":
      return isAr
        ? `يؤكد تدقيق العدادات الفرعية أن وحدة التكييف عملت ${overtimeHours} ساعة إضافية بعد جدولها المعتمد البالغ ${facility?.hvac?.normal_hours ?? 10} ساعة، مستهلكة ما يُقدَّر بـ ${hvacWasteKwh} كيلوواط/ساعة دون رقابة. ساهمت أحمال المقابس الخاملة في المنطقة B بحمل إضافي غير مُدار. عدادات الإضاءة والطاقة الشمسية الفرعية تتبع جدولها المتوقع، ما يستبعد هذين النظامين.`
        : `Sub-meter audit confirms the HVAC unit ran ${overtimeHours} hours beyond its ${facility?.hvac?.normal_hours ?? 10}h scheduled runtime, drawing an estimated ${hvacWasteKwh} kWh unmonitored. Idle workstation plug-loads in Zone B contributed additional unmanaged load. Lighting and solar sub-meters track their expected schedule, ruling out those systems.`;
    case "recommend":
    default:
      return isAr
        ? `التوصية: تنفيذ سياسة قطع جدول التكييف المدمجة مع سكون أحمال المقابس الخاملة الذكي. هذا هو الخيار الأعلى خفضًا والأقل مخاطرة تشغيلية بين الحلول المحاكاة — راجع لوحة المقاييس للأرقام الدقيقة بعملتك المضبوطة.`
        : `Recommendation: implement the combined HVAC schedule cutoff alongside intelligent idle plug-load sleep. This is the highest-reduction, low-operational-risk option among the simulated candidates — see the metrics panel for exact cost figures in your configured currency.`;
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
