/**
 * Server-side quote renderer.
 *
 * Takes a QuoteBuilderState and returns the final HTML by loading the
 * approved reference template (samples/reference-quote.html) and
 * substituting dynamic values — client name, ref, modules, prices, dates.
 *
 * This runs on the server in milliseconds with zero API calls. The
 * output is guaranteed to match the approved visual design.
 */

import { getReferenceTemplate } from "./reference-template";
import type { QuoteBuilderState } from "./builder/types";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "./modules-catalog";
import { fmtNum, curSymbol, fmtDateArabic } from "./utils";

/** Module icon/name map for the scope grid — matches the visual style. */
const MODULE_ICONS: Record<string, string> = {
  crm: "🤝",
  sales: "💼",
  pos: "🛍️",
  subscriptions: "🔁",
  rental: "📅",
  inventory: "📦",
  purchase: "🛒",
  barcode: "🔖",
  delivery: "🚚",
  repair: "🔧",
  mrp: "🏭",
  plm: "🧬",
  maintenance: "🛠️",
  quality: "✅",
  accounting: "📊",
  invoicing: "🧾",
  expenses: "💳",
  payroll: "💰",
  hr: "👤",
  recruitment: "🎯",
  leaves: "🌴",
  appraisals: "📈",
  attendance: "⏰",
  project: "📋",
  timesheets: "⏱️",
  fieldservice: "🗺️",
  helpdesk: "🎧",
  website: "🌐",
  ecommerce: "🛍️",
  elearning: "🎓",
  livechat: "💬",
  realestate: "🏢",
  eam: "🏭",
  hms: "🏥",
  lab: "🔬",
};

const SECTOR_LABELS_EN: Record<string, string> = {
  trading: "Trade & Distribution",
  manufacturing: "Manufacturing & Production",
  services: "Professional Services",
  healthcare: "Healthcare",
  construction: "Construction",
  realestate: "Real Estate",
  logistics: "Logistics & Transport",
  retail: "Retail",
  food: "Food & Beverage",
  education: "Education & Training",
  government: "Government",
  other: "Other",
};

const SIZE_LABELS_EN: Record<string, string> = {
  small: "< 20 Employees",
  medium: "20–100 Employees",
  large: "100–500 Employees",
  enterprise: "500+ Employees",
};

function getSelectedModules(state: QuoteBuilderState) {
  const result: Array<{ id: string; name: string; price: number; discount: number; separate: boolean; features: string[] }> = [];
  ODOO_MODULES.forEach((cat) => {
    cat.modules.forEach((m) => {
      const st = state.modules[m.id];
      if (st?.selected) {
        result.push({
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
  const modulesRaw = mods.reduce((s, m) => s + Math.round(m.price * (1 - (m.discount || 0) / 100)), 0);
  const modulesBeforeDiscount = mods.reduce((s, m) => s + m.price, 0);
  const bgImpl = bgApps.reduce((s, a) => s + a.implementationPrice, 0);
  const bgMonthly = bgApps.reduce((s, a) => s + a.monthlyPrice, 0);
  const devRaw = modulesRaw + bgImpl;
  const development = Math.round(devRaw * (1 - (state.totalDiscount || 0) / 100));
  const licMonthly = Math.round(state.license.serverMonthly + state.license.perUserMonthly * state.license.users);
  const pkg = SUPPORT_PACKAGES.find((p) => p.id === state.support.packageId);
  const supportMonthly = state.support.packageId === "none" ? 0 : state.support.prices[state.support.packageId as "basic" | "advanced" | "premium"] ?? pkg?.price ?? 0;
  const installments = state.payment.installments > 1 ? Math.round(development / state.payment.installments) : 0;
  const annualLicense = licMonthly * 12;
  const grandTotalY1 = development + annualLicense;
  const firstInstallment = Math.round(grandTotalY1 * (state.payment.firstPaymentPct || 30) / 100);
  return {
    modules: modulesRaw,
    modulesBeforeDiscount,
    bgImpl,
    bgMonthly,
    development,
    developmentRaw: devRaw,
    licMonthly,
    supportMonthly,
    installments,
    totalMonthly: licMonthly + supportMonthly + bgMonthly,
    annualLicense,
    grandTotalY1,
    firstInstallment,
  };
}

/** Build the module cards grid HTML (replacing the hardcoded 11 in the template). */
function renderModuleCards(state: QuoteBuilderState): string {
  const mods = getSelectedModules(state);
  if (mods.length === 0) return "";
  return mods
    .map((m) => {
      const icon = MODULE_ICONS[m.id] || "📦";
      const snippet = (m.features || []).slice(0, 3).join(" · ");
      return `        <div class="mod-card">
          <div class="mod-icon">${icon}</div>
          <div class="mod-name">${escapeHtml(m.name)}</div>
          <div class="mod-features">${escapeHtml(snippet)}</div>
        </div>`;
    })
    .join("\n");
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function getContact(state: QuoteBuilderState) {
  return state.contacts.find((c) => c.id === state.selectedContactId) || state.contacts[0];
}

/**
 * Main render function. Loads the reference template and substitutes
 * the dynamic fields with values derived from the builder state.
 */
export function renderQuoteHtml(state: QuoteBuilderState): string {
  let html = getReferenceTemplate();
  const totals = computeTotals(state);
  const cur = curSymbol(state.meta.currency);
  const mods = getSelectedModules(state);
  const modCount = mods.length;
  const contact = getContact(state);

  // ── Core values ─────────────────────────────────────────────
  const ref = state.meta.ref || "BG-XXXX-XXX-XXX";
  const clientAr = state.client.nameAr || "العميل";
  const clientEn = state.client.nameEn || clientAr;
  const dateText = state.meta.date || "";
  const version = state.odooVersion || "18";
  const sector = SECTOR_LABELS_EN[state.client.sector] || "Business";
  const size = SIZE_LABELS_EN[state.client.employeeSize] || "Medium-sized";
  const discountPct = mods.length > 0 && totals.modulesBeforeDiscount > 0
    ? Math.round(((totals.modulesBeforeDiscount - totals.modules) / totals.modulesBeforeDiscount) * 100)
    : 0;
  const startDate = state.payment.startDate
    ? fmtDateArabic(state.payment.startDate)
    : dateText;

  // ── Simple string replacements (ordered from most to least specific) ──
  const replacements: Array<[string | RegExp, string]> = [
    // Reference number (many places)
    [/BG202604186/g, ref],

    // Client name
    [/IMKAN(?!&amp;)/g, clientEn],
    [/إمكان الدولية/g, clientAr],

    // Dates
    [/April 2026/g, dateText || "—"],
    [/May 1, 2026/g, startDate],

    // Odoo version
    [/Odoo 18 ERP/g, `Odoo ${version} ERP`],
    [/Odoo 18/g, `Odoo ${version}`],

    // Module count references
    [/11 Odoo 18 modules/g, `${modCount} Odoo ${version} modules`],
    [/11 Odoo 18/g, `${modCount} Odoo ${version}`],
    [/11 modules/g, `${modCount} modules`],
    [/11 business functions/g, `${modCount} business functions`],
    [/All 11/g, `All ${modCount}`],
    [/<div style="font-size:48px; font-weight:800; color:var\(--green\); font-family:'Inter',monospace; line-height:1;">11<\/div>/g,
      `<div style="font-size:48px; font-weight:800; color:var(--green); font-family:'Inter',monospace; line-height:1;">${modCount}</div>`],

    // Sector / size
    [/Trade &amp; Distribution/g, sector],
    [/Trade & Distribution/g, sector],
    [/20–100 Employees/g, size],
    [/20–100 employees/g, size.toLowerCase()],

    // Validity
    [/30 Days/g, state.meta.validity || "30 Days"],
    [/30 days/g, (state.meta.validity || "30 days").toLowerCase()],

    // Users (Odoo license)
    [/5 Users/g, `${state.license.users} Users`],
    [/5 users/g, `${state.license.users} users`],

    // Financial values
    [/8,146/g, fmtNum(totals.development)],
    [/9,051/g, fmtNum(totals.developmentRaw)],
    [/\b905\b/g, fmtNum(totals.developmentRaw - totals.development)],
    [/2,100/g, fmtNum(totals.annualLicense)],
    [/\b175\b/g, fmtNum(totals.licMonthly)],
    [/10,200/g, fmtNum(totals.grandTotalY1)],
    [/\b635\b/g, fmtNum(totals.licMonthly + totals.supportMonthly)],
    [/3,060/g, fmtNum(totals.firstInstallment)],
    [/\b185\b/g, fmtNum(totals.licMonthly)],

    // Support prices in cards (these are template defaults)
    [/\b250\s*د\.ك\s*<\/div>\s*<div class="sup-period">\/month<\/div>\s*<div class="sup-hrs">10 hrs/g,
      `${fmtNum(state.support.prices.basic)} ${cur}</div>\n                <div class="sup-period">/month</div>\n                <div class="sup-hrs">10 hrs`],
    [/\b350\s*د\.ك\s*<\/div>\s*<div class="sup-period">\/month<\/div>\s*<div class="sup-hrs">15 hrs/g,
      `${fmtNum(state.support.prices.advanced)} ${cur}</div>\n                <div class="sup-period">/month</div>\n                <div class="sup-hrs">15 hrs`],
    [/\b450\s*د\.ك\s*<\/div>\s*<div class="sup-period">\/month<\/div>\s*<div class="sup-hrs">20 hrs/g,
      `${fmtNum(state.support.prices.premium)} ${cur}</div>\n                <div class="sup-period">/month</div>\n                <div class="sup-hrs">20 hrs`],

    // Currency
    [/KWD د\.ك/g, `${state.meta.currency} ${cur}`],
    [/د\.ك/g, cur],

    // Discount percentage text
    [/After 10% discount/g, discountPct > 0 ? `After ${discountPct}% discount` : "After group discount"],
    [/10% Discount/g, discountPct > 0 ? `${discountPct}% Discount` : "Group Discount"],
    [/10% disc/g, discountPct > 0 ? `${discountPct}% disc` : "disc"],
    [/10% group discount/g, discountPct > 0 ? `${discountPct}% group discount` : "group discount"],

    // Signature contact
    [/Eng\. Mahmoud Oun/g, contact.name || "Eng. Mahmoud Oun"],
    [/CEO &amp; Co-Founder/g, contact.role || "CEO & Co-Founder"],
    [/CEO & Co-Founder/g, contact.role || "CEO & Co-Founder"],
    [/OUN@businessesgates\.com/g, contact.email || "OUN@businessesgates.com"],
    [/\+965 9999 0412/g, contact.phone || "+965 9999 0412"],
  ];

  replacements.forEach(([pattern, value]) => {
    html = html.replace(pattern, value);
  });

  // ── Replace the module cards grid ─────────────────────────
  const moduleCards = renderModuleCards(state);
  if (moduleCards) {
    // Target the <div class="mod-grid"> ... </div> block inside #scope
    html = html.replace(
      /(<div class="mod-grid">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- ═══ §3)/,
      (_match, openTag, _body, closeTagWithNext) =>
        `${openTag}\n${moduleCards}\n      ${closeTagWithNext}`
    );
  }

  // ── Patch the Configurator JS BASE values ─────────────────
  html = html.replace(
    /var BASE\s*=\s*\d+[\d,]*\s*;/,
    `var BASE = ${totals.development};`
  );
  html = html.replace(
    /var licCost\s*=\s*\d+\s*;/,
    `var licCost = ${totals.licMonthly};`
  );
  html = html.replace(
    /var supCost\s*=\s*\d+\s*;/,
    `var supCost = ${totals.supportMonthly};`
  );

  return html;
}
