/**
 * Bilingual chrome text (EN/AR). Scoped deliberately: this covers the app's
 * static shell — header, timeline stage names, tab labels, key buttons —
 * not the deep dynamic content (agent reasoning log, LLM-generated text,
 * chat replies), which stays English regardless of language since
 * maintaining parallel Arabic versions of every generated sentence isn't
 * reliably achievable without either a second LLM prompt path or hand-
 * translating template strings that would drift out of sync over time.
 *
 * Layout direction is intentionally left LTR in both languages — Arabic
 * script renders correctly right-to-left within its own text nodes via
 * the browser's normal bidi handling, without needing to mirror the whole
 * page layout, which is where i18n effort-to-risk ratio gets expensive.
 */

export type Language = "en" | "ar";

export const translations = {
  en: {
    tagline: "AI Energy Agent",
    subtitle: "Autonomous Facility Energy Expert & Digital Twin",
    rate: "Rate",
    runAnalysis: "Run EnerQ Analysis",
    runningAnalysis: "Running Agent Pipeline...",
    resetTooltip: "Reset to Initial Anomaly State",
    askAgent: "Ask Agent",
    auditReport: "Audit Report",
    approval: "Approval",
    autonomous: "Autonomous",
    settingsTooltip: "Facility & Tariff Settings",
    themeToLight: "Switch to light mode",
    themeToDark: "Switch to dark mode",
    langToggle: "العربية",

    timelineTitle: "EnerQ AI Agent Workflow",
    timelineSubtitle: "Autonomous Decision & Verification Pipeline",
    reasoningActive: "Autonomous Reasoning Active",
    workflowCompleted: "Workflow Completed & Verified",
    stepOf: (n: number) => `Step ${n} of 9`,

    stages: {
      OBSERVE: { label: "Observe", description: "Ingest meter telemetry & facility schedules" },
      DETECT: { label: "Detect", description: "Evaluate variance against baseline (+24%)" },
      INVESTIGATE: { label: "Investigate", description: "Isolate sub-system cause (HVAC 4h overtime)" },
      GENERATE_SOLUTIONS: { label: "Generate", description: "Formulate candidate interventions (A, B, C)" },
      SIMULATE: { label: "Simulate", description: "Test scenarios in facility Digital Twin" },
      COMPARE: { label: "Compare", description: "Multi-criteria tradeoff evaluation" },
      DECIDE: { label: "Decide", description: "Select highest-value safe intervention" },
      RECOMMEND: { label: "Recommend", description: "Present actionable plan with ROI breakdown" },
      VERIFY: { label: "Verify", description: "Simulate post-approval implementation (-15%)" },
    },

    tabs: {
      ALL: "Unified Control View",
      TWIN: "Digital Twin Physics",
      SOLUTIONS: "Solution Comparison Lab",
      ANALYTICS: "24h Load Telemetry",
    },
  },
  ar: {
    tagline: "وكيل ذكاء اصطناعي للطاقة",
    subtitle: "خبير طاقة مستقل للمنشأة وتوأم رقمي",
    rate: "التعرفة",
    runAnalysis: "تشغيل تحليل EnerQ",
    runningAnalysis: "جارٍ تشغيل الوكيل...",
    resetTooltip: "إعادة التعيين لحالة الشذوذ الأولية",
    askAgent: "اسأل الوكيل",
    auditReport: "تقرير التدقيق",
    approval: "بموافقة",
    autonomous: "مستقل",
    settingsTooltip: "إعدادات المنشأة والتعرفة",
    themeToLight: "التبديل إلى الوضع الفاتح",
    themeToDark: "التبديل إلى الوضع الداكن",
    langToggle: "English",

    timelineTitle: "سير عمل وكيل EnerQ",
    timelineSubtitle: "خط أنابيب القرار والتحقق المستقل",
    reasoningActive: "الاستدلال المستقل نشط",
    workflowCompleted: "اكتملت العملية وتم التحقق",
    stepOf: (n: number) => `الخطوة ${n} من 9`,

    stages: {
      OBSERVE: { label: "مراقبة", description: "استيعاب قراءات العدادات وجداول المنشأة" },
      DETECT: { label: "اكتشاف", description: "تقييم الانحراف عن خط الأساس (+24%)" },
      INVESTIGATE: { label: "تحقيق", description: "عزل السبب الجذري (تكييف 4 ساعات إضافية)" },
      GENERATE_SOLUTIONS: { label: "توليد", description: "صياغة حلول مرشحة (A، B، C)" },
      SIMULATE: { label: "محاكاة", description: "اختبار السيناريوهات في التوأم الرقمي" },
      COMPARE: { label: "مقارنة", description: "تقييم متعدد المعايير" },
      DECIDE: { label: "قرار", description: "اختيار أفضل تدخل آمن" },
      RECOMMEND: { label: "توصية", description: "تقديم خطة قابلة للتنفيذ مع العائد المالي" },
      VERIFY: { label: "تحقق", description: "محاكاة التنفيذ بعد الموافقة (-15%)" },
    },

    tabs: {
      ALL: "العرض الموحد",
      TWIN: "فيزياء التوأم الرقمي",
      SOLUTIONS: "مختبر مقارنة الحلول",
      ANALYTICS: "قياسات الحمل 24 ساعة",
    },
  },
} as const;

export function getTranslation(lang: Language) {
  return translations[lang];
}
