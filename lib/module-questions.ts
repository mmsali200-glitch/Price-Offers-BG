/**
 * Module complexity questionnaire — questions per module that affect
 * implementation effort and pricing. Answers increase a complexity
 * multiplier which adjusts the base price.
 */

export type QuestionType = "yesno" | "number" | "select";

export type ModuleQuestion = {
  id: string;
  text: string;
  textEn: string;
  type: QuestionType;
  category: string;
  options?: Array<{ value: string; label: string; multiplier: number }>;
  /** How much this YES answer adds to the complexity (0.0 - 0.3) */
  weight: number;
};

export type ModuleQuestionnaire = {
  moduleId: string;
  questions: ModuleQuestion[];
};

export const MODULE_QUESTIONS: Record<string, ModuleQuestion[]> = {
  // ═══════════════════════════════════════
  // 1. ACCOUNTING
  // ═══════════════════════════════════════
  accounting: [
    // Structure
    { id: "acc_multi_company", text: "هل توجد شركات متعددة؟", textEn: "Multiple companies?", type: "yesno", category: "الهيكل", weight: 0.15 },
    { id: "acc_branches", text: "هل يوجد فروع متعددة؟", textEn: "Multiple branches?", type: "yesno", category: "الهيكل", weight: 0.10 },
    { id: "acc_multi_currency", text: "هل تحتاج عملات متعددة؟", textEn: "Multi-currency?", type: "yesno", category: "الهيكل", weight: 0.10 },
    { id: "acc_multi_coa", text: "هل تحتاج شجرة حسابات متعددة؟", textEn: "Multiple chart of accounts?", type: "yesno", category: "الهيكل", weight: 0.10 },
    // Operations
    { id: "acc_cost_centers", text: "هل يوجد مراكز تكلفة؟", textEn: "Cost centers?", type: "yesno", category: "العمليات", weight: 0.08 },
    { id: "acc_budget", text: "هل تحتاج إدارة ميزانيات؟", textEn: "Budget management?", type: "yesno", category: "العمليات", weight: 0.08 },
    { id: "acc_fixed_assets", text: "هل يوجد أصول ثابتة وإهلاك؟", textEn: "Fixed assets & depreciation?", type: "yesno", category: "العمليات", weight: 0.08 },
    { id: "acc_project_accounting", text: "هل تحتاج محاسبة مشاريع؟", textEn: "Project accounting?", type: "yesno", category: "العمليات", weight: 0.10 },
    { id: "acc_mfg_costing", text: "هل تحتاج محاسبة تصنيع؟", textEn: "Manufacturing costing?", type: "yesno", category: "العمليات", weight: 0.12 },
    // Compliance
    { id: "acc_vat", text: "هل تحتاج إعداد ضريبة القيمة المضافة؟", textEn: "VAT configuration?", type: "yesno", category: "الامتثال", weight: 0.05 },
    { id: "acc_zatca", text: "هل تحتاج ربط ZATCA (السعودية)؟", textEn: "ZATCA integration?", type: "yesno", category: "الامتثال", weight: 0.15 },
    { id: "acc_einvoice", text: "هل تحتاج فوترة إلكترونية؟", textEn: "E-invoicing?", type: "yesno", category: "الامتثال", weight: 0.10 },
    // Data
    { id: "acc_migration", text: "هل يوجد بيانات تحتاج ترحيل؟", textEn: "Data migration needed?", type: "yesno", category: "البيانات", weight: 0.12 },
    { id: "acc_years", text: "كم سنة بيانات مطلوبة؟", textEn: "Years of data?", type: "select", category: "البيانات", weight: 0.05, options: [
      { value: "0", label: "أرصدة افتتاحية فقط", multiplier: 0 },
      { value: "1", label: "سنة واحدة", multiplier: 0.05 },
      { value: "3", label: "3 سنوات", multiplier: 0.10 },
      { value: "5", label: "5 سنوات+", multiplier: 0.15 },
    ]},
  ],

  // ═══════════════════════════════════════
  // 2. SALES
  // ═══════════════════════════════════════
  sales: [
    { id: "sal_team_count", text: "كم عدد مندوبي المبيعات؟", textEn: "Sales team size?", type: "select", category: "الهيكل", weight: 0.05, options: [
      { value: "small", label: "1-5 مندوبين", multiplier: 0 },
      { value: "medium", label: "6-15 مندوب", multiplier: 0.05 },
      { value: "large", label: "16+ مندوب", multiplier: 0.10 },
    ]},
    { id: "sal_teams", text: "هل يوجد فرق مبيعات متعددة؟", textEn: "Multiple sales teams?", type: "yesno", category: "الهيكل", weight: 0.08 },
    { id: "sal_targets", text: "هل يوجد أهداف مبيعات؟", textEn: "Sales targets?", type: "yesno", category: "الهيكل", weight: 0.05 },
    { id: "sal_approval", text: "هل يوجد اعتماد عروض الأسعار؟", textEn: "Quotation approval workflow?", type: "yesno", category: "العملية", weight: 0.08 },
    { id: "sal_discount_approval", text: "هل يوجد اعتماد خصومات؟", textEn: "Discount approval?", type: "yesno", category: "العملية", weight: 0.08 },
    { id: "sal_pricelists", text: "هل تحتاج قوائم أسعار متعددة؟", textEn: "Multiple price lists?", type: "yesno", category: "العملية", weight: 0.08 },
    { id: "sal_b2b", text: "هل يوجد تسعير B2B مختلف؟", textEn: "Different B2B pricing?", type: "yesno", category: "العملية", weight: 0.05 },
    { id: "sal_custom_quote", text: "هل تحتاج قالب عرض سعر مخصص؟", textEn: "Custom quotation template?", type: "yesno", category: "التخصيص", weight: 0.10 },
    { id: "sal_terms", text: "هل يوجد شروط وأحكام مختلفة؟", textEn: "Different terms & conditions?", type: "yesno", category: "التخصيص", weight: 0.05 },
  ],

  // ═══════════════════════════════════════
  // 3. CRM
  // ═══════════════════════════════════════
  crm: [
    { id: "crm_stages", text: "كم عدد مراحل Pipeline؟", textEn: "Pipeline stages?", type: "select", category: "Pipeline", weight: 0.05, options: [
      { value: "default", label: "افتراضي (4 مراحل)", multiplier: 0 },
      { value: "custom", label: "مخصص (5-8 مراحل)", multiplier: 0.05 },
      { value: "complex", label: "معقد (9+ مراحل)", multiplier: 0.10 },
    ]},
    { id: "crm_scoring", text: "هل تحتاج Lead Scoring؟", textEn: "Lead scoring?", type: "yesno", category: "Pipeline", weight: 0.08 },
    { id: "crm_forecast", text: "هل تحتاج توقع الإيرادات؟", textEn: "Revenue forecasting?", type: "yesno", category: "Pipeline", weight: 0.05 },
    { id: "crm_website", text: "هل تأتي Leads من الموقع؟", textEn: "Leads from website?", type: "yesno", category: "المصادر", weight: 0.05 },
    { id: "crm_whatsapp", text: "هل تحتاج ربط WhatsApp؟", textEn: "WhatsApp integration?", type: "yesno", category: "المصادر", weight: 0.10 },
    { id: "crm_campaigns", text: "هل تأتي Leads من حملات تسويقية؟", textEn: "Marketing campaigns?", type: "yesno", category: "المصادر", weight: 0.08 },
    { id: "crm_sla", text: "هل يوجد SLA لمتابعة العملاء؟", textEn: "Follow-up SLA?", type: "yesno", category: "العملية", weight: 0.08 },
    { id: "crm_automation", text: "هل تحتاج أتمتة التذكيرات؟", textEn: "Reminder automation?", type: "yesno", category: "العملية", weight: 0.05 },
  ],

  // ═══════════════════════════════════════
  // 4. INVENTORY
  // ═══════════════════════════════════════
  inventory: [
    { id: "inv_warehouses", text: "كم عدد المخازن؟", textEn: "Number of warehouses?", type: "select", category: "الهيكل", weight: 0.05, options: [
      { value: "1", label: "مخزن واحد", multiplier: 0 },
      { value: "2-3", label: "2-3 مخازن", multiplier: 0.08 },
      { value: "4+", label: "4+ مخازن", multiplier: 0.15 },
    ]},
    { id: "inv_locations", text: "هل تحتاج مواقع داخلية (رفوف/مناطق)؟", textEn: "Internal locations?", type: "yesno", category: "الهيكل", weight: 0.08 },
    { id: "inv_barcode", text: "هل تستخدم نظام باركود؟", textEn: "Barcode system?", type: "yesno", category: "الهيكل", weight: 0.08 },
    { id: "inv_products", text: "كم عدد المنتجات تقريباً؟", textEn: "Product count?", type: "select", category: "العمليات", weight: 0.05, options: [
      { value: "small", label: "أقل من 100", multiplier: 0 },
      { value: "medium", label: "100-1,000", multiplier: 0.05 },
      { value: "large", label: "1,000-10,000", multiplier: 0.10 },
      { value: "xlarge", label: "10,000+", multiplier: 0.15 },
    ]},
    { id: "inv_serial", text: "هل تحتاج أرقام تسلسلية؟", textEn: "Serial numbers?", type: "yesno", category: "العمليات", weight: 0.08 },
    { id: "inv_batch", text: "هل تحتاج تتبع الباتشات؟", textEn: "Batch tracking?", type: "yesno", category: "العمليات", weight: 0.08 },
    { id: "inv_expiry", text: "هل تحتاج تتبع الصلاحية؟", textEn: "Expiry dates?", type: "yesno", category: "العمليات", weight: 0.08 },
    { id: "inv_reorder", text: "هل تحتاج إعادة طلب تلقائية؟", textEn: "Auto reorder rules?", type: "yesno", category: "العمليات", weight: 0.05 },
  ],

  // ═══════════════════════════════════════
  // 5. PURCHASE
  // ═══════════════════════════════════════
  purchase: [
    { id: "pur_approval", text: "هل يوجد اعتماد على طلبات الشراء؟", textEn: "Purchase approval workflow?", type: "yesno", category: "العملية", weight: 0.08 },
    { id: "pur_rfq", text: "هل تستخدم طلبات عروض أسعار (RFQ)؟", textEn: "RFQ process?", type: "yesno", category: "العملية", weight: 0.05 },
    { id: "pur_comparison", text: "هل تحتاج مقارنة موردين؟", textEn: "Vendor comparison?", type: "yesno", category: "العملية", weight: 0.05 },
    { id: "pur_budget", text: "هل يوجد رقابة ميزانية على المشتريات؟", textEn: "Budget control?", type: "yesno", category: "الرقابة", weight: 0.10 },
    { id: "pur_preferred", text: "هل يوجد موردين مفضلين؟", textEn: "Preferred vendors?", type: "yesno", category: "الرقابة", weight: 0.03 },
    { id: "pur_framework", text: "هل يوجد اتفاقيات إطارية؟", textEn: "Framework agreements?", type: "yesno", category: "الرقابة", weight: 0.08 },
    { id: "pur_volume", text: "كم أمر شراء شهرياً تقريباً؟", textEn: "Monthly PO volume?", type: "select", category: "الحجم", weight: 0.05, options: [
      { value: "low", label: "أقل من 20", multiplier: 0 },
      { value: "medium", label: "20-100", multiplier: 0.05 },
      { value: "high", label: "100+", multiplier: 0.10 },
    ]},
  ],

  // ═══════════════════════════════════════
  // 6. MRP (Manufacturing)
  // ═══════════════════════════════════════
  mrp: [
    { id: "mrp_products", text: "كم عدد المنتجات المصنعة؟", textEn: "Manufactured products?", type: "select", category: "الهيكل", weight: 0.05, options: [
      { value: "small", label: "أقل من 20", multiplier: 0 },
      { value: "medium", label: "20-100", multiplier: 0.08 },
      { value: "large", label: "100+", multiplier: 0.15 },
    ]},
    { id: "mrp_multi_bom", text: "هل تحتاج BOM متعددة لنفس المنتج؟", textEn: "Multiple BOMs?", type: "yesno", category: "الهيكل", weight: 0.10 },
    { id: "mrp_variants", text: "هل يوجد متغيرات للمنتجات؟", textEn: "Product variants?", type: "yesno", category: "الهيكل", weight: 0.08 },
    { id: "mrp_workcenters", text: "هل يوجد مراكز عمل متعددة؟", textEn: "Work centers?", type: "yesno", category: "العملية", weight: 0.08 },
    { id: "mrp_routing", text: "هل تحتاج مسارات إنتاج؟", textEn: "Routing?", type: "yesno", category: "العملية", weight: 0.10 },
    { id: "mrp_subcontract", text: "هل يوجد تصنيع خارجي (Subcontracting)؟", textEn: "Subcontracting?", type: "yesno", category: "العملية", weight: 0.12 },
    { id: "mrp_costing", text: "هل تحتاج تكلفة فعلية (Actual Cost)؟", textEn: "Actual costing?", type: "yesno", category: "التكاليف", weight: 0.10 },
    { id: "mrp_labor", text: "هل تحتاج تكلفة عمالة؟", textEn: "Labor cost?", type: "yesno", category: "التكاليف", weight: 0.08 },
    { id: "mrp_planning", text: "هل تحتاج تخطيط MRP؟", textEn: "MRP planning?", type: "yesno", category: "التخطيط", weight: 0.10 },
  ],

  // ═══════════════════════════════════════
  // 7. HR
  // ═══════════════════════════════════════
  hr: [
    { id: "hr_count", text: "كم عدد الموظفين؟", textEn: "Employee count?", type: "select", category: "الهيكل", weight: 0.05, options: [
      { value: "small", label: "أقل من 20", multiplier: 0 },
      { value: "medium", label: "20-100", multiplier: 0.05 },
      { value: "large", label: "100-500", multiplier: 0.10 },
      { value: "xlarge", label: "500+", multiplier: 0.15 },
    ]},
    { id: "hr_branches", text: "هل يوجد فروع متعددة؟", textEn: "Multiple branches?", type: "yesno", category: "الهيكل", weight: 0.08 },
    { id: "hr_attendance", text: "هل تحتاج ربط أجهزة البصمة؟", textEn: "Attendance device integration?", type: "yesno", category: "الميزات", weight: 0.10 },
    { id: "hr_leave_complex", text: "هل سياسة الإجازات معقدة؟", textEn: "Complex leave policy?", type: "yesno", category: "الميزات", weight: 0.08 },
    { id: "hr_documents", text: "هل تحتاج إدارة وثائق الموظفين؟", textEn: "Employee document management?", type: "yesno", category: "الميزات", weight: 0.05 },
    { id: "hr_approval", text: "هل يوجد تسلسل اعتماد معقد؟", textEn: "Complex approval hierarchy?", type: "yesno", category: "العملية", weight: 0.08 },
  ],

  // ═══════════════════════════════════════
  // 8. PROJECT
  // ═══════════════════════════════════════
  project: [
    { id: "prj_count", text: "كم عدد المشاريع النشطة عادةً؟", textEn: "Active projects?", type: "select", category: "الهيكل", weight: 0.05, options: [
      { value: "few", label: "1-5", multiplier: 0 },
      { value: "medium", label: "6-20", multiplier: 0.05 },
      { value: "many", label: "20+", multiplier: 0.10 },
    ]},
    { id: "prj_budget", text: "هل تحتاج ميزانية لكل مشروع؟", textEn: "Budget per project?", type: "yesno", category: "الرقابة", weight: 0.08 },
    { id: "prj_cost", text: "هل تحتاج تتبع التكاليف الفعلية؟", textEn: "Cost tracking?", type: "yesno", category: "الرقابة", weight: 0.08 },
    { id: "prj_dependencies", text: "هل يوجد اعتماديات بين المهام؟", textEn: "Task dependencies?", type: "yesno", category: "العملية", weight: 0.05 },
    { id: "prj_timesheet", text: "هل تحتاج تسجيل ساعات العمل؟", textEn: "Timesheets?", type: "yesno", category: "العملية", weight: 0.08 },
    { id: "prj_profitability", text: "هل تحتاج تقرير ربحية لكل مشروع؟", textEn: "Profitability per project?", type: "yesno", category: "التقارير", weight: 0.08 },
  ],

  // ═══════════════════════════════════════
  // 9. POS
  // ═══════════════════════════════════════
  pos: [
    { id: "pos_branches", text: "كم عدد فروع نقاط البيع؟", textEn: "POS branches?", type: "select", category: "الهيكل", weight: 0.05, options: [
      { value: "1", label: "فرع واحد", multiplier: 0 },
      { value: "2-5", label: "2-5 فروع", multiplier: 0.10 },
      { value: "6+", label: "6+ فروع", multiplier: 0.15 },
    ]},
    { id: "pos_cashiers", text: "كم عدد الكاشير في كل فرع؟", textEn: "Cashiers per branch?", type: "select", category: "الهيكل", weight: 0.03, options: [
      { value: "1", label: "1 كاشير", multiplier: 0 },
      { value: "2-3", label: "2-3 كاشير", multiplier: 0.05 },
      { value: "4+", label: "4+ كاشير", multiplier: 0.08 },
    ]},
    { id: "pos_barcode", text: "هل تستخدم باركود؟", textEn: "Barcode scanning?", type: "yesno", category: "التكامل", weight: 0.05 },
    { id: "pos_loyalty", text: "هل تحتاج برنامج ولاء؟", textEn: "Loyalty program?", type: "yesno", category: "التكامل", weight: 0.08 },
    { id: "pos_payments", text: "كم طريقة دفع تحتاج؟", textEn: "Payment methods?", type: "select", category: "المالية", weight: 0.03, options: [
      { value: "basic", label: "نقد + بطاقة", multiplier: 0 },
      { value: "multi", label: "+ K-Net/تحويل", multiplier: 0.05 },
      { value: "gift", label: "+ بطاقات هدايا", multiplier: 0.08 },
    ]},
  ],

  // ═══════════════════════════════════════
  // 10. PAYROLL
  // ═══════════════════════════════════════
  payroll: [
    { id: "pay_structures", text: "كم هيكل راتب مختلف؟", textEn: "Salary structures?", type: "select", category: "الهيكل", weight: 0.05, options: [
      { value: "1", label: "هيكل واحد", multiplier: 0 },
      { value: "2-3", label: "2-3 هياكل", multiplier: 0.05 },
      { value: "4+", label: "4+ هياكل", multiplier: 0.10 },
    ]},
    { id: "pay_overtime", text: "هل تحتاج احتساب عمل إضافي؟", textEn: "Overtime calculation?", type: "yesno", category: "العمليات", weight: 0.05 },
    { id: "pay_loans", text: "هل يوجد نظام سلف وقروض؟", textEn: "Loans/advances?", type: "yesno", category: "العمليات", weight: 0.08 },
    { id: "pay_eos", text: "هل تحتاج حساب مكافأة نهاية الخدمة؟", textEn: "End of service calculation?", type: "yesno", category: "العمليات", weight: 0.05 },
    { id: "pay_wps", text: "هل تحتاج ملف تحويل بنكي (WPS/SIF)؟", textEn: "Bank transfer file (WPS)?", type: "yesno", category: "المالية", weight: 0.08 },
    { id: "pay_gosi", text: "هل تحتاج ربط GOSI/تأمينات اجتماعية؟", textEn: "GOSI/social insurance?", type: "yesno", category: "الامتثال", weight: 0.10 },
  ],
};

/**
 * Calculate the complexity multiplier based on answers.
 * Returns a value between 1.0 (base) and ~2.0 (maximum complexity).
 */
export function calculateComplexity(
  moduleId: string,
  answers: Record<string, string | boolean>
): { multiplier: number; level: string; levelEn: string } {
  const questions = MODULE_QUESTIONS[moduleId];
  if (!questions) return { multiplier: 1.0, level: "قياسي", levelEn: "Standard" };

  let totalWeight = 0;

  questions.forEach((q) => {
    const answer = answers[q.id];
    if (q.type === "yesno" && answer === true) {
      totalWeight += q.weight;
    } else if (q.type === "select" && typeof answer === "string") {
      const opt = q.options?.find((o) => o.value === answer);
      if (opt) totalWeight += opt.multiplier;
    }
  });

  const multiplier = 1.0 + totalWeight;

  let level: string, levelEn: string;
  if (multiplier <= 1.15) { level = "قياسي"; levelEn = "Standard"; }
  else if (multiplier <= 1.35) { level = "متوسط"; levelEn = "Medium"; }
  else if (multiplier <= 1.60) { level = "متقدم"; levelEn = "Advanced"; }
  else { level = "معقد"; levelEn = "Complex"; }

  return { multiplier: Math.round(multiplier * 100) / 100, level, levelEn };
}
