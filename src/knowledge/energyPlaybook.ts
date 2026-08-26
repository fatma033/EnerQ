/**
 * EnerQ Knowledge Base — the grounding corpus for the agent's RAG layer.
 *
 * Two families of entries:
 *  - Facility/energy-management playbook chunks (HVAC, plug loads, decision
 *    theory, verification, solar, lighting) — the original grounding corpus.
 *  - "meta" chunks about the agent system itself (what a multi-agent system
 *    is, what RAG/Digital Twin/IoT mean here) — added so the chat can give
 *    a grounded, cited answer to basic "how does this work" questions, not
 *    just facility-specific ones. This is the corpus most likely to be
 *    probed directly, since the chat is the first thing evaluated.
 *
 * Every chunk is bilingual (English + Arabic title/content) so a citation
 * displays in whichever language the app is in, and both language variants
 * are indexed for retrieval — a query typed in either language can match
 * either half of the content, since facility vocabulary sometimes gets
 * typed in English even in an Arabic-language session.
 */

export interface KnowledgeChunk {
  id: string;
  title: string;
  title_ar: string;
  category:
    | "hvac"
    | "plug-loads"
    | "decision-making"
    | "verification"
    | "change-management"
    | "solar"
    | "lighting"
    | "meta";
  tags: string[]; // English + Arabic keyword variants together, for retrieval matching in both languages
  content: string;
  content_ar: string;
}

export const ENERGY_KNOWLEDGE_BASE: KnowledgeChunk[] = [
  {
    id: "hvac-schedule-lockout",
    title: "HVAC After-Hours Schedule Lockout",
    title_ar: "قفل جدول التكييف بعد ساعات الدوام",
    category: "hvac",
    tags: ["hvac", "after-hours", "schedule", "chiller", "ahu", "overtime", "تكييف", "بعد الدوام", "جدول", "مبرد", "تشغيل اضافي"],
    content:
      "The single highest-leverage HVAC fix in commercial buildings is enforcing a hard schedule cutoff tied to occupancy hours. A rooftop AHU/chiller plant left running past closing time consumes near-full load (typically 90%+ of daytime draw) for zero occupant benefit. BMS-level schedule locks with a short (10-20 minute) thermal coasting buffer recover the vast majority of this waste with zero comfort impact, since no one is present to notice the earlier cutoff. This is a Low risk, immediate-implementation intervention and should be evaluated before touching setpoints.",
    content_ar:
      "أهم إصلاح ذو تأثير كبير لأنظمة التكييف في المباني التجارية هو فرض قطع صارم للجدول مرتبط بساعات الإشغال. ترك وحدة التكييف المركزية (AHU/المبرد) تعمل بعد وقت الإغلاق يستهلك حملاً شبه كامل (عادة أكثر من 90% من الاستهلاك النهاري) دون أي فائدة للشاغلين. قفل الجدول على مستوى نظام إدارة المبنى (BMS) مع هامش انزلاق حراري قصير (10-20 دقيقة) يسترد معظم هذا الهدر دون أي تأثير على الراحة، لأنه لا يوجد أحد لملاحظة القطع المبكر. هذا تدخل منخفض المخاطر وفوري التنفيذ، ويجب تقييمه قبل التعامل مع نقاط الضبط الحرارية.",
  },
  {
    id: "hvac-setpoint-tradeoff",
    title: "Setpoint Offset vs. Schedule Fix Trade-off",
    title_ar: "المفاضلة بين تعديل نقطة الضبط وإصلاح الجدول",
    category: "hvac",
    tags: ["hvac", "setpoint", "temperature", "comfort", "thermal drift", "نقطة الضبط", "حرارة", "راحة", "انجراف حراري"],
    content:
      "Raising a cooling setpoint (e.g. +1.0 to +1.5C) reduces compressor lift work across all operating hours, including times the building IS occupied, so it introduces real thermal-comfort risk and often yields smaller total savings than fixing a scheduling gap. Setpoint changes are best used as a secondary, complementary lever after schedule-based waste is eliminated, not as the primary fix for an after-hours anomaly.",
    content_ar:
      "رفع نقطة ضبط التبريد (مثلاً +1.0 إلى +1.5°C) يقلل حِمل عمل الضاغط خلال جميع ساعات التشغيل، بما فيها أوقات إشغال المبنى الفعلي، لذا فهو يحمل مخاطرة حقيقية على الراحة الحرارية وغالبًا ما يحقق توفيرًا إجماليًا أقل من إصلاح فجوة الجدولة. الأفضل استخدام تعديل نقطة الضبط كأداة ثانوية مكمّلة بعد إزالة الهدر المرتبط بالجدول، وليس كإصلاح أساسي لشذوذ ما بعد الدوام.",
  },
  {
    id: "plug-load-vampire-power",
    title: "Unmanaged Idle / Vampire Plug Load",
    title_ar: "حمل المقابس الخامل غير المُدار",
    category: "plug-loads",
    tags: ["plug load", "idle", "workstation", "computer", "pc", "vampire power", "equipment", "حمل خامل", "محطة عمل", "حاسوب", "حواسيب", "كمبيوتر", "أجهزة حاسوب", "طاقة شبح", "تجهيزات"],
    content:
      "Workstations, monitors, and auxiliary peripherals left powered outside working hours ('vampire power') typically account for 5-15% of total idle-period draw in office facilities. Smart PDU/power-strip sleep policies or OS-level wake-on-LAN shutdown scripts are low-risk, low-cost interventions that combine well with an HVAC schedule fix because they attack the same after-hours time window without touching climate control.",
    content_ar:
      "محطات العمل والشاشات والملحقات المتروكة قيد التشغيل خارج ساعات الدوام ('طاقة الشبح') تمثّل عادة 5-15% من إجمالي الاستهلاك أثناء فترات الخمول في المكاتب. سياسات سكون وحدات توزيع الطاقة الذكية (PDU) أو نصوص إيقاف التشغيل عبر الشبكة (Wake-on-LAN) هي تدخلات منخفضة المخاطر والتكلفة، وتتكامل جيدًا مع إصلاح جدول التكييف لأنها تستهدف نفس النافذة الزمنية بعد الدوام دون المساس بالتحكم المناخي.",
  },
  {
    id: "combined-intervention-principle",
    title: "Combined Interventions Compound Savings at Low Marginal Risk",
    title_ar: "التدخلات المدمجة تضاعف التوفير بمخاطرة هامشية منخفضة",
    category: "decision-making",
    tags: ["combined", "solution", "risk", "savings", "multi-criteria", "حل مدمج", "مخاطرة", "توفير"],
    content:
      "When two waste sources occupy the same time window (e.g. after-hours HVAC + after-hours idle equipment), combining their fixes into one intervention captures both savings pools without materially increasing operational risk, because the fixes act on independent systems. In multi-criteria decision analysis, a combined solution should generally outrank a single-system fix whenever its risk score does not increase proportionally to its added savings.",
    content_ar:
      "عندما يتشارك مصدرا هدر نفس النافذة الزمنية (مثل تكييف ما بعد الدوام + تجهيزات خاملة بعد الدوام)، فإن دمج إصلاحيهما في تدخل واحد يحقق مجمل التوفير من الاثنين دون زيادة جوهرية في المخاطرة التشغيلية، لأن الإصلاحين يعملان على أنظمة مستقلة. في تحليل القرار متعدد المعايير، يجب أن يتفوق الحل المدمج عادة على إصلاح نظام واحد طالما أن درجة مخاطرته لا ترتفع بما يتناسب مع زيادة التوفير.",
  },
  {
    id: "mcda-scoring",
    title: "Multi-Criteria Decision Analysis for Facility Interventions",
    title_ar: "تحليل القرار متعدد المعايير لتدخلات المنشأة",
    category: "decision-making",
    tags: ["decision", "score", "risk", "comfort", "mcda", "ranking", "قرار", "درجة", "مخاطرة", "راحة", "ترتيب"],
    content:
      "A defensible facility-optimization recommendation should weigh at least three axes: (1) energy/cost savings magnitude, (2) occupant comfort or operational disruption, and (3) implementation risk and reversibility. A solution with a smaller savings percentage but materially lower comfort/risk cost can still be the wrong recommendation if a combined alternative achieves both higher savings and an acceptable (not necessarily zero) risk delta — the agent should recommend the pareto-best option, not simply the largest single number.",
    content_ar:
      "يجب أن توازن أي توصية معتبرة لتحسين المنشأة بين ثلاثة محاور على الأقل: (1) حجم التوفير في الطاقة/التكلفة، (2) راحة الشاغلين أو الإخلال التشغيلي، (3) مخاطرة التنفيذ وإمكانية التراجع. الحل ذو نسبة توفير أقل لكن بتكلفة راحة/مخاطرة أقل بكثير قد يظل خيارًا خاطئًا إذا كان البديل المدمج يحقق توفيرًا أعلى بمخاطرة مقبولة (ليست بالضرورة صفرية) — يجب أن يوصي الوكيل بالخيار الأمثل باريتو، لا بأكبر رقم منفرد فقط.",
  },
  {
    id: "ipmvp-verification",
    title: "Measurement & Verification (M&V) Protocol",
    title_ar: "بروتوكول القياس والتحقق (M&V)",
    category: "verification",
    tags: ["verification", "m&v", "ipmvp", "actual vs expected", "savings confirmation", "تحقق", "قياس", "فعلي مقابل متوقع"],
    content:
      "Following the IPMVP-style verification principle, a savings claim is only credible after comparing actual post-intervention consumption against the pre-intervention baseline under equivalent conditions, not merely against the simulated expectation. A gap between expected and actual savings (e.g. expected 15% vs 12.5% actual) is normal and should be reported transparently rather than hidden, with the residual gap flagged for a follow-up investigation cycle.",
    content_ar:
      "وفق مبدأ التحقق على طراز IPMVP، لا يكون ادعاء التوفير موثوقًا إلا بعد مقارنة الاستهلاك الفعلي بعد التدخل بخط الأساس قبل التدخل تحت ظروف مكافئة، وليس فقط مقابل التوقع المحاكى. وجود فجوة بين التوفير المتوقع والفعلي (مثلًا 15% متوقعة مقابل 12.5% فعلية) أمر طبيعي ويجب الإبلاغ عنه بشفافية بدلاً من إخفائه، مع تحديد الفجوة المتبقية لدورة تحقيق لاحقة.",
  },
  {
    id: "employee-notification-escalation",
    title: "Responsible-Party Notification & Escalation Cadence",
    title_ar: "وتيرة إشعار الجهة المسؤولة والتصعيد",
    category: "change-management",
    tags: ["notification", "escalation", "responsible", "reminder", "accountability", "إشعار", "تصعيد", "تذكير", "مسؤولية"],
    content:
      "Autonomous energy agents should not silently act without a named responsible owner for each piece of equipment. Best practice is a three-step cadence: (1) initial notification with quantified cost impact and a deadline, (2) a single reminder if unresolved that restates accumulating cost, (3) an escalation after a defined SLA (commonly 7-14 days) that surfaces cumulative waste to management. This keeps the human accountable while the agent keeps the issue from being forgotten.",
    content_ar:
      "لا ينبغي لوكلاء الطاقة المستقلين التصرف بصمت دون مالك مسؤول محدد لكل قطعة تجهيزات. أفضل الممارسات هي وتيرة من ثلاث خطوات: (1) إشعار أولي مع تحديد التأثير المالي وموعد نهائي، (2) تذكير واحد إن لم يُحل، يعيد ذكر التكلفة المتراكمة، (3) تصعيد بعد مدة زمنية محددة (عادة 7-14 يومًا) يعرض الهدر التراكمي على الإدارة. هذا يبقي الإنسان مسؤولاً بينما يمنع الوكيل نسيان المشكلة.",
  },
  {
    id: "digital-twin-simulation-value",
    title: "Why Simulate Before Acting",
    title_ar: "لماذا نحاكي قبل التنفيذ",
    category: "decision-making",
    tags: ["digital twin", "simulation", "test before act", "physics model", "توأم رقمي", "محاكاة", "اختبار قبل التنفيذ"],
    content:
      "Testing a candidate intervention in a Digital Twin before real-world deployment lets the agent quantify expected savings and comfort impact without any operational risk. This is especially important for combined interventions, where the interaction between two changed systems (e.g. HVAC schedule + plug-load sleep) is not always the simple sum of their individual effects and benefits from an explicit simulated check.",
    content_ar:
      "اختبار تدخل مرشح في التوأم الرقمي قبل التطبيق الفعلي يتيح للوكيل تحديد التوفير المتوقع وتأثير الراحة كميًا دون أي مخاطرة تشغيلية. هذا مهم خصوصًا للتدخلات المدمجة، حيث لا يكون التفاعل بين نظامين متغيّرين (مثل جدول التكييف + سكون أحمال المقابس) دائمًا مجرد مجموع تأثيريهما المنفردين، ويستفيد من فحص محاكى صريح.",
  },
  {
    id: "solar-self-consumption",
    title: "On-Site Solar Generation and Anomaly Isolation",
    title_ar: "التوليد الشمسي في الموقع وعزل الشذوذ",
    category: "solar",
    tags: ["solar", "pv", "generation", "baseline", "شمسي", "توليد", "خط أساس"],
    content:
      "When diagnosing a consumption anomaly, on-site solar generation should be checked independently from the load side. A facility can show a net-consumption spike purely from increased load with completely normal solar output, or the anomaly could stem from a generation shortfall (inverter fault, panel soiling). Ruling out the generation side first prevents mis-attributing a load-side waste problem to a solar issue, or vice versa.",
    content_ar:
      "عند تشخيص شذوذ في الاستهلاك، يجب فحص التوليد الشمسي في الموقع بشكل مستقل عن جانب الحمل. قد تظهر المنشأة ارتفاعًا في صافي الاستهلاك بسبب زيادة الحمل فقط مع توليد شمسي طبيعي تمامًا، أو قد ينبع الشذوذ من نقص في التوليد (عطل في العاكس، اتساخ الألواح). استبعاد جانب التوليد أولاً يمنع نسبة مشكلة هدر في جانب الحمل خطأً إلى مشكلة شمسية، أو العكس.",
  },
  {
    id: "lighting-schedule-baseline",
    title: "Scheduled Lighting as a Low-Priority Investigation Target",
    title_ar: "الإضاءة المجدولة كهدف تحقيق منخفض الأولوية",
    category: "lighting",
    tags: ["lighting", "schedule", "photocell", "baseline", "إضاءة", "خلية ضوئية", "جدول"],
    content:
      "Facilities with photocell- or schedule-controlled LED lighting rarely contribute to sudden anomalies, since their draw is deterministic and bounded by fixture count. When investigating a consumption spike, lighting sub-meters that track their expected schedule closely can be deprioritized quickly, focusing investigative effort on systems with variable or occupancy-dependent draw such as HVAC and plug loads.",
    content_ar:
      "المنشآت ذات إضاءة LED المتحكم بها عبر خلية ضوئية أو جدول نادرًا ما تساهم في شذوذ مفاجئ، لأن استهلاكها حتمي ومحدود بعدد الوحدات. عند التحقيق في ارتفاع الاستهلاك، يمكن استبعاد عدادات الإضاءة الفرعية التي تتبع جدولها المتوقع بسرعة، وتركيز جهد التحقيق على الأنظمة ذات الاستهلاك المتغير أو المرتبط بالإشغال مثل التكييف وأحمال المقابس.",
  },

  // --- Meta chunks: the agent system itself ---
  {
    id: "meta-what-is-enerq",
    title: "What EnerQ Is",
    title_ar: "ما هو EnerQ",
    category: "meta",
    tags: ["enerq", "what is", "overview", "agent", "ما هو", "نظرة عامة", "وكيل"],
    content:
      "EnerQ is a multi-agent AI energy system for commercial facilities. It doesn't just display a dashboard — it observes consumption, detects anomalies, investigates root cause, simulates candidate fixes in a Digital Twin, decides on the best one using a computed multi-criteria score, and either asks for approval or acts autonomously, then verifies the result. Four specialist agents (Observer, Diagnostic, Simulation, Action) each own part of that pipeline, coordinated by a shared orchestrator.",
    content_ar:
      "EnerQ هو نظام طاقة متعدد الوكلاء بالذكاء الاصطناعي للمنشآت التجارية. لا يكتفي بعرض لوحة بيانات — بل يراقب الاستهلاك، يكتشف الشذوذ، يحقق في السبب الجذري، يحاكي الحلول المرشحة في توأم رقمي، يقرر الأفضل باستخدام درجة محسوبة متعددة المعايير، ثم يطلب الموافقة أو ينفّذ باستقلالية، ويتحقق من النتيجة بعد ذلك. أربعة وكلاء متخصصون (المراقبة، التشخيص، المحاكاة، التنفيذ) يتولى كل منهم جزءًا من هذا المسار، بتنسيق من منسّق مشترك.",
  },
  {
    id: "meta-multi-agent-architecture",
    title: "Why Multiple Agents Instead of One Script",
    title_ar: "لماذا وكلاء متعددون بدلًا من نص برمجي واحد",
    category: "meta",
    tags: ["multi-agent", "architecture", "agents", "orchestrator", "وكلاء متعددون", "معمارية", "منسق"],
    content:
      "A single monolithic script that does everything is hard to reason about, test, or replace piece by piece. EnerQ splits its nine-stage pipeline across four agents, each with one job: ObserverAgent (observe, detect), DiagnosticAgent (investigate, generate solutions), SimulationAgent (simulate, compare, decide), and ActionAgent (recommend, verify). A coordinator (the orchestrator) holds shared state and calls each agent in turn but contains none of the actual reasoning itself. This means, for example, ObserverAgent alone could be replaced with a real IoT/BMS data feed without touching any other agent.",
    content_ar:
      "نص برمجي واحد ضخم يقوم بكل شيء يصعب فهمه أو اختباره أو استبدال جزء منه. يقسّم EnerQ مساره التسع-مراحل على أربعة وكلاء، لكل منهم مهمة واحدة: وكيل المراقبة (مراقبة، اكتشاف)، وكيل التشخيص (تحقيق، توليد حلول)، وكيل المحاكاة (محاكاة، مقارنة، قرار)، ووكيل التنفيذ (توصية، تحقق). منسّق مشترك (Orchestrator) يحمل الحالة المشتركة ويستدعي كل وكيل بدوره، لكنه لا يحتوي على أي من الاستدلال الفعلي بنفسه. هذا يعني، على سبيل المثال، أن وكيل المراقبة وحده يمكن استبداله بمصدر بيانات IoT/BMS حقيقي دون المساس بأي وكيل آخر.",
  },
  {
    id: "meta-what-is-rag",
    title: "What RAG (Retrieval-Augmented Generation) Means Here",
    title_ar: "ماذا يعني RAG (التوليد المعزز بالاسترجاع) هنا",
    category: "meta",
    tags: ["rag", "retrieval", "knowledge base", "citation", "استرجاع", "قاعدة معرفة", "استشهاد"],
    content:
      "Before the LLM answers, EnerQ retrieves the most relevant entries from a small energy-management knowledge base using keyword/term-overlap matching (no vector database needed for this scale), and gives those excerpts to the model as grounding context. This is why answers can cite a real source instead of the model inventing one — the citation chip shown under a chat reply names the actual knowledge-base entry that was retrieved and used.",
    content_ar:
      "قبل أن يجيب النموذج اللغوي، يسترجع EnerQ أكثر المدخلات صلة من قاعدة معرفة صغيرة لإدارة الطاقة باستخدام مطابقة الكلمات المفتاحية (دون الحاجة لقاعدة بيانات متجهة بهذا الحجم)، ويقدّم تلك المقتطفات للنموذج كسياق استرشادي. لهذا يمكن للإجابات أن تستشهد بمصدر حقيقي بدلاً من أن يخترعه النموذج — شارة الاستشهاد الظاهرة أسفل رد المحادثة تسمّي مدخل قاعدة المعرفة الفعلي الذي تم استرجاعه واستخدامه.",
  },
  {
    id: "meta-deterministic-fallback",
    title: "Why the Agent Still Works Without the LLM",
    title_ar: "لماذا يستمر الوكيل بالعمل دون النموذج اللغوي",
    category: "meta",
    tags: ["deterministic", "fallback", "resilience", "offline", "ollama", "حتمي", "احتياطي", "مرونة", "دون اتصال"],
    content:
      "EnerQ's decisions never depend on the LLM being reachable. Every stage's pipeline logic and the multi-criteria scoring run on deterministic code regardless of whether a local Ollama instance is running; only the free-form narrative explanation and chat replies are LLM-generated when available, falling back to templated (but still data-grounded, and now bilingual) text when it isn't. This was a deliberate design choice — an energy agent that stops working when a language model is unreachable isn't reliable enough for real facility operations.",
    content_ar:
      "قرارات EnerQ لا تعتمد أبدًا على توفر النموذج اللغوي. منطق كل مرحلة والتقييم متعدد المعايير يعملان بشكل حتمي بغض النظر عن تشغيل Ollama محليًا؛ فقط السرد الحر والردود في المحادثة تُولَّد بواسطة النموذج اللغوي عند توفره، وتعود إلى نص جاهز (لكنه مستند إلى البيانات الفعلية، وثنائي اللغة الآن) عند عدم توفره. كان هذا قرار تصميم متعمد — وكيل طاقة يتوقف عن العمل عند تعذّر الوصول لنموذج لغوي ليس موثوقًا بما يكفي لعمليات منشأة حقيقية.",
  },
  {
    id: "meta-iot-real-deployment",
    title: "Connecting to Real IoT / Building Management Systems",
    title_ar: "الاتصال بأنظمة إنترنت الأشياء وإدارة المباني الحقيقية",
    category: "meta",
    tags: ["iot", "bms", "bacnet", "modbus", "sensors", "real deployment", "انترنت الاشياء", "نظام ادارة مبنى", "حساسات", "تطبيق حقيقي"],
    content:
      "This demo runs on mock facility data. In a real deployment, ObserverAgent's telemetry read would be replaced with a live feed from the building's BMS (commonly BACnet or Modbus protocol) or smart-meter API instead of a static mock object — every other agent consumes the same FacilityState shape either way, so nothing downstream changes. Autonomous execution (ActionAgent) would similarly call a real BMS control API or smart-relay/PDU vendor API to actually cut power, gated behind the same approval/autonomous authorization levels already in the UI.",
    content_ar:
      "يعمل هذا العرض التوضيحي على بيانات منشأة وهمية. في تطبيق حقيقي، يُستبدل استيعاب القراءات لدى وكيل المراقبة بتغذية حية من نظام إدارة المبنى (عادة بروتوكول BACnet أو Modbus) أو واجهة برمجية للعداد الذكي بدلاً من كائن ثابت وهمي — تستهلك بقية الوكلاء نفس شكل بيانات المنشأة (FacilityState) في الحالتين، فلا يتغير شيء في المراحل التالية. التنفيذ المستقل (وكيل التنفيذ) يستدعي بالمثل واجهة برمجية حقيقية للتحكم بنظام إدارة المبنى أو مرحّل ذكي/وحدة توزيع طاقة لقطع التيار فعليًا، ضمن نفس مستويات تفويض الموافقة/الاستقلالية الموجودة بالفعل في الواجهة.",
  },
  {
    id: "meta-autonomy-levels",
    title: "Approval vs. Autonomous Execution Levels",
    title_ar: "مستويات التنفيذ بالموافقة مقابل الاستقلالية",
    category: "meta",
    tags: ["autonomy", "approval", "autonomous", "level 3", "human in the loop", "استقلالية", "موافقة", "مستقل", "إنسان في الحلقة"],
    content:
      "EnerQ supports two authorization levels. In Approval mode, ActionAgent hands the decision to a human and, if left unanswered, reminds then escalates rather than acting on its own. In Autonomous mode, for a solution whose risk score falls within a pre-authorized threshold, ActionAgent proceeds directly to implementation without waiting — still logged transparently, still followed by the same verification step. This mirrors how real facility automation is typically deployed: low-risk actions autonomous, higher-stakes ones human-gated.",
    content_ar:
      "يدعم EnerQ مستويي تفويض. في وضع الموافقة، يسلّم وكيل التنفيذ القرار لإنسان، وإن لم يُجَب عليه يذكّر ثم يصعّد بدلًا من التصرف بمفرده. في الوضع المستقل، بالنسبة لحل تقع درجة مخاطرته ضمن عتبة مفوَّضة مسبقًا، ينتقل وكيل التنفيذ مباشرة إلى التنفيذ دون انتظار — مع تسجيل شفاف دائمًا، ومتبوعًا بنفس خطوة التحقق. هذا يعكس كيفية نشر أتمتة المنشآت الحقيقية عادة: إجراءات منخفضة المخاطر مستقلة، وإجراءات أعلى حساسية تمر عبر بوابة بشرية.",
  },
];
