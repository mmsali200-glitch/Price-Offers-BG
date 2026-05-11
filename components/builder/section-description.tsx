"use client";

import { SectionCard, Field } from "./section-card";
import { useBuilderStore, selectedModules, selectedBGApps } from "@/lib/builder/store";
import { Sparkles } from "lucide-react";

const SECTOR_NAMES: Record<string, string> = {
  trading: "التجارة والتوزيع",
  manufacturing: "التصنيع والإنتاج",
  services: "الخدمات المهنية",
  healthcare: "الرعاية الصحية",
  construction: "المقاولات والتشييد",
  realestate: "العقارات وإدارة الأملاك",
  logistics: "اللوجستيات والنقل",
  retail: "التجزئة والمتاجر",
  food: "الأغذية والمطاعم",
  education: "التعليم والتدريب",
  government: "القطاع الحكومي",
  other: "الأعمال",
};

export function SectionDescription() {
  const state = useBuilderStore();
  const setDescription = useBuilderStore((s) => s.setDescription);
  const setWorkflows = useBuilderStore((s) => s.setWorkflows);
  const setExtraNotes = useBuilderStore((s) => s.setExtraNotes);

  function autoGenerate() {
    const clientName = state.client.nameAr || "الشركة";
    const sectorName = SECTOR_NAMES[state.client.sector] || "الأعمال";
    const mods = selectedModules(state);
    const bgApps = selectedBGApps(state);
    const modsList = mods.map((m) => m.name).join(" و");
    const bgList = bgApps.map((a) => a.name).join(" و");

    let desc = `يهدف هذا المشروع إلى تحويل العمليات الرقمية لشركة ${clientName} العاملة في قطاع ${sectorName} من خلال تطبيق نظام Odoo ${state.odooVersion} المتكامل.\n\n`;
    desc += `يشمل نطاق العمل تطبيق وتخصيص موديولات: ${modsList || "المحددة"}${bgList ? ` بالإضافة إلى تطبيقات Business Gate الحصرية: ${bgList}` : ""}.\n\n`;
    desc += `يضمن هذا النظام: توحيد البيانات في منصة واحدة، تسريع اتخاذ القرار بالتقارير الفورية، تقليل الأخطاء اليدوية، وتحسين كفاءة الفرق.\n`;
    if (state.client.businessDesc) {
      desc += `\nحول الشركة: ${state.client.businessDesc.slice(0, 200)}`;
    }
    setDescription(desc);

    const wf: string[] = [];
    const ids = mods.map((m) => m.id);
    if (ids.includes("sales") || ids.includes("crm"))
      wf.push("دورة المبيعات: من العميل المحتمل في CRM ← عرض سعر ← اعتماد ← أمر بيع ← تحقق ائتماني ← شحن ← فاتورة ← تحصيل ← قيود محاسبية تلقائية");
    if (ids.includes("purchase"))
      wf.push("دورة المشتريات: طلب داخلي ← اعتماد المدير ← RFQ للموردين ← مقارنة العروض ← أمر شراء ← استلام البضاعة ← فاتورة المورد ← دفع ← تحديث المخزون");
    if (ids.includes("inventory"))
      wf.push("دورة المخزون: استلام البضاعة وتسجيل الباتش والصلاحية ← تخزين في المواقع ← تحويلات داخلية ← تنبيه إعادة الطلب ← جرد دوري ← تقرير المخزون");
    if (ids.includes("accounting"))
      wf.push("دورة المحاسبة: قيود تلقائية من كل العمليات ← مطابقة البنك ← إدارة الذمم ← إغلاق شهري ← تقارير مالية (ميزانية/دخل/تدفقات)");
    if (ids.includes("hms"))
      wf.push("دورة المريض: تسجيل المريض ← حجز موعد ← كشف طبي وتشخيص ← وصفة وتحاليل ← تصفية تأمين ← فاتورة ← تحصيل ← أرشفة السجل");
    if (ids.includes("mrp"))
      wf.push("دورة الإنتاج: طلب إنتاج ← تحقق المواد الخام ← أمر تصنيع ← تتبع مراحل الإنتاج ← فحص جودة ← إدخال المنتج النهائي ← ربط التكاليف");
    if (ids.includes("hr") || ids.includes("payroll"))
      wf.push("دورة الرواتب: تجميع بيانات الحضور ← احتساب العمل الإضافي ← خصم الغيابات ← احتساب البدلات ← اعتماد كشف الراتب ← صرف وإرسال القسائم");
    if (ids.includes("realestate"))
      wf.push("دورة العقارات: تسجيل الوحدة ← عقد المستأجر ← فوترة دورية تلقائية ← استلام الإيجار ← متابعة المتأخرات ← تجديد أو إنهاء العقد");
    if (bgApps.some((a) => a.id === "onesales"))
      wf.push("دورة الميدان (One Sales): تعيين مهمة للمندوب ← تنقل مع GPS ← تسجيل زيارة العميل ← تسجيل طلب/تحصيل من الجوال ← مزامنة تلقائية ← تقرير أداء يومي");
    if (wf.length === 0) wf.push("دورة العمل الأساسية بناءً على الموديولات المختارة");
    setWorkflows(wf.join("\n\n"));
  }

  return (
    <SectionCard icon="📝" tone="info" title="وصف المشروع ودورات العمل" subtitle="يُولَّد تلقائياً بناءً على الموديولات والقطاع">
      <button
        type="button"
        onClick={autoGenerate}
        className="w-full btn-primary mb-3 inline-flex items-center justify-center gap-2"
      >
        <Sparkles className="size-4" /> توليد تلقائي
      </button>
      <div className="space-y-3">
        <Field label="وصف المشروع — الملخص التنفيذي">
          <textarea
            className="input min-h-[120px] resize-y"
            value={state.projectDescription}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="اضغط توليد تلقائي أو اكتب يدوياً..."
          />
        </Field>
        <Field label="دورات العمل الرئيسية (سطر لكل دورة)">
          <textarea
            className="input min-h-[140px] resize-y"
            value={state.workflows}
            onChange={(e) => setWorkflows(e.target.value)}
            placeholder="اضغط توليد تلقائي أو اكتب يدوياً..."
          />
        </Field>
        <Field label="شروط وملاحظات إضافية">
          <textarea
            className="input min-h-[70px] resize-y"
            value={state.extraNotes}
            onChange={(e) => setExtraNotes(e.target.value)}
            placeholder="أي شروط خاصة أو استثناءات..."
          />
        </Field>
      </div>
    </SectionCard>
  );
}
