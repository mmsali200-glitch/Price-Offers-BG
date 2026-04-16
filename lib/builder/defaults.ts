import type { QuoteBuilderState } from "./types";
import { ODOO_MODULES, BG_APPS } from "@/lib/modules-catalog";

/** Build initial state for a fresh quote. */
export function makeInitialState(): QuoteBuilderState {
  const modules: QuoteBuilderState["modules"] = {};
  ODOO_MODULES.forEach((cat) => {
    cat.modules.forEach((m) => {
      modules[m.id] = {
        id: m.id,
        categoryId: cat.id,
        selected: false,
        discount: 0,
        separate: false,
      };
    });
  });
  // Defaults that mirror the original v3 builder state.
  modules["sales"].selected = true;
  modules["inventory"].selected = true;
  modules["purchase"].selected = true;

  const bgApps: QuoteBuilderState["bgApps"] = {};
  BG_APPS.forEach((a) => {
    bgApps[a.id] = {
      id: a.id,
      selected: false,
      implementationPrice: a.implementationPrice,
      monthlyPrice: a.monthlyPrice,
    };
  });

  return {
    meta: {
      ref: "",
      date: "",
      currency: "KWD",
      validity: "30 يوم",
    },
    client: {
      nameAr: "",
      nameEn: "",
      sector: "trading",
      employeeSize: "medium",
      businessDesc: "",
      contactName: "",
      contactPhone: "",
      contactEmail: "",
    },
    odooVersion: "18",
    language: "ar",
    priceMode: "total",
    totalDiscount: 0,
    modules,
    bgApps,
    options: [
      { id: 1, name: "تهجير البيانات من النظام القديم", price: 500, selected: false },
      { id: 2, name: "تدريب إضافي بعد التشغيل", price: 300, selected: false },
      { id: 3, name: "تخصيص التقارير والطباعة", price: 400, selected: false },
    ],
    phases: [
      { id: 1, name: "التحليل والتصميم", duration: "أسبوعان", deliverables: "وثيقة متطلبات، خريطة العمليات، إعداد البيئة" },
      { id: 2, name: "التطوير والتهيئة", duration: "4 أسابيع", deliverables: "موديولات مُهيأة، بيانات أساسية محملة، تكاملات" },
      { id: 3, name: "الاختبار والتدريب", duration: "أسبوعان", deliverables: "UAT مكتمل، تدريب الفريق، دليل المستخدم" },
      { id: 4, name: "الإطلاق والمتابعة", duration: "أسبوعان", deliverables: "Go-Live، دعم مكثف، تحليل الأداء الأولي" },
    ],
    durationLabel: "60 يوم",
    payment: {
      method: "دفعة واحدة (خصم 5%)",
      installments: 0,
      startDate: "",
      firstPaymentPct: 30,
      note: "",
    },
    license: {
      type: "Odoo.sh",
      serverType: "cloud",
      users: 10,
      exchangeRate: 1,
      serverMonthly: 150,
      perUserMonthly: 15,
      manualServer: false,
      manualPerUser: false,
      includeOdooInTotal: false,
      licenseMonths: 12,
    },
    support: {
      packageId: "advanced",
      freeSupport: "شهر واحد مجاني",
      paidSupport: "3 أشهر",
      prices: { basic: 250, advanced: 350, premium: 450 },
    },
    projectDescription: "",
    workflows: "",
    extraNotes: "",
    extraRequirements: "",
    contacts: [
      { id: "mahmoud", name: "م. محمود عون", role: "المدير التنفيذي", phone: "+965 9999 0412", email: "OUN@businessesgates.com", isDefault: true },
      { id: "osama", name: "م. أسامة أحمد", role: "مدير قسم التطوير", phone: "+965 6996 8508", email: "osama@businessesgates.com", isDefault: false },
    ],
    selectedContactId: "mahmoud",
    meetingNotes: [],
    moduleChanges: [],
  };
}
