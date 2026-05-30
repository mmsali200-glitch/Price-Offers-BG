/**
 * Contract HTML renderer.
 * Takes a quote builder state + per-contract extras and renders a styled
 * Arabic RTL contract following the template at
 * /قالب_عقد_Odoo_BusinessGate.md.
 */

import type { QuoteBuilderState } from "./builder/types";
import { computeTotals } from "./builder/totals";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "./modules-catalog";
import { getVatRate } from "./country-pricing";
import { fmtNum, curSymbol, fmtDateArabic } from "./utils";
import {
  type ContractParty,
  type ContractBank,
  DEFAULT_PROVIDER,
  DEFAULT_BANK,
  defaultJurisdiction,
} from "./contract-defaults";

export type ContractClientOverride = Partial<{
  name: string;
  cr: string;
  vat: string;
  address: string;
  rep: string;
  email: string;
}>;

export type ContractExtras = {
  ref: string;
  contractDate: string; // ISO date
  jurisdiction: string;
  pmName: string;
  pmPhone: string;
  pmEmail: string;
  provider?: Partial<ContractParty>;
  bank?: Partial<ContractBank>;
  /** Client data entered in the contract form — overrides the snapshot from the quote. */
  client?: ContractClientOverride;
};

function esc(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function selectedModuleNames(state: QuoteBuilderState): Array<{ name: string; exclusive: boolean }> {
  const out: Array<{ name: string; exclusive: boolean }> = [];
  ODOO_MODULES.forEach((cat) =>
    cat.modules.forEach((m) => {
      if (state.modules[m.id]?.selected) out.push({ name: m.name, exclusive: false });
    })
  );
  BG_APPS.forEach((a) => {
    if (state.bgApps[a.id]?.selected) out.push({ name: a.name, exclusive: true });
  });
  return out;
}

/** Group selected modules into scope items, one per category. */
function buildScope(state: QuoteBuilderState): Array<{ title: string; desc: string }> {
  const scope: Array<{ title: string; desc: string }> = [];
  ODOO_MODULES.forEach((cat) => {
    const picked = cat.modules.filter((m) => state.modules[m.id]?.selected);
    if (picked.length === 0) return;
    scope.push({
      title: cat.name,
      desc: `إعداد وتطبيق ${picked.map((m) => m.name).join("، ")} مع التهيئة الكاملة والتدريب على الاستخدام.`,
    });
  });
  const bg = BG_APPS.filter((a) => state.bgApps[a.id]?.selected);
  if (bg.length > 0) {
    scope.push({
      title: "تطبيقات Business Gate الحصرية",
      desc: bg.map((a) => a.name).join("، "),
    });
  }
  return scope;
}

function buildPayments(state: QuoteBuilderState, total: number): Array<{ label: string; desc: string; date: string; percent: number; amount: number }> {
  const pay = state.payment ?? ({} as QuoteBuilderState["payment"]);
  const n = Math.max(1, pay.installments || 1);
  const fpPct = pay.firstPaymentPct || 30;
  const startISO = pay.startDate || new Date().toISOString().slice(0, 10);
  const start = new Date(startISO);
  const fa = Math.round((total * fpPct) / 100);
  const perInst = n > 1 ? Math.round((total - fa) / (n - 1)) : 0;
  const labels = ["عند التوقيع", "بدء التطوير", "منتصف المشروع", "التسليم النهائي", "القسط", "القسط"];

  const out: Array<{ label: string; desc: string; date: string; percent: number; amount: number }> = [];
  let consumed = 0;
  for (let i = 0; i < n; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + Math.round((i / Math.max(1, n - 1)) * 60));
    const amt =
      i === 0 ? fa : i === n - 1 ? total - consumed : perInst;
    consumed += amt;
    out.push({
      label: `الدفعة ${i + 1}`,
      desc: labels[Math.min(i, labels.length - 1)],
      date: fmtDateArabic(d),
      percent: Math.round((amt / total) * 100),
      amount: amt,
    });
  }
  return out;
}

const P1_DUTIES: Array<{ lead: string; text: string }> = [
  { lead: "تطبيق وتخصيص النظام:", text: "تنفيذ وتخصيص الموديولات المعتمدة في نطاق العمل، وتهيئتها وفق طبيعة عمل العميل." },
  { lead: "نقل البيانات:", text: "ترحيل البيانات الأساسية التي يسلّمها الطرف الثاني في القوالب المعتمدة، مع التحقق من الاتساق." },
  { lead: "التدريب:", text: "تدريب المستخدمين الرئيسيين (Key Users) على تشغيل النظام وإدارة العمليات اليومية." },
  { lead: "اختبار القبول:", text: "تنفيذ اختبار قبول المستخدم (UAT) واعتماد المخرجات وفق المتفق عليه." },
  { lead: "الدعم المجاني:", text: "تقديم شهر واحد من الدعم الفني المجاني بعد الإطلاق الرسمي." },
  { lead: "السرّية:", text: "الحفاظ على سرّية البيانات والمعلومات المتبادلة طوال مدة التعاقد وبعدها." },
];

const P2_DUTIES: Array<{ lead: string; text: string }> = [
  { lead: "تسليم البيانات:", text: "توفير بيانات العمليات والمنتجات والعملاء والموردين في القوالب المعتمدة في المواعيد المتفق عليها." },
  { lead: "البنية التحتية:", text: "تجهيز الخوادم/الحسابات والشبكات اللازمة لتشغيل النظام، أو الاشتراك في Odoo.sh عند الحاجة." },
  { lead: "الاعتمادات:", text: "اعتماد مخرجات كل مرحلة خطياً خلال 5 أيام عمل من تسليمها." },
  { lead: "السداد:", text: "سداد الدفعات في مواعيدها المحددة في جدول الدفعات." },
  { lead: "التعاون:", text: "تخصيص مدير مشروع متفرّغ من جانبه للمتابعة مع فريق الطرف الأول." },
];

export function renderContractHtml(state: QuoteBuilderState, extras: ContractExtras): string {
  const totals = computeTotals(state);
  const dev = totals.development;
  const country = state.client?.country || "السعودية";
  const vatRate = getVatRate(country);
  const vatPct = Math.round(vatRate * 100);
  const vat = Math.round(dev * vatRate);
  const total = dev + vat;
  const cur = curSymbol(state.meta.currency);

  const provider: ContractParty = { ...DEFAULT_PROVIDER, ...(extras.provider || {}) };
  const bank: ContractBank = { ...DEFAULT_BANK, ...(extras.bank || {}) };
  const jurisdiction = extras.jurisdiction || defaultJurisdiction(country);

  const client = state.client;
  const ov = extras.client || {};
  const p2: ContractParty = {
    name: ov.name || client?.nameAr || "—",
    cr: ov.cr || client?.crn || "—",
    vat: ov.vat || client?.taxNumber || "—",
    address:
      ov.address ||
      [client?.governorate, client?.address].filter(Boolean).join("، ") ||
      "—",
    rep: ov.rep || client?.contactName || "—",
    email: ov.email || client?.contactEmail || "—",
  };

  const modules = selectedModuleNames(state);
  const scope = buildScope(state);
  const payments = buildPayments(state, total);
  const duration = state.durationLabel || "60 يوم عمل";
  const contractDate = extras.contractDate
    ? fmtDateArabic(new Date(extras.contractDate))
    : fmtDateArabic(new Date());

  const supportPrices = (state.support?.prices ?? {}) as Record<string, number>;
  const supportRows = SUPPORT_PACKAGES.filter((p) => p.id !== "none")
    .map((p) => {
      const price = supportPrices[p.id] ?? p.price;
      const star = p.id === "advanced";
      return { name: p.name, price, features: p.features || [], star };
    });

  const moduleList = modules
    .map((m) => `<li>${m.exclusive ? "★ " : ""}${esc(m.name)}${m.exclusive ? " <span style=\"color:#c9a84c;font-weight:700;font-size:11px;\">(تطبيق Business Gate الحصري)</span>" : ""}</li>`)
    .join("");

  const scopeList = scope
    .map((s) => `<li><strong style="color:#1a5c37;">${esc(s.title)}:</strong> ${esc(s.desc)}</li>`)
    .join("");

  const paymentsRows = payments
    .map(
      (p, i) => `<tr style="background:${i % 2 === 0 ? "#fff" : "#f7f9f6"};border-bottom:1px solid #e2e8e3;">
        <td style="padding:9px 12px;font-weight:700;color:#1a5c37;">${esc(p.label)}</td>
        <td style="padding:9px 12px;color:#3e5446;">${esc(p.desc)}</td>
        <td style="padding:9px 12px;text-align:center;color:#7a8e80;">${esc(p.date)}</td>
        <td style="padding:9px 12px;text-align:center;font-weight:700;">${p.percent}%</td>
        <td style="padding:9px 12px;text-align:left;font-weight:800;font-family:monospace;color:#1a5c37;">${fmtNum(p.amount)}</td>
      </tr>`
    )
    .join("");

  const p1DutiesList = P1_DUTIES.map((d) => `<li><strong style="color:#1a5c37;">${esc(d.lead)}</strong> ${esc(d.text)}</li>`).join("");
  const p2DutiesList = P2_DUTIES.map((d) => `<li><strong style="color:#1a5c37;">${esc(d.lead)}</strong> ${esc(d.text)}</li>`).join("");

  const supportList = supportRows
    .map(
      (s) => `<div style="border:1.5px solid ${s.star ? "#c9a84c" : "#e2e8e3"};border-radius:10px;padding:12px 14px;margin-bottom:8px;${s.star ? "background:#fffbf0;" : "background:#fff;"}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
          <strong style="color:#1a5c37;font-size:13px;">${esc(s.name)}${s.star ? " <span style=\"color:#c9a84c;\">★</span>" : ""}</strong>
          <span style="font-family:monospace;font-weight:800;color:#8a6010;">${fmtNum(s.price)} ${cur}/شهر</span>
        </div>
        <div style="font-size:10px;color:#7a8e80;line-height:1.6;">${s.features.slice(0, 4).map(esc).join(" · ")}</div>
      </div>`
    )
    .join("");

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>عقد ${esc(extras.ref || state.meta.ref || "")} — ${esc(provider.name)} × ${esc(p2.name)}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700;800;900&display=swap" rel="stylesheet" />
<style>
  *{box-sizing:border-box}
  body{margin:0;background:#f3f5f1;font-family:"Noto Sans Arabic",Arial,sans-serif;color:#141f18;line-height:1.85;}
  .doc{max-width:880px;margin:24px auto;background:#fff;box-shadow:0 8px 32px rgba(26,92,55,0.08);border-radius:12px;overflow:hidden;}
  .hero{background:linear-gradient(135deg,#1a5c37 0%,#0e3a1e 100%);color:#fff;padding:34px 32px;border-bottom:6px solid #c9a84c;}
  .hero h1{margin:0 0 8px;font-size:26px;font-weight:900;}
  .hero .sub{font-size:13px;color:#c9a84c;font-weight:700;}
  .hero .meta{margin-top:14px;display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:rgba(255,255,255,0.85);}
  .hero .meta b{color:#c9a84c;}
  section{padding:28px 32px;border-bottom:1px solid #eaf3ed;}
  section h2{margin:0 0 14px;font-size:17px;font-weight:800;color:#1a5c37;display:flex;align-items:center;gap:10px;}
  section h2::before{content:"";width:4px;height:20px;background:#c9a84c;border-radius:2px;}
  .parties{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
  .party{border:1.5px solid #e2e8e3;border-radius:10px;padding:16px;background:#f7f9f6;}
  .party h3{margin:0 0 10px;font-size:13px;font-weight:800;color:#c9a84c;text-transform:uppercase;letter-spacing:0.5px;}
  .party div{font-size:12px;margin-bottom:5px;}
  .party b{color:#1a5c37;}
  ul{margin:6px 0;padding-right:22px;}
  ul li{margin-bottom:6px;font-size:12.5px;}
  table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px;}
  table th{background:#1a5c37;color:#fff;padding:9px 12px;text-align:right;font-weight:700;}
  table td{padding:8px 12px;border-bottom:1px solid #e2e8e3;}
  .totals{background:#1a5c37;color:#fff;font-weight:900;}
  .totals td{padding:11px 12px;}
  .gold{color:#c9a84c;}
  .note{background:#fdf5e0;border:1px solid #c9a84c;border-radius:8px;padding:10px 14px;font-size:11.5px;color:#8a6010;margin-top:10px;}
  .preamble{background:#f7f9f6;border-right:4px solid #c9a84c;padding:14px 18px;border-radius:6px;font-size:13px;color:#3e5446;}
  .signatures{display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-top:20px;}
  .sign-box{border:1.5px solid #1a5c37;border-radius:10px;padding:18px;background:#fff;}
  .sign-box h4{margin:0 0 12px;color:#c9a84c;font-size:11px;text-transform:uppercase;letter-spacing:0.6px;}
  .sign-box div{font-size:12px;margin-bottom:6px;color:#3e5446;}
  .sign-line{margin-top:24px;border-top:2px dashed #7a8e80;padding-top:6px;font-size:11px;color:#7a8e80;}
  .bank{display:grid;grid-template-columns:1fr 1fr;gap:10px;background:#f7f9f6;border:1.5px solid #e2e8e3;border-radius:10px;padding:14px;font-size:12px;}
  .bank b{color:#1a5c37;}
  footer{background:#0e3a1e;color:#c9a84c;text-align:center;padding:14px;font-size:11px;}
  @media print{
    body{background:#fff;}
    .doc{box-shadow:none;margin:0;border-radius:0;max-width:none;}
    section{page-break-inside:avoid;}
  }
  @media(max-width:640px){
    .doc{margin:0;border-radius:0;}
    .parties,.signatures,.bank{grid-template-columns:1fr;}
    section{padding:20px 16px;}
    .hero{padding:24px 16px;}
  }
</style>
</head>
<body>
<div class="doc">
  <div class="hero">
    <div class="sub">عقد تنفيذ نظام Odoo ${state.odooVersion} ERP</div>
    <h1>${esc(provider.name)} × ${esc(p2.name)}</h1>
    <div class="meta">
      <div><b>تاريخ العقد:</b> ${esc(contractDate)}</div>
      <div><b>رقم العرض المرجعي:</b> ${esc(state.meta.ref || "—")}</div>
      <div><b>رقم العقد:</b> ${esc(extras.ref || "—")}</div>
      <div><b>القطاع:</b> ${esc(state.client?.sector || "—")}</div>
      <div><b>السوق:</b> ${esc(country)}</div>
      <div><b>العملة:</b> ${esc(cur)}</div>
      <div><b>النشر:</b> ${esc(state.license.type)}</div>
      ${vatRate > 0 ? `<div><b>الضريبة:</b> ${vatPct}%</div>` : ""}
    </div>
  </div>

  <section>
    <h2>البند التمهيدي — أطراف العقد</h2>
    <div class="parties">
      <div class="party">
        <h3>الطرف الأول — مزوّد الخدمة</h3>
        <div><b>الاسم التجاري:</b> ${esc(provider.name)}</div>
        <div><b>السجل التجاري:</b> ${esc(provider.cr)} · <b>الرقم الضريبي:</b> ${esc(provider.vat)}</div>
        <div><b>العنوان:</b> ${esc(provider.address)}</div>
        <div><b>الممثل القانوني:</b> ${esc(provider.rep)}</div>
        <div><b>البريد:</b> ${esc(provider.email)}</div>
      </div>
      <div class="party">
        <h3>الطرف الثاني — العميل</h3>
        <div><b>الاسم التجاري:</b> ${esc(p2.name)}</div>
        <div><b>السجل التجاري:</b> ${esc(p2.cr)} · <b>الرقم الضريبي:</b> ${esc(p2.vat)}</div>
        <div><b>العنوان:</b> ${esc(p2.address)}</div>
        <div><b>الممثل القانوني:</b> ${esc(p2.rep)}</div>
        <div><b>البريد:</b> ${esc(p2.email)}</div>
      </div>
    </div>
  </section>

  <section>
    <h2>تمهيد</h2>
    <div class="preamble">
      حيث إن الطرف الأول يعمل في مجال برمجة وتقديم حلول تخطيط موارد المؤسسات (ERP) باستخدام نظام Odoo، وحيث إن الطرف الثاني يرغب في الاستفادة من خبرات الطرف الأول لتنفيذ نظام Odoo ${state.odooVersion} المتكامل في قطاع ${esc(state.client?.sector || "")}؛ فقد اتفق الطرفان وهما بكامل أهليتهما المعتبرة شرعاً ونظاماً على ما يلي.
      <br><br>
      يُعدّ هذا التمهيد وعرض السعر النهائي رقم <strong>${esc(state.meta.ref || "—")}</strong> وملاحقهما جزءاً لا يتجزأ من هذا العقد ويُقرأان معه قراءة واحدة متكاملة.
    </div>
  </section>

  <section>
    <h2>البند الأول — موضوع العقد ونطاق العمل</h2>
    <p style="font-size:12.5px;">يلتزم الطرف الأول بتنفيذ «مشروع نظام Odoo ${state.odooVersion} ERP» لصالح الطرف الثاني، ويشمل نطاق العمل المعتمد تطبيق وتخصيص الموديولات التالية حصراً:</p>
    <ul>${moduleList || "<li>—</li>"}</ul>
    <p style="font-size:12.5px;font-weight:700;color:#1a5c37;margin-top:14px;">تفصيل مجالات نطاق العمل:</p>
    <ul>${scopeList || "<li>—</li>"}</ul>
    <div class="note">
      <strong>حصر النطاق (Scope Lock):</strong> يقتصر التزام الطرف الأول على الموديولات والمجالات المذكورة أعلاه. أي طلب لموديول أو وظيفة أو تكامل خارج هذا النطاق يُعدّ عملاً إضافياً يُسعّر ويُتعاقد عليه بأمر تغيير (Change Order) مستقل ومدفوع.
    </div>
  </section>

  <section>
    <h2>البند الثاني — مدة العقد والتنفيذ</h2>
    <ol style="padding-right:22px;font-size:12.5px;">
      <li>مدة تنفيذ المشروع <strong>${esc(duration)}</strong>، تبدأ من تاريخ توقيع العقد واستلام الدفعة الأولى كاملةً، أيهما أحدث.</li>
      <li>تُحتسب المدة بأيام العمل الرسمية ولا تشمل العطل الرسمية ولا أيام توقّف العمل لأسباب راجعة إلى الطرف الثاني.</li>
      <li>أي تأخير ناتج عن الطرف الثاني يُمدّد مدة التنفيذ تلقائياً بما يعادله دون غرامة.</li>
      <li>يبدأ احتساب مدة كل مرحلة فقط بعد سداد الدفعة الخاصة بها واعتماد مخرجات المرحلة السابقة.</li>
    </ol>
  </section>

  <section>
    <h2>البند الثالث — القيمة المالية وشروط الدفع</h2>
    <table>
      <thead><tr><th>البيان</th><th style="text-align:left;">المبلغ (${cur})</th></tr></thead>
      <tbody>
        <tr><td>القيمة قبل الضريبة</td><td style="text-align:left;font-family:monospace;font-weight:700;">${fmtNum(dev)}</td></tr>
        ${vatRate > 0 ? `<tr><td>ضريبة القيمة المضافة (${vatPct}%)</td><td style="text-align:left;font-family:monospace;font-weight:700;color:#8a6010;">${fmtNum(vat)}</td></tr>` : ""}
        <tr class="totals"><td>الإجمالي شامل الضريبة</td><td style="text-align:left;font-family:monospace;" class="gold">${fmtNum(total)}</td></tr>
      </tbody>
    </table>

    <p style="font-size:12.5px;font-weight:700;color:#1a5c37;margin-top:18px;">جدول الدفعات:</p>
    <table>
      <thead><tr><th>الدفعة</th><th>الوصف</th><th style="text-align:center;">التاريخ</th><th style="text-align:center;">النسبة</th><th style="text-align:left;">المبلغ (${cur})</th></tr></thead>
      <tbody>
        ${paymentsRows}
        <tr class="totals"><td colspan="3">الإجمالي</td><td style="text-align:center;">100%</td><td style="text-align:left;font-family:monospace;" class="gold">${fmtNum(total)}</td></tr>
      </tbody>
    </table>

    <div class="note">
      <strong>شروط الدفع:</strong>
      جميع المبالغ بـ${cur} وشاملة لضريبة القيمة المضافة الواجبة نظاماً. تُسدّد كل دفعة خلال 5 أيام عمل من استحقاقها. عند تأخر أي دفعة يحق للطرف الأول تعليق العمل دون إخلال بالتزاماته. الدفعات المسددة غير قابلة للاسترداد مقابل ما أُنجز فعلياً. أسعار اشتراك Odoo السنوي والدعم الفني مستقلة تماماً عن هذه القيمة.
    </div>

    <p style="font-size:12.5px;font-weight:700;color:#1a5c37;margin-top:18px;">بيانات الحساب البنكي للطرف الأول:</p>
    <div class="bank">
      <div><b>اسم المستفيد:</b> ${esc(bank.beneficiary)}</div>
      <div><b>البنك/الفرع:</b> ${esc(bank.name)}</div>
      <div><b>رقم الحساب:</b> ${esc(bank.account)}</div>
      <div><b>الآيبان (IBAN):</b> ${esc(bank.iban)}</div>
    </div>
  </section>

  <section>
    <h2>البند الرابع — التزامات الطرفين</h2>
    <p style="font-size:12.5px;font-weight:700;color:#1a5c37;">أولاً: التزامات الطرف الأول (مزوّد الخدمة)</p>
    <ul>${p1DutiesList}</ul>
    <p style="font-size:12.5px;font-weight:700;color:#1a5c37;margin-top:14px;">ثانياً: التزامات الطرف الثاني (العميل)</p>
    <ul>${p2DutiesList}
      <li><strong style="color:#1a5c37;">مدير المشروع:</strong> تفويض السيد/ ${esc(extras.pmName || "—")} مديراً للمشروع — جوال: ${esc(extras.pmPhone || "—")} · بريد: ${esc(extras.pmEmail || "—")}</li>
    </ul>
    <div class="note">
      <strong>أثر إخلال الطرف الثاني بالتزاماته:</strong> أي تأخير أو نقص أو عدم دقة في البيانات أو البنية التحتية أو الاعتمادات الواجبة على الطرف الثاني يُعفي الطرف الأول من المسؤولية عن أي تأخير ناتج عنه، ويمدّد مدة التنفيذ بما يعادله دون غرامة.
    </div>
  </section>

  <section>
    <h2>البند الخامس — الدعم الفني واشتراك Odoo</h2>
    <div class="note" style="margin-top:0;">
      <strong>الدعم المجاني:</strong> يشمل العقد شهراً واحداً من الدعم الفني المجاني لحل المشكلات التقنية المتعلقة بالنظام، يبدأ من تاريخ الإطلاق الرسمي.
    </div>
    <p style="font-size:12.5px;font-weight:700;color:#1a5c37;margin-top:14px;">باقات الدعم السنوي (اختيارية — منفصلة عن قيمة العقد):</p>
    ${supportList}
    <p style="font-size:12px;color:#3e5446;">أو الدفع بالساعة عند الحاجة: <strong>250 ${cur}/ساعة</strong> دون التزام شهري ودون أولوية في الاستجابة.</p>
    <div class="note">
      <strong>فصل اشتراك Odoo:</strong> اشتراك منصة Odoo السنوي يُدفع مباشرةً لشركة Odoo، وهو مستقل تماماً عن قيمة هذا العقد وعن رسوم الدعم الفني. ويتغيّر حسب عدد المستخدمين والباقة المختارة من Odoo.
    </div>
  </section>

  <section>
    <h2>البند السادس — أحكام عامة وحماية الحقوق</h2>
    <ol style="padding-right:22px;font-size:12.5px;">
      <li><strong style="color:#1a5c37;">الملكية الفكرية:</strong> تظل جميع التطويرات والأكواد المخصصة ملكاً للطرف الأول حتى سداد كامل القيمة (100%). وبعد السداد الكامل ينتقل حق استخدام النظام للطرف الثاني.</li>
      <li><strong style="color:#1a5c37;">حدّ المسؤولية:</strong> لا تتجاوز المسؤولية الإجمالية للطرف الأول القيمة الإجمالية المدفوعة فعلياً. ولا يكون مسؤولاً عن أي أضرار غير مباشرة أو تبعية أو خسائر أرباح أو بيانات أو توقّف أعمال.</li>
      <li><strong style="color:#1a5c37;">السرّية:</strong> يلتزم الطرفان بالمحافظة على سرّية المعلومات والبيانات المتبادلة وعدم إفشائها أو استخدامها لغير أغراض هذا العقد.</li>
      <li><strong style="color:#1a5c37;">الضمان:</strong> يضمن الطرف الأول معالجة الأخطاء البرمجية المكتشفة في نطاق العمل المتفق عليه خلال مدة الضمان.</li>
      <li><strong style="color:#1a5c37;">القوة القاهرة:</strong> لا يُسأل أي طرف عن الإخلال أو التأخير الناتج عن أسباب خارجة عن إرادته المعقولة.</li>
      <li><strong style="color:#1a5c37;">اعتماد UAT:</strong> يُعدّ اعتماد الطرف الثاني الخطي لنتائج اختبار القبول النهائي إقراراً بمطابقة النظام للمتطلبات.</li>
      <li><strong style="color:#1a5c37;">إنهاء العقد:</strong> عند رغبة الطرف الثاني في إيقاف المشروع، تبقى الدفعات المسددة غير قابلة للاسترداد مقابل الأعمال المنجزة.</li>
      <li><strong style="color:#1a5c37;">التعديلات:</strong> لا يُعتدّ بأي تعديل على هذا العقد ما لم يكن خطياً وموقّعاً من الطرفين.</li>
      <li><strong style="color:#1a5c37;">القانون والاختصاص:</strong> يخضع هذا العقد للأنظمة المعمول بها في ${esc(country)}. وعند نشوء أي نزاع يُحلّ ودياً، فإن تعذّر فالمحاكم المختصة في <strong>${esc(jurisdiction)}</strong> هي الفيصل.</li>
      <li>حُرّر هذا العقد من نسختين أصليتين بيد كل طرف نسخة للعمل بموجبها.</li>
    </ol>
  </section>

  <section>
    <h2>التوقيعات والاعتماد</h2>
    <div class="preamble">
      بالتوقيع أدناه، يُقرّ الطرفان بقراءة جميع بنود هذا العقد وملاحقه وفهمها والموافقة عليها، ويبدأ التنفيذ وفق المراحل المحددة بعد استلام الدفعة الأولى.
    </div>
    <div class="signatures">
      <div class="sign-box">
        <h4>الطرف الأول — ${esc(provider.name)}</h4>
        <div><b>الاسم:</b> ${esc(provider.rep)}</div>
        <div><b>السجل التجاري:</b> ${esc(provider.cr)}</div>
        <div><b>البريد:</b> ${esc(provider.email)}</div>
        <div class="sign-line">التوقيع والختم</div>
      </div>
      <div class="sign-box">
        <h4>الطرف الثاني — ${esc(p2.name)}</h4>
        <div><b>الاسم:</b> ${esc(p2.rep)}</div>
        <div><b>السجل التجاري:</b> ${esc(p2.cr)}</div>
        <div><b>البريد:</b> ${esc(p2.email)}</div>
        <div class="sign-line">الختم والتوقيع</div>
      </div>
    </div>
  </section>

  <footer>
    المهندس محمود عون — المدير التنفيذي · oun@businessesgates.com · 99990412 · دولة الكويت
  </footer>
</div>
</body>
</html>`;
}
