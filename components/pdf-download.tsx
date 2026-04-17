"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  html: string;
  fileName: string;
  language: "ar" | "en" | null;
};

/**
 * Opens quote HTML in a new window with a TABLE-based header/footer
 * (the only 100% reliable cross-browser method for repeating
 * headers/footers on every printed page) and triggers print.
 */
export function PdfDownloadButton({ html, fileName, language }: Props) {
  const [state, setState] = useState<"idle" | "rendering" | "done">("idle");

  const handlePrint = useCallback(() => {
    if (!html) return;
    setState("rendering");

    const isAr = language === "ar";
    const printDoc = buildPrintDoc(html, fileName, isAr);

    const win = window.open("", "_blank");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة (pop-ups) لتحميل PDF.");
      setState("idle");
      return;
    }

    win.document.open();
    win.document.write(printDoc);
    win.document.close();

    // Auto-print after fonts load.
    const triggerPrint = () => {
      win.focus();
      win.print();
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    };
    win.onload = () => setTimeout(triggerPrint, 600);
    setTimeout(() => { if (state === "rendering") triggerPrint(); }, 3500);
  }, [html, fileName, language, state]);

  return (
    <button
      onClick={handlePrint}
      disabled={state === "rendering" || !html}
      className={`inline-flex items-center gap-1.5 h-8 text-xs font-bold rounded-sm2 px-3 transition-colors ${
        state === "done"
          ? "bg-bg-green text-white"
          : "bg-bg-gold text-bg-green hover:bg-bg-gold-2"
      }`}
    >
      {state === "rendering" ? (
        <><Loader2 className="size-3.5 animate-spin" /> جاري التحضير...</>
      ) : state === "done" ? (
        <><CheckCircle2 className="size-3.5" /> تم ✓</>
      ) : (
        <><Download className="size-3.5" /> حفظ PDF</>
      )}
    </button>
  );
}

/**
 * Extract everything between <body> and </body> from the quote HTML,
 * then wrap it in a TABLE structure:
 *   <thead> = BG header (repeats on every printed page)
 *   <tfoot> = contact footer (repeats on every printed page)
 *   <tbody> = quote content
 *
 * This is the only reliable cross-browser method. CSS position:fixed
 * fails in many print contexts. display:table-header-group is what
 * browsers have supported for 20+ years.
 */
function buildPrintDoc(html: string, title: string, isAr: boolean): string {
  // Extract <head> content (for CSS + fonts)
  const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  const headContent = headMatch?.[1] ?? "";

  // Extract <body> content
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  let bodyContent = bodyMatch?.[1] ?? html;

  // Remove sidebar, topbar, overlay from body content
  bodyContent = bodyContent
    .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, "")
    .replace(/<div[^>]*id="sidebar"[^>]*>[\s\S]*?<\/div>\s*(?=<!--)/gi, "")
    .replace(/<div[^>]*id="topbar"[^>]*>[\s\S]*?<\/div>/gi, "")
    .replace(/<div[^>]*class="topbar"[^>]*>[\s\S]*?<\/div>\s*(?=<)/gi, "")
    .replace(/<div[^>]*class="sidebar-overlay"[^>]*>[^<]*<\/div>/gi, "")
    .replace(/<div[^>]*id="overlay"[^>]*>[^<]*<\/div>/gi, "");

  const dir = isAr ? "rtl" : "ltr";
  const align = isAr ? "right" : "left";

  return `<!DOCTYPE html>
<html lang="${isAr ? "ar" : "en"}" dir="${dir}">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
${headContent}
<style>
  /* ─── Print table trick ─── */
  .print-table { width: 100%; border-collapse: collapse; }
  .print-table td { padding: 0; vertical-align: top; }

  @media print {
    @page { size: A4 portrait; margin: 4mm 10mm 4mm 10mm; }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
    }

    body {
      margin: 0 !important; padding: 0 !important;
      background: #fff !important;
      font-size: 11px !important;
      line-height: 1.5 !important;
    }

    /* Hide non-print elements */
    #sidebar, .sidebar, aside,
    #topbar, .topbar,
    .sidebar-overlay, .mobile-toggle,
    #hamburger, #overlay { display: none !important; }

    .main, main, .wrap, .shell, .content {
      margin: 0 !important; padding: 0 !important;
      width: 100% !important; display: block !important;
    }

    /* Sections */
    .section, section { padding: 14px 8px !important; background: #fff !important; max-width: 100% !important; }
    .section:nth-child(even), .section:nth-child(odd) { background: #fff !important; }

    /* Page breaks */
    .section, section, .card, .mod-card, .exec-card, .feat-card,
    .phase-card, .fin-card, .sign-card, .kpi-card, tr {
      page-break-inside: avoid !important;
    }
    h1, h2, h3, h4, .section-header, .section-title {
      page-break-after: avoid !important;
    }

    /* Hero */
    .hero, #hero { padding: 20px 12px !important; border-radius: 0 !important; }
    .hero-title { font-size: 22px !important; }
    .hero-client, .hero-client-name { font-size: 17px !important; }

    /* Grids */
    .mod-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 6px !important; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 6px !important; }
    .feat-grid, .exec-grid, .fin-grid, .phases-grid, .sup-grid, .plans-grid {
      grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important;
    }
    .resp-grid, .sign-grid, .terms-grid, .lic-grid {
      grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important;
    }

    /* Cards */
    .mod-card, .card, .feat-card, .exec-card, .kpi-card, .sup-card {
      padding: 6px !important; border-radius: 4px !important;
    }

    /* Tables */
    table:not(.print-table) { width: 100% !important; font-size: 9px !important; }
    thead { display: table-header-group !important; }

    /* Section titles */
    .section-title { font-size: 15px !important; }
    .section-num { width: 22px !important; height: 22px !important; font-size: 10px !important; }

    p { orphans: 3; widows: 3; }
  }

  /* Screen: hide print elements */
  @media screen {
    body { background: #f5f6f4; padding: 20px; }
    .print-table { max-width: 794px; margin: 0 auto; background: #fff; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
  }
</style>
</head>
<body>

<table class="print-table">
  <!-- HEADER: repeats on every printed page -->
  <thead>
    <tr>
      <td>
        <div style="background:#1a5c37;padding:6px 16px;display:flex;align-items:center;justify-content:space-between;">
          <div style="display:flex;align-items:center;gap:8px;">
            <div style="background:#c9a84c;color:#1a5c37;font-weight:800;font-size:10px;padding:3px 8px;border-radius:4px;font-family:Inter,Arial,sans-serif;">BG</div>
            <div>
              <div style="color:#fff;font-weight:700;font-size:10px;font-family:Inter,Arial,sans-serif;">BUSINESS GATE</div>
              <div style="color:#c9a84c;font-size:7px;font-family:Inter,Arial,sans-serif;">Technical Consulting</div>
            </div>
          </div>
          <div style="color:rgba(255,255,255,0.7);font-size:8px;font-family:Inter,Arial,sans-serif;">${title}</div>
        </div>
        <div style="background:#c9a84c;height:2px;"></div>
      </td>
    </tr>
  </thead>

  <!-- FOOTER: repeats on every printed page -->
  <tfoot>
    <tr>
      <td>
        <div style="border-top:1px solid #1a5c37;padding:4px 16px;display:flex;justify-content:space-between;align-items:center;margin-top:6px;">
          <span style="font-size:7px;color:#7a8e80;font-family:Inter,Arial,sans-serif;">
            www.businessesgates.com &nbsp;·&nbsp; OUN@businessesgates.com &nbsp;·&nbsp; +965 9999 0412 &nbsp;·&nbsp; Kuwait
          </span>
          <span style="font-size:7px;color:#1a5c37;font-weight:700;font-family:Inter,Arial,sans-serif;">
            Business Gate Technical Consulting
          </span>
        </div>
      </td>
    </tr>
  </tfoot>

  <!-- BODY: the quote content -->
  <tbody>
    <tr>
      <td>
        ${bodyContent}
      </td>
    </tr>
  </tbody>
</table>

</body>
</html>`;
}
