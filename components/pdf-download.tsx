"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  html: string;
  fileName: string;
  language: "ar" | "en" | null;
};

/**
 * Opens the quote HTML in a new browser window with print-optimized
 * layout (no sidebar/topbar, embedded header/footer via CSS) and
 * triggers window.print() — the browser's native engine handles
 * RTL Arabic perfectly, page breaks intelligently, and produces
 * a high-quality PDF when the user selects "Save as PDF".
 */
export function PdfDownloadButton({ html, fileName, language }: Props) {
  const [state, setState] = useState<"idle" | "rendering" | "done">("idle");

  const handlePrint = useCallback(() => {
    if (!html) return;
    setState("rendering");

    const isAr = language === "ar";
    const printHtml = buildPrintPage(html, fileName, isAr);

    // Open in a new window so the user's current page is untouched.
    const win = window.open("", "_blank", "width=900,height=700");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة (pop-ups) لتحميل PDF.");
      setState("idle");
      return;
    }

    win.document.open();
    win.document.write(printHtml);
    win.document.close();

    // Wait for fonts + images, then auto-trigger print.
    win.onload = () => {
      setTimeout(() => {
        win.print();
        setState("done");
        setTimeout(() => setState("idle"), 2000);
      }, 800);
    };

    // Fallback if onload doesn't fire (some browsers).
    setTimeout(() => {
      if (state === "rendering") {
        win.print();
        setState("done");
        setTimeout(() => setState("idle"), 2000);
      }
    }, 3000);
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
 * Build a complete, self-contained HTML page optimized for printing:
 * - No sidebar / topbar / overlay
 * - Embedded header + footer via CSS position:fixed (repeats every page)
 * - @page rules for A4 with 10mm margins
 * - Page breaks avoid splitting sections
 * - Full RTL support for Arabic
 */
function buildPrintPage(html: string, title: string, isAr: boolean): string {
  // Start with the original HTML and inject our print overrides.
  let h = html;

  // Inject comprehensive print CSS + embedded header/footer HTML before </head>
  const printBlock = `
<style id="bg-pdf-print">
  /* ─── Page setup ─── */
  @page {
    size: A4 portrait;
    margin: 10mm 12mm 10mm 12mm;
  }

  /* ─── Hide screen chrome ─── */
  @media print {
    #sidebar, .sidebar, aside,
    #topbar, .topbar,
    .sidebar-overlay, .mobile-toggle,
    #hamburger, #overlay,
    .tb-actions, .topbar-left button,
    script { display: none !important; }

    /* Main content full width */
    .main, main, main.main {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
    }
    .wrap, .shell { display: block !important; width: 100% !important; }

    /* Colors */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
      text-shadow: none !important;
    }
    body { background: #fff !important; }

    /* Sections */
    .section, section.section, section {
      padding: 20px 16px !important;
      border-bottom: 0.5px solid #e2e8e3 !important;
      background: #fff !important;
      max-width: 100% !important;
      page-break-inside: avoid !important;
    }
    .section:nth-child(even), .section:nth-child(odd) {
      background: #fff !important;
    }

    /* Hero */
    .hero, #hero, section#hero, section.hero {
      padding: 24px 16px !important;
      border-radius: 0 !important;
    }

    /* Avoid orphaned headings */
    h1, h2, h3, h4, .section-header, .section-title {
      page-break-after: avoid !important;
    }

    /* Grids for A4 */
    .mod-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 8px !important; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
    .feat-grid, .exec-grid, .fin-grid, .phases-grid, .sup-grid, .plans-grid {
      grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important;
    }
    .resp-grid, .sign-grid, .terms-grid, .lic-grid {
      grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important;
    }

    /* Cards compact */
    .mod-card, .feat-card, .exec-card, .phase-card,
    .fin-card, .kpi-card, .card, .sup-card, .lic-card {
      padding: 8px !important;
      border-radius: 5px !important;
      page-break-inside: avoid !important;
    }

    /* Tables */
    table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
    thead { display: table-header-group !important; }
    tr { page-break-inside: avoid !important; }
    th { background: #eaf3ed !important; color: #1a5c37 !important; padding: 6px 8px !important; }
    td { padding: 5px 8px !important; border-bottom: 0.5px solid #e2e8e3 !important; }

    /* Typography */
    body { font-size: 12px !important; line-height: 1.5 !important; }
    .section-title, h2.section-title { font-size: 16px !important; }
    .hero-title { font-size: 24px !important; }
    .hero-client, .hero-client-name { font-size: 18px !important; }

    p { orphans: 3; widows: 3; }

    /* ─── Fixed header + footer (repeats on every page) ─── */
    .print-header {
      display: block !important;
      position: fixed;
      top: 0; ${isAr ? "right" : "left"}: 0;
      width: 100%;
      height: 11mm;
      z-index: 9999;
    }
    .print-footer {
      display: block !important;
      position: fixed;
      bottom: 0; ${isAr ? "right" : "left"}: 0;
      width: 100%;
      height: 8mm;
      z-index: 9999;
    }
    /* Push content below header and above footer */
    .print-spacer-top { height: 12mm; display: block !important; }
    .print-spacer-bottom { height: 9mm; display: block !important; }
  }

  /* Hide print elements on screen */
  @media screen {
    .print-header, .print-footer,
    .print-spacer-top, .print-spacer-bottom { display: none !important; }
  }
</style>`;

  h = h.replace(/<\/head>/i, printBlock + "\n</head>");

  // Inject header + footer HTML + spacers right after <body...>
  const headerHtml = `
<div class="print-header">
  <div style="background:#1a5c37;height:10mm;display:flex;align-items:center;justify-content:space-between;padding:0 14mm;">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="background:#c9a84c;color:#1a5c37;font-weight:800;font-size:9pt;padding:2px 6px;border-radius:4px;font-family:Inter,sans-serif;">BG</div>
      <div>
        <div style="color:#fff;font-weight:700;font-size:9pt;font-family:Inter,sans-serif;letter-spacing:0.3px;">BUSINESS GATE</div>
        <div style="color:#c9a84c;font-size:6pt;font-family:Inter,sans-serif;">Technical Consulting</div>
      </div>
    </div>
    <div style="color:rgba(255,255,255,0.6);font-size:7pt;font-family:Inter,sans-serif;">${title}</div>
  </div>
  <div style="background:#c9a84c;height:1mm;"></div>
</div>

<div class="print-footer">
  <div style="border-top:0.5px solid #1a5c37;padding:2mm 14mm 0;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:6pt;color:#7a8e80;font-family:Inter,sans-serif;">www.businessesgates.com · OUN@businessesgates.com · +965 9999 0412 · Kuwait</span>
    <span style="font-size:7pt;color:#1a5c37;font-weight:700;font-family:Inter,sans-serif;"></span>
  </div>
</div>

<div class="print-spacer-top"></div>`;

  const footerSpacer = `<div class="print-spacer-bottom"></div>`;

  // Insert after <body...>
  h = h.replace(/(<body[^>]*>)/i, `$1\n${headerHtml}`);
  // Insert before </body>
  h = h.replace(/<\/body>/i, `${footerSpacer}\n</body>`);

  // Set the page title for the print dialog
  h = h.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  return h;
}
