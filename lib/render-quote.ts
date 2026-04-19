/**
 * Server-side quote renderer — bilingual.
 *
 * Builds 100% dynamic HTML from the Builder state using section
 * renderers. No template substitution — all sections are generated
 * from scratch with consistent pricing (country × complexity multipliers).
 */

import type { QuoteBuilderState } from "./builder/types";
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

/**
 * Main render function — builds 100% dynamic HTML from Builder state.
 * All pricing uses country × complexity multipliers via the shared
 * helpers in render-dynamic-sections-2.ts.
 */
export function renderQuoteHtml(state: QuoteBuilderState): string {
  const isAr = state.language === "ar";

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
    renderDescriptionHtml(state, isAr),
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

  return `<!DOCTYPE html>
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
}
