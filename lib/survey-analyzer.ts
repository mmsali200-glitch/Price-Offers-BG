/**
 * Analyzes survey responses to suggest modules, estimate pricing,
 * and identify discussion points for the sales team.
 */

import { SURVEY_DATA } from "./survey-data";
import { ODOO_MODULES } from "./modules-catalog";

export type SurveyAnalysis = {
  suggestedModules: Array<{ id: string; name: string; reason: string; confidence: "high" | "medium" | "low" }>;
  estimatedUsers: { full: number; portal: number };
  complexityLevel: "standard" | "medium" | "advanced" | "complex";
  complexityScore: number;
  pricingFactors: Array<{ factor: string; impact: "increase" | "decrease" | "neutral"; detail: string }>;
  discussionPoints: Array<{ question: string; answer: string; concern: string }>;
  sectionSummary: Array<{ section: string; answered: number; total: number; highlights: string[] }>;
  estimatedDuration: string;
  estimatedBudgetRange: { min: number; max: number; currency: string };
};

export function analyzeSurvey(
  responses: Record<string, unknown>,
  clientInfo: { company_name?: string; industry?: string }
): SurveyAnalysis {
  const suggestedModules: SurveyAnalysis["suggestedModules"] = [];
  const pricingFactors: SurveyAnalysis["pricingFactors"] = [];
  const discussionPoints: SurveyAnalysis["discussionPoints"] = [];

  // --- Extract key answers ---
  const multiCompany = responses.q1_2 as string;
  const fullUsers = Number(responses.q1_6) || 10;
  const portalUsers = Number(responses.q1_7) || 0;
  const wave1 = (responses.q3_wave1 as string[]) || [];
  const wave2 = (responses.q3_wave2 as string[]) || [];
  const wave3 = (responses.q3_wave3 as string[]) || [];
  const boqSize = responses.q5_4 as string;
  const migrationScope = responses.q11_1 as string;
  const hostingPref = responses.q12_1 as string;
  const hypercare = responses.q13_5 as string;
  const pricingModel = responses.q14_6 as string;

  // --- Module suggestions ---
  if (wave1.some((w) => w.includes("Accounting"))) {
    suggestedModules.push({ id: "accounting", name: "المحاسبة", reason: "مطلوب في الموجة الأولى", confidence: "high" });
  }
  if (wave1.some((w) => w.includes("Purchase"))) {
    suggestedModules.push({ id: "purchase", name: "المشتريات", reason: "مطلوب في الموجة الأولى", confidence: "high" });
    suggestedModules.push({ id: "inventory", name: "المخازن", reason: "مرتبط بالمشتريات", confidence: "high" });
  }
  if (wave1.some((w) => w.includes("Project"))) {
    suggestedModules.push({ id: "project", name: "المشاريع", reason: "مطلوب في الموجة الأولى", confidence: "high" });
  }
  if (wave1.some((w) => w.includes("Expenses"))) {
    suggestedModules.push({ id: "expenses", name: "المصروفات", reason: "مطلوب في الموجة الأولى", confidence: "high" });
  }
  if (wave2.some((w) => w.includes("المقاولين"))) {
    suggestedModules.push({ id: "contracting", name: "إدارة المقاولات", reason: "مطلوب في الموجة الثانية — تخصيص", confidence: "high" });
  }
  if (wave3.some((w) => w.includes("العقار"))) {
    suggestedModules.push({ id: "realestate", name: "العقارات", reason: "مطلوب في الموجة الثالثة — تخصيص", confidence: "high" });
  }
  if (wave3.some((w) => w.includes("CRM"))) {
    suggestedModules.push({ id: "crm", name: "CRM", reason: "مطلوب للمبيعات العقارية", confidence: "high" });
  }
  if (multiCompany === "نعم") {
    suggestedModules.push({ id: "multicompany", name: "الشركات المتعددة", reason: "العميل لديه عدة كيانات", confidence: "high" });
    pricingFactors.push({ factor: "شركات متعددة", impact: "increase", detail: "يحتاج إعداد كل شركة مستقلة + عمليات بينية" });
  }

  // Add standard modules if not explicitly mentioned
  const hasModule = (id: string) => suggestedModules.some((m) => m.id === id);
  if (!hasModule("accounting")) suggestedModules.push({ id: "accounting", name: "المحاسبة", reason: "أساسي في أي تطبيق ERP", confidence: "medium" });
  if (!hasModule("hr") && fullUsers > 20) suggestedModules.push({ id: "hr", name: "الموظفون", reason: `${fullUsers} مستخدم — يحتاج إدارة موارد بشرية`, confidence: "medium" });
  if (!hasModule("payroll") && fullUsers > 30) suggestedModules.push({ id: "payroll", name: "الرواتب", reason: `${fullUsers} موظف يحتاج نظام رواتب`, confidence: "low" });

  // --- Pricing factors ---
  if (fullUsers > 50) pricingFactors.push({ factor: "عدد مستخدمين كبير", impact: "increase", detail: `${fullUsers} مستخدم — ترخيص أعلى + تدريب أطول` });
  if (fullUsers <= 10) pricingFactors.push({ factor: "عدد مستخدمين صغير", impact: "decrease", detail: `${fullUsers} مستخدم — ترخيص أقل` });

  if (boqSize === "أكثر من 200") pricingFactors.push({ factor: "BOQ معقد", impact: "increase", detail: "أكثر من 200 بند — تخصيص إضافي" });

  if (migrationScope === "تاريخ كامل (3 سنوات أو أكثر)") {
    pricingFactors.push({ factor: "ترحيل بيانات شامل", impact: "increase", detail: "3 سنوات+ من البيانات التاريخية" });
  }

  if (hostingPref === "On-Premise") {
    pricingFactors.push({ factor: "استضافة محلية", impact: "increase", detail: "يحتاج إعداد خادم + صيانة" });
  }

  // --- Discussion points (unanswered critical questions) ---
  SURVEY_DATA.sections.forEach((s) => {
    if (s.pricing_impact === "critical" || s.pricing_impact === "high") {
      s.questions.forEach((q) => {
        const answer = responses[q.id];
        if (answer === "غير متأكد" || answer === "غير محدد") {
          discussionPoints.push({
            question: q.label,
            answer: answer as string,
            concern: `إجابة غير محددة في قسم ${s.title} — يحتاج مناقشة`,
          });
        }
      });
    }
  });

  // --- Section summary ---
  const sectionSummary = SURVEY_DATA.sections.map((s) => {
    const answered = s.questions.filter((q) => {
      const v = responses[q.id];
      return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
    }).length;
    const highlights: string[] = [];
    s.questions.forEach((q) => {
      const v = responses[q.id];
      if (v && q.type === "radio" && typeof v === "string" && v !== "غير محدد") {
        highlights.push(`${q.label}: ${v}`);
      }
    });
    return { section: s.title, answered, total: s.questions.length, highlights: highlights.slice(0, 3) };
  });

  // --- Complexity score ---
  let complexityScore = 0;
  if (multiCompany === "نعم") complexityScore += 20;
  if (fullUsers > 50) complexityScore += 15;
  if (wave2.length > 0) complexityScore += 20;
  if (wave3.length > 0) complexityScore += 25;
  if (boqSize === "100 - 200" || boqSize === "أكثر من 200") complexityScore += 15;
  if (migrationScope === "تاريخ كامل (3 سنوات أو أكثر)") complexityScore += 10;

  const complexityLevel: SurveyAnalysis["complexityLevel"] =
    complexityScore <= 20 ? "standard" :
    complexityScore <= 45 ? "medium" :
    complexityScore <= 70 ? "advanced" : "complex";

  // --- Duration estimate ---
  const moduleCount = suggestedModules.length;
  const estimatedDuration =
    moduleCount <= 5 ? "2-3 أشهر" :
    moduleCount <= 10 ? "4-6 أشهر" :
    moduleCount <= 15 ? "6-9 أشهر" : "9-12 شهر";

  // --- Budget range ---
  const basePerModule = 800;
  const complexityMultiplier = complexityLevel === "standard" ? 1 : complexityLevel === "medium" ? 1.3 : complexityLevel === "advanced" ? 1.6 : 2;
  const baseEstimate = moduleCount * basePerModule * complexityMultiplier;
  const min = Math.round(baseEstimate * 0.8);
  const max = Math.round(baseEstimate * 1.3);

  return {
    suggestedModules,
    estimatedUsers: { full: fullUsers, portal: portalUsers },
    complexityLevel,
    complexityScore,
    pricingFactors,
    discussionPoints,
    sectionSummary,
    estimatedDuration,
    estimatedBudgetRange: { min, max, currency: "KWD" },
  };
}
