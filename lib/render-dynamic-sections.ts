/**
 * Generates HTML sections for all dynamic Builder data that should
 * appear in the final quote output (HTML preview + PDF).
 *
 * This is injected into the rendered HTML before the </body> or
 * before the signature section.
 */

import type { QuoteBuilderState } from "./builder/types";
import { generateRequirements } from "./requirements-catalog";
import { ODOO_MODULES, BG_APPS } from "./modules-catalog";
import { fmtNum, curSymbol, fmtDateArabic } from "./utils";

function esc(s: string): string {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const RESP_COLORS: Record<string, { bg: string; color: string; label: string; labelEn: string }> = {
  client: { bg: "#fdf5e0", color: "#8a6010", label: "العميل", labelEn: "Client" },
  bg:     { bg: "#eaf3ed", color: "#1a5c37", label: "BG", labelEn: "BG" },
  shared: { bg: "#eff6ff", color: "#2563eb", label: "مشترك", labelEn: "Shared" },
};

/**
 * Generate the requirements section HTML.
 */
export function renderRequirementsHtml(state: QuoteBuilderState, isAr: boolean): string {
  const selectedIds = Object.entries(state.modules)
    .filter(([, m]) => m.selected)
    .map(([id]) => id);

  if (selectedIds.length === 0) return "";

  const { modules: modReqs, common } = generateRequirements(selectedIds);
  const title = isAr ? "متطلبات العمل والتشغيل" : "Work Requirements & Prerequisites";
  const subtitle = isAr
    ? `ما يحتاجه العميل لتشغيل ${selectedIds.length} موديول بنجاح`
    : `What the client needs to provide for ${selectedIds.length} modules`;

  let html = `
  <section style="padding:32px 24px;border-bottom:1px solid #e2e8e3;background:#fff;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;">
      <div style="width:32px;height:32px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;flex-shrink:0;">📋</div>
      <div>
        <div style="font-size:18px;font-weight:700;color:#1a5c37;">${title}</div>
        <div style="font-size:12px;color:#7a8e80;margin-top:2px;">${subtitle}</div>
      </div>
    </div>`;

  // Per-module requirements
  modReqs.forEach((mod) => {
    html += `
    <div style="border:1px solid #e2e8e3;border-radius:8px;overflow:hidden;margin-bottom:12px;page-break-inside:avoid;">
      <div style="background:#f7f9f6;padding:8px 14px;border-bottom:1px solid #e2e8e3;display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">${mod.icon}</span>
        <span style="font-size:12px;font-weight:800;color:#1a5c37;">${esc(mod.moduleName)}</span>
        <span style="font-size:10px;color:#7a8e80;margin-${isAr ? "right" : "left"}:auto;">${mod.requirements.length} ${isAr ? "متطلب" : "items"}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">`;

    mod.requirements.forEach((req, i) => {
      const r = RESP_COLORS[req.responsible];
      html += `
        <tr style="border-bottom:1px solid #f0f2ef;">
          <td style="padding:6px 12px;color:#7a8e80;width:24px;text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px;color:#141f18;">${esc(req.text)}</td>
          <td style="padding:6px 12px;text-align:center;width:70px;">
            <span style="background:${r.bg};color:${r.color};font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;">${isAr ? r.label : r.labelEn}</span>
          </td>
        </tr>`;
    });
    html += `</table></div>`;
  });

  // Common requirements
  common.forEach((cat) => {
    html += `
    <div style="border:1px solid #e2e8e3;border-radius:8px;overflow:hidden;margin-bottom:12px;page-break-inside:avoid;">
      <div style="background:#eaf3ed;padding:8px 14px;border-bottom:1px solid #e2e8e3;display:flex;align-items:center;gap:8px;">
        <span style="font-size:16px;">${cat.icon}</span>
        <span style="font-size:12px;font-weight:800;color:#1a5c37;">${esc(cat.category)}</span>
        <span style="font-size:10px;color:#7a8e80;margin-${isAr ? "right" : "left"}:auto;">${isAr ? "ثابت في كل مشروع" : "Standard"}</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px;">`;

    cat.reqs.forEach((req, i) => {
      const r = RESP_COLORS[req.responsible];
      html += `
        <tr style="border-bottom:1px solid #f0f2ef;">
          <td style="padding:6px 12px;color:#7a8e80;width:24px;text-align:center;">${i + 1}</td>
          <td style="padding:6px 8px;color:#141f18;">${esc(req.text)}</td>
          <td style="padding:6px 12px;text-align:center;width:70px;">
            <span style="background:${r.bg};color:${r.color};font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;">${isAr ? r.label : r.labelEn}</span>
          </td>
        </tr>`;
    });
    html += `</table></div>`;
  });

  // Extra requirements
  if (state.extraRequirements?.trim()) {
    html += `
    <div style="background:#f7f9f6;border:1px solid #e2e8e3;border-radius:8px;padding:12px 16px;margin-bottom:12px;">
      <div style="font-size:11px;font-weight:700;color:#1a5c37;margin-bottom:6px;">${isAr ? "متطلبات إضافية" : "Additional Requirements"}</div>
      <div style="font-size:11px;color:#3e5446;white-space:pre-line;line-height:1.6;">${esc(state.extraRequirements)}</div>
    </div>`;
  }

  html += `</section>`;
  return html;
}

/**
 * Generate the meeting notes section HTML.
 */
export function renderMeetingNotesHtml(state: QuoteBuilderState, isAr: boolean): string {
  if (state.meetingNotes.length === 0 && state.moduleChanges.length === 0) return "";

  const title = isAr ? "ملاحظات الاجتماع" : "Meeting Notes";
  const ICONS: Record<string, string> = { note: "📝", important: "⚠️", request: "🔧", concern: "❓" };

  let html = `
  <section style="padding:32px 24px;border-bottom:1px solid #e2e8e3;background:#f7f9f6;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:32px;height:32px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;">💬</div>
      <div style="font-size:18px;font-weight:700;color:#1a5c37;">${title}</div>
    </div>`;

  if (state.meetingNotes.length > 0) {
    html += `<div style="margin-bottom:16px;">`;
    state.meetingNotes.forEach((n) => {
      const icon = ICONS[n.type] || "📝";
      const isBold = n.type === "important";
      html += `
      <div style="padding:8px 14px;border:1px solid ${isBold ? "#c9a84c" : "#e2e8e3"};background:${isBold ? "#fdf5e0" : "#fff"};border-radius:6px;margin-bottom:6px;display:flex;align-items:center;gap:8px;font-size:12px;">
        <span>${icon}</span>
        <span style="flex:1;color:#141f18;">${esc(n.text)}</span>
        ${n.owner ? `<span style="font-size:10px;color:#7a8e80;">${esc(n.owner)}</span>` : ""}
      </div>`;
    });
    html += `</div>`;
  }

  if (state.moduleChanges.length > 0) {
    const subTitle = isAr ? "تعديلات على مستوى الموديولات" : "Module-level Changes";
    html += `<div style="font-size:12px;font-weight:700;color:#1a5c37;margin-bottom:8px;">${subTitle}</div>`;
    state.moduleChanges.forEach((c) => {
      let modName = c.moduleId === "new" ? (isAr ? "موديول جديد" : "New module") : c.moduleId;
      ODOO_MODULES.forEach((cat) => cat.modules.forEach((m) => { if (m.id === c.moduleId) modName = m.name; }));
      const impactColors: Record<string, string> = { low: "#7a8e80", med: "#c9a84c", high: "#c0392b" };
      const impactLabels: Record<string, string> = { low: isAr ? "محدود" : "Low", med: isAr ? "متوسط" : "Medium", high: isAr ? "كبير" : "High" };
      html += `
      <div style="padding:6px 14px;border:1px solid #e2e8e3;border-radius:6px;margin-bottom:4px;font-size:11px;display:flex;align-items:center;gap:8px;">
        <span style="font-weight:700;color:#1a5c37;">[${esc(modName)}]</span>
        <span style="flex:1;color:#141f18;">${esc(c.change)}</span>
        <span style="font-size:9px;font-weight:700;color:${impactColors[c.impact] || "#7a8e80"};">${impactLabels[c.impact] || ""}</span>
      </div>`;
    });
  }

  html += `</section>`;
  return html;
}

/**
 * Generate the project description + workflows section HTML.
 */
export function renderDescriptionHtml(state: QuoteBuilderState, isAr: boolean): string {
  if (!state.projectDescription?.trim() && !state.workflows?.trim()) return "";

  let html = "";

  if (state.projectDescription?.trim()) {
    const title = isAr ? "وصف المشروع — الملخص التنفيذي" : "Project Description — Executive Summary";
    html += `
    <section style="padding:32px 24px;border-bottom:1px solid #e2e8e3;background:#fff;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:32px;height:32px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">📝</div>
        <div style="font-size:18px;font-weight:700;color:#1a5c37;">${title}</div>
      </div>
      <div style="font-size:13px;color:#3e5446;line-height:1.8;white-space:pre-line;">${esc(state.projectDescription)}</div>
    </section>`;
  }

  if (state.workflows?.trim()) {
    const title = isAr ? "دورات العمل الرئيسية" : "Key Business Workflows";
    html += `
    <section style="padding:32px 24px;border-bottom:1px solid #e2e8e3;background:#f7f9f6;page-break-inside:avoid;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;">
        <div style="width:32px;height:32px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;">🔄</div>
        <div style="font-size:18px;font-weight:700;color:#1a5c37;">${title}</div>
      </div>
      <div style="font-size:12px;color:#3e5446;line-height:1.8;white-space:pre-line;">${esc(state.workflows)}</div>
    </section>`;
  }

  if (state.extraNotes?.trim()) {
    html += `
    <section style="padding:24px;border-bottom:1px solid #e2e8e3;background:#fdf5e0;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:16px;">⚠️</span>
        <span style="font-size:14px;font-weight:700;color:#8a6010;">${isAr ? "شروط وملاحظات خاصة" : "Special Terms & Notes"}</span>
      </div>
      <div style="font-size:12px;color:#3e5446;line-height:1.7;white-space:pre-line;">${esc(state.extraNotes)}</div>
    </section>`;
  }

  return html;
}
