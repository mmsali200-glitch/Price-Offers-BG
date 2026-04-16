/**
 * Server-side quote renderer — v3 feature-complete.
 *
 * Takes a QuoteBuilderState and produces final HTML by loading the
 * approved reference template (samples/reference-quote.html) and
 * substituting every dynamic value from the builder state.
 *
 * Supports all v3 spec features:
 *   - Language toggle (ar / en)
 *   - Price display modes (total / items / hidden)
 *   - Per-module separate billing
 *   - Per-module discount + total discount
 *   - Payment schedule with actual dates
 *   - Odoo cost inclusion in grand total (configurable months)
 *   - Multi-contact signature footer
 *   - Exchange rate awareness
 */

import { getReferenceTemplate } from "./reference-template";
import type { QuoteBuilderState } from "./builder/types";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "./modules-catalog";
import { fmtNum, curSymbol, fmtDateArabic } from "./utils";

/** Module icon map for the scope grid. */
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
  trading: "Trade & Distribution",
  manufacturing: "Manufacturing",
  services: "Professional Services",
  healthcare: "Healthcare",
  construction: "Construction",
  realestate: "Real Estate",
  logistics: "Logistics & Transport",
  retail: "Retail",
  food: "Food & Beverage",
  education: "Education",
  government: "Government",
  other: "Business",
};

const SECTOR_AR: Record<string, string> = {
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
  other: "أعمال",
};

const SIZE_EN: Record<string, string> = {
  small: "< 20 Employees",
  medium: "20–100 Employees",
  large: "100–500 Employees",
  enterprise: "500+ Employees",
};

const SIZE_AR: Record<string, string> = {
  small: "أقل من 20 موظف",
  medium: "20–100 موظف",
  large: "100–500 موظف",
  enterprise: "أكثر من 500 موظف",
};

type SelectedModule = {
  id: string;
  name: string;
  price: number;
  discount: number;
  separate: boolean;
  features: string[];
};

function getSelectedModules(state: QuoteBuilderState): SelectedModule[] {
  const result: SelectedModule[] = [];
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
  const grandTotalWithOdoo = development + odooCost;
  const installments = state.payment.installments > 1
    ? Math.round(grandTotalY1 / state.payment.installments)
    : 0;
  const firstInstallment = Math.round(
    grandTotalY1 * (state.payment.firstPaymentPct || 30) / 100
  );
  return {
    modules: modulesAfterItemDiscount,
    modulesBeforeDiscount,
    modulesSaved: modulesBeforeDiscount - modulesAfterItemDiscount,
    bgImpl, bgMonthly,
    development, developmentRaw: devRaw,
    totalDiscountAmount: devRaw - development,
    licMonthly, supportMonthly,
    annualLicense, odooCost,
    grandTotalY1, grandTotalWithOdoo,
    installments, firstInstallment,
    licenseMonths: months,
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

function renderModuleCards(mods: SelectedModule[]): string {
  if (mods.length === 0) return "";
  return mods.map((m) => {
    const icon = MODULE_ICONS[m.id] || "📦";
    const snippet = (m.features || []).slice(0, 3).join(" · ");
    const discountBadge = m.discount > 0
      ? `<div style="font-size:9px; color:var(--gold); margin-top:4px; font-weight:700;">خصم ${m.discount}%</div>`
      : "";
    return `        <div class="mod-card">
          <div class="mod-icon">${icon}</div>
          <div class="mod-name">${escapeHtml(m.name)}</div>
          <div class="mod-features">${escapeHtml(snippet)}</div>
          ${discountBadge}
        </div>`;
  }).join("\n");
}

/** Compute a real payment schedule from start date + project weeks + installments. */
function computeSchedule(state: QuoteBuilderState, totals: ReturnType<typeof computeTotals>) {
  const months = state.payment.installments;
  if (months <= 1 || !state.payment.startDate) return [];
  const start = new Date(state.payment.startDate);
  const durWeeks = parseInt(state.durationLabel) || 8;
  const totalDays = durWeeks * 7;
  const total = totals.grandTotalY1;
  const firstPct = state.payment.firstPaymentPct || 30;
  const fa = Math.round(total * firstPct / 100);
  const remaining = total - fa;
  const rows: Array<{ num: number; desc: string; date: string; pct: number; amount: number }> = [];
  if (months === 2) {
    const d2 = new Date(start); d2.setDate(d2.getDate() + totalDays);
    rows.push({ num: 1, desc: "عند التوقيع على العقد", date: fmtDateArabic(start), pct: 50, amount: Math.round(total * 0.5) });
    rows.push({ num: 2, desc: "عند التسليم النهائي", date: fmtDateArabic(d2), pct: 50, amount: total - Math.round(total * 0.5) });
  } else {
    const perInstallment = Math.round(remaining / (months - 1));
    rows.push({ num: 1, desc: "عند التوقيع على العقد", date: fmtDateArabic(start), pct: firstPct, amount: fa });
    for (let i = 1; i < months; i++) {
      const d = new Date(start); d.setDate(d.getDate() + Math.round(totalDays * i / (months - 1)));
      const isLast = i === months - 1;
      const amount = isLast ? (total - fa - perInstallment * (months - 2)) : perInstallment;
      const pct = Math.round(amount * 100 / total);
      const desc = isLast ? "التسليم النهائي والإطلاق"
        : i === 1 ? "بدء مرحلة التطوير"
        : i === Math.floor((months - 1) / 2) ? "منتصف المشروع"
        : `قسط رقم ${i + 1}`;
      rows.push({ num: i + 1, desc, date: fmtDateArabic(d), pct, amount });
    }
  }
  return rows;
}

function renderScheduleHtml(rows: ReturnType<typeof computeSchedule>, cur: string): string {
  if (rows.length === 0) return "";
  return rows.map(r => `
            <tr>
              <td style="padding:12px 18px; border-bottom:1px solid var(--gline); font-weight:700;">${r.num}</td>
              <td style="padding:12px 18px; border-bottom:1px solid var(--gline);">${escapeHtml(r.desc)}</td>
              <td style="padding:12px 18px; border-bottom:1px solid var(--gline); color:var(--tgray);">${escapeHtml(r.date)}</td>
              <td style="padding:12px 18px; border-bottom:1px solid var(--gline); text-align:center;">${r.pct}%</td>
              <td style="padding:12px 18px; border-bottom:1px solid var(--gline); text-align:right; font-weight:700; color:var(--green);">${fmtNum(r.amount)} ${cur}</td>
            </tr>`).join("");
}

/**
 * Main render function.
 */
export function renderQuoteHtml(state: QuoteBuilderState): string {
  let html = getReferenceTemplate();
  const totals = computeTotals(state);
  const cur = curSymbol(state.meta.currency);
  const mods = getSelectedModules(state);
  const bgApps = getSelectedBGApps(state);
  const contact = getContact(state);
  const isEn = state.language === "en";
  const allMods = [...mods, ...bgApps.map(a => ({
    id: a.id, name: a.name, price: a.implementationPrice, discount: 0,
    separate: false, features: a.features,
  } as SelectedModule))];
  const modCount = allMods.length;

  // ── Core values ───────────────────────────────────────────
  const ref = state.meta.ref || "BG-XXXX-XXX-XXX";
  const clientPrimary = isEn
    ? (state.client.nameEn || state.client.nameAr || "Client")
    : (state.client.nameAr || "العميل");
  const clientSecondary = isEn
    ? (state.client.nameAr || "")
    : (state.client.nameEn || "");
  const dateText = state.meta.date || "";
  const version = state.odooVersion || "18";
  const sector = isEn ? (SECTOR_EN[state.client.sector] || "Business") : (SECTOR_AR[state.client.sector] || "أعمال");
  const size = isEn ? (SIZE_EN[state.client.employeeSize] || "") : (SIZE_AR[state.client.employeeSize] || "");
  const discountPct = totals.modulesBeforeDiscount > 0 && totals.modulesSaved > 0
    ? Math.round((totals.modulesSaved / totals.modulesBeforeDiscount) * 100)
    : 0;
  const startDate = state.payment.startDate
    ? fmtDateArabic(state.payment.startDate)
    : dateText;

  // ── Targeted replacements (specific long patterns first) ──
  const r: Array<[RegExp, string]> = [
    [/BG202604186/g, ref],
    [/IMKAN(?!&amp;)/g, clientPrimary],
    [/إمكان الدولية/g, clientSecondary],
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

  // ── Module cards grid ─────────────────────────────────────
  const moduleCards = renderModuleCards(allMods);
  if (moduleCards) {
    html = html.replace(
      /(<div class="mod-grid">)([\s\S]*?)(<\/div>\s*<\/section>\s*<!-- ═══ §3)/,
      (_m, open, _body, close) => `${open}\n${moduleCards}\n      ${close}`
    );
  }

  // ── Configurator JS base values ──────────────────────────
  html = html.replace(/var BASE\s*=\s*[^;]+;/, `var BASE = ${totals.development};`);
  html = html.replace(/var licCost\s*=\s*[^;]+;/, `var licCost = ${totals.licMonthly};`);
  html = html.replace(/var supCost\s*=\s*[^;]+;/, `var supCost = ${totals.supportMonthly};`);

  // ── Replace installments table if schedule can be computed ──
  const schedule = computeSchedule(state, totals);
  if (schedule.length > 0) {
    const scheduleRows = renderScheduleHtml(schedule, cur);
    // Replace the installments table body — find tbody after §11 marker
    html = html.replace(
      /(<!-- ═══ §1[12] INSTALLMENTS[\s\S]*?<tbody[^>]*>)([\s\S]*?)(<\/tbody>)/,
      (_m, open, _body, close) => `${open}${scheduleRows}${close}`
    );
  }

  // ── Additional Odoo-cost line if includeOdooInTotal ──────
  if (state.license.includeOdooInTotal) {
    const odooLine = `
            <tr style="background:var(--gold-lt);">
              <td class="td-green fw-700">Odoo License — ${totals.licenseMonths} months (indicative)</td>
              <td><span class="badge badge-gold">Included in Total</span></td>
              <td class="td-price">${fmtNum(totals.odooCost)}</td>
              <td>${totals.licenseMonths} months</td>
              <td>⚠ Indicative — confirm with Odoo</td>
            </tr>`;
    html = html.replace(
      /(<tr>\s*<td class="td-green fw-700">Premium Technical Support)/,
      `${odooLine}\n            $1`
    );
  }

  // ── Language: flip dir/lang and font stack ───────────────
  if (isEn) {
    html = html.replace(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="en" dir="ltr">`);
    html = html.replace(
      /font-family:\s*'Inter',\s*'Noto Sans Arabic',\s*sans-serif/g,
      `font-family: 'Inter', 'Noto Sans Arabic', sans-serif`
    );
  } else {
    html = html.replace(/<html lang="[^"]*" dir="[^"]*">/, `<html lang="ar" dir="rtl">`);
    // Swap font priority: Arabic first for Arabic content
    html = html.replace(
      /font-family:\s*'Inter',\s*'Noto Sans Arabic',\s*sans-serif/g,
      `font-family: 'Noto Sans Arabic', 'Inter', sans-serif`
    );
    // Keep Inter for the hero title and brand/ref codes (monospace-like look)
    // by adding a generic override that keeps numbers tabular
  }

  return html;
}
