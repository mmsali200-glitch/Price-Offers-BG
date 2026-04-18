/** §1 Hero + §2 Scope + §3 Executive + §4 Features — dynamic */
import type { QuoteBuilderState } from "./builder/types";
import { ODOO_MODULES, BG_APPS } from "./modules-catalog";
import { fmtNum, curSymbol } from "./utils";

function esc(s: string) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

const ICONS: Record<string,string> = {
  crm:"🤝",sales:"💼",pos:"🛍️",inventory:"📦",purchase:"🛒",barcode:"🔖",
  mrp:"🏭",accounting:"📊",invoicing:"🧾",payroll:"💰",hr:"👤",attendance:"⏰",
  leaves:"🌴",recruitment:"🎯",project:"📋",helpdesk:"🎧",website:"🌐",
  ecommerce:"🛒",realestate:"🏢",hms:"🏥",lab:"🔬",quality:"✅",
  maintenance:"🛠️",delivery:"🚚",repair:"🔧",timesheets:"⏱️",fieldservice:"🗺️",
  expenses:"💳",subscriptions:"🔁",rental:"📅",plm:"🧬",eam:"🏭",
  livechat:"💬",elearning:"🎓",appraisals:"📈",
};

const SECTOR_AR: Record<string,string> = {trading:"تجارة وتوزيع",manufacturing:"تصنيع",services:"خدمات",healthcare:"رعاية صحية",construction:"مقاولات",realestate:"عقارات",logistics:"لوجستيات",retail:"تجزئة",food:"أغذية",education:"تعليم",government:"حكومي",other:"أعمال"};
const SECTOR_EN: Record<string,string> = {trading:"Trade & Distribution",manufacturing:"Manufacturing",services:"Services",healthcare:"Healthcare",construction:"Construction",realestate:"Real Estate",logistics:"Logistics",retail:"Retail",food:"Food & Beverage",education:"Education",government:"Government",other:"Business"};

function getMods(state: QuoteBuilderState) {
  const r: Array<{id:string;name:string;price:number;discount:number;features:string[]}> = [];
  ODOO_MODULES.forEach(c => c.modules.forEach(m => { const s = state.modules[m.id]; if(s?.selected) r.push({id:m.id,name:m.name,price:s.priceOverride??m.price,discount:s.discount,features:m.features}); }));
  return r;
}
function getBG(state: QuoteBuilderState) { return BG_APPS.filter(a => state.bgApps[a.id]?.selected).map(a => ({...a, impl: state.bgApps[a.id].implementationPrice})); }

export function renderHeroHtml(state: QuoteBuilderState, isAr: boolean): string {
  const cur = curSymbol(state.meta.currency);
  const clientName = isAr ? (state.client.nameAr||"العميل") : (state.client.nameEn||state.client.nameAr||"Client");
  const clientSub = isAr ? (state.client.nameEn||"") : (state.client.nameAr||"");
  const sector = isAr ? SECTOR_AR[state.client.sector]||"أعمال" : SECTOR_EN[state.client.sector]||"Business";
  const ref = state.meta.ref || "BG-XXXX";
  const date = state.meta.date || "";

  return `<section id="hero" style="background:linear-gradient(135deg,#1a5c37,#247a4a);padding:40px 28px;color:#fff;border-bottom:4px solid #c9a84c;position:relative;">
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:24px;">
      <div style="width:60px;height:60px;background:#fff;border-radius:14px;display:flex;align-items:center;justify-content:center;font-weight:800;color:#1a5c37;font-size:24px;">BG</div>
      <div><div style="font-size:18px;font-weight:800;">BUSINESS GATE</div><div style="font-size:11px;color:rgba(255,255,255,0.6);">Technical Consulting · بوابة الأعمال</div></div>
    </div>
    <div style="width:50px;height:3px;background:#c9a84c;border-radius:2px;margin-bottom:16px;"></div>
    <div style="font-size:14px;color:#c9a84c;margin-bottom:6px;">${isAr ? "عرض سعر مقدَّم إلى" : "Quotation Prepared For"}</div>
    <div style="font-size:28px;font-weight:800;margin-bottom:4px;">${esc(clientName)}</div>
    ${clientSub ? `<div style="font-size:16px;color:rgba(255,255,255,0.65);margin-bottom:20px;">${esc(clientSub)}</div>` : ""}
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:20px;">
      ${[
        [`${isAr?"رقم العرض":"Ref"}`, ref],
        [`${isAr?"التاريخ":"Date"}`, date],
        [`${isAr?"العملة":"Currency"}`, `${cur} (${state.meta.currency})`],
        [`${isAr?"الصلاحية":"Validity"}`, state.meta.validity],
        [`${isAr?"النظام":"System"}`, `Odoo ${state.odooVersion} ERP`],
        [`${isAr?"القطاع":"Sector"}`, sector],
      ].map(([l,v]) => `<div style="background:rgba(255,255,255,0.12);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:5px 12px;font-size:11px;"><b style="color:#c9a84c;">${l}:</b> ${esc(v||"—")}</div>`).join("")}
    </div>
  </section>`;
}

export function renderScopeHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getMods(state);
  const bgApps = getBG(state);
  const cur = curSymbol(state.meta.currency);
  const total = mods.length + bgApps.length;
  const title = isAr ? "نطاق المشروع" : "Project Scope";
  const clientName = isAr ? (state.client.nameAr || "الشركة") : (state.client.nameEn || state.client.nameAr || "the company");
  const sector = isAr ? SECTOR_AR[state.client.sector] || "الأعمال" : SECTOR_EN[state.client.sector] || "Business";
  const modNames = mods.map(m => m.name).join(isAr ? " و" : ", ");

  // Auto-generate project description
  const desc = state.projectDescription?.trim() || (isAr
    ? `يهدف هذا المشروع إلى تحويل العمليات الرقمية لشركة ${esc(clientName)} العاملة في قطاع ${esc(sector)} من خلال تطبيق نظام Odoo ${state.odooVersion} المتكامل.\n\nيشمل نطاق العمل تطبيق وتخصيص موديولات: ${esc(modNames)}.\n\nيضمن هذا النظام: توحيد البيانات في منصة واحدة، تسريع اتخاذ القرار بالتقارير الفورية، تقليل الأخطاء اليدوية، وتحسين كفاءة الفرق.`
    : `This project aims to digitally transform ${esc(clientName)} operations in the ${esc(sector)} sector through a comprehensive Odoo ${state.odooVersion} ERP implementation.\n\nScope includes: ${esc(modNames)}.\n\nThe system ensures: unified data platform, real-time decision intelligence, reduced manual errors, and improved team efficiency.`);

  let html = `<section id="scope" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">02</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div>
      <div style="font-size:11px;color:#7a8e80;">${total} Odoo ${state.odooVersion} ${isAr ? "موديول" : "modules"} | ${isAr ? SECTOR_AR[state.client.sector] || "" : SECTOR_EN[state.client.sector] || ""}</div></div>
    </div>

    <!-- وصف المشروع -->
    <div style="background:#f7f9f6;border:1px solid #e2e8e3;border-right:3px solid #1a5c37;border-radius:8px;padding:16px 18px;margin-bottom:20px;font-size:12px;color:#3e5446;line-height:1.8;white-space:pre-line;">${esc(desc)}</div>

    <!-- بطاقات الموديولات -->
    <div style="font-size:11px;font-weight:700;color:#7a8e80;text-transform:uppercase;letter-spacing:0.8px;margin-bottom:10px;">${isAr ? "الموديولات المشمولة" : "Included Modules"}</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:10px;">`;

  mods.forEach(m => {
    html += `<div style="background:#fff;border:1px solid #e2e8e3;border-radius:8px;padding:12px;text-align:center;box-shadow:0 2px 8px rgba(26,92,55,0.06);">
      <div style="font-size:20px;margin-bottom:4px;">${ICONS[m.id] || "📦"}</div>
      <div style="font-size:11px;font-weight:700;color:#141f18;">${esc(m.name)}</div>
      <div style="font-size:9px;color:#7a8e80;margin-top:2px;">${m.features.slice(0, 2).join(" · ")}</div>
    </div>`;
  });
  bgApps.forEach(a => {
    html += `<div style="background:#fdf5e0;border:1px solid #c9a84c;border-radius:8px;padding:12px;text-align:center;">
      <div style="font-size:8px;font-weight:800;background:#c9a84c;color:#1a5c37;display:inline-block;padding:1px 6px;border-radius:8px;margin-bottom:4px;">BG</div>
      <div style="font-size:11px;font-weight:700;color:#8a6010;">${esc(a.name.split("—")[0] || a.name)}</div>
    </div>`;
  });

  html += `</div>`;

  // شروط خاصة (إن وجدت)
  if (state.extraNotes?.trim()) {
    html += `<div style="background:#fdf5e0;border:1px solid #c9a84c;border-radius:8px;padding:12px 16px;margin-top:16px;">
      <div style="font-size:11px;font-weight:700;color:#8a6010;margin-bottom:4px;">⚠️ ${isAr ? "شروط وملاحظات خاصة" : "Special Terms"}</div>
      <div style="font-size:11px;color:#3e5446;line-height:1.6;white-space:pre-line;">${esc(state.extraNotes)}</div>
    </div>`;
  }

  html += `</section>`;
  return html;
}

export function renderExecHtml(state: QuoteBuilderState, isAr: boolean): string {
  const client = isAr ? state.client.nameAr : (state.client.nameEn||state.client.nameAr);
  const mods = getMods(state);
  const title = isAr ? "الملخص التنفيذي" : "Executive Summary";
  const cards = isAr ? [
    {icon:"🏗️",t:"منصة موحّدة",d:`جميع العمليات (${mods.length} موديول) في منظومة Odoo ${state.odooVersion} واحدة — بدون بيانات مكررة`},
    {icon:"⚡",t:"قرارات فورية",d:`تقارير ولوحات تحكم حية تمنح ${esc(client||"")} رؤية فورية للأداء المالي والتشغيلي`},
    {icon:"🌱",t:"نمو مستدام",d:`النظام يتوسع مع نمو الشركة — موديولات جديدة ومستخدمين إضافيين بدون إعادة تأسيس`},
  ] : [
    {icon:"🏗️",t:"Unified Platform",d:`All ${mods.length} modules in a single Odoo ${state.odooVersion} environment — no data silos`},
    {icon:"⚡",t:"Instant Intelligence",d:`Real-time dashboards give ${esc(client||"")} immediate visibility into operations`},
    {icon:"🌱",t:"Sustainable Growth",d:`The platform scales with your business — add modules and users without rebuilding`},
  ];

  return `<section id="exec" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#f7f9f6;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">03</div>
      <div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;">
      ${cards.map(c => `<div style="background:#fff;border:1px solid #e2e8e3;border-radius:10px;padding:18px;box-shadow:0 2px 8px rgba(26,92,55,0.06);">
        <div style="font-size:28px;margin-bottom:8px;">${c.icon}</div>
        <div style="font-size:13px;font-weight:700;color:#1a5c37;margin-bottom:6px;">${c.t}</div>
        <div style="font-size:11px;color:#3e5446;line-height:1.6;">${c.d}</div>
      </div>`).join("")}
    </div>
  </section>`;
}

export function renderFeaturesHtml(state: QuoteBuilderState, isAr: boolean): string {
  const title = isAr ? "المميزات الإضافية المشمولة" : "Exclusive Features Included";
  const sub = isAr ? "قيمة مضافة مع كل مشروع من Business Gate" : "Added value with every Business Gate project";
  const items = isAr ? [
    {icon:"🔗",t:"تكامل كامل",d:"جميع الموديولات تتواصل تلقائياً"},
    {icon:"📱",t:"دعم الجوال",d:"وصول كامل من أي جهاز"},
    {icon:"📊",t:"تقارير مؤتمتة",d:"لوحات تحكم ومؤشرات أداء"},
    {icon:"🎓",t:"تدريب وتوثيق",d:"جلسات تدريب + دليل مستخدم"},
    {icon:"🔐",t:"صلاحيات متعددة",d:"تحكم دقيق بمن يرى ماذا"},
    {icon:"🔄",t:"تحديثات مستمرة",d:"تطوير وتحسين مستمر"},
  ] : [
    {icon:"🔗",t:"Full Integration",d:"All modules communicate seamlessly"},
    {icon:"📱",t:"Mobile-Ready",d:"Full access from any device"},
    {icon:"📊",t:"Automated Reports",d:"Dashboards and KPIs"},
    {icon:"🎓",t:"Training & Docs",d:"Training sessions + user guide"},
    {icon:"🔐",t:"Access Control",d:"Fine-grained permissions"},
    {icon:"🔄",t:"Continuous Updates",d:"Ongoing development"},
  ];

  return `<section id="feat" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">04</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div><div style="font-size:11px;color:#7a8e80;">${sub}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
      ${items.map(i => `<div style="display:flex;gap:10px;align-items:flex-start;background:#f7f9f6;border:1px solid #e2e8e3;border-radius:8px;padding:14px;">
        <div style="font-size:22px;flex-shrink:0;">${i.icon}</div>
        <div><div style="font-size:12px;font-weight:700;color:#1a5c37;">${i.t}</div><div style="font-size:10px;color:#3e5446;margin-top:2px;">${i.d}</div></div>
      </div>`).join("")}
    </div>
  </section>`;
}
