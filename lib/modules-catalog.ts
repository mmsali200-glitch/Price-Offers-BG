/**
 * Business Gate — Odoo Modules Catalog + BG Exclusive Apps
 * Mirrors the data in BG_Quote_Skill_v3 (46 Odoo modules in 9 categories, 4 BG apps).
 * Prices are defaults in the base currency (KWD); override per quote as needed.
 */

export type OdooModule = {
  id: string;
  name: string;
  price: number;
  features: string[];
};

export type OdooCategory = {
  id: string;
  name: string;
  modules: OdooModule[];
};

export const ODOO_MODULES: OdooCategory[] = [
  {
    id: "sales",
    name: "المبيعات والعملاء",
    modules: [
      {
        id: "crm",
        name: "CRM",
        price: 700,
        features: [
          "إدارة العملاء المحتملين والفرص",
          "Pipeline مرئي للمبيعات",
          "جدولة الأنشطة والمتابعات",
          "تحليلات معدل التحويل",
          "تكامل البريد والتقويم",
        ],
      },
      {
        id: "sales",
        name: "المبيعات",
        price: 900,
        features: [
          "عروض الأسعار وأوامر البيع",
          "أسعار مخصصة وخصومات",
          "التحقق من الحد الائتماني",
          "تكامل مع المخزون والمحاسبة",
          "متابعة الطلبات والشحن",
        ],
      },
      {
        id: "pos",
        name: "نقاط البيع (POS)",
        price: 700,
        features: [
          "واجهة لمسية سريعة",
          "دعم الكاشير والطابعات",
          "دفع نقدي وبطاقة",
          "تقارير المبيعات اليومية",
          "إدارة الجلسات",
        ],
      },
      {
        id: "subscriptions",
        name: "الاشتراكات",
        price: 500,
        features: [
          "عقود الاشتراك الدورية",
          "فوترة تلقائية متكررة",
          "تتبع الإلغاء والتجديد",
          "إشعارات انتهاء الاشتراك",
        ],
      },
      {
        id: "rental",
        name: "التأجير",
        price: 600,
        features: [
          "عقود الإيجار",
          "جدولة التوافر",
          "فوترة يومي/أسبوعي/شهري",
          "تتبع حالة الأصول المؤجرة",
        ],
      },
    ],
  },
  {
    id: "inventory",
    name: "المخزون واللوجستيات",
    modules: [
      {
        id: "inventory",
        name: "المخازن",
        price: 1200,
        features: [
          "متعدد المستودعات",
          "تتبع الباتشات والصلاحية",
          "حركات المخزون الداخلية",
          "تنبيه نقطة إعادة الطلب",
          "تقييم FIFO/AVCO",
          "تكامل الباركود",
        ],
      },
      {
        id: "purchase",
        name: "المشتريات",
        price: 800,
        features: [
          "دورة شراء محكمة متعددة الاعتمادات",
          "طلبات RFQ ومقارنة الموردين",
          "استلام الفواتير وربطها",
          "تقييم أداء الموردين",
        ],
      },
      {
        id: "barcode",
        name: "الباركود",
        price: 400,
        features: [
          "مسح الباركود وQR",
          "تسريع الاستلام والشحن",
          "تحقق الكميات فوري",
          "تقليل الأخطاء 90%",
        ],
      },
      {
        id: "delivery",
        name: "مسارات التوصيل",
        price: 500,
        features: [
          "تحسين مسارات التوصيل",
          "تتبع السائقين والشاحنات",
          "تأكيد التسليم رقمياً",
          "إشعارات العملاء",
        ],
      },
      {
        id: "repair",
        name: "الإصلاح والصيانة",
        price: 550,
        features: [
          "أوامر الإصلاح والضمان",
          "تتبع الأجزاء المستخدمة",
          "فوترة ساعات العمل",
          "تاريخ كامل لكل جهاز",
        ],
      },
    ],
  },
  {
    id: "manufacturing",
    name: "التصنيع والإنتاج",
    modules: [
      {
        id: "mrp",
        name: "التصنيع (MRP)",
        price: 1100,
        features: [
          "أوامر الإنتاج مع جدول",
          "قوائم المواد BOM",
          "تخطيط الطاقة CRP",
          "تتبع الإنتاج فوري",
          "تكامل المخزون والمحاسبة",
        ],
      },
      {
        id: "plm",
        name: "دورة حياة المنتج (PLM)",
        price: 600,
        features: [
          "مراجعات BOM",
          "اعتماد التغييرات الهندسية",
          "تتبع إصدارات المنتجات",
        ],
      },
      {
        id: "maintenance",
        name: "الصيانة",
        price: 500,
        features: [
          "صيانة وقائية ودورية",
          "طلبات صيانة طارئة",
          "تتبع تكاليف الصيانة",
          "موثوقية الآلات",
        ],
      },
      {
        id: "quality",
        name: "الجودة",
        price: 550,
        features: [
          "نقاط تفتيش الجودة",
          "أوامر تحكم QC",
          "تتبع المرفوضات",
          "معدل العيوب",
        ],
      },
    ],
  },
  {
    id: "accounting",
    name: "المحاسبة والمالية",
    modules: [
      {
        id: "accounting",
        name: "المحاسبة",
        price: 1500,
        features: [
          "قيود تلقائية من كل العمليات",
          "الذمم المدينة والدائنة",
          "مطابقة البنك",
          "تقارير IFRS",
          "عملات متعددة",
          "VAT",
        ],
      },
      {
        id: "invoicing",
        name: "الفوترة",
        price: 600,
        features: [
          "فواتير إلكترونية",
          "متابعة حالة الدفع",
          "إشعارات التأخر",
          "بوابات الدفع",
        ],
      },
      {
        id: "expenses",
        name: "المصروفات",
        price: 400,
        features: [
          "تسجيل من الموبايل",
          "سير موافقة المصروفات",
          "تسوية السلف",
          "تقارير تفصيلية",
        ],
      },
      {
        id: "payroll",
        name: "الرواتب",
        price: 700,
        features: [
          "الرواتب والبدلات",
          "خصم الغياب والتأخير",
          "قسائم راتب إلكترونية",
          "تكامل الحضور",
        ],
      },
    ],
  },
  {
    id: "hr",
    name: "الموارد البشرية",
    modules: [
      {
        id: "hr",
        name: "الموظفون",
        price: 500,
        features: [
          "ملفات موظفين كاملة",
          "الهيكل التنظيمي",
          "تتبع العقود والوثائق",
          "تنبيهات التأشيرات",
        ],
      },
      {
        id: "recruitment",
        name: "التوظيف",
        price: 400,
        features: [
          "إدارة طلبات التوظيف",
          "نشر الوظائف",
          "تتبع المتقدمين",
          "المقابلات والعروض",
        ],
      },
      {
        id: "leaves",
        name: "الإجازات والغياب",
        price: 350,
        features: [
          "طلبات إجازة إلكترونية",
          "رصيد وتراكم الإجازات",
          "تقارير الغياب",
          "تكامل الرواتب",
        ],
      },
      {
        id: "appraisals",
        name: "تقييم الأداء",
        price: 400,
        features: [
          "دورات تقييم دورية",
          "أهداف OKR وKPI",
          "تقييم 360 درجة",
        ],
      },
      {
        id: "attendance",
        name: "الحضور والانصراف",
        price: 400,
        features: [
          "بصمة اليد/الوجه",
          "تقارير الدوام",
          "تكامل أجهزة البصمة",
          "احتساب العمل الإضافي",
        ],
      },
    ],
  },
  {
    id: "projects",
    name: "المشاريع والخدمات",
    modules: [
      {
        id: "project",
        name: "المشاريع",
        price: 500,
        features: [
          "Kanban وGantt",
          "تقسيم المهام",
          "تتبع التقدم",
          "ميزانية مقابل فعلي",
        ],
      },
      {
        id: "timesheets",
        name: "ساعات العمل",
        price: 350,
        features: [
          "تسجيل ساعات على مشاريع",
          "فوترة بالساعة",
          "إنتاجية الفريق",
        ],
      },
      {
        id: "fieldservice",
        name: "الخدمة الميدانية",
        price: 600,
        features: [
          "جدولة على الخريطة",
          "تعيين الفنيين",
          "تقارير الزيارة",
          "توقيع رقمي",
        ],
      },
      {
        id: "helpdesk",
        name: "الدعم الفني",
        price: 500,
        features: [
          "تذاكر متعددة القنوات",
          "SLA وأولويات",
          "قاعدة معرفة",
          "رضا العملاء",
        ],
      },
    ],
  },
  {
    id: "web",
    name: "الموقع والتجارة",
    modules: [
      {
        id: "website",
        name: "الموقع الإلكتروني",
        price: 800,
        features: [
          "بناء بدون كود",
          "صفحات هبوط",
          "مدونة SEO",
          "تحليلات الزوار",
        ],
      },
      {
        id: "ecommerce",
        name: "التجارة الإلكترونية",
        price: 1000,
        features: [
          "متجر إلكتروني كامل",
          "إدارة المنتجات",
          "بوابات دفع",
          "تكامل المخزون",
        ],
      },
      {
        id: "elearning",
        name: "التعلم الإلكتروني",
        price: 500,
        features: [
          "دورات تدريبية",
          "تتبع الطلاب",
          "شهادات إتمام",
          "اختبارات",
        ],
      },
      {
        id: "livechat",
        name: "الدردشة المباشرة",
        price: 300,
        features: [
          "دردشة على الموقع",
          "Chatbot",
          "تحويل لتذاكر",
          "تكامل WhatsApp",
        ],
      },
    ],
  },
  {
    id: "realestate",
    name: "العقارات والأصول",
    modules: [
      {
        id: "realestate",
        name: "العقارات",
        price: 900,
        features: [
          "إدارة الوحدات",
          "عقود الإيجار وتجديدها",
          "التحصيل والمتأخرات",
          "الإشغال والعائد",
        ],
      },
      {
        id: "eam",
        name: "إدارة الأصول (EAM)",
        price: 650,
        features: [
          "سجل كل أصل",
          "صيانة دورية ووقائية",
          "قيمة وإهلاك الأصل",
          "موثوقية الأصول",
        ],
      },
    ],
  },
  {
    id: "healthcare",
    name: "الرعاية الصحية",
    modules: [
      {
        id: "hms",
        name: "إدارة المستشفيات (HMS)",
        price: 2000,
        features: [
          "ملفات مرضى EMR",
          "جدولة المواعيد",
          "أقسام وعيادات",
          "تأمين صحي وفوترة",
          "وصفات إلكترونية",
          "مخزون صيدلاني",
        ],
      },
      {
        id: "lab",
        name: "المختبرات الطبية",
        price: 800,
        features: [
          "طلبات فحوصات",
          "إدخال النتائج",
          "ربط الأجهزة",
          "إشعار النتائج",
        ],
      },
    ],
  },
  {
    id: "fleet_ops",
    name: "إدارة الأسطول والنقل",
    modules: [
      {
        id: "fleet",
        name: "إدارة الأسطول",
        price: 700,
        features: [
          "سجل المركبات والسائقين",
          "تتبع الوقود وقراءات العداد",
          "جدولة الصيانة الوقائية والإصلاحات",
          "إدارة عقود التأمين والترخيص",
          "تحليل تكلفة المركبة الواحدة",
          "تنبيهات انتهاء التأمين والصيانة",
        ],
      },
    ],
  },
  {
    id: "contracting",
    name: "المقاولات والإنشاءات",
    modules: [
      {
        id: "contracting",
        name: "إدارة المقاولات",
        price: 2200,
        features: [
          "جداول الكميات (BOQ) لكل مشروع",
          "إدارة المقاولين الفرعيين والعقود",
          "الفواتير المرحلية (Progress Billing)",
          "مبالغ الاحتجاز (Retention)",
          "أوامر التغيير (Variation Orders)",
          "تتبع التقدم بالنسب المئوية",
          "تقارير ربحية لكل مشروع",
          "تكامل مع المخازن والمشتريات",
        ],
      },
    ],
  },
  {
    id: "multicompany",
    name: "الشركات المتعددة",
    modules: [
      {
        id: "multicompany",
        name: "الشركات المتعددة",
        price: 1500,
        features: [
          "إدارة عدة كيانات قانونية في قاعدة واحدة",
          "شجرة حسابات مستقلة لكل شركة",
          "عمليات بين الشركات تلقائية (Inter-Company)",
          "عملات متعددة لكل شركة",
          "تقارير مالية مدمجة وفردية",
          "صلاحيات وصول منفصلة لكل شركة",
        ],
      },
    ],
  },
];

/** Business Gate exclusive apps (developed in-house to complement Odoo). */
export type BGApp = {
  id: string;
  name: string;
  description: string;
  implementationPrice: number;
  monthlyPrice: number;
  features: string[];
};

export const BG_APPS: BGApp[] = [
  {
    id: "onesales",
    name: "One Sales — المبيعات الميداني",
    description:
      "تطبيق حصري يتكامل مع Odoo لإدارة فرق المبيعات الميدانية.",
    implementationPrice: 1200,
    monthlyPrice: 0,
    features: [
      "زيارات ميدانية للمناديب",
      "خريطة GPS فوري",
      "Offline Mode مع مزامنة تلقائية",
      "تسجيل الطلبات والتحصيل من الجوال",
      "تقارير أداء المندوبين",
      "مقارنة الأهداف بالفعلي",
    ],
  },
  {
    id: "onetime",
    name: "One Time — إدارة الوقت",
    description:
      "تطبيق حصري لتتبع وقت العمل على المشاريع وتوليد فواتير تلقائية.",
    implementationPrice: 800,
    monthlyPrice: 0,
    features: [
      "تسجيل ساعات على المشاريع",
      "مؤقتات تشغيل مباشر",
      "فوترة تلقائية بالساعات",
      "تقارير إنتاجية مفصلة",
      "تحليل ربحية المشاريع",
    ],
  },
  {
    id: "bgdash",
    name: "BG Analytics Dashboard",
    description:
      "لوحة تحليلات مخصصة من BG مع مؤشرات أداء حسب قطاع العميل.",
    implementationPrice: 500,
    monthlyPrice: 0,
    features: [
      "لوحة KPI تنفيذية مخصصة",
      "تقارير مقارنة فورية",
      "تنبيهات ذكية عند الانحرافات",
      "تصدير PDF وExcel",
    ],
  },
  {
    id: "bgwhatsapp",
    name: "BG WhatsApp Integration",
    description:
      "تكامل حصري يربط Odoo مع WhatsApp Business API.",
    implementationPrice: 400,
    monthlyPrice: 0,
    features: [
      "إرسال فواتير/عروض عبر WhatsApp",
      "إشعارات حالة الطلبات",
      "استقبال طلبات من WhatsApp",
      "ربط المحادثات بسجل العميل",
    ],
  },
];

/** Support packages with monthly prices (editable per quote). */
export type SupportPackage = {
  id: string;
  name: string;
  price: number;
  hoursNote: string;
  features: string[];
};

export const SUPPORT_PACKAGES: SupportPackage[] = [
  {
    id: "none",
    name: "بدون عقد",
    price: 0,
    hoursNote: "25/ساعة عند الحاجة",
    features: [
      "دفع بالساعة حسب الحاجة",
      "25 وحدة/ساعة",
      "بدون أولوية",
      "بدون تدريب دوري",
    ],
  },
  {
    id: "basic",
    name: "أساسية",
    price: 250,
    hoursNote: "10 ساعات/شهر",
    features: [
      "10 ساعات دعم/شهر",
      "استجابة خلال 24 ساعة",
      "تحديثات أساسية",
      "تقرير شهري مبسط",
    ],
  },
  {
    id: "advanced",
    name: "متقدمة ⭐",
    price: 350,
    hoursNote: "15 ساعة/شهر",
    features: [
      "15 ساعة دعم/شهر",
      "استجابة خلال 8 ساعات",
      "تحديثات وتطوير مستمر",
      "تقرير شهري تفصيلي",
      "جلسة تدريب شهرية",
      "أولوية في الاستجابة",
    ],
  },
  {
    id: "premium",
    name: "مميزة",
    price: 450,
    hoursNote: "20 ساعة/شهر",
    features: [
      "20 ساعة دعم/شهر",
      "استجابة خلال 4 ساعات",
      "مدير مشروع مخصص",
      "تقارير أسبوعية",
      "جلستا تدريب/شهر",
      "خط واتساب مباشر",
      "مراجعة ربع سنوية",
    ],
  },
];

/** Odoo license pricing in USD (indicative — confirm with Odoo official quote). */
export const LICENSE_PRICING = {
  Community: {
    cloud: { base: 0, perUser: 0 },
    vps: { base: 40, perUser: 0 },
    dedicated: { base: 100, perUser: 0 },
    onprem: { base: 0, perUser: 0 },
  },
  "Odoo.sh": {
    cloud: { base: 150, perUser: 15 },
    vps: { base: 120, perUser: 12 },
    dedicated: { base: 250, perUser: 15 },
    onprem: { base: 0, perUser: 15 },
  },
  "Enterprise On-Premise": {
    cloud: { base: 200, perUser: 25 },
    vps: { base: 150, perUser: 25 },
    dedicated: { base: 300, perUser: 25 },
    onprem: { base: 0, perUser: 25 },
  },
} as const;

/** Version metadata — each with a sub-label and description. */
export const ODOO_VERSIONS = {
  "16": {
    label: "Odoo 16",
    sub: "LTS مستقر",
    description:
      "إصدار طويل الأمد (LTS) مستقر ومُختبَر، مناسب للجهات الحكومية والمشاريع المحافظة التي تُعلي الاستقرار على الميزات الجديدة.",
  },
  "17": {
    label: "Odoo 17",
    sub: "أداء محسّن",
    description:
      "تحسينات كبيرة في الأداء والواجهة، نموذج محاسبة محسّن، وتكامل أقوى مع الخدمات الخارجية. خيار ممتاز للمشاريع الجديدة.",
  },
  "18": {
    label: "Odoo 18",
    sub: "AI + محسّن",
    description:
      "يتضمن ميزات ذكاء اصطناعي مدمجة، تحسينات جوهرية في الواجهة وأداء المحرك. الاختيار الأمثل للمشاريع الراغبة في ميزات AI الحديثة.",
  },
  "19": {
    label: "Odoo 19",
    sub: "الأحدث",
    description:
      "أحدث إصدار يتضمن AI متقدم، محرك قواعد بيانات محسّن، وواجهة جيل جديد. للمشاريع الجريئة الراغبة في أحدث تكنولوجيا Odoo.",
  },
} as const;

export type OdooVersion = keyof typeof ODOO_VERSIONS;
