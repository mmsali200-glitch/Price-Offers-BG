/**
 * Server-side quote renderer — bilingual.
 *
 * Selects the canonical template based on state.language:
 *   - "ar" → samples/reference-arabic.html (Osama Al-Sayed sample)
 *   - "en" → samples/reference-quote.html (IMKAN sample)
 *
 * Then substitutes client name, ref, prices, modules, phases, dates,
 * and contact info from the builder state. Runs in milliseconds with
 * zero API calls — output is guaranteed to match the approved design.
 */

import { getReferenceTemplateAr, getReferenceTemplateEn } from "./reference-template";
import type { QuoteBuilderState } from "./builder/types";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "./modules-catalog";
import { fmtNum, curSymbol, fmtDateArabic } from "./utils";
import { PRINT_CSS } from "./print-css";
import {
  renderRequirementsHtml,
  renderMeetingNotesHtml,
  renderDescriptionHtml,
} from "./render-dynamic-sections";
import {
  renderModuleDetailsHtml,
  renderWorkflowsHtml,
  renderPhasesHtml,
  renderPricingHtml,
  renderInstallmentsHtml,
} from "./render-dynamic-sections-2";
import {
  renderHeroHtml,
  renderScopeHtml,
  renderExecHtml,
  renderFeaturesHtml,
} from "./render-sections-hero";
import {
  renderSupportHtml,
  renderTermsHtml,
  renderSignatureHtml,
} from "./render-sections-footer";

/** Inject the shared professional print stylesheet just before </head>. */
function injectPrintStyles(html: string): string {
  if (html.includes('id="bg-print-styles"')) return html;
  return html.replace(/<\/head>/i, `${PRINT_CSS}\n</head>`);
}

/**
 * Inject all dynamic sections (requirements, description, workflows,
 * meeting notes) before the signature/terms section or before </body>.
 * Also REMOVES the static "responsibilities" section from the template
 * to avoid duplication with the dynamic requirements.
 */
function injectDynamicSections(html: string, state: QuoteBuilderState, isAr: boolean): string {
  let h = html;

  // Remove ALL static sections — everything is now dynamic.
  const allIds = [
    "hero", "scope", "overview", "exec", "executive", "feat", "features",
    "mods", "modules", "flows", "workflows", "phases", "plan",
    "resp", "responsibilities", "reqs",
    "pricing", "configurator",
    "financial", "fin", "items",
    "inst", "installments", "schedule",
    "support", "terms", "sign",
  ];
  allIds.forEach((id) => {
    h = h.replace(
      new RegExp(`<section[^>]*(?:id="${id}"|class="[^"]*(?:hero|section)[^"]*"\\s+id="${id}")[^>]*>[\\s\\S]*?<\\/section>`, "gi"),
      ""
    );
  });

  // Build ALL sections dynamically in order.
  const sections = [
    renderHeroHtml(state, isAr),
    renderScopeHtml(state, isAr),
    renderExecHtml(state, isAr),
    renderFeaturesHtml(state, isAr),
    renderModuleDetailsHtml(state, isAr),
    renderWorkflowsHtml(state, isAr),
    renderPhasesHtml(state, isAr),
    renderRequirementsHtml(state, isAr),
    renderPricingHtml(state, isAr),
    renderInstallmentsHtml(state, isAr),
    renderSupportHtml(state, isAr),
    renderMeetingNotesHtml(state, isAr),
    renderTermsHtml(state, isAr),
    renderSignatureHtml(state, isAr),
  ].filter(Boolean).join("\n");

  if (!sections) return h;

  const signPatterns = [
    /(<section[^>]*id="sign")/i,
    /(<section[^>]*id="terms")/i,
    /(<!-- ═+\s*§?\s*1[45]\s)/i,
    /(<!-- ={3,}\s*SIGN)/i,
    /(<!-- ={3,}\s*1[45])/i,
  ];

  for (const pat of signPatterns) {
    if (pat.test(h)) {
      return h.replace(pat, `${sections}\n$1`);
    }
  }

  return h.replace(/<\/body>/i, `${sections}\n</body>`);
}

/** Module icons for the scope grid. */
const MODULE_ICONS: Record<string, string> = {
  crm: "🤝", sales: "💼", pos: "🛍️", subscriptions: "🔁", rental: "📅",
  inventory: "📦", purchase: "🛒", barcode: "🔖", delivery: "🚚", repair: "🔧",
  mrp: "🏭", plm: "🧬", maintenance: "🛠️", quality: "✅",
  accounting: "📊", invoicing: "🧾", expenses: "💳", payroll: "💰",
  hr: "👤", recruitment: "🎯", leaves: "🌴", appraisals: "📈", attendance: "⏰",
  project: "📋", timesheets: "⏱️", fieldservice: "🗺️", helpdesk: "🎧",
  website: "🌐", ecommerce: "🛒", elearning: "🎓", livechat: "💬",
  realestate: "🏢", eam: "🏭", hms: "🏥", lab: "🔬",
};

const SECTOR_EN: Record<string, string> = {
  trading: "Trade & Distribution", manufacturing: "Manufacturing",
  services: "Professional Services", healthcare: "Healthcare",
  construction: "Construction", realestate: "Real Estate",
  logistics: "Logistics & Transport", retail: "Retail",
  food: "Food & Beverage", education: "Education",
  government: "Government", other: "Business",
};

const SECTOR_AR: Record<string, string> = {
  trading: "تجارة وتوزيع", manufacturing: "تصنيع وإنتاج",
  services: "خدمات مهنية", healthcare: "رعاية صحية",
  construction: "مقاولات وتشييد", realestate: "عقارات وأملاك",
  logistics: "لوجستيات ونقل", retail: "تجزئة ومتاجر",
  food: "أغذية ومطاعم", education: "تعليم وتدريب",
  government: "جهة حكومية", other: "أعمال",
};

const SIZE_EN: Record<string, string> = {
  small: "< 20 Employees", medium: "20–100 Employees",
  large: "100–500 Employees", enterprise: "500+ Employees",
};

const SIZE_AR: Record<string, string> = {
  small: "أقل من 20 موظف", medium: "20–100 موظف",
  large: "100–500 موظف", enterprise: "أكثر من 500 موظف",
};

type SelectedModule = {
  id: string; name: string; price: number;
  discount: number; separate: boolean; features: string[];
};

function getSelectedModules(state: QuoteBuilderState): SelectedModule[] {
  const result: SelectedModule[] = [];
  ODOO_MODULES.forEach((cat) => {
    cat.modules.forEach((m) => {
      const st = state.modules[m.id];
      if (st?.selected) {
        result.push({
          id: m.id, name: m.name,
          price: st.priceOverride ?? m.price,
          discount: st.discount, separate: st.separate, features: m.features,
        });
      }
    });
  });
  return result;
}

function getSelectedBGApps(state: QuoteBuilderState) {
  return BG_APPS.filter((a) => state.bgApps[a.id]?.selected).map((a) => ({
    ...a,
    implementationPrice: state.bgApps[a.id].implementationPrice,
    monthlyPrice: state.bgApps[a.id].monthlyPrice,
  }));
}

function computeTotals(state: QuoteBuilderState) {
  const mods = getSelectedModules(state);
  const bgApps = getSelectedBGApps(state);
  const modulesAfterItemDiscount = mods.reduce(
    (s, m) => s + Math.round(m.price * (1 - (m.discount || 0) / 100)),
    0
  );
  const modulesBeforeDiscount = mods.reduce((s, m) => s + m.price, 0);
  const bgImpl = bgApps.reduce((s, a) => s + a.implementationPrice, 0);
  const bgMonthly = bgApps.reduce((s, a) => s + a.monthlyPrice, 0);
  const devRaw = modulesAfterItemDiscount + bgImpl;
  const development = Math.round(devRaw * (1 - (state.totalDiscount || 0) / 100));
  const licMonthly = Math.round(
    state.license.serverMonthly + state.license.perUserMonthly * state.license.users
  );
  const pkg = SUPPORT_PACKAGES.find((p) => p.id === state.support.packageId);
  const supportMonthly = state.support.packageId === "none"
    ? 0
    : state.support.prices[state.support.packageId as "basic" | "advanced" | "premium"] ?? pkg?.price ?? 0;
  const months = state.license.licenseMonths || 12;
  const odooCost = state.license.includeOdooInTotal ? licMonthly * months : 0;
  const annualLicense = licMonthly * 12;
  const grandTotalY1 = development + annualLicense;
  const firstInstallment = Math.round(
    grandTotalY1 * (state.payment.firstPaymentPct || 30) / 100
  );
  return {
    modules: modulesAfterItemDiscount, modulesBeforeDiscount,
    modulesSaved: modulesBeforeDiscount - modulesAfterItemDiscount,
    bgImpl, bgMonthly, development, developmentRaw: devRaw,
    totalDiscountAmount: devRaw - development,
    licMonthly, supportMonthly, annualLicense, odooCost,
    grandTotalY1, firstInstallment, licenseMonths: months,
  };
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function getContact(state: QuoteBuilderState) {
  return state.contacts.find((c) => c.id === state.selectedContactId) || state.contacts[0];
}

// ──────────────────────────────────────────────────────────────────
// ENGLISH RENDERER (IMKAN reference)
// ──────────────────────────────────────────────────────────────────
function renderEnglish(state: QuoteBuilderState): string {
  let html = getReferenceTemplateEn();
  const totals = computeTotals(state);
  const cur = curSymbol(state.meta.currency);
  const mods = getSelectedModules(state);
  const bgApps = getSelectedBGApps(state);
  const contact = getContact(state);
  const allMods = [
    ...mods,
    ...bgApps.map((a) => ({
      id: a.id, name: a.name, price: a.implementationPrice, discount: 0,
      separate: false, features: a.features,
    } as SelectedModule)),
  ];
  const modCount = allMods.length;
  const ref = state.meta.ref || "BG-XXXX-XXX-XXX";
  const clientEn = state.client.nameEn || state.client.nameAr || "Client";
  const clientAr = state.client.nameAr || "";
  const dateText = state.meta.date || "";
  const version = state.odooVersion || "18";
  const sector = SECTOR_EN[state.client.sector] || "Business";
  const size = SIZE_EN[state.client.employeeSize] || "";
  const discountPct = totals.modulesBeforeDiscount > 0 && totals.modulesSaved > 0
    ? Math.round((totals.modulesSaved / totals.modulesBeforeDiscount) * 100) : 0;
  const startDate = state.payment.startDate ? fmtDateArabic(state.payment.startDate) : dateText;

  const r: Array<[RegExp, string]> = [
    [/BG202604186/g, ref],
    [/IMKAN(?!&amp;)/g, clientEn],
    [/إمكان الدولية/g, clientAr],
    [/April 2026/g, dateText || "—"],
    [/May 1, 2026/g, startDate],
    [/Odoo 18 ERP/g, `Odoo ${version} ERP`],
    [/Odoo 18/g, `Odoo ${version}`],
    [/11 Odoo 18 modules/g, `${modCount} Odoo ${version} modules`],
    [/11 Odoo 18/g, `${modCount} Odoo ${version}`],
    [/11 modules/g, `${modCount} modules`],
    [/11 business functions/g, `${modCount} business functions`],
    [/All 11/g, `All ${modCount}`],
    [/>11<\/div>/g, `>${modCount}</div>`],
    [/Trade &amp; Distribution/g, sector],
    [/Trade & Distribution/g, sector],
    [/20–100 Employees/g, size],
    [/20–100 employees/g, size.toLowerCase()],
    [/30 Days/g, state.meta.validity || "30 Days"],
    [/30 days/g, (state.meta.validity || "30 days").toLowerCase()],
    [/\b5 Users\b/g, `${state.license.users} Users`],
    [/\b5 users\b/g, `${state.license.users} users`],
    [/8,146/g, fmtNum(totals.development)],
    [/9,051/g, fmtNum(totals.developmentRaw)],
    [/\b905\b/g, fmtNum(totals.modulesSaved || 905)],
    [/2,100/g, fmtNum(totals.annualLicense)],
    [/10,200/g, fmtNum(totals.grandTotalY1)],
    [/\b635\b/g, fmtNum(totals.licMonthly + totals.supportMonthly)],
    [/3,060/g, fmtNum(totals.firstInstallment)],
    [/\b185\b/g, fmtNum(totals.licMonthly)],
    [/\b175\b/g, fmtNum(totals.licMonthly)],
    [/KWD د\.ك/g, `${state.meta.currency} ${cur}`],
    [/د\.ك/g, cur],
    [/After 10% discount/g, discountPct > 0 ? `After ${discountPct}% discount` : "After group discount"],
    [/10% Discount/g, discountPct > 0 ? `${discountPct}% Discount` : "Group Discount"],
    [/10% disc/g, discountPct > 0 ? `${discountPct}% disc` : "disc"],
    [/10% group discount/g, discountPct > 0 ? `${discountPct}% group discount` : "group discount"],
    [/Eng\. Mahmoud Oun/g, escapeHtml(contact.name || "Eng. Mahmoud Oun")],
    [/CEO &amp; Co-Founder/g, escapeHtml(contact.role || "CEO & Co-Founder")],
    [/CEO & Co-Founder/g, escapeHtml(contact.role || "CEO & Co-Founder")],
    [/OUN@businessesgates\.com/g, contact.email || "OUN@businessesgates.com"],
    [/\+965 9999 0412/g, contact.phone || "+965 9999 0412"],
  ];
  r.forEach(([pattern, value]) => { html = html.replace(pattern, value); });

  // Module cards grid
  const moduleCards = allMods.map((m) => {
    const icon = MODULE_ICONS[m.id] || "📦";
    const snippet = (m.features || []).slice(0, 3).join(" · ");
    return `        <div class="mod-card">
          <div class="mod-icon">${icon}</div>
          <div class="mod-name">${escapeHtml(m.name)}</div>
          <div class="mod-features">${escapeHtml(snippet)}</div>
        </div>`;
  }).join("\n");
  if (moduleCards) {
    html = html.replace(
      /(<div class="mod-grid">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- ═══ §3)/,
      (_m, open, _body, close) => `${open}\n${moduleCards}\n      ${close}`
    );
  }

  // Configurator JS vars
  html = html.replace(/var BASE\s*=\s*[^;]+;/, `var BASE = ${totals.development};`);
  html = html.replace(/var licCost\s*=\s*[^;]+;/, `var licCost = ${totals.licMonthly};`);
  html = html.replace(/var supCost\s*=\s*[^;]+;/, `var supCost = ${totals.supportMonthly};`);

  // Enforce LTR + English at the <html> level
  html = html.replace(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="en" dir="ltr">`);

  // ── Inject dynamic sections before the signature/closing ──
  html = injectDynamicSections(html, state, false);

  return html;
}

// ──────────────────────────────────────────────────────────────────
// ARABIC RENDERER (Osama Al-Sayed reference)
// ──────────────────────────────────────────────────────────────────
function renderArabicModuleCards(
  mods: SelectedModule[],
  bgApps: Array<{ id: string; name: string; implementationPrice: number; description: string }>,
  cur: string
): string {
  const regular = mods.map((m) => {
    const icon = MODULE_ICONS[m.id] || "📦";
    const snippet = (m.features || []).slice(0, 1).join("، ") ||
      `ميزات ${m.name}`;
    return `        <div class="mod-card">
          <div class="mod-icon">${icon}</div>
          <h4>${escapeHtml(m.name)}</h4>
          <p>${escapeHtml(snippet)}</p>
          <div class="price">${fmtNum(m.price)} ${cur}</div>
        </div>`;
  }).join("\n");

  const bg = bgApps.map((a) => {
    const icon = MODULE_ICONS[a.id] || "⭐";
    const shortDesc = a.description.length > 80 ? a.description.slice(0, 77) + "..." : a.description;
    return `        <div class="mod-card gold">
          <div class="tag">حصري</div>
          <div class="mod-icon">${icon}</div>
          <h4>${escapeHtml(a.name.split(" — ")[0] || a.name)}</h4>
          <p>${escapeHtml(shortDesc)}</p>
          <div class="price">${fmtNum(a.implementationPrice)} ${cur}</div>
        </div>`;
  }).join("\n");

  return [regular, bg].filter(Boolean).join("\n");
}

function renderArabic(state: QuoteBuilderState): string {
  let html = getReferenceTemplateAr();
  const totals = computeTotals(state);
  const cur = curSymbol(state.meta.currency);
  const mods = getSelectedModules(state);
  const bgApps = getSelectedBGApps(state);
  const contact = getContact(state);
  const modCount = mods.length + bgApps.length;

  const ref = state.meta.ref || "BG-XXXX-XXX-XXX";
  const clientAr = state.client.nameAr || "العميل";
  const clientEn = state.client.nameEn || clientAr;
  const dateText = state.meta.date || "أبريل 2026";
  const version = state.odooVersion || "18";
  const sector = SECTOR_AR[state.client.sector] || "أعمال";
  const size = SIZE_AR[state.client.employeeSize] || "";
  const startDate = state.payment.startDate ? fmtDateArabic(state.payment.startDate) : "23 أبريل 2026";

  const country = state.client.country || "الكويت";
  const governorate = state.client.governorate || "";
  const city = state.client.city || "";
  const address = state.client.address || "";
  const website = state.client.website || "www.businessesgates.com";

  // ── Ordered string replacements ───────────────────────────
  const r: Array<[RegExp, string]> = [
    // Ref (multiple places)
    [/BG-2026-OSG-5220/g, ref],
    // Client names
    [/شركة أسامة السيد لمصنع الذهب/g, escapeHtml(clientAr)],
    [/Osama Al-Sayed Gold Factory Co\./g, escapeHtml(clientEn)],
    // Location (only replace when the user picked a non-Kuwait country)
    ...(country !== "الكويت"
      ? [[/دولة الكويت/g, escapeHtml(`دولة ${country}`)] as [RegExp, string]]
      : []),
    // Dates
    [/23 أبريل 2026/g, startDate],
    [/أبريل 2026/g, dateText],
    // Odoo version
    [/Odoo 18 ERP/g, `Odoo ${version} ERP`],
    [/Odoo 18/g, `Odoo ${version}`],
    // Sector + validity
    [/تجارة وتوزيع/g, escapeHtml(sector)],
    [/30 يوم/g, state.meta.validity || "30 يوم"],
    // Financial values (from the sample totals)
    [/7,211 د\.ك/g, `${fmtNum(totals.development)} ${cur}`],
    [/6,461 د\.ك/g, `${fmtNum(totals.modules)} ${cur}`],
    [/\b7,211\b/g, fmtNum(totals.development)],
    [/\b6,461\b/g, fmtNum(totals.modules)],
    [/\b3,354\b/g, fmtNum(totals.firstInstallment)],
    [/\b2,203\b/g, fmtNum(Math.round(totals.grandTotalY1 / 3))],
    // Contact details
    [/م\. أسامة أحمد/g, escapeHtml(contact.name || "م. أسامة أحمد")],
    [/osama@businessesgates\.com/g, contact.email || "osama@businessesgates.com"],
    [/\+965 6996 8508/g, contact.phone || "+965 6996 8508"],
    [/\+965 9999 0412/g, contact.phone || "+965 9999 0412"],
    // Currency
    [/د\.ك \(KWD\)/g, `${cur} (${state.meta.currency})`],
    [/د\.ك/g, cur],
  ];
  r.forEach(([pattern, value]) => { html = html.replace(pattern, value); });

  // ── Rebuild the module cards grid from the user's selections ──
  const moduleCards = renderArabicModuleCards(mods, bgApps, cur);
  if (moduleCards) {
    // Target the <div class="mod-grid"> block inside the modules section
    html = html.replace(
      /(<h3[^>]*>الموديولات المشمولة<\/h3>\s*<div class="mod-grid">)([\s\S]*?)(<\/div>\s*<\/section>)/,
      (_m, open, _body, close) => `${open}\n${moduleCards}\n      ${close}`
    );
  }

  // ── Patch Configurator JS vars ────────────────────────────
  html = html.replace(/var BASE\s*=\s*[^;]+;/, `var BASE = ${totals.development};`);
  html = html.replace(/var licCost\s*=\s*[^;]+;/, `var licCost = ${totals.licMonthly};`);
  html = html.replace(/var supCost\s*=\s*[^;]+;/, `var supCost = ${totals.supportMonthly};`);

  // ── Patch mod count and user count if such placeholders exist ──
  html = html.replace(/(<div class="lbl">عدد المستخدمين<\/div>\s*<div class="val">)[^<]+(<\/div>)/g,
    `$1${state.license.users} مستخدم$2`);
  html = html.replace(/(<div class="lbl">عدد الموديولات<\/div>\s*<div class="val">)[^<]+(<\/div>)/g,
    `$1${modCount}$2`);

  // Ensure correct document direction + language
  html = html.replace(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="ar" dir="rtl">`);

  // ── Inject dynamic sections ──
  html = injectDynamicSections(html, state, true);

  return html;
}

/**
 * Main render function — builds 100% dynamic HTML.
 * Uses the reference template ONLY for its CSS/fonts, then replaces
 * ALL body content with dynamically generated sections.
 */
export function renderQuoteHtml(state: QuoteBuilderState): string {
  const isAr = state.language === "ar";
  const template = isAr ? getReferenceTemplateAr() : getReferenceTemplateEn();

  // Extract <head> content (CSS + fonts) from the template.
  const headMatch = template.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch?.[1] ?? "";

  // Build ALL sections dynamically from the Builder state.
  const sections = [
    renderHeroHtml(state, isAr),
    renderScopeHtml(state, isAr),
    renderExecHtml(state, isAr),
    renderFeaturesHtml(state, isAr),
    renderModuleDetailsHtml(state, isAr),
    renderWorkflowsHtml(state, isAr),
    renderPhasesHtml(state, isAr),
    renderRequirementsHtml(state, isAr),
    renderPricingHtml(state, isAr),
    renderInstallmentsHtml(state, isAr),
    renderSupportHtml(state, isAr),
    renderMeetingNotesHtml(state, isAr),
    renderTermsHtml(state, isAr),
    renderSignatureHtml(state, isAr),
  ].filter(Boolean).join("\n");

  const dir = isAr ? "rtl" : "ltr";
  const lang = isAr ? "ar" : "en";
  const font = isAr
    ? "'Noto Sans Arabic', 'Inter', sans-serif"
    : "'Inter', 'Noto Sans Arabic', sans-serif";


  const contact = state.contacts?.find(c => c.id === state.selectedContactId) || state.contacts?.[0];
  const cName = contact?.name || "م. محمود عون";
  const cEmail = contact?.email || "OUN@businessesgates.com";
  const cPhone = contact?.phone || "+965 9999 0412";

  const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${state.meta.ref || "BG Quote"} — ${state.client.nameAr || "Quote"}</title>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
<style>
  :root{--green:#1a5c37;--green2:#247a4a;--gold:#c9a84c;--gold2:#e0bc5a;--goldlt:#fdf5e0;--bg:#f5f6f4;--bgcard:#fff;--bggray:#f0f2ef;--gline:#e2e8e3;--tdark:#141f18;--tmid:#3e5446;--tgray:#7a8e80;--green-lt:#eaf3ed;--gold-lt:#fdf5e0}
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{font-family:${font};background:var(--bg);color:var(--tdark);font-size:14px;line-height:1.7;direction:${dir}}
  a{color:inherit;text-decoration:none}
  .doc{max-width:900px;margin:0 auto;background:#fff;min-height:100vh;box-shadow:0 0 30px rgba(0,0,0,.08)}
  .hdr{background:linear-gradient(135deg,#1a5c37,#247a4a);padding:14px 24px;display:flex;align-items:center;justify-content:space-between;border-bottom:3px solid #c9a84c}
  .hdr-logo{display:flex;align-items:center;gap:10px}
  .hdr-logo .lb{width:42px;height:42px;background:#c9a84c;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:17px;color:#1a5c37;font-family:Inter,sans-serif}
  .hdr-logo .lt{color:#fff;font-weight:800;font-size:15px;font-family:Inter,sans-serif;letter-spacing:.3px}
  .hdr-logo .ls{color:#c9a84c;font-size:9px;font-family:Inter,sans-serif}
  .hdr-ref{color:rgba(255,255,255,.65);font-size:10px;font-family:Inter,monospace;text-align:right}
  .ftr{background:#1a5c37;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:10px}
  .ftr-brand{display:flex;align-items:center;gap:10px}
  .ftr-brand .fb{width:30px;height:30px;background:#c9a84c;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:12px;color:#1a5c37;font-family:Inter,sans-serif}
  .ftr-info{font-size:10px;color:rgba(255,255,255,.8);line-height:1.6}
  .ftr-info strong{color:#fff}
  .ftr-contact{font-size:9px;color:rgba(255,255,255,.7);text-align:${isAr ? "left" : "right"};line-height:1.7}
  .ftr-contact a{color:#c9a84c}
  @media print{
    @page{size:A4 portrait;margin:10mm 12mm}
    *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important;box-shadow:none!important}
    body{background:#fff!important}
    .doc{max-width:100%;box-shadow:none}
    section{page-break-inside:avoid!important}
    h1,h2,h3,h4{page-break-after:avoid!important}
    table{font-size:10px!important}
    thead{display:table-header-group!important}
    tr{page-break-inside:avoid!important}
    p{orphans:3;widows:3}
  }
  @media(max-width:600px){.doc{margin:0}section{padding:16px 12px!important}}
</style>
${PRINT_CSS}
</head>
<body>
<div class="doc">

  <div class="hdr">
    <div class="hdr-logo">
      <div class="lb">BG</div>
      <div>
        <div class="lt">BUSINESS GATE</div>
        <div class="ls">Technical Consulting · بوابة الأعمال للاستشارات التقنية</div>
      </div>
    </div>
    <div class="hdr-ref">
      <div>${state.meta.ref || ""}</div>
      <div>${state.meta.date || ""}</div>
    </div>
  </div>

${sections}

  <div class="ftr">
    <div class="ftr-brand">
      <div class="fb">BG</div>
      <div class="ftr-info">
        <div><strong>Business Gate Technical Consulting</strong></div>
        <div>بوابة الأعمال للاستشارات التقنية</div>
      </div>
    </div>
    <div class="ftr-contact">
      <div><a href="https://www.businessesgates.com">www.businessesgates.com</a></div>
      <div>${cName} · ${cEmail} · ${cPhone}</div>
      <div>${isAr ? "دولة الكويت" : "State of Kuwait"}</div>
    </div>
  </div>

</div>
</body>
</html>`;

  return html;
}
