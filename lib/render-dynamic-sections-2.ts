/**
 * Dynamic section generators — Part 2
 * Module details, workflows, phases, pricing, financial, installments.
 * Each function returns an HTML string to inject into the output.
 */

import type { QuoteBuilderState } from "./builder/types";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "./modules-catalog";
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

/** §5 — Module details table */
export function renderModuleDetailsHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getSelectedMods(state);
  const bgApps = getSelectedBG(state);
  if (mods.length === 0 && bgApps.length === 0) return "";
  const cur = curSymbol(state.meta.currency);
  const title = isAr ? "تفاصيل الموديولات" : "Module Details";
  const sub = isAr ? `وصف تفصيلي لكل موديول ومميزاته الرئيسية — ${mods.length + bgApps.length} موديول` : `Detailed breakdown — ${mods.length + bgApps.length} modules`;

  let html = `<section id="dyn-modules" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#fff;page-break-inside:auto;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">📦</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div><div style="font-size:11px;color:#7a8e80;">${sub}</div></div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:11px;">
      <thead><tr style="background:#eaf3ed;">
        <th style="padding:8px 10px;text-align:${isAr ? "right" : "left"};color:#1a5c37;font-weight:700;">${isAr ? "الموديول" : "Module"}</th>
        <th style="padding:8px 10px;text-align:${isAr ? "right" : "left"};color:#1a5c37;font-weight:700;">${isAr ? "المميزات الرئيسية" : "Key Features"}</th>
        <th style="padding:8px 10px;text-align:center;color:#1a5c37;font-weight:700;width:80px;">${isAr ? "السعر" : "Price"}</th>
      </tr></thead><tbody>`;

  mods.forEach((m) => {
    const ext = getExtended(m.id);
    const feats = ext.features.length > 0 ? ext.features : m.features;
    const finalPrice = Math.round(m.price * (1 - (m.discount || 0) / 100));
    html += `<tr style="border-bottom:1px solid #e2e8e3;page-break-inside:avoid;">
      <td style="padding:8px 10px;font-weight:700;color:#1a5c37;white-space:nowrap;">${esc(m.name)}</td>
      <td style="padding:8px 10px;color:#3e5446;line-height:1.6;">${feats.map((f) => esc(f)).join(" · ")}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:#1a5c37;">${fmtNum(finalPrice)} ${cur}${m.discount > 0 ? `<br><span style="font-size:9px;color:#c9a84c;">خصم ${m.discount}%</span>` : ""}</td>
    </tr>`;
  });

  bgApps.forEach((a) => {
    html += `<tr style="border-bottom:1px solid #e2e8e3;background:#fdf5e0;page-break-inside:avoid;">
      <td style="padding:8px 10px;font-weight:700;color:#8a6010;"><span style="background:#c9a84c;color:#1a5c37;font-size:8px;font-weight:800;padding:1px 5px;border-radius:8px;margin-left:4px;">BG</span> ${esc(a.name)}</td>
      <td style="padding:8px 10px;color:#3e5446;line-height:1.6;">${a.features.slice(0, 4).map((f) => esc(f)).join(" · ")}</td>
      <td style="padding:8px 10px;text-align:center;font-weight:700;color:#8a6010;">${fmtNum(a.implementationPrice)} ${cur}</td>
    </tr>`;
  });

  html += `</tbody></table></section>`;
  return html;
}

/** §6 — Workflows — auto-generated from extended module data */
export function renderWorkflowsHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getSelectedMods(state);
  const ids = mods.map(m => m.id);

  if (ids.length === 0 && !state.workflows?.trim()) return "";

  // If user wrote custom workflows, use them only.
  if (state.workflows?.trim()) {
    const lines = state.workflows.split("\n\n").filter(Boolean);
    return buildWorkflowSection(lines, isAr);
  }

  // Auto-generate from extended module data — each module gets its own workflow card.
  const cards: string[] = [];
  mods.forEach((m) => {
    const ext = getExtended(m.id);
    if (ext.workflow.length > 0) {
      const steps = ext.workflow.map((s, i) => `<span style="color:#7a8e80;margin-left:4px;">${i + 1}.</span> ${esc(s)}`).join("<br>");
      cards.push(`<div style="background:#fff;border:1px solid #e2e8e3;border-radius:8px;padding:14px 16px;margin-bottom:10px;page-break-inside:avoid;">
        <div style="font-size:13px;font-weight:700;color:#1a5c37;margin-bottom:8px;border-bottom:2px solid #c9a84c;padding-bottom:6px;">🔄 ${esc(m.name)}</div>
        <div style="font-size:11px;color:#3e5446;line-height:1.9;">${steps}</div>
      </div>`);
    }
  });

  if (cards.length === 0) return "";

  const title = isAr ? "دورات العمل الرئيسية" : "Business Workflows";
  const sub = isAr ? `${cards.length} دورة عمل مؤتمتة بناءً على الموديولات المختارة` : `${cards.length} automated workflows based on selected modules`;

  return `<section id="dyn-workflows" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#f7f9f6;page-break-inside:auto;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">🔄</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div><div style="font-size:11px;color:#7a8e80;">${sub}</div></div>
    </div>
    ${cards.join("\n")}
  </section>`;
}

/** §7 — Implementation phases — uses user's phases from Builder */
export function renderPhasesHtml(state: QuoteBuilderState, isAr: boolean): string {
  const phases = state.phases && state.phases.length > 0 ? state.phases : [];
  if (phases.length === 0) return "";

  const title = isAr ? "خطة التنفيذ" : "Implementation Plan";
  const sub = isAr ? `${phases.length} مراحل — المدة الإجمالية: ${state.durationLabel || "—"}` : `${phases.length} phases — Total: ${state.durationLabel || "—"}`;
  const colors = ["#1a5c37", "#c9a84c", "#2563eb", "#27ae60", "#8e44ad", "#e67e22"];

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

/** §9+10+11 — Pricing + Financial + Items */
export function renderPricingHtml(state: QuoteBuilderState, isAr: boolean): string {
  const mods = getSelectedMods(state);
  const bgApps = getSelectedBG(state);
  const cur = curSymbol(state.meta.currency);
  const modsTotal = mods.reduce((s, m) => s + Math.round(m.price * (1 - (m.discount || 0) / 100)), 0);
  const bgImpl = bgApps.reduce((s, a) => s + a.implementationPrice, 0);
  const devRaw = modsTotal + bgImpl;
  const dev = Math.round(devRaw * (1 - (state.totalDiscount || 0) / 100));
  const licM = Math.round(state.license.serverMonthly + state.license.perUserMonthly * state.license.users);
  const pkg = SUPPORT_PACKAGES.find((p) => p.id === state.support.packageId);
  const supM = state.support.packageId === "none" ? 0 : state.support.prices[state.support.packageId as "basic" | "advanced" | "premium"] ?? pkg?.price ?? 0;
  const annualLic = licM * 12;
  const grandY1 = dev + annualLic;
  const firstPay = Math.round(grandY1 * (state.payment.firstPaymentPct || 30) / 100);

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
      </div>
      <div style="background:#c9a84c;color:#fff;border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:10px;opacity:0.8;margin-bottom:6px;">${isAr ? "متكرر شهرياً" : "Monthly Recurring"}</div>
        <div style="font-size:26px;font-weight:800;">${fmtNum(licM + supM)}</div>
        <div style="font-size:10px;opacity:0.7;">${cur}/${isAr ? "شهر" : "mo"} (${isAr ? "ترخيص" : "License"} ${fmtNum(licM)} + ${isAr ? "دعم" : "Support"} ${fmtNum(supM)})</div>
      </div>
      <div style="background:#fff;border:1.5px solid #e2e8e3;border-radius:10px;padding:18px;text-align:center;">
        <div style="font-size:10px;color:#7a8e80;margin-bottom:6px;">${isAr ? "الدفعة الأولى" : "First Payment"} (${state.payment.firstPaymentPct}%)</div>
        <div style="font-size:26px;font-weight:800;color:#1a5c37;">${fmtNum(firstPay)}</div>
        <div style="font-size:10px;color:#7a8e80;">${cur}${state.payment.startDate ? ` — ${fmtDateArabic(state.payment.startDate)}` : ""}</div>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:14px;">
      <thead><tr style="background:#eaf3ed;">
        <th style="padding:7px 10px;text-align:${isAr ? "right" : "left"};color:#1a5c37;">${isAr ? "البند" : "Item"}</th>
        <th style="padding:7px 10px;text-align:center;color:#1a5c37;">${isAr ? "النوع" : "Type"}</th>
        <th style="padding:7px 10px;text-align:center;color:#1a5c37;">${isAr ? "المبلغ" : "Amount"} (${cur})</th>
      </tr></thead><tbody>`;

  html += `<tr style="border-bottom:1px solid #e2e8e3;">
    <td style="padding:6px 10px;font-weight:700;color:#1a5c37;">${isAr ? "تطوير وتطبيق" : "Development"} — ${mods.length + bgApps.length} ${isAr ? "موديول" : "modules"}</td>
    <td style="padding:6px 10px;text-align:center;"><span style="background:#eaf3ed;color:#1a5c37;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;">${isAr ? "مرة واحدة" : "One-time"}</span></td>
    <td style="padding:6px 10px;text-align:center;font-weight:700;color:#1a5c37;">${fmtNum(dev)}</td>
  </tr>`;
  html += `<tr style="border-bottom:1px solid #e2e8e3;">
    <td style="padding:6px 10px;color:#1a5c37;">${isAr ? "ترخيص واستضافة" : "License & Hosting"} (${state.license.type})</td>
    <td style="padding:6px 10px;text-align:center;"><span style="background:#fdf5e0;color:#8a6010;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;">${isAr ? "شهري" : "Monthly"}</span></td>
    <td style="padding:6px 10px;text-align:center;font-weight:700;color:#c9a84c;">${fmtNum(licM)}</td>
  </tr>`;
  if (supM > 0) {
    html += `<tr style="border-bottom:1px solid #e2e8e3;">
      <td style="padding:6px 10px;color:#1a5c37;">${isAr ? "دعم فني" : "Support"} (${pkg?.name ?? ""})</td>
      <td style="padding:6px 10px;text-align:center;"><span style="background:#fdf5e0;color:#8a6010;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;">${isAr ? "شهري" : "Monthly"}</span></td>
      <td style="padding:6px 10px;text-align:center;font-weight:700;color:#c9a84c;">${fmtNum(supM)}</td>
    </tr>`;
  }
  if (state.totalDiscount > 0) {
    html += `<tr style="border-bottom:1px solid #e2e8e3;background:#eaf3ed;">
      <td style="padding:6px 10px;color:#1a5c37;">${isAr ? "خصم إجمالي" : "Total Discount"} (${state.totalDiscount}%)</td>
      <td style="padding:6px 10px;text-align:center;"><span style="background:#eaf3ed;color:#1a5c37;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;">${isAr ? "وفر" : "Saved"}</span></td>
      <td style="padding:6px 10px;text-align:center;font-weight:700;color:#1a5c37;">-${fmtNum(devRaw - dev)}</td>
    </tr>`;
  }
  html += `</tbody></table>`;

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
  const mods = getSelectedMods(state);
  const bgApps = getSelectedBG(state);
  const modsTotal = mods.reduce((s, m) => s + Math.round(m.price * (1 - (m.discount || 0) / 100)), 0);
  const bgImpl = bgApps.reduce((s, a) => s + a.implementationPrice, 0);
  const dev = Math.round((modsTotal + bgImpl) * (1 - (state.totalDiscount || 0) / 100));
  const licM = Math.round(state.license.serverMonthly + state.license.perUserMonthly * state.license.users);
  const total = dev + licM * 12;
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
