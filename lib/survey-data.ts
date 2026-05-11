/**
 * Client Discovery Questionnaire — 15 sections, 122 questions.
 * Based on BG's ERP implementation methodology.
 * Each question has a pricing_weight that determines how much
 * the answer affects the final quote estimation.
 */

export type QuestionType = "text" | "textarea" | "number" | "radio" | "checkbox" | "user-table" | "approval-table" | "migration-table";

export type SurveyQuestion = {
  id: string;
  type: QuestionType;
  label: string;
  help?: string;
  options?: string[];
  rows?: string[];
  required?: boolean;
  pricing_weight?: number;
};

export type SurveySection = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  pricing_impact: "low" | "medium" | "high" | "critical";
  questions: SurveyQuestion[];
};

export type SurveyData = {
  meta: { title: string; subtitle: string; description: string };
  client_info_fields: Array<{ id: string; label: string; type: string; required: boolean; placeholder?: string }>;
  sections: SurveySection[];
};

const IMPACT_LABELS: Record<string, { label: string; color: string; icon: string }> = {
  low: { label: "منخفض", color: "#7a8e80", icon: "⚪" },
  medium: { label: "متوسط", color: "#f59e0b", icon: "🟡" },
  high: { label: "مرتفع", color: "#f97316", icon: "🟠" },
  critical: { label: "حرج", color: "#ef4444", icon: "🔴" },
};

export { IMPACT_LABELS };

export const SURVEY_DATA: SurveyData = {
  meta: {
    title: "استبيان اكتشاف متطلبات نظام Odoo",
    subtitle: "Discovery Questionnaire — Odoo ERP Implementation",
    description: "استبيان منظَّم وفق دورات العمل الجوهرية في شركتكم لتحديد نطاق العمل وإعداد عرض السعر بدقة.",
  },
  client_info_fields: [
    { id: "company_name", label: "اسم الشركة / الجهة", type: "text", required: true, placeholder: "مثال: شركة النور للتجارة" },
    { id: "industry", label: "النشاط / القطاع", type: "text", required: true, placeholder: "مثال: تجارة، مقاولات، خدمات..." },
    { id: "contact_name", label: "اسم الشخص المسؤول", type: "text", required: true },
    { id: "contact_position", label: "المسمى الوظيفي", type: "text", required: false },
    { id: "contact_email", label: "البريد الإلكتروني", type: "email", required: true },
    { id: "contact_phone", label: "رقم الجوال", type: "text", required: false },
  ],
  sections: [
    {
      id: "s1", icon: "🏢", title: "الهيكل التنظيمي والمستخدمون", subtitle: "Organizational Structure & Users",
      description: "يحدد عدد رخص المستخدمين والكيانات القانونية — من أكبر العوامل في تحديد التكلفة السنوية.",
      pricing_impact: "high",
      questions: [
        { id: "q1_1", type: "textarea", label: "هل لشركتكم كيان قانوني واحد أم عدة شركات/كيانات شقيقة؟ يرجى ذكر عددها وأسمائها.", pricing_weight: 0.15 },
        { id: "q1_2", type: "radio", label: "هل تحتاجون تفعيل Multi-Company في Odoo؟", options: ["نعم", "لا", "غير متأكد"], pricing_weight: 0.2 },
        { id: "q1_3", type: "textarea", label: "هل لديكم فروع جغرافية متعددة؟ يرجى ذكر المواقع." },
        { id: "q1_4", type: "textarea", label: "هل توجد شركات تابعة تحتاج تقارير موحدة (Consolidated Reports)؟", pricing_weight: 0.1 },
        { id: "q1_5", type: "user-table", label: "توزيع المستخدمين على الأدوار التشغيلية", help: "المستخدم الذي يدخل النظام ولو مرة شهرياً يُعتبر مرخصاً في Odoo Enterprise.", pricing_weight: 0.25,
          rows: ["الإدارة العليا","المدير المالي","محاسبو الذمم الدائنة","محاسبو الذمم المدينة","المشتريات","مدراء المشاريع","مهندسو الموقع","مشرفو المواقع","مساحو الكميات","أمناء المخازن","المبيعات","خدمة العملاء","الشؤون القانونية","الموارد البشرية","تقنية المعلومات","المدقق الداخلي","مستخدمون آخرون"] },
        { id: "q1_6", type: "number", label: "إجمالي عدد المستخدمين الكامل (Full Users)", pricing_weight: 0.3 },
        { id: "q1_7", type: "number", label: "عدد المستخدمين المحدودين (Portal Users — مقاولون/موردون/عملاء)", pricing_weight: 0.1 },
        { id: "q1_8", type: "checkbox", label: "اللغة المعتمدة لواجهة النظام", options: ["عربية", "إنجليزية", "كلاهما (مزدوج)"] },
        { id: "q1_9", type: "textarea", label: "هل يحتاج المستخدمون الميدانيون للنظام عبر الموبايل؟ كم عددهم؟" },
        { id: "q1_10", type: "textarea", label: "هل توجد فئة تحتاج الوصول من خارج البلاد؟" },
      ],
    },
    {
      id: "s2", icon: "📊", title: "الحجم التشغيلي ونطاق الأعمال", subtitle: "Operational Volume & Business Scope",
      description: "حجم البيانات والمعاملات يُحدد متطلبات الأداء والوقت اللازم للتدريب والترحيل.",
      pricing_impact: "medium",
      questions: [
        { id: "q2_1", type: "textarea", label: "كم عدد المشاريع النشطة حالياً؟ والمتوقع خلال 3-5 سنوات؟" },
        { id: "q2_2", type: "textarea", label: "ما متوسط عدد الوحدات في كل مشروع؟" },
        { id: "q2_3", type: "textarea", label: "ما متوسط القيمة الإجمالية لمشروع متوسط الحجم؟" },
        { id: "q2_4", type: "number", label: "عدد الموردين النشطين (آخر 12 شهراً)" },
        { id: "q2_5", type: "textarea", label: "كم عدد المقاولين النشطين؟ وعدد المستخلصات الشهرية؟" },
        { id: "q2_6", type: "textarea", label: "كم عدد العملاء الحاليين؟ والمتوقع سنوياً؟" },
        { id: "q2_7", type: "number", label: "متوسط عدد طلبات الشراء (PRs) الشهرية" },
        { id: "q2_8", type: "number", label: "متوسط عدد فواتير الموردين الشهرية" },
        { id: "q2_9", type: "number", label: "متوسط عدد عقود البيع الشهرية في فترة الذروة" },
        { id: "q2_10", type: "number", label: "متوسط عدد القيود اليومية تقريباً" },
      ],
    },
    {
      id: "s3", icon: "📦", title: "التطبيقات والوحدات المطلوبة", subtitle: "Modules in Scope",
      description: "تأكيد الوحدات المطلوبة في كل موجة من موجات التنفيذ.",
      pricing_impact: "high",
      questions: [
        { id: "q3_wave1", type: "checkbox", label: "الموجة الأولى — الأساس", pricing_weight: 0.3, options: ["Accounting + Localization + ZATCA","Analytic Accounting","Budget Management","Purchase (PR/RFQ/PO)","Inventory + GRN","Project Management + Timesheets","Approvals + Sign + Documents","Expenses","Studio","Spreadsheet + Dashboards"] },
        { id: "q3_wave2", type: "checkbox", label: "الموجة الثانية — المقاولون", pricing_weight: 0.25, options: ["وحدة المقاولين والمستخلصات","تقارير المقاولين","ربط البنوك"] },
        { id: "q3_wave3", type: "checkbox", label: "الموجة الثالثة — العقار", pricing_weight: 0.25, options: ["وحدة العقار","عقد البيع وجدول الأقساط","IFRS 15","ربط منصة الإفراغ","CRM للمبيعات","بوابة العملاء"] },
        { id: "q3_other", type: "textarea", label: "هل تحتاجون وحدات إضافية (HR, Payroll, Maintenance, Manufacturing, Helpdesk)؟" },
      ],
    },
    {
      id: "s4", icon: "🛒", title: "دورة المشتريات والمواد", subtitle: "Procurement Cycle",
      description: "العمود الفقري لتتبع تكاليف المشاريع — دقة التكوين تنعكس على كل التقارير.",
      pricing_impact: "medium",
      questions: [
        { id: "q4_1", type: "textarea", label: "هل تستخدمون نموذج طلب الشراء (PR) رسمياً أم يبدأ من PO مباشرة؟" },
        { id: "q4_2", type: "textarea", label: "ما حدود الصلاحيات المالية للاعتماد على أوامر الشراء؟", pricing_weight: 0.08 },
        { id: "q4_3", type: "textarea", label: "هل تطبقون قاعدة 3 عروض موردين قبل اعتماد PO؟" },
        { id: "q4_4", type: "textarea", label: "هل لديكم قاعدة موردين معتمدة (Approved Vendor List)؟" },
        { id: "q4_5", type: "radio", label: "طريقة تسعير المخزون", options: ["FIFO","Weighted Average","Standard Cost","غير محدد"] },
        { id: "q4_6", type: "radio", label: "هل ترغبون بإلزام Three-way Matching؟", options: ["إلزامي صارم","تحذيري فقط","غير محدد"], pricing_weight: 0.08 },
        { id: "q4_7", type: "radio", label: "هل تحتاجون عقود إطارية (Blanket POs)؟", options: ["نعم","لا","غير محدد"] },
        { id: "q4_8", type: "number", label: "كم عدد المستودعات/المواقع التي تحتاج إدارة مخزون مستقلة؟", pricing_weight: 0.05 },
        { id: "q4_9", type: "radio", label: "هل توجد مشتريات بعملات أجنبية؟", options: ["نعم","لا"] },
      ],
    },
    {
      id: "s5", icon: "🏗️", title: "دورة المقاولين والمستخلصات", subtitle: "Contractors & Progress Bills",
      description: "أعقد دورة في النظام — الإجابات تُحدد جهد بناء وحدة المستخلصات المخصصة.",
      pricing_impact: "critical",
      questions: [
        { id: "q5_1", type: "textarea", label: "ما نموذج الدفعة المقدمة (Down Payment)؟ النسبة الاعتيادية وكيفية الاسترداد؟", pricing_weight: 0.1 },
        { id: "q5_2", type: "textarea", label: "ما نسبة الضمان (Retention) المعتادة؟ وفترة الإفراج عنها؟", pricing_weight: 0.1 },
        { id: "q5_3", type: "radio", label: "VAT 15% تُحتسب على الصافي أم الإجمالي؟", options: ["على الصافي بعد الخصومات","على الإجمالي","غير محدد"] },
        { id: "q5_4", type: "radio", label: "متوسط عدد بنود BOQ في العقد الواحد؟", options: ["أقل من 50","50-100","100-200","أكثر من 200"], pricing_weight: 0.15 },
        { id: "q5_5", type: "textarea", label: "من يعتمد المستخلصات تقنياً؟ وكم مستوى اعتماد؟", pricing_weight: 0.08 },
        { id: "q5_6", type: "radio", label: "هل تحتاجون ربط بنود BOQ بأكواد التكلفة؟", options: ["نعم","لا","غير محدد"], pricing_weight: 0.08 },
        { id: "q5_7", type: "radio", label: "هل توجد عقود مقاولين بعملات أجنبية؟", options: ["نعم","لا"] },
        { id: "q5_8", type: "textarea", label: "هل تتعاملون مع مقاولين من الباطن (Sub-contractors)؟", pricing_weight: 0.08 },
        { id: "q5_9", type: "textarea", label: "هل توجد غرامات تأخير (LDs) تُحسب آلياً؟ ما القاعدة؟", pricing_weight: 0.05 },
        { id: "q5_10", type: "textarea", label: "هل توجد مستخلصات قائمة تحتاج ترحيل مع تاريخها التراكمي؟", pricing_weight: 0.1 },
      ],
    },
    {
      id: "s6", icon: "🏠", title: "دورة المبيعات العقارية", subtitle: "Real Estate Sales",
      description: "الدورة الأكثر تخصيصاً — Odoo لا توفر وحدة عقارية رسمية.",
      pricing_impact: "critical",
      questions: [
        { id: "q6_1", type: "checkbox", label: "أنواع الوحدات العقارية التي تبيعونها", options: ["شقق","فلل","تاون هاوس","أراضٍ","محلات تجارية","مكاتب"] },
        { id: "q6_2", type: "textarea", label: "نسبة المبيعات على الخارطة (Off-plan) مقابل الجاهزة؟" },
        { id: "q6_3", type: "textarea", label: "ما خطط السداد المعتادة؟ كم نمط مختلف؟", pricing_weight: 0.1 },
        { id: "q6_4", type: "textarea", label: "هل توجد عمولات مسوّقين خارجيين؟ ما طريقة الاحتساب؟" },
        { id: "q6_5", type: "radio", label: "هل تستخدمون منصة الإفراغ؟", options: ["نعم - مع API","نعم - يدوي","لا"], pricing_weight: 0.1 },
        { id: "q6_6", type: "radio", label: "هل تحتاجون بوابة عميل (Customer Portal)؟", options: ["نعم","لا","ربما لاحقاً"], pricing_weight: 0.08 },
        { id: "q6_7", type: "textarea", label: "هل تتعاملون مع تمويل عقاري بنكي للعملاء؟" },
        { id: "q6_8", type: "radio", label: "هل تحتسب الزكاة على المخزون العقاري؟", options: ["نعم","لا","غير محدد"] },
        { id: "q6_9", type: "textarea", label: "هل توجد عقود إيجار طويلة الأمد لبعض الوحدات؟" },
        { id: "q6_10", type: "radio", label: "هل يطبَّق IFRS 15 على البيع؟", options: ["نعم","لا","غير محدد"], pricing_weight: 0.12 },
        { id: "q6_11", type: "textarea", label: "هل تحتاجون ربط CRM مع منصات تسويق رقمية (Meta/Google)؟" },
      ],
    },
    {
      id: "s7", icon: "💰", title: "المالية والمحاسبة والامتثال", subtitle: "Finance, Accounting & Compliance",
      description: "متطلبات الامتثال والتكامل مع الأنظمة المالية الحالية.",
      pricing_impact: "medium",
      questions: [
        { id: "q7_1", type: "textarea", label: "هل لديكم دليل حسابات حالي؟ كم عدد الحسابات؟ ومتوافق مع IFRS/SOCPA؟" },
        { id: "q7_2", type: "textarea", label: "هل أنتم مسجلون في ZATCA Phase 2؟ هل لديكم شهادة الربط (CSID)؟", pricing_weight: 0.1 },
        { id: "q7_3", type: "textarea", label: "ما النظام المحاسبي المستخدم حالياً؟" },
        { id: "q7_4", type: "radio", label: "طبيعة العملات المتعامل بها", options: ["عملة واحدة فقط","متعددة"], pricing_weight: 0.05 },
        { id: "q7_5", type: "textarea", label: "ما البنوك التي تتعاملون معها؟ هل تحتاجون تسويات بنكية آلية؟" },
        { id: "q7_6", type: "textarea", label: "هل تحتاجون إدارة الأصول الثابتة والإهلاك؟ كم عدد الأصول؟" },
        { id: "q7_7", type: "textarea", label: "هل لديكم متطلبات تقارير زكاة وضريبة تتجاوز ZATCA القياسي؟" },
        { id: "q7_8", type: "textarea", label: "متى تنتهي السنة المالية؟ ومتى الإغلاق الشهري المعتاد؟" },
        { id: "q7_9", type: "radio", label: "هل تحتاجون Cost Allocation تلقائي للمصاريف العامة؟", options: ["نعم","لا","غير محدد"], pricing_weight: 0.05 },
        { id: "q7_10", type: "textarea", label: "هل تتم مراجعة القوائم المالية من مكتب تدقيق خارجي؟" },
      ],
    },
    {
      id: "s8", icon: "📈", title: "المشاريع والموازنات والتقارير", subtitle: "Projects, Budgets & Reports",
      description: "بنية الأكواد التحليلية ومتطلبات التقارير الإدارية ولوحات القيادة.",
      pricing_impact: "high",
      questions: [
        { id: "q8_1", type: "radio", label: "هل أكواد التكلفة نهائية ومعتمدة؟", options: ["نعم نهائية","تحتاج مراجعة","غير محدد"] },
        { id: "q8_2", type: "textarea", label: "هل مراحل المشروع ثابتة أم تختلف حسب النوع؟" },
        { id: "q8_3", type: "checkbox", label: "فحص الموازنة قبل الإنفاق (Budget Block)؟ على أي مستوى؟", options: ["المشروع","المرحلة","كود التكلفة","كل ما سبق"], pricing_weight: 0.08 },
        { id: "q8_4", type: "radio", label: "ماذا يحدث عند تجاوز الموازنة؟", options: ["منع كامل","إنذار + اعتماد إضافي","لا يوجد ضابط آلي"] },
        { id: "q8_5", type: "textarea", label: "ما عدد التقارير الإدارية المعتمدة حالياً؟ هل توجد عينات؟" },
        { id: "q8_6", type: "checkbox", label: "لوحات القيادة (Dashboards) المطلوبة", options: ["CEO Dashboard","CFO Dashboard","PM Dashboard","مدير المبيعات","مدير المشتريات","لوحة لكل مشروع"], pricing_weight: 0.1 },
        { id: "q8_7", type: "radio", label: "هل تحتاجون تقرير EAC (Estimate at Completion)؟", options: ["نعم","لا","غير محدد"], pricing_weight: 0.05 },
        { id: "q8_8", type: "textarea", label: "هل توجد تقارير حرجة لا يمكن الإطلاق بدونها؟" },
        { id: "q8_9", type: "radio", label: "هل تحتاجون تقارير تتبع الالتزامات المفتوحة؟", options: ["نعم","لا"] },
      ],
    },
    {
      id: "s9", icon: "🔐", title: "الصلاحيات والاعتمادات والحوكمة", subtitle: "Permissions, Approvals & Governance",
      description: "حوكمة الأدوار وفصل المهام ومسارات الاعتماد الشرطية.",
      pricing_impact: "medium",
      questions: [
        { id: "q9_1", type: "textarea", label: "هل لديكم Authority Matrix معتمدة (DOA)؟" },
        { id: "q9_2", type: "approval-table", label: "حدود الاعتماد لكل نوع مستند", rows: ["طلب شراء (PR)","أمر شراء (PO)","فاتورة مورد","مستخلص مقاول","عقد بيع وحدة","تعديل موازنة","خصم/إعفاء عميل","قيد يومية يدوي"] },
        { id: "q9_3", type: "textarea", label: "هل تطبقون Segregation of Duties (فصل المهام)؟ ما الازدواجيات المحظورة؟" },
        { id: "q9_4", type: "radio", label: "هل تحتاجون Audit Log موسّع؟", options: ["نعم","لا","غير محدد"] },
        { id: "q9_5", type: "radio", label: "هل تحتاجون إجراء Break Glass للحالات الطارئة؟", options: ["نعم","لا","غير محدد"] },
        { id: "q9_6", type: "radio", label: "هل تريدون إلزام رفع مرفقات قبل اعتماد بعض المستندات؟", options: ["نعم","لا"] },
        { id: "q9_7", type: "radio", label: "هل مشرف الموقع يرى أسعار المشتريات؟", options: ["نعم - يرى الأسعار","لا - تخفى عنه (Field-Level Security)"], pricing_weight: 0.05 },
      ],
    },
    {
      id: "s10", icon: "🔌", title: "التكاملات مع أنظمة خارجية", subtitle: "External Integrations",
      description: "كل تكامل يضيف وقت تطوير وتكلفة — تحديدها مبكراً يساعد في دقة العرض.",
      pricing_impact: "high",
      questions: [
        { id: "q10_1", type: "textarea", label: "ZATCA Phase 2 — هل تم اختيار شريك توطين معتمد؟", pricing_weight: 0.1 },
        { id: "q10_2", type: "textarea", label: "ربط البنوك — أي البنوك وهل توفر API؟", pricing_weight: 0.08 },
        { id: "q10_3", type: "textarea", label: "التوقيع الإلكتروني — ما المزود المستخدم؟" },
        { id: "q10_4", type: "radio", label: "منصة الإفراغ — يدوي أم API؟", options: ["يدوي","API","مختلط","غير محدد"], pricing_weight: 0.1 },
        { id: "q10_5", type: "textarea", label: "مزود SMS Gateway؟ ومزود البريد؟" },
        { id: "q10_6", type: "textarea", label: "هل لديكم نظام HR/Payroll حالي يحتاج ربطاً؟", pricing_weight: 0.05 },
        { id: "q10_7", type: "radio", label: "هل تحتاجون ربط CRM مع منصات تسويق؟", options: ["نعم","لا","غير محدد"], pricing_weight: 0.05 },
        { id: "q10_8", type: "textarea", label: "أنظمة أخرى ضرورية للربط (GIS/خرائط/أرشفة/BI خارجي)؟" },
        { id: "q10_9", type: "textarea", label: "هل لديكم نظام محاسبة سيستمر بالتوازي ويحتاج تكاملاً مؤقتاً؟" },
      ],
    },
    {
      id: "s11", icon: "📁", title: "ترحيل البيانات", subtitle: "Data Migration",
      description: "بند تكلفة ضخم وغالباً يُغفل في التقدير.",
      pricing_impact: "high",
      questions: [
        { id: "q11_1", type: "radio", label: "ما النهج المطلوب لترحيل البيانات؟", options: ["أرصدة افتتاحية فقط","سنة كاملة + الافتتاحية","تاريخ كامل (3 سنوات أو أكثر)"], pricing_weight: 0.2 },
        { id: "q11_2", type: "migration-table", label: "حجم البيانات للترحيل", rows: ["دليل الحسابات","الموردون","العملاء","الأصناف والمواد","الأرصدة الافتتاحية","عقود مقاولين نشطة","مستخلصات سابقة","وحدات عقارية","عقود بيع نشطة","أوامر شراء مفتوحة","فواتير قائمة","أصول ثابتة + إهلاك"] },
        { id: "q11_3", type: "radio", label: "ما تنسيق البيانات الحالي؟", options: ["Excel","SQL Database","CSV","نظام محاسبة سابق","غير ذلك"] },
        { id: "q11_4", type: "radio", label: "هل البيانات نظيفة أم تحتاج Data Cleansing؟", options: ["نظيفة","تحتاج تنظيف","غير معلوم"], pricing_weight: 0.08 },
        { id: "q11_5", type: "radio", label: "من يتحمل مسؤولية تجهيز البيانات؟", options: ["فريقنا الداخلي","فريق التطبيق","مشترك"] },
        { id: "q11_6", type: "radio", label: "هل يُطلب تشغيل موازٍ (Parallel Run)؟", options: ["نعم","لا","غير محدد"], pricing_weight: 0.05 },
      ],
    },
    {
      id: "s12", icon: "🖥️", title: "الاستضافة والبنية التحتية", subtitle: "Hosting & Infrastructure",
      description: "خيارات الاستضافة وتأثيرها على التكلفة والامتثال.",
      pricing_impact: "medium",
      questions: [
        { id: "q12_1", type: "radio", label: "التفضيل المبدئي للاستضافة", options: ["Odoo.sh (Cloud)","On-Premise","Hybrid","غير محدد"], pricing_weight: 0.1 },
        { id: "q12_2", type: "radio", label: "هل توجد متطلبات PDPL تُلزم باستضافة محلية؟", options: ["نعم إلزامي","غير إلزامي","غير محدد"] },
        { id: "q12_3", type: "radio", label: "ما متطلبات الإتاحة (SLA)؟", options: ["99.5%","99.9%","99.99%","غير محدد"] },
        { id: "q12_4", type: "checkbox", label: "هل تحتاجون بيئات منفصلة؟", options: ["Development","Staging / UAT","Production"] },
        { id: "q12_5", type: "textarea", label: "ما متطلبات النسخ الاحتياطي والاستعادة (RPO/RTO)؟" },
        { id: "q12_6", type: "checkbox", label: "متطلبات أمنية إضافية", options: ["PenTest سنوي","ISO 27001","تشفير البيانات","2FA إلزامي","IP Whitelisting"] },
        { id: "q12_7", type: "radio", label: "هل لديكم فريق DevOps داخلي؟", options: ["نعم","لا - نطلب إدارة كاملة"] },
      ],
    },
    {
      id: "s13", icon: "🎓", title: "التدريب والدعم", subtitle: "Training & Support",
      description: "نموذج التدريب والدعم بعد الإطلاق — تأثير مباشر على نجاح المشروع.",
      pricing_impact: "medium",
      questions: [
        { id: "q13_1", type: "textarea", label: "ما عدد المتدربين المتوقع لكل مجموعة وظيفية؟" },
        { id: "q13_2", type: "radio", label: "نمط التدريب", options: ["حضوري","Online","مختلط"] },
        { id: "q13_3", type: "radio", label: "هل تحتاجون مواد تدريبية باللغة العربية؟", options: ["نعم - فيديوهات + أدلة","نعم - أدلة فقط","لا"], pricing_weight: 0.05 },
        { id: "q13_4", type: "radio", label: "هل تحتاجون Train-the-Trainer؟", options: ["نعم","لا","غير محدد"], pricing_weight: 0.05 },
        { id: "q13_5", type: "radio", label: "مدة الدعم المكثف (Hyper-care) بعد Go-Live", options: ["4 أسابيع","8 أسابيع","12 أسبوعاً","غير ذلك"], pricing_weight: 0.08 },
        { id: "q13_6", type: "textarea", label: "ما نموذج الدعم المطلوب بعد Hyper-care؟" },
        { id: "q13_7", type: "radio", label: "ساعات الدعم المطلوبة", options: ["ساعات العمل فقط","24/7","24/5"] },
        { id: "q13_8", type: "radio", label: "هل تحتاجون فريق Power Users داخلي (3-5 موظفين)؟", options: ["نعم","لا","غير محدد"] },
      ],
    },
    {
      id: "s14", icon: "📅", title: "الجدول الزمني والحوكمة", subtitle: "Timeline & Governance",
      description: "الإطار الزمني وآلية اتخاذ القرارات ونموذج التسعير المفضل.",
      pricing_impact: "high",
      questions: [
        { id: "q14_1", type: "radio", label: "هل تاريخ Go-Live ثابت؟", options: ["ثابت تماماً","قابل للتعديل","مفتوح"] },
        { id: "q14_2", type: "textarea", label: "هل توجد قيود زمنية (نهاية سنة مالية، إطلاق مشروع كبير)؟" },
        { id: "q14_3", type: "textarea", label: "من Project Sponsor من جانبكم؟ ومن Single Point of Contact؟" },
        { id: "q14_4", type: "textarea", label: "هل تم تشكيل لجنة توجيهية (Steering Committee)؟ وما تواترها؟" },
        { id: "q14_5", type: "textarea", label: "ما معايير قبول كل موجة (Go/No-Go Criteria)؟" },
        { id: "q14_6", type: "radio", label: "نموذج التسعير المفضل", options: ["Fixed Price","Time & Materials","Capped T&M","نموذج هجين"], pricing_weight: 0.05 },
        { id: "q14_7", type: "textarea", label: "هل لديكم سقف ميزانية مبدئي؟" },
        { id: "q14_8", type: "textarea", label: "ما إجراءات طلب التغيير (Change Request) المعتمدة؟" },
      ],
    },
    {
      id: "s15", icon: "💬", title: "متطلبات إضافية وملاحظات", subtitle: "Additional Requirements & Notes",
      description: "أي متطلب أو سيناريو لم يُغطَّ في الأقسام السابقة.",
      pricing_impact: "low",
      questions: [
        { id: "q15_1", type: "textarea", label: "هل توجد متطلبات أو سيناريوهات لم نغطها وترونها أساسية؟" },
        { id: "q15_2", type: "textarea", label: "هل توجد قيود تنظيمية أو سياسية داخلية يجب مراعاتها؟" },
        { id: "q15_3", type: "textarea", label: "هل لديكم مخاوف من تطبيق ERP بناءً على تجارب سابقة؟" },
        { id: "q15_4", type: "textarea", label: "ما المعايير التي ستحكمون عليها بنجاح المشروع بعد سنة من الإطلاق؟" },
      ],
    },
  ],
};

export function getTotalQuestions(): number {
  return SURVEY_DATA.sections.reduce((sum, s) => sum + s.questions.length, 0);
}

export function computeSurveyProgress(responses: Record<string, unknown>): number {
  const total = getTotalQuestions();
  let answered = 0;
  SURVEY_DATA.sections.forEach((s) => {
    s.questions.forEach((q) => {
      const val = responses[q.id];
      if (val !== undefined && val !== null && val !== "" &&
          !(Array.isArray(val) && val.length === 0) &&
          !(typeof val === "object" && !Array.isArray(val) && Object.keys(val as object).length === 0)) {
        answered++;
      }
    });
  });
  return total > 0 ? Math.round((answered / total) * 100) : 0;
}
