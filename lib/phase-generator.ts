/**
 * Smart phase generator — creates implementation phases based on
 * selected modules and project duration.
 */

import type { ProjectPhase } from "./builder/types";

type PhaseTemplate = {
  name: string;
  pct: number; // percentage of total duration
  deliverables: string;
};

const BASE_PHASES: PhaseTemplate[] = [
  { name: "التحليل والتصميم", pct: 20, deliverables: "وثيقة المتطلبات، خريطة العمليات، إعداد البيئة" },
  { name: "التطوير والتهيئة", pct: 40, deliverables: "" }, // deliverables filled dynamically
  { name: "الاختبار والتدريب", pct: 25, deliverables: "اختبار القبول (UAT)، تدريب الفريق، دليل المستخدم" },
  { name: "الإطلاق والمتابعة", pct: 15, deliverables: "Go-Live رسمي، دعم مكثف، مراجعة الأداء" },
];

const DURATION_MAP: Record<string, number> = {
  "30 يوم": 30, "45 يوم": 45, "60 يوم": 60, "90 يوم": 90,
  "120 يوم": 120, "6 أشهر": 180, "9 أشهر": 270, "12 شهراً": 365,
};

function daysToLabel(days: number): string {
  if (days <= 7) return "أسبوع";
  if (days <= 14) return "أسبوعان";
  if (days <= 21) return "3 أسابيع";
  if (days <= 35) return `${Math.round(days / 7)} أسابيع`;
  if (days <= 60) return `${Math.round(days / 30)} شهر`;
  return `${Math.round(days / 30)} أشهر`;
}

/**
 * Suggest a project duration based on module count.
 */
export function suggestDuration(moduleCount: number): string {
  if (moduleCount <= 2) return "30 يوم";
  if (moduleCount <= 4) return "45 يوم";
  if (moduleCount <= 6) return "60 يوم";
  if (moduleCount <= 8) return "90 يوم";
  if (moduleCount <= 12) return "120 يوم";
  if (moduleCount <= 16) return "6 أشهر";
  return "9 أشهر";
}

/**
 * Generate implementation phases based on duration and selected modules.
 */
export function generatePhases(
  durationLabel: string,
  moduleNames: string[],
  bgAppNames: string[],
): ProjectPhase[] {
  const totalDays = DURATION_MAP[durationLabel] || 60;
  const allNames = [...moduleNames, ...bgAppNames];
  const n = allNames.length;

  // For large projects (>8 modules), split development into 2 phases
  const splitDev = n > 8;

  if (splitDev) {
    const half = Math.ceil(n / 2);
    const firstBatch = allNames.slice(0, half);
    const secondBatch = allNames.slice(half);

    const phases: PhaseTemplate[] = [
      { name: "التحليل والتصميم", pct: 15, deliverables: "وثيقة المتطلبات، تصميم العمليات، إعداد البيئة" },
      { name: "التطوير — الدفعة الأولى", pct: 25, deliverables: firstBatch.join("، ") },
      { name: "التطوير — الدفعة الثانية", pct: 25, deliverables: secondBatch.join("، ") },
      { name: "التكامل والاختبار", pct: 15, deliverables: "تكامل الموديولات، اختبار شامل (UAT)، إصلاح الأخطاء" },
      { name: "التدريب والإطلاق", pct: 10, deliverables: "تدريب الفريق، دليل المستخدم، Go-Live" },
      { name: "المتابعة والدعم", pct: 10, deliverables: "دعم مكثف بعد الإطلاق، مراجعة الأداء، تحسينات" },
    ];

    return phases.map((p, i) => ({
      id: i + 1,
      name: p.name,
      duration: daysToLabel(Math.round(totalDays * p.pct / 100)),
      deliverables: p.deliverables,
    }));
  }

  // Standard 4 phases
  const devDeliverables = allNames.length > 0
    ? allNames.join("، ")
    : "تهيئة الموديولات، تحميل البيانات الأساسية";

  return BASE_PHASES.map((p, i) => ({
    id: i + 1,
    name: p.name,
    duration: daysToLabel(Math.round(totalDays * p.pct / 100)),
    deliverables: i === 1 ? devDeliverables : p.deliverables,
  }));
}
