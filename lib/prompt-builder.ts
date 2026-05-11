/**
 * Converts the builder state into a structured user prompt that Claude
 * consumes together with the BG Quote Skill v3 system prompt.
 * The output matches the "برومبت جاهز" format from the v3 HTML.
 */

import type { QuoteBuilderState } from "./builder/types";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "./modules-catalog";
import { fmtNum, curSymbol } from "./utils";

const SECTOR_NAMES: Record<string, string> = {
  trading: "تجارة وتوزيع",
  manufacturing: "تصنيع وإنتاج",
  services: "خدمات مهنية",
  healthcare: "رعاية صحية",
  construction: "مقاولات وتشييد",
  realestate: "عقارات وأملاك",
  logistics: "لوجستيات ونقل",
  retail: "تجزئة ومتاجر",
  food: "أغذية ومطاعم",
  education: "تعليم وتدريب",
  government: "جهة حكومية",
  other: "أخرى",
};

const SIZE_NAMES: Record<string, string> = {
  small: "أقل من 20 موظف",
  medium: "20–100 موظف",
  large: "100–500 موظف",
  enterprise: "أكثر من 500",
};

export function buildQuotePrompt(state: QuoteBuilderState): string {
  const cur = curSymbol(state.meta.currency);

  const selectedMods: Array<{ id: string; name: string; price: number; discount: number; separate: boolean; features: string[] }> = [];
  ODOO_MODULES.forEach((cat) => {
    cat.modules.forEach((m) => {
      const st = state.modules[m.id];
      if (st?.selected) {
        selectedMods.push({
          id: m.id,
          name: m.name,
          price: st.priceOverride ?? m.price,
          discount: st.discount,
          separate: st.separate,
          features: m.features,
        });
      }
    });
  });

  const selectedBG = BG_APPS.filter((a) => state.bgApps[a.id]?.selected).map((a) => ({
    ...a,
    implementationPrice: state.bgApps[a.id].implementationPrice,
    monthlyPrice: state.bgApps[a.id].monthlyPrice,
  }));

  const selectedOptions = state.options.filter((o) => o.selected);
  const modulesRaw = selectedMods.reduce(
    (s, m) => s + Math.round(m.price * (1 - (m.discount || 0) / 100)),
    0
  );
  const bgImpl = selectedBG.reduce((s, a) => s + a.implementationPrice, 0);
  const dev = Math.round((modulesRaw + bgImpl) * (1 - (state.totalDiscount || 0) / 100));
  const licMonthly = Math.round(
    state.license.serverMonthly + state.license.perUserMonthly * state.license.users
  );
  const supPkg = SUPPORT_PACKAGES.find((p) => p.id === state.support.packageId);
  const supCost =
    state.support.packageId === "none"
      ? 0
      : state.support.prices[state.support.packageId as "basic" | "advanced" | "premium"] ?? supPkg?.price ?? 0;

  const sepMods = selectedMods.filter((m) => m.separate);
  const grpMods = selectedMods.filter((m) => !m.separate);
  const grpTot = grpMods.reduce((s, m) => s + m.price, 0);

  const pmLabel =
    state.priceMode === "total" ? "إجمالي موحد" : state.priceMode === "items" ? "سعر كل موديول على حدة" : "إخفاء الأسعار";

  let modsStr = "";
  if (sepMods.length > 0) {
    modsStr += "  [ بنود بأسعار منفصلة ]\n";
    modsStr += sepMods
      .map(
        (m, i) =>
          `  ${i + 1}. ${m.name}\n     السعر: ${fmtNum(m.price)} ${cur}\n     المميزات: ${(m.features || []).slice(0, 3).join(" | ")}`
      )
      .join("\n") + "\n";
  }
  if (grpMods.length > 0) {
    modsStr += "\n  [ موديولات مجمّعة في بند واحد ]\n";
    modsStr += grpMods
      .map(
        (m, i) =>
          `  ${i + 1}. ${m.name} — ${
            state.priceMode === "hidden" ? "سعر مخفي" : `${fmtNum(m.price)} ${cur}`
          }\n     المميزات: ${(m.features || []).slice(0, 3).join(" | ")}`
      )
      .join("\n");
    if (state.priceMode !== "hidden") {
      modsStr += `\n  الإجمالي المجمّع: ${fmtNum(grpTot)} ${cur}`;
    }
  }

  const bgStr = selectedBG.length
    ? selectedBG
        .map((a, i) => {
          const parts: string[] = [];
          if (a.implementationPrice > 0) parts.push(`تطبيق: ${fmtNum(a.implementationPrice)} ${cur}`);
          if (a.monthlyPrice > 0) parts.push(`شهري: ${fmtNum(a.monthlyPrice)} ${cur}`);
          return `  ${i + 1}. ${a.name} — ${parts.join(" | ") || "مجاني"}`;
        })
        .join("\n")
    : "  لا توجد تطبيقات BG";

  const optsStr = selectedOptions.length
    ? selectedOptions.map((o, i) => `  ${i + 1}. ${o.name} — ${fmtNum(o.price)} ${cur} (اختياري)`).join("\n")
    : "  لا توجد مكونات اختيارية";

  const phStr = state.phases
    .map((p, i) => `  المرحلة ${i + 1} — ${p.name}\n  المدة: ${p.duration}\n  المخرجات: ${p.deliverables}`)
    .join("\n\n");

  const installments = state.payment.installments > 1 ? Math.round(dev / state.payment.installments) : 0;

  const contact = state.contacts.find((c) => c.id === state.selectedContactId) || state.contacts[0];
  const contactsStr =
    `الأساسية: ${contact.name} | ${contact.role} | ${contact.phone} | ${contact.email}` +
    (state.contacts.length > 1
      ? "\nجميع جهات الاتصال:\n" +
        state.contacts
          .map((c, i) => `  ${i + 1}. ${c.name} — ${c.role} | ${c.phone} | ${c.email}${c.isDefault ? " (افتراضي)" : ""}`)
          .join("\n")
      : "");

  const supStr =
    `الدعم المجاني: ${state.support.freeSupport}\nعقد الدعم المدفوع: ${state.support.paidSupport}\n` +
    `الباقة المختارة: ${supPkg?.name ?? ""}${supCost ? ` — ${fmtNum(supCost)} ${cur}/شهر` : ""}\n` +
    `مميزات الباقة:\n${(supPkg?.features ?? []).map((x) => `  • ${x}`).join("\n")}\n` +
    `باقة أساسية: ${fmtNum(state.support.prices.basic)} ${cur}/شهر — 10 ساعات\n` +
    `باقة متقدمة: ${fmtNum(state.support.prices.advanced)} ${cur}/شهر — 15 ساعة\n` +
    `باقة مميزة: ${fmtNum(state.support.prices.premium)} ${cur}/شهر — 20 ساعة`;

  const notesStr = state.meetingNotes.length
    ? state.meetingNotes
        .map((n, i) => {
          const icons: Record<string, string> = { note: "📝", important: "⚠", request: "🔧", concern: "❓" };
          return `  ${i + 1}. ${icons[n.type] || "📝"} ${n.text}${n.owner ? ` (${n.owner})` : ""}`;
        })
        .join("\n")
    : "  لا توجد ملاحظات";

  const changesStr = state.moduleChanges.length
    ? state.moduleChanges
        .map((c, i) => {
          let mn = "";
          ODOO_MODULES.forEach((cat) => cat.modules.forEach((m) => { if (m.id === c.moduleId) mn = m.name; }));
          if (c.moduleId === "new") mn = "موديول جديد مقترح";
          const imp: Record<string, string> = { low: "تأثير محدود", med: "تأثير متوسط", high: "تأثير كبير" };
          return `  ${i + 1}. [${mn}] ${c.change} — ${imp[c.impact] || ""}`;
        })
        .join("\n")
    : "  لا توجد تعديلات";

  const sectorLabel = SECTOR_NAMES[state.client.sector] || "الأعمال";
  const sizeLabel = SIZE_NAMES[state.client.employeeSize] || "";

  return `أنشئ عرض سعر HTML احترافي كامل بنفس التصميم المعتمد لـ Business Gate (أخضر #1a5c37 + ذهبي #c9a84c + RTL + Noto Sans Arabic + 15 قسماً + Sidebar يمين + Configurator تفاعلي في #pricing + دعم طباعة A4).

═══════════════════════════════════════
📌 بيانات العميل
═══════════════════════════════════════
اسم العميل:    ${state.client.nameAr || "[لم يُحدد]"}
الإنجليزي:     ${state.client.nameEn || ""}
رقم العرض:     ${state.meta.ref || "BG-XXXX-XXX-XXX"}
التاريخ:       ${state.meta.date || ""}
العملة:        ${state.meta.currency} — ${cur}
الصلاحية:      ${state.meta.validity}
النظام:        Odoo ${state.odooVersion}
القطاع:        ${sectorLabel}
الحجم:         ${sizeLabel}
${state.client.businessDesc ? `النشاط:        ${state.client.businessDesc.slice(0, 200)}\n` : ""}
═══════════════════════════════════════
👤 جهات الاتصال في العرض
═══════════════════════════════════════
${contactsStr}

═══════════════════════════════════════
📦 الموديولات (${selectedMods.length} موديول | ${fmtNum(dev)} ${cur})
═══════════════════════════════════════
طريقة عرض الأسعار: ${pmLabel}
${state.totalDiscount > 0 ? `خصم إجمالي على العرض: ${state.totalDiscount}%\n` : ""}${state.license.exchangeRate !== 1 ? `سعر الصرف: 1 USD = ${state.license.exchangeRate} ${cur}\n` : ""}${sepMods.length > 0 ? `موديولات بسعر منفصل: ${sepMods.map((m) => m.name).join("، ")}\n` : ""}
${modsStr}

═══════════════════════════════════════
⭐ تطبيقات Business Gate
═══════════════════════════════════════
${bgStr}

═══════════════════════════════════════
➕ المكونات الاختيارية
═══════════════════════════════════════
${optsStr}

═══════════════════════════════════════
📅 مراحل التنفيذ — الإجمالي: ${state.durationLabel}
═══════════════════════════════════════
${phStr}

═══════════════════════════════════════
💳 التسعير وطريقة الدفع
═══════════════════════════════════════
قيمة التطوير: ${fmtNum(dev)} ${cur}
طريقة الدفع:  ${state.payment.method}
${state.payment.startDate ? `تاريخ البدء: ${state.payment.startDate}\n` : ""}نسبة الدفعة الأولى: ${state.payment.firstPaymentPct}%
${installments > 0 ? `القسط الشهري المقدر: ${fmtNum(installments)} ${cur}\n` : ""}${state.payment.note ? `ملاحظة: ${state.payment.note}\n` : ""}
═══════════════════════════════════════
🔑 الترخيص والاستضافة
═══════════════════════════════════════
النوع:         ${state.license.type}
الخادم:        ${state.license.serverType}
المستخدمون:    ${state.license.users} مستخدم
التكلفة:       ${fmtNum(licMonthly)} ${cur}/شهر (إرشادي)
⚠ الأسعار إرشادية — يُؤكَّد بعرض رسمي من Odoo

═══════════════════════════════════════
🛟 الدعم الفني
═══════════════════════════════════════
${supStr}

═══════════════════════════════════════
📝 وصف المشروع
═══════════════════════════════════════
${state.projectDescription || "(يُولَّد تلقائياً بناءً على الموديولات)"}

═══════════════════════════════════════
🔄 دورات العمل
═══════════════════════════════════════
${state.workflows || "(يُولَّد تلقائياً بناءً على الموديولات)"}
${state.extraNotes ? `\n═══════════════════════════════════════\n⚠ شروط خاصة\n═══════════════════════════════════════\n${state.extraNotes}\n` : ""}${state.extraRequirements ? `\nمتطلبات إضافية:\n  ${state.extraRequirements}\n` : ""}
═══════════════════════════════════════
💬 ملاحظات الاجتماع
═══════════════════════════════════════
الملاحظات:
${notesStr}

التعديلات على الموديولات:
${changesStr}

═══════════════════════════════════════
✅ الملخص المالي
═══════════════════════════════════════
تطوير (مرة واحدة):  ${fmtNum(dev)} ${cur}
ترخيص (شهري):       ${fmtNum(licMonthly)} ${cur} (إرشادي)
دعم فني (شهري):     ${supCost ? fmtNum(supCost) : "—"} ${cur}
${installments > 0 ? `قسط شهري مقدّر:    ${fmtNum(installments)} ${cur}\n` : ""}

تنبيهات إلزامية:
- أنتج ملف HTML كامل واحد من <!DOCTYPE html> إلى </html>.
- لا CSS/JS خارجي — كل شيء مدمج.
- استخدم الألوان الثابتة فقط: --g1: #1a5c37, --go: #c9a84c.
- ضع 15 قسماً بالترتيب المذكور مع IDs صحيحة.
- أضف Sidebar ثابت يمين + Topbar + Configurator JS في #pricing.
- دعم طباعة A4 (@media print) + موبايل ≤900px.
- خانة التوقيع: ${contact.name} — ${contact.role} · ${contact.phone} · ${contact.email}.
- Footer: www.businessesgates.com
`;
}
