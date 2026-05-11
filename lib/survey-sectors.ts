/**
 * Sector-specific survey configuration.
 * Each sector has its own set of relevant sections and questions.
 * Common sections appear for ALL sectors; specialized sections
 * appear only for their target sector.
 */

export type SectorConfig = {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  commonSections: string[];
  specializedSections: string[];
};

export const SURVEY_SECTORS: SectorConfig[] = [
  {
    id: "construction",
    name: "المقاولات والإنشاءات",
    icon: "🏗️",
    description: "شركات مقاولات، بنية تحتية، إنشاءات — BOQ، مستخلصات، مقاولين فرعيين",
    color: "#f97316",
    commonSections: ["s1", "s2", "s3", "s4", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: ["s5"],
  },
  {
    id: "realestate",
    name: "التطوير العقاري",
    icon: "🏠",
    description: "شركات تطوير عقاري، بيع وحدات، إيجارات — عقود بيع، أقساط، IFRS 15",
    color: "#3b82f6",
    commonSections: ["s1", "s2", "s3", "s4", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: ["s6"],
  },
  {
    id: "construction_realestate",
    name: "المقاولات + العقار",
    icon: "🏢",
    description: "شركات تجمع المقاولات والتطوير العقاري معاً",
    color: "#8b5cf6",
    commonSections: ["s1", "s2", "s3", "s4", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: ["s5", "s6"],
  },
  {
    id: "trading",
    name: "التجارة والتوزيع",
    icon: "🛒",
    description: "تجارة جملة وتجزئة، توزيع — مخازن، مبيعات، مشتريات",
    color: "#10b981",
    commonSections: ["s1", "s2", "s3", "s4", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: [],
  },
  {
    id: "manufacturing",
    name: "التصنيع والإنتاج",
    icon: "🏭",
    description: "مصانع، خطوط إنتاج — BOM، مراكز عمل، جودة",
    color: "#6366f1",
    commonSections: ["s1", "s2", "s3", "s4", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: [],
  },
  {
    id: "services",
    name: "الخدمات المهنية",
    icon: "💼",
    description: "استشارات، خدمات تقنية، محاماة — مشاريع، ساعات عمل",
    color: "#0ea5e9",
    commonSections: ["s1", "s2", "s3", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: [],
  },
  {
    id: "healthcare",
    name: "الرعاية الصحية",
    icon: "🏥",
    description: "مستشفيات، عيادات، مختبرات — مرضى، مواعيد، تأمين",
    color: "#ef4444",
    commonSections: ["s1", "s2", "s3", "s7", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: [],
  },
  {
    id: "other",
    name: "قطاع آخر",
    icon: "📋",
    description: "أي قطاع غير مدرج — استبيان عام شامل",
    color: "#64748b",
    commonSections: ["s1", "s2", "s3", "s4", "s7", "s8", "s9", "s10", "s11", "s12", "s13", "s14", "s15"],
    specializedSections: [],
  },
];

export function getSectorConfig(sectorId: string): SectorConfig {
  return SURVEY_SECTORS.find((s) => s.id === sectorId) || SURVEY_SECTORS[SURVEY_SECTORS.length - 1];
}

export function getSectorSections(sectorId: string): string[] {
  const config = getSectorConfig(sectorId);
  return [...config.commonSections, ...config.specializedSections];
}
