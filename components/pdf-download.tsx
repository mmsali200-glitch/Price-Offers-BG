"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  html: string;
  fileName: string;
  language: "ar" | "en" | null;
};

export function PdfDownloadButton({ html, fileName, language }: Props) {
  const [state, setState] = useState<"idle" | "rendering" | "done">("idle");

  const handlePrint = useCallback(() => {
    if (!html) return;
    setState("rendering");

    const isAr = language === "ar";
    const printDoc = buildPrintDoc(html, fileName, isAr);

    const win = window.open("", "_blank");
    if (!win) {
      alert("يرجى السماح بالنوافذ المنبثقة لتحميل PDF.");
      setState("idle");
      return;
    }

    win.document.open();
    win.document.write(printDoc);
    win.document.close();

    const triggerPrint = () => {
      win.focus();
      win.print();
      setState("done");
      setTimeout(() => setState("idle"), 2000);
    };
    win.onload = () => setTimeout(triggerPrint, 800);
    setTimeout(() => { if (state === "rendering") triggerPrint(); }, 4000);
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
 * SAFE approach: inject CSS-only overrides into the ORIGINAL HTML.
 * No regex surgery on the body — the HTML structure stays intact.
 * Sidebar/topbar are hidden via display:none in print CSS.
 */
function buildPrintDoc(html: string, title: string, isAr: boolean): string {
  const printCSS = `
<style id="bg-pdf-final">
  @media print {
    @page {
      size: A4 landscape;
      margin: 8mm 12mm;
    }

    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      box-shadow: none !important;
      text-shadow: none !important;
      animation: none !important;
      transition: none !important;
    }

    body {
      background: #fff !important;
      margin: 0 !important;
      padding: 0 !important;
      font-size: 11px !important;
      line-height: 1.5 !important;
    }

    /* ─── HIDE sidebar + topbar (CSS only, no HTML removal) ─── */
    #sidebar, .sidebar, aside.sidebar,
    #topbar, .topbar, div.topbar,
    .sidebar-overlay, #overlay,
    .mobile-toggle, #hamburger,
    .tb-actions { display: none !important; visibility: hidden !important; height: 0 !important; overflow: hidden !important; }

    /* ─── Main content takes full width ─── */
    .main, main, main.main { margin: 0 !important; margin-left: 0 !important; margin-right: 0 !important; padding: 0 !important; width: 100% !important; }
    .wrap, .shell { display: block !important; width: 100% !important; }
    .content { width: 100% !important; }

    /* ─── Sections: clean + avoid page breaks ─── */
    .section, section.section, section {
      padding: 16px 10px !important;
      border-bottom: 0.5px solid #e2e8e3 !important;
      background: #fff !important;
      max-width: 100% !important;
      page-break-inside: avoid !important;
      break-inside: avoid !important;
    }
    .section:nth-child(even), .section:nth-child(odd) { background: #fff !important; }

    /* ─── Hero ─── */
    .hero, #hero, section#hero, section.hero {
      padding: 20px 12px !important;
      border-radius: 0 !important;
    }
    .hero-inner { padding: 0 !important; }
    .hero-title { font-size: 22px !important; }
    .hero-client, .hero-client-name { font-size: 17px !important; }

    /* ─── Section headers ─── */
    h1, h2, h3, h4, .section-header, .section-title {
      page-break-after: avoid !important;
    }
    .section-title, h2.section-title { font-size: 15px !important; }
    .section-num { width: 22px !important; height: 22px !important; font-size: 10px !important; }

    /* ─── Grids for A4 Landscape (wider → more columns) ─── */
    .mod-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 8px !important; }
    .kpi-grid { grid-template-columns: repeat(5, 1fr) !important; gap: 8px !important; }
    .feat-grid, .exec-grid, .fin-grid, .phases-grid, .sup-grid, .plans-grid {
      grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important;
    }
    .resp-grid, .sign-grid, .terms-grid, .lic-grid {
      grid-template-columns: repeat(2, 1fr) !important; gap: 10px !important;
    }

    /* ─── Cards compact ─── */
    .mod-card, .card, .feat-card, .exec-card, .kpi-card, .sup-card,
    .phase-card, .fin-card, .lic-card, .plan-card, .mini-card {
      padding: 6px !important;
      border-radius: 4px !important;
      page-break-inside: avoid !important;
    }

    /* ─── Tables ─── */
    table { width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
    thead { display: table-header-group !important; }
    tr { page-break-inside: avoid !important; }
    th { background: #eaf3ed !important; color: #1a5c37 !important; padding: 5px 6px !important; }
    td { padding: 4px 6px !important; border-bottom: 0.5px solid #e2e8e3 !important; }

    /* ─── Configurator ─── */
    .configurator, .cfg-wrap { border-radius: 6px !important; }
    .cfg-header { padding: 8px 12px !important; }

    /* ─── Signature ─── */
    .sign-card { page-break-inside: avoid !important; }

    /* ─── Prevent stray lines ─── */
    p { orphans: 3; widows: 3; }

    /* ─── Print header/footer via table trick ─── */
    .pdf-wrap { width: 100%; border-collapse: collapse; }
    .pdf-wrap td { padding: 0; vertical-align: top; }
    .pdf-header, .pdf-footer { display: table-header-group; }
    .pdf-footer { display: table-footer-group; }
  }

  /* ─── Screen: preview mode ─── */
  @media screen {
    #sidebar, .sidebar, aside.sidebar,
    #topbar, .topbar, div.topbar,
    .sidebar-overlay, #overlay { display: none !important; }
    .main, main { margin: 0 !important; }
    body { background: #f5f6f4 !important; }
    .pdf-wrap { max-width: 794px; margin: 0 auto; background: #fff; box-shadow: 0 2px 20px rgba(0,0,0,0.08); }
  }
</style>`;

  // Inject our CSS before </head> — NO body HTML changes
  let doc = html.replace(/<\/head>/i, printCSS + "\n</head>");

  // Update page title
  doc = doc.replace(/<title>[^<]*<\/title>/i, `<title>${title}</title>`);

  // Wrap body content in the table trick for header/footer repetition.
  // We do this by wrapping the ENTIRE <body> inner content.
  const headerRow = `
<table class="pdf-wrap">
<thead class="pdf-header"><tr><td>
  <div style="background:#1a5c37;padding:5px 14px;display:flex;align-items:center;justify-content:space-between;">
    <div style="display:flex;align-items:center;gap:8px;">
      <div style="background:#c9a84c;color:#1a5c37;font-weight:800;font-size:10px;padding:2px 7px;border-radius:4px;font-family:Inter,Arial,sans-serif;">BG</div>
      <div>
        <div style="color:#fff;font-weight:700;font-size:9px;font-family:Inter,Arial,sans-serif;">BUSINESS GATE</div>
        <div style="color:#c9a84c;font-size:6px;font-family:Inter,Arial,sans-serif;">Technical Consulting</div>
      </div>
    </div>
    <div style="color:rgba(255,255,255,0.7);font-size:7px;font-family:Inter,Arial,sans-serif;">${title}</div>
  </div>
  <div style="background:#c9a84c;height:2px;"></div>
</td></tr></thead>
<tfoot class="pdf-footer"><tr><td>
  <div style="border-top:1px solid #1a5c37;margin-top:4px;padding:3px 14px;display:flex;justify-content:space-between;align-items:center;">
    <span style="font-size:6px;color:#7a8e80;font-family:Inter,Arial,sans-serif;">www.businessesgates.com · OUN@businessesgates.com · +965 9999 0412 · Kuwait</span>
    <span style="font-size:7px;color:#1a5c37;font-weight:700;font-family:Inter,Arial,sans-serif;">Business Gate</span>
  </div>
</td></tr></tfoot>
<tbody><tr><td>`;

  const footerRow = `</td></tr></tbody></table>`;

  // Insert table wrapper after <body> and before </body>
  doc = doc.replace(/(<body[^>]*>)/i, `$1\n${headerRow}`);
  doc = doc.replace(/<\/body>/i, `${footerRow}\n</body>`);

  return doc;
}
