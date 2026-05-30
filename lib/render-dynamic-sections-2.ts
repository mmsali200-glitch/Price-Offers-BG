/**
 * Dynamic section generators — Part 2
 * Module details, workflows, phases, pricing, financial, installments.
 * Each function returns an HTML string to inject into the output.
 */

import type { QuoteBuilderState } from "./builder/types";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "./modules-catalog";
import { MODULE_QUESTIONS, calculateComplexity } from "./module-questions";
import { getCountryPricing, getVatRate } from "./country-pricing";
import { fmtNum, curSymbol, fmtDateArabic } from "./utils";
import { getExtended } from "./modules-extended";

function esc(s: string) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Helper for custom workflow text from textarea. */
function buildWorkflowSection(lines: string[], isAr: boolean): string {
  const title = isAr ? "دورات العمل الرئيسية" : "Business Workflows";
  let html = `<section id="dyn-workflows" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#f7f9f6;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">🔄</div>
      <div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div>
    </div>`;
  lines.forEach((line) => {
    html += `<div style="background:#fff;border:1px solid #e2e8e3;border-radius:8px;padding:12px 16px;margin-bottom:8px;">
      <div style="font-size:11px;color:#3e5446;line-height:1.7;">${esc(line)}</div>
    </div>`;
  });
  html += `</section>`;
  return html;
}

function getSelectedMods(state: QuoteBuilderState) {
  const r: Array<{ id: string; name: string; price: number; discount: number; features: string[]; separate: boolean }> = [];
  ODOO_MODULES.forEach((cat) => {
    cat.modules.forEach((m) => {
      const st = state.modules[m.id];
      if (st?.selected) r.push({ id: m.id, name: m.name, price: st.priceOverride ?? m.price, discount: st.discount, features: m.features, separate: st.separate });
    });
  });
  return r;
}

function getSelectedBG(state: QuoteBuilderState) {
  return BG_APPS.filter((a) => state.bgApps[a.id]?.selected).map((a) => ({
    ...a, implementationPrice: state.bgApps[a.id].implementationPrice, monthlyPrice: state.bgApps[a.id].monthlyPrice,
  }));
}

function getCountryMultiplier(state: QuoteBuilderState) {
  const country = state.client?.country || "الكويت";
  const dbEntry = (state as Record<string, unknown>).countryMultipliers as Record<string, { multiplier: number }> | undefined;
  if (dbEntry?.[country]) return dbEntry[country].multiplier;
  return getCountryPricing(country).priceMultiplier;
}

function getModuleCountryPrice(state: QuoteBuilderState, moduleId: string, basePrice: number): number {
  const country = state.client?.country || "الكويت";
  const countryKey = `${country}:${moduleId}`;
  const dbPrice = (state as Record<string, unknown>).countryModulePrices as Record<string, number> | undefined;
  if (dbPrice?.[countryKey] !== undefined) return dbPrice[countryKey];
  return Math.round(basePrice * getCountryMultiplier(state));
}

function getModuleAdjustedPrice(state: QuoteBuilderState, moduleId: string, basePrice: number) {
  const answers = state.moduleAnswers?.[moduleId] ?? {};
  const { multiplier } = calculateComplexity(moduleId, answers);
  const countryPrice = getModuleCountryPrice(state, moduleId, basePrice);
  return Math.round(countryPrice * multiplier);
}

function computeRenderTotals(state: QuoteBuilderState) {
  const mods = getSelectedMods(state);
  const bgApps = getSelectedBG(state);
  const cm = getCountryMultiplier(state);

  const modsTotal = mods.reduce((s, m) => {
    const adjusted = getModuleAdjustedPrice(state, m.id, m.price);
    return s + Math.round(adjusted * (1 - (m.discount || 0) / 100));
  }, 0);
  const bgImpl = bgApps.reduce((s, a) => s + Math.round(a.implementationPrice * cm), 0);
  const optsTotal = state.options
    .filter((o) => o.selected)
    .reduce((s, o) => s + Math.round((o.price || 0) * cm), 0);
  const devRaw = modsTotal + bgImpl + optsTotal;
  const dev = Math.round(devRaw * (1 - (state.totalDiscount || 0) / 100));
  const licM = Math.round(state.license.serverMonthly + state.license.perUserMonthly * state.license.users);
  const pkg = SUPPORT_PACKAGES.find((p) => p.id === state.support.packageId);
  const supM = state.support.packageId === "none" ? 0 : state.support.prices[state.support.packageId as "basic" | "advanced" | "premium"] ?? pkg?.price ?? 0;
  const annualLic = licM * 12;
  // VAT (e.g. 15% for Saudi Arabia) — applied to the one-time development
  // total only. Odoo license & hosting is quoted tax-free (indicative).
  const vatRate = getVatRate(state.client?.country || "");
  const vat = Math.round(dev * vatRate);
  const devWithVat = dev + vat;
  // Offer total & payments are based on development + VAT only — the Odoo
  // license value is never included in the total.
  const grandY1 = devWithVat;
  const firstPay = Math.round(grandY1 * (state.payment.firstPaymentPct || 30) / 100);

  return { modsTotal, bgImpl, optsTotal, devRaw, dev, licM, supM, annualLic, vatRate, vat, devWithVat, grandY1, firstPay };
}

/** Package-mode module list — compact branded table listing modules with single bundled price. */
function renderPackageModulesHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getSelectedMods(state);
  const bgApps = getSelectedBG(state);
  const cur = curSymbol(state.meta.currency);
  const { dev } = computeRenderTotals(state);
  const items: Array<{ id: string; name: string; features: string[] }> = [
    ...mods.map((m) => ({ id: m.id, name: m.name, features: m.features })),
    ...bgApps.map((a) => ({ id: a.id, name: a.name, features: a.features })),
  ];
  if (items.length === 0) return "";
  const enLabel = (id: string) => id.split(/[-_]/).map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" ");

  let html = `<section id="dyn-modules" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#fff;">
    <div style="border:1.5px solid #e2e8e3;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(26,92,55,0.08);page-break-inside:avoid;">
      <div style="background:linear-gradient(135deg,#1a5c37 0%,#247a4a 100%);padding:14px 20px;display:flex;align-items:center;gap:12px;">
        <div style="width:34px;height:34px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;flex-shrink:0;">1</div>
        <div style="color:#fff;font-size:14px;font-weight:800;letter-spacing:0.2px;">${isAr ? "الموديولات الأساسية المشمولة في الباقة" : "Core modules included in the package"}</div>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">
        <thead>
          <tr style="background:#247a4a;color:#fff;">
            <th style="padding:9px 14px;width:50px;text-align:center;font-weight:700;font-size:11px;">#</th>
            <th style="padding:9px 14px;text-align:${isAr ? "right" : "left"};font-weight:700;font-size:11px;">${isAr ? "الموديول" : "Module"}</th>
            <th style="padding:9px 14px;width:140px;text-align:center;font-weight:700;font-size:11px;">${isAr ? "الحالة" : "Status"}</th>
          </tr>
        </thead>
        <tbody>`;

  items.forEach((it, i) => {
    const enName = enLabel(it.id);
    const desc = it.features?.[0] || "";
    const stripe = i % 2 === 0 ? "#fff" : "#f7f9f6";
    html += `<tr style="border-bottom:1px solid #f0f2ef;background:${stripe};">
      <td style="padding:12px 14px;text-align:center;color:#7a8e80;font-weight:700;font-family:monospace;font-size:12px;">${String(i + 1).padStart(2, "0")}</td>
      <td style="padding:12px 14px;">
        <div style="font-size:13px;font-weight:800;margin-bottom:3px;">
          <span style="color:#1a5c37;border-bottom:2px solid #c9a84c;padding-bottom:1px;">${esc(enName)} — ${esc(it.name)}</span>
        </div>
        <div style="font-size:10px;color:#7a8e80;line-height:1.55;">${esc(desc)}</div>
      </td>
      <td style="padding:12px 14px;text-align:center;">
        <span style="color:#15803d;font-size:11px;font-weight:800;">✓ ${isAr ? "ضمن الباقة" : "Included"}</span>
      </td>
    </tr>`;
  });

  html += `</tbody>
        <tfoot>
          <tr style="background:linear-gradient(90deg,#1a5c37 0%,#0e3a1e 100%);color:#fff;">
            <td colspan="2" style="padding:14px 16px;">
              <div style="font-size:13px;font-weight:800;">${isAr ? `الإجمالي — تطوير وتطبيق الباقة الأساسية (${items.length} ${items.length === 1 ? "موديول" : "موديولات"})` : `Total — Package implementation (${items.length} modules)`}</div>
            </td>
            <td style="padding:14px 16px;text-align:${isAr ? "left" : "right"};white-space:nowrap;">
              <span style="font-size:20px;font-weight:900;color:#c9a84c;font-family:monospace;">${fmtNum(dev)}</span>
              <span style="font-size:12px;color:#c9a84c;margin-${isAr ? "right" : "left"}:4px;">${cur}</span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  </section>`;
  return html;
}

/** §5 — Module details — creative card design (detailed) or package list (package mode) */
export function renderModuleDetailsHtml(state: QuoteBuilderState, isAr: boolean): string {
  if (state.meta.displayMode === "package") return renderPackageModulesHtml(state, isAr);
  const mods = getSelectedMods(state);
  const bgApps = getSelectedBG(state);
  if (mods.length === 0 && bgApps.length === 0) return "";
  const cur = curSymbol(state.meta.currency);
  const title = isAr ? "تفاصيل الموديولات" : "Module Details";
  const sub = isAr ? `وصف تفصيلي لكل موديول ومميزاته الرئيسية — ${mods.length + bgApps.length} موديول` : `Detailed breakdown — ${mods.length + bgApps.length} modules`;
  const ICONS: Record<string,string> = {crm:"🤝",sales:"💼",pos:"🛍️",inventory:"📦",purchase:"🛒",barcode:"🔖",mrp:"🏭",accounting:"📊",invoicing:"🧾",payroll:"💰",hr:"👤",attendance:"⏰",leaves:"🌴",recruitment:"🎯",project:"📋",helpdesk:"🎧",website:"🌐",ecommerce:"🛒",realestate:"🏢",hms:"🏥",lab:"🔬",quality:"✅",maintenance:"🛠️",delivery:"🚚",repair:"🔧",timesheets:"⏱️",fieldservice:"🗺️",expenses:"💳",subscriptions:"🔁",plm:"🧬",eam:"🏭",livechat:"💬",elearning:"🎓",appraisals:"📈",rental:"📅",marketing:"📢",documents:"📄",fleet:"🚗",studio:"🎨",dms:"📂",eapprovals:"✅"};

  let html = `<section id="dyn-modules" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#fff;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">📦</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div><div style="font-size:11px;color:#7a8e80;">${sub}</div></div>
    </div>`;

  mods.forEach((m, idx) => {
    const ext = getExtended(m.id);
    const feats = ext.features.length > 0 ? ext.features : m.features;
    const adjustedBase = getModuleAdjustedPrice(state, m.id, m.price);
    const finalPrice = Math.round(adjustedBase * (1 - (m.discount || 0) / 100));
    const icon = ICONS[m.id] || "📦";
    const isEven = idx % 2 === 0;

    html += `
    <div style="border:1.5px solid #e2e8e3;border-radius:12px;overflow:hidden;margin-bottom:16px;page-break-inside:avoid;box-shadow:0 2px 10px rgba(26,92,55,0.05);">
      <!-- Module header -->
      <div style="background:${isEven ? "linear-gradient(135deg,#1a5c37,#247a4a)" : "linear-gradient(135deg,#247a4a,#2d9052)"};padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:28px;">${icon}</div>
          <div>
            <div style="color:#fff;font-size:15px;font-weight:800;">${esc(m.name)}</div>
            <div style="color:rgba(255,255,255,0.65);font-size:10px;">${feats.length} ${isAr ? "ميزة" : "features"}</div>
          </div>
        </div>
        <div style="text-align:left;">
          <div style="color:#c9a84c;font-size:18px;font-weight:800;font-family:monospace;">${fmtNum(finalPrice)}</div>
          <div style="color:rgba(255,255,255,0.6);font-size:9px;">${cur}${m.discount > 0 ? ` (${isAr ? "خصم" : "disc"} ${m.discount}%)` : ""}</div>
        </div>
      </div>
      <!-- Features grid -->
      <div style="padding:14px 18px;">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
          ${feats.map((f, i) => `
            <div style="display:flex;align-items:flex-start;gap:6px;padding:5px 8px;background:${i % 2 === 0 ? "#f7f9f6" : "#fff"};border-radius:6px;">
              <span style="color:#1a5c37;font-weight:800;font-size:10px;margin-top:1px;">✓</span>
              <span style="font-size:10px;color:#3e5446;line-height:1.5;">${esc(f)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>`;
  });

  // BG Apps — apply country multiplier
  const bgCm = getCountryMultiplier(state);
  bgApps.forEach((a) => {
    const icon = ICONS[a.id] || "⭐";
    const adjustedBgPrice = Math.round(a.implementationPrice * bgCm);
    html += `
    <div style="border:2px solid #c9a84c;border-radius:12px;overflow:hidden;margin-bottom:16px;page-break-inside:avoid;">
      <div style="background:linear-gradient(135deg,#c9a84c,#e0bc5a);padding:14px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="font-size:28px;">${icon}</div>
          <div>
            <div style="color:#1a5c37;font-size:15px;font-weight:800;">${esc(a.name)}</div>
            <div style="background:#1a5c37;color:#fff;font-size:8px;font-weight:800;padding:1px 8px;border-radius:10px;display:inline-block;margin-top:2px;">حصري BG</div>
          </div>
        </div>
        <div style="color:#1a5c37;font-size:18px;font-weight:800;font-family:monospace;">${fmtNum(adjustedBgPrice)} ${cur}</div>
      </div>
      <div style="padding:12px 18px;">
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;">
          ${a.features.slice(0, 6).map((f, i) => `
            <div style="display:flex;align-items:flex-start;gap:6px;padding:5px 8px;background:${i % 2 === 0 ? "#fdf5e0" : "#fff"};border-radius:6px;">
              <span style="color:#c9a84c;font-weight:800;font-size:10px;margin-top:1px;">★</span>
              <span style="font-size:10px;color:#3e5446;line-height:1.5;">${esc(f)}</span>
            </div>
          `).join("")}
        </div>
      </div>
    </div>`;
  });

  html += `</section>`;
  return html;
}

/** §6 — Workflows — ALWAYS uses extended module data */
export function renderWorkflowsHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getSelectedMods(state);
  if (mods.length === 0) return "";

  const title = isAr ? "دورات العمل الرئيسية" : "Business Workflows";
  const sub = isAr ? "العمليات المؤتمتة التي ستعمل داخل النظام بناءً على الموديولات المختارة" : "Automated processes running inside the system based on selected modules";
  const ICONS: Record<string,string> = {crm:"🤝",sales:"💼",pos:"🛍️",inventory:"📦",purchase:"🛒",mrp:"🏭",accounting:"📊",payroll:"💰",hr:"👤",project:"📋",helpdesk:"🎧",website:"🌐",realestate:"🏢",hms:"🏥",fieldservice:"🗺️",subscriptions:"🔁",maintenance:"🛠️",marketing:"📢",fleet:"🚗",contracting:"🏗️",multicompany:"🏢"};
  const COLORS = ["#1a5c37","#1a5c37","#1a5c37","#1a5c37","#1a5c37","#1a5c37","#1a5c37","#1a5c37"];

  let html = `<section id="dyn-workflows" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:linear-gradient(180deg,#f7f9f6 0%,#fff 100%);">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:28px;">
      <div style="width:34px;height:34px;background:linear-gradient(135deg,#c9a84c,#e0bc5a);color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">🔄</div>
      <div><div style="font-size:18px;font-weight:800;color:#1a5c37;">${title}</div><div style="font-size:11px;color:#7a8e80;margin-top:2px;">${sub}</div></div>
    </div>`;

  mods.forEach((m, mIdx) => {
    const ext = getExtended(m.id);
    if (ext.workflow.length === 0) return;
    const icon = ICONS[m.id] || "🔄";
    const color = COLORS[mIdx % COLORS.length];

    html += `
    <div style="margin-bottom:28px;page-break-inside:avoid;">
      <!-- Workflow header bar -->
      <div style="background:${color};border-radius:10px 10px 0 0;padding:12px 18px;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:20px;">${icon}</div>
          <div>
            <div style="color:#fff;font-size:14px;font-weight:800;">${isAr ? "دورة عمل" : "Workflow"}: ${esc(m.name)}</div>
            <div style="color:rgba(255,255,255,0.7);font-size:10px;">${ext.workflow.length} ${isAr ? "خطوة متتابعة" : "sequential steps"}</div>
          </div>
        </div>
      </div>

      <!-- Steps flow -->
      <div style="border:1.5px solid ${color};border-top:none;border-radius:0 0 10px 10px;background:#fff;padding:16px;">
        <!-- Horizontal flow for first 3-4 key steps -->
        <div style="display:flex;flex-wrap:wrap;gap:0;margin-bottom:12px;align-items:stretch;">
          ${ext.workflow.slice(0, Math.min(ext.workflow.length, 4)).map((step, i, arr) => {
            const parts = step.split(":");
            const sTitle = parts[0]?.trim() || `${isAr ? "خطوة" : "Step"} ${i + 1}`;
            return `
            <div style="flex:1;min-width:120px;display:flex;align-items:stretch;">
              <div style="flex:1;background:${i === 0 ? color : "#f7f9f6"};border-radius:8px;padding:10px;text-align:center;position:relative;">
                <div style="width:24px;height:24px;border-radius:50%;background:${i === 0 ? "rgba(255,255,255,0.3)" : color};color:${i === 0 ? "#fff" : "#fff"};display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;margin:0 auto 6px;">${i + 1}</div>
                <div style="font-size:10px;font-weight:700;color:${i === 0 ? "#fff" : "#141f18"};line-height:1.4;">${esc(sTitle)}</div>
              </div>
              ${i < arr.length - 1 ? `<div style="display:flex;align-items:center;padding:0 2px;"><span style="color:${color};font-size:16px;font-weight:800;">→</span></div>` : ""}
            </div>`;
          }).join("")}
        </div>

        <!-- Detailed steps list -->
        <div style="border-top:1px solid #e2e8e3;padding-top:12px;">
          ${ext.workflow.map((step, i) => {
            const parts = step.split(":");
            const sTitle = parts[0]?.trim() || "";
            const sDesc = parts.slice(1).join(":").trim() || step;
            const hasDesc = sTitle !== step && sDesc.length > 0;

            return `
            <div style="display:flex;gap:10px;margin-bottom:${i === ext.workflow.length - 1 ? "0" : "8px"};align-items:flex-start;">
              <div style="width:22px;height:22px;border-radius:50%;background:${i < 4 ? color : "#e2e8e3"};color:${i < 4 ? "#fff" : "#7a8e80"};display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0;margin-top:1px;">${i + 1}</div>
              <div style="flex:1;min-width:0;">
                ${hasDesc
                  ? `<div style="font-size:11px;font-weight:700;color:#141f18;">${esc(sTitle)}</div><div style="font-size:10px;color:#7a8e80;line-height:1.5;margin-top:1px;">${esc(sDesc)}</div>`
                  : `<div style="font-size:11px;color:#3e5446;line-height:1.5;">${esc(step)}</div>`
                }
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>`;
  });

  html += `</section>`;
  return html;
}

/** §7 — Implementation phases — uses user's phases from Builder */
export function renderPhasesHtml(state: QuoteBuilderState, isAr: boolean): string {
  const phases = state.phases && state.phases.length > 0 ? state.phases : [];
  if (phases.length === 0) return "";

  const title = isAr ? "خطة التنفيذ" : "Implementation Plan";
  const sub = isAr ? `${phases.length} مراحل — المدة الإجمالية: ${state.durationLabel || "—"}` : `${phases.length} phases — Total: ${state.durationLabel || "—"}`;
  const colors = ["#1a5c37", "#c9a84c", "#247a4a", "#1a5c37", "#c9a84c", "#247a4a"];

  let html = `<section id="dyn-phases" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#fff;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">📅</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div><div style="font-size:11px;color:#7a8e80;">${sub}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(${Math.min(state.phases.length, 4)},1fr);gap:12px;">`;

  phases.forEach((p, i) => {
    const c = colors[i % 6];
    html += `<div style="border:1.5px solid ${c};border-top:4px solid ${c};border-radius:8px;padding:14px;page-break-inside:avoid;">
      <div style="font-size:10px;font-weight:800;color:${c};text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">${isAr ? "المرحلة" : "Phase"} ${i + 1}</div>
      <div style="font-size:13px;font-weight:700;color:#141f18;margin-bottom:4px;">${esc(p.name)}</div>
      <div style="font-size:11px;color:#7a8e80;margin-bottom:8px;">⏱ ${esc(p.duration)}</div>
      <div style="font-size:10px;color:#3e5446;line-height:1.6;border-top:1px solid #e2e8e3;padding-top:8px;">${esc(p.deliverables)}</div>
    </div>`;
  });

  html += `</div></section>`;
  return html;
}

/** §8b — Complexity Assessment Results */
export function renderAssessmentHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getSelectedMods(state);
  const cm = getCountryMultiplier(state);
  const countryName = state.client?.country || "الكويت";

  const assessedMods = mods.filter((m) => {
    const questions = MODULE_QUESTIONS[m.id];
    const answers = state.moduleAnswers?.[m.id] ?? {};
    if (!questions || questions.length === 0) return false;
    return Object.values(answers).some((v) => v === true || (typeof v === "string" && v !== ""));
  });

  if (assessedMods.length === 0) return "";

  const title = isAr ? "نتائج تقييم التعقيد" : "Complexity Assessment Results";
  const sub = isAr ? "تحليل مستوى تعقيد كل موديول بناءً على متطلبات العميل" : "Module complexity analysis based on client requirements";
  const cur = curSymbol(state.meta.currency);

  const LEVEL_COLORS: Record<string, string> = {
    "قياسي": "#22c55e", "Standard": "#22c55e",
    "متوسط": "#f59e0b", "Medium": "#f59e0b",
    "متقدم": "#f97316", "Advanced": "#f97316",
    "معقد": "#ef4444", "Complex": "#ef4444",
  };

  let totalBase = 0, totalAdjusted = 0;

  let html = `<section id="dyn-assessment" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:linear-gradient(180deg,#eff6ff 0%,#fff 100%);page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#2563eb;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">📊</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div><div style="font-size:11px;color:#7a8e80;">${sub}</div></div>
    </div>`;

  if (cm !== 1) {
    html += `<div style="background:#fdf5e0;border:1px solid #c9a84c;border-radius:6px;padding:8px 14px;margin-bottom:14px;font-size:10px;color:#8a6010;">
      🌍 ${isAr ? "معامل تسعير" : "Pricing multiplier"} ${countryName}: <strong>×${cm}</strong>
    </div>`;
  }

  html += `<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;">
    <thead><tr style="background:#1a5c37;color:#fff;">
      <th style="padding:8px 10px;text-align:${isAr ? "right" : "left"};">${isAr ? "الموديول" : "Module"}</th>
      <th style="padding:8px 10px;text-align:center;">${isAr ? "المستوى" : "Level"}</th>
      <th style="padding:8px 10px;text-align:center;">${isAr ? "المعامل" : "Multiplier"}</th>
      <th style="padding:8px 10px;text-align:center;">${isAr ? "السعر الأساسي" : "Base"}</th>
      <th style="padding:8px 10px;text-align:center;">${isAr ? "السعر المعدّل" : "Adjusted"}</th>
    </tr></thead><tbody>`;

  assessedMods.forEach((m) => {
    const answers = state.moduleAnswers?.[m.id] ?? {};
    const { multiplier, level, levelEn } = calculateComplexity(m.id, answers);
    const lbl = isAr ? level : levelEn;
    const adjusted = Math.round(m.price * cm * multiplier);
    const color = LEVEL_COLORS[lbl] || "#7a8e80";
    totalBase += m.price;
    totalAdjusted += adjusted;

    html += `<tr style="border-bottom:1px solid #e2e8e3;">
      <td style="padding:7px 10px;font-weight:700;color:#1a5c37;">${esc(m.name)}</td>
      <td style="padding:7px 10px;text-align:center;"><span style="background:${color}20;color:${color};font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;">${lbl}</span></td>
      <td style="padding:7px 10px;text-align:center;font-weight:700;color:#2563eb;font-family:monospace;">×${multiplier.toFixed(2)}</td>
      <td style="padding:7px 10px;text-align:center;color:#7a8e80;">${fmtNum(m.price)}</td>
      <td style="padding:7px 10px;text-align:center;font-weight:700;color:#1a5c37;">${fmtNum(adjusted)} ${cur}</td>
    </tr>`;
  });

  const diff = totalAdjusted - totalBase;
  html += `<tr style="background:#eaf3ed;font-weight:800;">
    <td colspan="3" style="padding:8px 10px;color:#1a5c37;">${isAr ? "الإجمالي" : "Total"}</td>
    <td style="padding:8px 10px;text-align:center;color:#7a8e80;">${fmtNum(totalBase)}</td>
    <td style="padding:8px 10px;text-align:center;color:#1a5c37;">${fmtNum(totalAdjusted)} ${cur}${diff > 0 ? ` <span style="font-size:9px;color:#2563eb;">(+${fmtNum(diff)})</span>` : ""}</td>
  </tr></tbody></table></section>`;

  return html;
}

/** §9+10+11 — Pricing + Financial + Items */
export function renderPricingHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getSelectedMods(state);
  const bgApps = getSelectedBG(state);
  const cur = curSymbol(state.meta.currency);
  const { optsTotal, devRaw, dev, licM, supM, annualLic, vatRate, vat, devWithVat, firstPay } = computeRenderTotals(state);
  const hasVat = vatRate > 0;
  const vatPct = Math.round(vatRate * 100);
  const isPackage = state.meta.displayMode === "package";
  const selectedOpts = state.options.filter((o) => o.selected);
  const pkg = SUPPORT_PACKAGES.find((p) => p.id === state.support.packageId);

  const title = isAr ? "الملخص المالي" : "Financial Summary";

  let html = `<section id="dyn-financial" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#fff;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">💰</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div></div>
    </div>

    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:20px;">
      <div style="background:#1a5c37;color:#fff;border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:10px;opacity:0.7;margin-bottom:6px;">${isAr ? "قيمة التطوير" : "Development"}</div>
        <div style="font-size:26px;font-weight:800;">${fmtNum(dev)}</div>
        <div style="font-size:10px;opacity:0.6;">${cur} — ${isAr ? "مرة واحدة" : "one-time"}</div>
        ${hasVat ? `<div style="font-size:10px;opacity:0.85;margin-top:4px;border-top:1px solid rgba(255,255,255,0.2);padding-top:4px;">${isAr ? `شامل ضريبة ${vatPct}%` : `incl. ${vatPct}% VAT`}: <strong>${fmtNum(devWithVat)} ${cur}</strong></div>` : ""}
      </div>
      <div style="background:#c9a84c;color:#fff;border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:10px;opacity:0.8;margin-bottom:6px;">${isAr ? "متكرر شهرياً" : "Monthly Recurring"}</div>
        <div style="font-size:26px;font-weight:800;">${fmtNum(licM + supM)}</div>
        <div style="font-size:10px;opacity:0.7;">${cur}/${isAr ? "شهر" : "mo"} (${isAr ? "ترخيص" : "License"} ${fmtNum(licM)} + ${isAr ? "دعم" : "Support"} ${fmtNum(supM)})</div>
        <div style="font-size:10px;opacity:0.9;margin-top:4px;border-top:1px solid rgba(255,255,255,0.25);padding-top:4px;">${isAr ? "التجديد السنوي (Odoo.sh)" : "Annual renewal (Odoo.sh)"}: <strong>${fmtNum(annualLic)} ${cur}</strong></div>
      </div>
      <div style="background:#fff;border:1.5px solid #e2e8e3;border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:10px;color:#7a8e80;margin-bottom:6px;">${isAr ? "الدفعة الأولى" : "First Payment"} (${state.payment.firstPaymentPct}%)</div>
        <div style="font-size:26px;font-weight:800;color:#1a5c37;">${fmtNum(firstPay)}</div>
        <div style="font-size:10px;color:#7a8e80;">${cur}${state.payment.startDate ? ` — ${fmtDateArabic(state.payment.startDate)}` : ""}</div>
      </div>
    </div>

    <div style="border:1.5px solid #e2e8e3;border-radius:14px;overflow:hidden;box-shadow:0 4px 16px rgba(26,92,55,0.06);margin-bottom:14px;page-break-inside:avoid;">
      <div style="background:linear-gradient(135deg,#1a5c37 0%,#247a4a 100%);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;"><span style="font-size:16px;">📋</span><span style="color:#fff;font-size:13px;font-weight:800;letter-spacing:0.3px;">${isAr ? "تفاصيل البنود" : "Line Items"}</span></div>
        <span style="color:#fff;font-size:10px;background:rgba(255,255,255,0.18);padding:3px 10px;border-radius:10px;font-weight:700;">${cur}</span>
      </div>
      <div style="background:#eaf3ed;padding:7px 16px;font-size:10px;font-weight:800;color:#1a5c37;letter-spacing:0.5px;display:flex;align-items:center;gap:6px;border-bottom:1px solid #d4e3d8;">
        <span>💼</span><span>${isAr ? (isPackage ? "بنود لمرة واحدة — الباقة الأساسية" : "بنود لمرة واحدة — التطوير والتطبيق") : (isPackage ? "One-time — Core Package" : "One-time — Development & Implementation")}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>
        <tr style="border-bottom:1px solid #f0f2ef;">
          <td style="padding:11px 14px;border-${isAr ? "right" : "left"}:3px solid #1a5c37;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;background:#eaf3ed;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">${isPackage ? "💎" : "📦"}</div>
              <div>
                <div style="font-size:12px;font-weight:800;color:#1a5c37;">${isAr ? (isPackage ? "الباقة الأساسية المتكاملة" : "تطوير وتطبيق") : (isPackage ? "Complete Core Package" : "Development & Implementation")}</div>
                <div style="font-size:10px;color:#7a8e80;margin-top:1px;">${mods.length + bgApps.length} ${isAr ? "موديول" : "modules"}${!isPackage && selectedOpts.length ? ` + ${selectedOpts.length} ${isAr ? "اختياري" : "optional"}` : ""}${isPackage ? ` ${isAr ? "— شاملة التدريب والتنفيذ" : "— incl. training & implementation"}` : ""}</div>
              </div>
            </div>
          </td>
          <td style="padding:11px 14px;text-align:center;width:90px;"><span style="background:#eaf3ed;color:#1a5c37;font-size:9px;font-weight:800;padding:3px 10px;border-radius:10px;">${isAr ? "مرة واحدة" : "One-time"}</span></td>
          <td style="padding:11px 14px;text-align:${isAr ? "left" : "right"};font-family:monospace;white-space:nowrap;width:120px;"><span style="font-size:14px;font-weight:800;color:#1a5c37;">${fmtNum(dev)}</span> <span style="font-size:10px;color:#7a8e80;">${cur}</span></td>
          ${hasVat ? `<td style="padding:11px 14px;text-align:${isAr ? "left" : "right"};font-family:monospace;white-space:nowrap;width:110px;"><span style="font-size:12px;font-weight:700;color:#8a6010;">${fmtNum(vat)}</span> <span style="font-size:9px;color:#b48a30;">${cur}</span></td>` : ""}
        </tr>`;

  if (!isPackage && optsTotal > 0) {
    html += `<tr style="border-bottom:1px solid #f0f2ef;background:#fffaf0;">
      <td style="padding:8px 14px;border-${isAr ? "right" : "left"}:3px solid #c9a84c;padding-${isAr ? "right" : "left"}:30px;">
        <div style="display:flex;align-items:flex-start;gap:8px;">
          <span style="color:#8a6010;font-size:11px;font-weight:800;margin-top:1px;">↳</span>
          <div>
            <div style="font-size:11px;font-weight:700;color:#8a6010;">${isAr ? "منها مكونات اختيارية" : "incl. optional components"}</div>
            <div style="font-size:9px;color:#a07a30;margin-top:1px;">${selectedOpts.map((o) => esc(o.name)).join("، ")}</div>
          </div>
        </div>
      </td>
      <td style="padding:8px 14px;text-align:center;"><span style="background:#fdf5e0;color:#8a6010;font-size:9px;font-weight:700;padding:3px 10px;border-radius:10px;">${isAr ? "ضمن التطوير" : "in dev"}</span></td>
      <td style="padding:8px 14px;text-align:${isAr ? "left" : "right"};font-family:monospace;white-space:nowrap;"><span style="font-size:12px;font-weight:700;color:#8a6010;">${fmtNum(optsTotal)}</span> <span style="font-size:9px;color:#a07a30;">${cur}</span></td>
      ${hasVat ? `<td style="padding:8px 14px;text-align:center;color:#b8c2bd;font-size:11px;">—</td>` : ""}
    </tr>`;
  }

  if (state.totalDiscount > 0) {
    html += `<tr style="border-bottom:1px solid #f0f2ef;background:#f0f9f3;">
      <td style="padding:10px 14px;border-${isAr ? "right" : "left"}:3px solid #22c55e;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:28px;height:28px;background:#dcfce7;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;">💸</div>
          <div>
            <div style="font-size:11px;font-weight:800;color:#15803d;">${isAr ? "خصم إجمالي" : "Total Discount"} (${state.totalDiscount}%)</div>
            <div style="font-size:9px;color:#22c55e;margin-top:1px;">${isAr ? "خصم تشجيعي على قيمة التطوير" : "Promotional discount on development"}</div>
          </div>
        </div>
      </td>
      <td style="padding:10px 14px;text-align:center;"><span style="background:#dcfce7;color:#15803d;font-size:9px;font-weight:800;padding:3px 10px;border-radius:10px;">${isAr ? "وفر" : "Saved"}</span></td>
      <td style="padding:10px 14px;text-align:${isAr ? "left" : "right"};font-family:monospace;white-space:nowrap;"><span style="font-size:13px;font-weight:800;color:#15803d;">−${fmtNum(devRaw - dev)}</span> <span style="font-size:10px;color:#22c55e;">${cur}</span></td>
      ${hasVat ? `<td style="padding:10px 14px;text-align:center;color:#b8c2bd;font-size:11px;">—</td>` : ""}
    </tr>`;
  }

  html += `</tbody></table>
      <div style="background:#fdf9ef;padding:7px 16px;font-size:10px;font-weight:800;color:#8a6010;letter-spacing:0.5px;border-top:1px solid #e2e8e3;border-bottom:1px solid #f0e6cf;display:flex;align-items:center;gap:6px;">
        <span>🔁</span><span>${isAr ? "بنود متكررة — غير مشمولة في إجمالي العرض" : "Recurring — excluded from offer total"}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;"><tbody>
        <tr style="border-bottom:1px solid #f0f2ef;">
          <td style="padding:11px 14px;border-${isAr ? "right" : "left"}:3px solid #c9a84c;">
            <div style="display:flex;align-items:center;gap:10px;">
              <div style="width:32px;height:32px;background:#fdf5e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🔌</div>
              <div>
                <div style="font-size:12px;font-weight:800;color:#8a6010;">${isAr ? "ترخيص واستضافة" : "License & Hosting"} <span style="font-size:9px;color:#b48a30;font-weight:600;">(Odoo.sh — ${state.license.type})</span></div>
                <div style="font-size:10px;color:#a07a30;margin-top:1px;">${isAr ? "فاتورة شهرية مستقلة عن العرض" : "Billed monthly, separate from offer"}</div>
              </div>
            </div>
          </td>
          <td style="padding:11px 14px;text-align:center;"><span style="background:#fdf5e0;color:#8a6010;font-size:9px;font-weight:800;padding:3px 10px;border-radius:10px;">${isAr ? "شهري" : "Monthly"}</span></td>
          <td style="padding:11px 14px;text-align:${isAr ? "left" : "right"};font-family:monospace;white-space:nowrap;"><span style="font-size:14px;font-weight:800;color:#c9a84c;">${fmtNum(licM)}</span> <span style="font-size:10px;color:#b48a30;">${cur}/${isAr ? "شهر" : "mo"}</span></td>
          ${hasVat ? `<td style="padding:11px 14px;text-align:center;color:#7a8e80;font-size:9px;">${isAr ? "بدون ضريبة" : "Tax-free"}</td>` : ""}
        </tr>
        <tr style="border-bottom:1px solid #f0f2ef;background:#fffaf0;">
          <td style="padding:9px 14px;border-${isAr ? "right" : "left"}:3px solid #c9a84c;padding-${isAr ? "right" : "left"}:30px;">
            <div style="display:flex;align-items:center;gap:8px;">
              <span style="color:#8a6010;font-size:11px;font-weight:800;">↳</span>
              <div>
                <div style="font-size:11px;font-weight:800;color:#8a6010;">${isAr ? "الإجمالي السنوي — تجديد الترخيص (Odoo.sh)" : "Annual total — license renewal (Odoo.sh)"}</div>
                <div style="font-size:9px;color:#a07a30;margin-top:1px;">${fmtNum(licM)} × 12 ${isAr ? "شهر" : "months"}</div>
              </div>
            </div>
          </td>
          <td style="padding:9px 14px;text-align:center;"><span style="background:#c9a84c;color:#fff;font-size:9px;font-weight:800;padding:3px 10px;border-radius:10px;">${isAr ? "سنوي" : "Annual"}</span></td>
          <td style="padding:9px 14px;text-align:${isAr ? "left" : "right"};font-family:monospace;white-space:nowrap;"><span style="font-size:14px;font-weight:900;color:#8a6010;">${fmtNum(annualLic)}</span> <span style="font-size:10px;color:#b48a30;">${cur}/${isAr ? "سنة" : "yr"}</span></td>
          ${hasVat ? `<td style="padding:9px 14px;text-align:center;color:#7a8e80;font-size:9px;">${isAr ? "بدون ضريبة" : "Tax-free"}</td>` : ""}
        </tr>`;

  if (supM > 0) {
    html += `<tr style="border-bottom:1px solid #f0f2ef;">
      <td style="padding:11px 14px;border-${isAr ? "right" : "left"}:3px solid #c9a84c;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:32px;height:32px;background:#fdf5e0;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:16px;flex-shrink:0;">🎧</div>
          <div>
            <div style="font-size:12px;font-weight:800;color:#8a6010;">${isAr ? "دعم فني" : "Support"} <span style="font-size:9px;color:#b48a30;font-weight:600;">(${pkg?.name ?? ""})</span></div>
            <div style="font-size:10px;color:#a07a30;margin-top:1px;">${isAr ? "باقة دعم شهرية" : "Monthly support package"}</div>
          </div>
        </div>
      </td>
      <td style="padding:11px 14px;text-align:center;"><span style="background:#fdf5e0;color:#8a6010;font-size:9px;font-weight:800;padding:3px 10px;border-radius:10px;">${isAr ? "شهري" : "Monthly"}</span></td>
      <td style="padding:11px 14px;text-align:${isAr ? "left" : "right"};font-family:monospace;white-space:nowrap;"><span style="font-size:14px;font-weight:800;color:#c9a84c;">${fmtNum(supM)}</span> <span style="font-size:10px;color:#b48a30;">${cur}/${isAr ? "شهر" : "mo"}</span></td>
      ${hasVat ? `<td style="padding:11px 14px;text-align:center;color:#b8c2bd;font-size:11px;">—</td>` : ""}
    </tr>`;
  }

  html += `</tbody></table>`;

  if (hasVat) {
    html += `<div style="background:#f7f9f6;padding:12px 16px;border-top:2px dashed #c4d6c8;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:11px;">
        <span style="color:#3e5446;">${isAr ? "المجموع قبل الضريبة (التطوير فقط)" : "Subtotal before VAT (development only)"}</span>
        <span style="font-weight:700;color:#1a5c37;font-family:monospace;">${fmtNum(dev)} ${cur}</span>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;font-size:11px;">
        <span style="color:#8a6010;">🧾 ${isAr ? `ضريبة القيمة المضافة (${vatPct}%)` : `VAT (${vatPct}%)`}</span>
        <span style="font-weight:700;color:#8a6010;font-family:monospace;">+ ${fmtNum(vat)} ${cur}</span>
      </div>
    </div>`;
  }

  html += `<div style="background:linear-gradient(135deg,#1a5c37 0%,#0e3a1e 100%);color:#fff;padding:18px 20px;display:flex;justify-content:space-between;align-items:center;border-top:3px solid #c9a84c;">
    <div>
      <div style="font-size:12px;color:#c9a84c;font-weight:800;letter-spacing:0.5px;margin-bottom:3px;">💎 ${isAr ? "إجمالي العرض" : "Offer Total"}${hasVat ? (isAr ? " (شامل الضريبة)" : " (incl. VAT)") : ""}</div>
      <div style="font-size:9px;opacity:0.65;">${isAr ? "ترخيص Odoo.sh غير مشمول — يُجدَّد سنوياً مستقلاً" : "Odoo.sh license excluded — renewed annually"}</div>
    </div>
    <div style="text-align:${isAr ? "left" : "right"};">
      <div style="font-size:32px;font-weight:900;color:#c9a84c;font-family:monospace;line-height:1;">${fmtNum(devWithVat)}</div>
      <div style="font-size:11px;opacity:0.75;margin-top:4px;">${cur}</div>
    </div>
  </div>
</div>`;

  // Odoo warning
  html += `<div style="background:#fdf5e0;border:1px solid #c9a84c;border-radius:6px;padding:8px 14px;font-size:10px;color:#8a6010;">
    ⚠️ ${isAr ? "أسعار الترخيص إرشادية من Odoo — تُؤكَّد بعرض رسمي" : "License prices are indicative — confirm with official Odoo quote"}
  </div></section>`;

  return html;
}

/** §12 — Installments schedule */
export function renderInstallmentsHtml(state: QuoteBuilderState, isAr: boolean): string {
  if (state.payment.installments <= 1) return "";
  const cur = curSymbol(state.meta.currency);
  const { devWithVat } = computeRenderTotals(state);
  const total = devWithVat;
  const n = state.payment.installments;
  const fp = state.payment.firstPaymentPct || 30;
  const fa = Math.round(total * fp / 100);
  const perInst = Math.round((total - fa) / (n - 1));

  const title = isAr ? "جدول الأقساط" : "Payment Schedule";
  const startDate = state.payment.startDate ? new Date(state.payment.startDate) : new Date();

  let html = `<section id="dyn-installments" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#f7f9f6;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">📆</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div>
      <div style="font-size:11px;color:#7a8e80;">${n} ${isAr ? "أقساط" : "installments"} — ${state.payment.method}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead><tr style="background:#1a5c37;color:#fff;">
        <th style="padding:8px 10px;">#</th>
        <th style="padding:8px 10px;text-align:${isAr ? "right" : "left"};">${isAr ? "الوصف" : "Description"}</th>
        <th style="padding:8px 10px;text-align:center;">${isAr ? "التاريخ" : "Date"}</th>
        <th style="padding:8px 10px;text-align:center;">%</th>
        <th style="padding:8px 10px;text-align:center;">${isAr ? "المبلغ" : "Amount"} (${cur})</th>
      </tr></thead><tbody>`;

  const labels = isAr
    ? ["عند التوقيع", "بدء التطوير", "منتصف المشروع", "التسليم النهائي", "القسط", "القسط"]
    : ["On signing", "Development start", "Mid-project", "Final delivery", "Installment", "Installment"];

  let sum = 0;
  for (let i = 0; i < n; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.round((i / (n - 1)) * 60));
    const amt = i === 0 ? fa : i === n - 1 ? total - fa - perInst * (n - 2) : perInst;
    const pct = Math.round((amt / total) * 100);
    sum += amt;
    const desc = i < labels.length ? labels[i] : `${labels[4]} ${i + 1}`;

    html += `<tr style="border-bottom:1px solid #e2e8e3;${i === 0 ? "background:#eaf3ed;" : ""}">
      <td style="padding:7px 10px;text-align:center;font-weight:700;">${i + 1}</td>
      <td style="padding:7px 10px;">${esc(desc)}</td>
      <td style="padding:7px 10px;text-align:center;color:#7a8e80;">${fmtDateArabic(d)}</td>
      <td style="padding:7px 10px;text-align:center;">${pct}%</td>
      <td style="padding:7px 10px;text-align:center;font-weight:700;color:#1a5c37;">${fmtNum(amt)}</td>
    </tr>`;
  }

  html += `<tr style="background:#1a5c37;color:#fff;font-weight:800;">
    <td colspan="3" style="padding:8px 10px;">${isAr ? "الإجمالي" : "Total"}</td>
    <td style="padding:8px 10px;text-align:center;">100%</td>
    <td style="padding:8px 10px;text-align:center;">${fmtNum(sum)} ${cur}</td>
  </tr></tbody></table></section>`;

  return html;
}
