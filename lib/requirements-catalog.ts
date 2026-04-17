/**
 * Work requirements catalog — maps each module to the data and
 * prerequisites the CLIENT must provide for successful implementation.
 *
 * Used by SectionRequirements to auto-generate a checklist based on
 * the selected modules. Each requirement has:
 *   - text: what the client needs to provide
 *   - responsible: who provides it (client / BG / shared)
 */

export type Requirement = {
  text: string;
  responsible: "client" | "bg" | "shared";
};

export type ModuleRequirements = {
  moduleId: string;
  moduleName: string;
  icon: string;
  requirements: Requirement[];
};

const MODULE_REQS: Record<string, { icon: string; name: string; reqs: Requirement[] }> = {
  // ── Sales & CRM ───────────────────────────────────────
  crm: {
    icon: "🤝", name: "CRM",
    reqs: [
      { text: "قائمة العملاء المحتملين الحاليين (Excel/CSV)", responsible: "client" },
      { text: "هيكل فريق المبيعات وصلاحياتهم", responsible: "client" },
      { text: "مصادر العملاء المحتملين (موقع، معارض، إحالات)", responsible: "client" },
      { text: "أهداف المبيعات الشهرية/الربع سنوية", responsible: "client" },
      { text: "إعداد Pipeline ومراحل البيع", responsible: "bg" },
    ],
  },
  sales: {
    icon: "💼", name: "المبيعات",
    reqs: [
      { text: "قائمة العملاء مع بياناتهم الكاملة", responsible: "client" },
      { text: "هيكل التسعير وقوائم الأسعار المعتمدة", responsible: "client" },
      { text: "حدود الائتمان لكل عميل", responsible: "client" },
      { text: "شروط الدفع المعتمدة (آجل، نقدي، أقساط)", responsible: "client" },
      { text: "مسار اعتماد عروض الأسعار وأوامر البيع", responsible: "client" },
      { text: "قوالب عروض الأسعار والفواتير", responsible: "shared" },
    ],
  },
  pos: {
    icon: "🛍️", name: "نقاط البيع",
    reqs: [
      { text: "قائمة المنتجات وأسعار البيع بالتجزئة", responsible: "client" },
      { text: "بيانات أجهزة نقاط البيع (عدد، مواقع)", responsible: "client" },
      { text: "سياسة الخصومات والعروض", responsible: "client" },
      { text: "طرق الدفع المقبولة (نقد، بطاقة، K-Net)", responsible: "client" },
      { text: "تهيئة POS وربط الطابعات", responsible: "bg" },
    ],
  },

  // ── Inventory & Logistics ─────────────────────────────
  inventory: {
    icon: "📦", name: "المخازن",
    reqs: [
      { text: "قائمة المنتجات بالوحدات والتصنيفات", responsible: "client" },
      { text: "هيكل المستودعات والمواقع", responsible: "client" },
      { text: "أرصدة المخزون الافتتاحية", responsible: "client" },
      { text: "سياسة التقييم (FIFO / AVCO / Standard)", responsible: "shared" },
      { text: "حد إعادة الطلب الأدنى لكل منتج", responsible: "client" },
      { text: "إعداد الباتشات وتتبع الصلاحية (إن وجد)", responsible: "shared" },
    ],
  },
  purchase: {
    icon: "🛒", name: "المشتريات",
    reqs: [
      { text: "قائمة الموردين وبياناتهم الكاملة", responsible: "client" },
      { text: "شروط الشراء والدفع لكل مورد", responsible: "client" },
      { text: "سلم صلاحيات الشراء (من يعتمد ماذا)", responsible: "client" },
      { text: "الفئات والمجموعات الشرائية", responsible: "client" },
      { text: "إعداد مسارات الاعتماد", responsible: "bg" },
    ],
  },
  barcode: {
    icon: "🔖", name: "الباركود",
    reqs: [
      { text: "ماسحات الباركود (نوع وعدد)", responsible: "client" },
      { text: "نظام ترميز المنتجات الحالي", responsible: "client" },
      { text: "ربط الماسحات وتهيئتها", responsible: "bg" },
    ],
  },

  // ── Manufacturing ─────────────────────────────────────
  mrp: {
    icon: "🏭", name: "التصنيع",
    reqs: [
      { text: "قوائم المواد BOM لكل منتج نهائي", responsible: "client" },
      { text: "خطوات الإنتاج وأوقاتها المعيارية", responsible: "client" },
      { text: "مراكز العمل وطاقاتها الإنتاجية", responsible: "client" },
      { text: "أرصدة المواد الخام الافتتاحية", responsible: "client" },
      { text: "إعداد مسارات الإنتاج في النظام", responsible: "bg" },
    ],
  },
  quality: {
    icon: "✅", name: "الجودة",
    reqs: [
      { text: "معايير الجودة ونقاط التفتيش لكل منتج", responsible: "client" },
      { text: "نماذج فحص الجودة المعتمدة", responsible: "client" },
      { text: "إعداد نقاط التفتيش التلقائية", responsible: "bg" },
    ],
  },

  // ── Accounting & Finance ──────────────────────────────
  accounting: {
    icon: "📊", name: "المحاسبة",
    reqs: [
      { text: "شجرة الحسابات المعتمدة", responsible: "client" },
      { text: "أرصدة افتتاحية لجميع الحسابات", responsible: "client" },
      { text: "بيانات الحسابات البنكية", responsible: "client" },
      { text: "سياسة الضريبة VAT والنسب المطبقة", responsible: "client" },
      { text: "سياسة الإهلاك للأصول الثابتة", responsible: "client" },
      { text: "إعداد الدليل المحاسبي والقيود التلقائية", responsible: "bg" },
    ],
  },
  invoicing: {
    icon: "🧾", name: "الفوترة",
    reqs: [
      { text: "قوالب الفواتير المعتمدة (شكل وبيانات)", responsible: "shared" },
      { text: "بيانات الضريبة على الفاتورة", responsible: "client" },
      { text: "بوابات الدفع الإلكتروني (إن وجدت)", responsible: "client" },
    ],
  },
  payroll: {
    icon: "💰", name: "الرواتب",
    reqs: [
      { text: "هيكل الرواتب والبدلات لكل فئة", responsible: "client" },
      { text: "جدول الحضور والانصراف المعتمد", responsible: "client" },
      { text: "قانون العمل المطبق (كويتي/سعودي/...)", responsible: "client" },
      { text: "جدول ضريبة الدخل (إن وجد)", responsible: "client" },
      { text: "إعداد هيكل الراتب في النظام", responsible: "bg" },
    ],
  },
  expenses: {
    icon: "💳", name: "المصروفات",
    reqs: [
      { text: "سياسة صرف العهد والسلف", responsible: "client" },
      { text: "مسار اعتماد المصروفات", responsible: "client" },
      { text: "فئات المصروفات المعتمدة", responsible: "client" },
    ],
  },

  // ── HR ─────────────────────────────────────────────────
  hr: {
    icon: "👤", name: "الموظفون",
    reqs: [
      { text: "بيانات الموظفين الكاملة (Excel/CSV)", responsible: "client" },
      { text: "الهيكل التنظيمي للشركة", responsible: "client" },
      { text: "أنواع العقود (محدد، غير محدد، تجربة)", responsible: "client" },
      { text: "وثائق الموظفين (إقامات، تأشيرات، جوازات)", responsible: "client" },
    ],
  },
  attendance: {
    icon: "⏰", name: "الحضور والانصراف",
    reqs: [
      { text: "أجهزة البصمة (نوع، عدد، مواقع)", responsible: "client" },
      { text: "سياسة الدوام (ساعات، ورديات، عمل إضافي)", responsible: "client" },
      { text: "ربط أجهزة البصمة بالنظام", responsible: "bg" },
    ],
  },
  leaves: {
    icon: "🌴", name: "الإجازات",
    reqs: [
      { text: "أنواع الإجازات وأرصدتها (سنوية، مرضية، ...)", responsible: "client" },
      { text: "سياسة الترحيل والتراكم", responsible: "client" },
    ],
  },
  recruitment: {
    icon: "🎯", name: "التوظيف",
    reqs: [
      { text: "قوالب الوصف الوظيفي", responsible: "client" },
      { text: "مراحل عملية التوظيف المعتمدة", responsible: "client" },
    ],
  },

  // ── Projects ──────────────────────────────────────────
  project: {
    icon: "📋", name: "المشاريع",
    reqs: [
      { text: "قائمة المشاريع الحالية وحالتها", responsible: "client" },
      { text: "فريق العمل وأدوارهم في كل مشروع", responsible: "client" },
      { text: "معايير فوترة المشاريع (ثابت/بالساعة)", responsible: "client" },
    ],
  },
  helpdesk: {
    icon: "🎧", name: "الدعم الفني",
    reqs: [
      { text: "فئات وأنواع تذاكر الدعم", responsible: "client" },
      { text: "مستويات الأولوية وSLA المطلوب", responsible: "client" },
      { text: "فريق الدعم وتوزيع التذاكر", responsible: "client" },
    ],
  },

  // ── Website & eCommerce ───────────────────────────────
  website: {
    icon: "🌐", name: "الموقع الإلكتروني",
    reqs: [
      { text: "محتوى الصفحات والنصوص", responsible: "client" },
      { text: "صور المنتجات والهوية البصرية", responsible: "client" },
      { text: "اسم النطاق (Domain) وشهادة SSL", responsible: "client" },
      { text: "تصميم وبناء الصفحات", responsible: "bg" },
    ],
  },
  ecommerce: {
    icon: "🛒", name: "التجارة الإلكترونية",
    reqs: [
      { text: "قائمة المنتجات بالصور والأوصاف", responsible: "client" },
      { text: "بوابة دفع إلكتروني معتمدة", responsible: "client" },
      { text: "سياسة الشحن والتوصيل", responsible: "client" },
      { text: "إعداد المتجر وربط بوابة الدفع", responsible: "bg" },
    ],
  },

  // ── Real Estate ───────────────────────────────────────
  realestate: {
    icon: "🏢", name: "العقارات",
    reqs: [
      { text: "قائمة العقارات والوحدات بالتفصيل", responsible: "client" },
      { text: "بيانات المستأجرين الحاليين", responsible: "client" },
      { text: "عقود الإيجار القائمة", responsible: "client" },
      { text: "جدول التحصيل والمتأخرات", responsible: "client" },
    ],
  },

  // ── Healthcare ────────────────────────────────────────
  hms: {
    icon: "🏥", name: "إدارة المستشفيات",
    reqs: [
      { text: "قائمة الأقسام والتخصصات", responsible: "client" },
      { text: "بيانات الأطباء والتخصصات", responsible: "client" },
      { text: "جداول أسعار الخدمات الطبية", responsible: "client" },
      { text: "شركات التأمين المعتمدة وعقودها", responsible: "client" },
      { text: "نموذج السجل الطبي المعتمد", responsible: "shared" },
      { text: "قائمة الأدوية والمستلزمات", responsible: "client" },
    ],
  },
  lab: {
    icon: "🔬", name: "المختبرات",
    reqs: [
      { text: "قائمة الفحوصات والتحاليل المتاحة", responsible: "client" },
      { text: "أجهزة المختبر وبروتوكولات الربط", responsible: "client" },
      { text: "نماذج نتائج الفحوصات", responsible: "shared" },
    ],
  },
};

/** Fixed requirements that apply to ALL projects. */
export const COMMON_REQUIREMENTS: Array<{ category: string; icon: string; reqs: Requirement[] }> = [
  {
    category: "البنية التحتية",
    icon: "🖥️",
    reqs: [
      { text: "خادم سحابي أو محلي جاهز للتشغيل", responsible: "client" },
      { text: "اتصال إنترنت مستقر وسريع", responsible: "client" },
      { text: "أجهزة المستخدمين بمتصفحات حديثة (Chrome/Edge/Safari)", responsible: "client" },
      { text: "إعداد بيئة الخادم وتثبيت Odoo", responsible: "bg" },
    ],
  },
  {
    category: "ترحيل البيانات",
    icon: "📁",
    reqs: [
      { text: "تصدير البيانات من النظام القديم (Excel/CSV)", responsible: "client" },
      { text: "مراجعة وتنظيف البيانات قبل الاستيراد", responsible: "shared" },
      { text: "الموافقة على نموذج البيانات الافتتاحية", responsible: "client" },
      { text: "استيراد البيانات وتحققها في النظام الجديد", responsible: "bg" },
    ],
  },
  {
    category: "التدريب والإطلاق",
    icon: "🎓",
    reqs: [
      { text: "تحديد مستخدمي النظام وصلاحياتهم", responsible: "client" },
      { text: "توفير قاعة/بيئة للتدريب", responsible: "client" },
      { text: "إعداد دليل المستخدم وجلسات التدريب", responsible: "bg" },
      { text: "اختبار القبول النهائي (UAT)", responsible: "shared" },
    ],
  },
];

/**
 * Generate the full requirements list based on selected module IDs.
 */
export function generateRequirements(selectedModuleIds: string[]): {
  modules: ModuleRequirements[];
  common: typeof COMMON_REQUIREMENTS;
} {
  const modules: ModuleRequirements[] = [];

  selectedModuleIds.forEach((id) => {
    const data = MODULE_REQS[id];
    if (data) {
      modules.push({
        moduleId: id,
        moduleName: data.name,
        icon: data.icon,
        requirements: data.reqs,
      });
    }
  });

  return { modules, common: COMMON_REQUIREMENTS };
}
