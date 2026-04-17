"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  html: string;
  fileName: string;
  language: "ar" | "en" | null;
};

export function PdfDownloadButton({ html, fileName, language }: Props) {
  const [state, setState] = useState<"idle" | "rendering" | "done" | "error">("idle");

  const handleDownload = useCallback(async () => {
    if (!html) return;
    setState("rendering");

    try {
      const { default: jsPDF } = await import("jspdf");

      // ── 1. Build a print-ready HTML document ─────────────────
      const printHtml = buildPrintDocument(html, language);

      // ── 2. Create hidden container at A4 width ───────────────
      const container = document.createElement("div");
      container.style.cssText = `
        position: fixed; top: 0; left: -9999px;
        width: 794px; background: #fff; z-index: -1;
      `;
      document.body.appendChild(container);
      container.innerHTML = printHtml;

      // Wait for fonts + images
      await new Promise((r) => setTimeout(r, 1500));

      // ── 3. Use jsPDF.html() for proper multi-page rendering ──
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      await new Promise<void>((resolve, reject) => {
        pdf.html(container, {
          callback: () => resolve(),
          margin: [16, 8, 14, 8],
          autoPaging: "text",
          width: 194,
          windowWidth: 794,
          html2canvas: {
            scale: 2,
            useCORS: true,
            allowTaint: true,
            backgroundColor: "#ffffff",
            logging: false,
          },
          x: 0,
          y: 0,
        }).catch(reject);
      });

      document.body.removeChild(container);

      // ── 4. Add branded header + footer on every page ─────────
      const totalPages = pdf.getNumberOfPages();
      const isAr = language === "ar";
      const pageW = 210;
      const pageH = 297;

      for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);

        // ── Header: green bar + gold line + BG text ────────────
        pdf.setFillColor(26, 92, 55);
        pdf.rect(0, 0, pageW, 11, "F");
        pdf.setFillColor(201, 168, 76);
        pdf.rect(0, 11, pageW, 1, "F");

        // BG text
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        const mainX = isAr ? pageW - 10 : 10;
        const mainAlign = isAr ? "right" as const : "left" as const;
        pdf.text("BUSINESS GATE", mainX, 5.5, { align: mainAlign });

        pdf.setFontSize(6.5);
        pdf.setTextColor(201, 168, 76);
        pdf.text("Technical Consulting", mainX, 8.5, { align: mainAlign });

        // Gold BG badge
        pdf.setFillColor(201, 168, 76);
        const bx = isAr ? 10 : pageW - 20;
        pdf.roundedRect(bx, 2.5, 12, 6, 1.5, 1.5, "F");
        pdf.setFontSize(8);
        pdf.setTextColor(26, 92, 55);
        pdf.text("BG", bx + 6, 6.5, { align: "center" });

        // ── Footer: line + info + page number ──────────────────
        const fy = pageH - 7;
        pdf.setDrawColor(26, 92, 55);
        pdf.setLineWidth(0.3);
        pdf.line(10, fy - 2.5, pageW - 10, fy - 2.5);

        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(6.5);
        pdf.setTextColor(122, 142, 128);
        pdf.text(
          "www.businessesgates.com  ·  OUN@businessesgates.com  ·  +965 9999 0412  ·  Kuwait",
          10, fy
        );

        pdf.setFontSize(7);
        pdf.setTextColor(26, 92, 55);
        const pageLabel = isAr ? `${i} / ${totalPages}` : `Page ${i} of ${totalPages}`;
        pdf.text(pageLabel, pageW - 10, fy, { align: "right" });
      }

      // ── 5. Save ──────────────────────────────────────────────
      const safeName = fileName.replace(/[^\p{L}\p{N}_-]+/gu, "_");
      pdf.save(`${safeName}.pdf`);

      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch (err) {
      console.error("[PDF]", err);
      setState("error");
      setTimeout(() => setState("idle"), 4000);
    }
  }, [html, fileName, language]);

  return (
    <button
      onClick={handleDownload}
      disabled={state === "rendering" || !html}
      className={`inline-flex items-center gap-1.5 h-8 text-xs font-bold rounded-sm2 px-3 transition-colors ${
        state === "done"
          ? "bg-bg-green text-white"
          : state === "error"
          ? "bg-bg-danger text-white"
          : "bg-bg-gold text-bg-green hover:bg-bg-gold-2"
      }`}
    >
      {state === "rendering" ? (
        <>
          <Loader2 className="size-3.5 animate-spin" />
          جاري إنشاء PDF...
        </>
      ) : state === "done" ? (
        <>
          <CheckCircle2 className="size-3.5" />
          تم التحميل ✓
        </>
      ) : state === "error" ? (
        <>خطأ — حاول مرة أخرى</>
      ) : (
        <>
          <Download className="size-3.5" />
          تحميل PDF
        </>
      )}
    </button>
  );
}

/**
 * Build a self-contained print-ready HTML document optimized for A4 PDF.
 * Removes sidebar/topbar, expands content full-width, applies clean
 * typography sizing, and ensures proper section spacing.
 */
function buildPrintDocument(html: string, language: "ar" | "en" | null): string {
  let h = html;

  // Remove sidebar, topbar, overlay elements
  h = h.replace(/<aside[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/aside>/gi, "");
  h = h.replace(/<div[^>]*id="sidebar"[^>]*>[\s\S]*?<\/div>\s*(?=<!--)/gi, "");
  h = h.replace(/<div[^>]*id="topbar"[^>]*>[\s\S]*?<\/div>/gi, "");
  h = h.replace(/<div[^>]*class="topbar"[^>]*>[\s\S]*?<\/div>\s*(?=<!--|\s*<(?:section|main|div))/gi, "");
  h = h.replace(/<div[^>]*class="sidebar-overlay"[^>]*>[\s\S]*?<\/div>/gi, "");

  // Inject PDF-specific styling for A4
  const pdfCSS = `<style id="pdf-layout">
    * { box-shadow: none !important; text-shadow: none !important; animation: none !important; transition: none !important; }
    html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; width: 794px !important; }
    body { font-size: 13px !important; line-height: 1.6 !important; color: #141f18 !important; }

    .main, main, main.main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    .wrap, .shell { display: block !important; width: 100% !important; }
    .content { width: 100% !important; }

    /* Sections */
    .section, section.section, section {
      padding: 24px 20px !important;
      border-bottom: 1px solid #e2e8e3 !important;
      background: #fff !important;
      max-width: 100% !important;
      page-break-inside: avoid;
    }
    .section:nth-child(even), .section:nth-child(odd) { background: #fff !important; }

    /* Hero */
    .hero, #hero, section#hero, section.hero {
      padding: 32px 20px !important;
      border-radius: 0 !important;
    }
    .hero-inner { padding: 0 16px !important; }
    .hero-title { font-size: 26px !important; line-height: 1.2 !important; }
    .hero-client, .hero-client-name { font-size: 20px !important; }
    .hero-subtitle, .hero-client-en { font-size: 12px !important; }
    .hero-meta { gap: 8px !important; margin-top: 16px !important; }
    .hero-meta-card, .hero-badge { font-size: 10px !important; padding: 5px 10px !important; }

    /* Section headers */
    .section-header { margin-bottom: 16px !important; }
    .section-title, h2.section-title { font-size: 18px !important; font-weight: 700 !important; color: #1a5c37 !important; }
    .section-sub { font-size: 11px !important; }
    .section-num { width: 26px !important; height: 26px !important; font-size: 11px !important; }

    /* Grids for A4 */
    .mod-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; }
    .feat-grid, .exec-grid, .fin-grid, .plans-grid, .phases-grid, .sup-grid {
      grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important;
    }
    .resp-grid, .sign-grid, .terms-grid, .lic-grid {
      grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important;
    }

    /* Cards */
    .mod-card, .feat-card, .exec-card, .phase-card, .fin-card, .kpi-card,
    .plan-card, .sup-card, .lic-card, .card, .mini-card {
      padding: 10px !important;
      border-radius: 6px !important;
      page-break-inside: avoid;
    }
    .mod-card h4, .mod-name { font-size: 12px !important; }
    .mod-card p, .mod-features { font-size: 10px !important; }

    /* Tables */
    table { width: 100% !important; border-collapse: collapse !important; font-size: 10px !important; }
    th { background: #eaf3ed !important; color: #1a5c37 !important; font-weight: 700 !important; padding: 7px 8px !important; font-size: 10px !important; }
    td { padding: 6px 8px !important; border-bottom: 1px solid #e2e8e3 !important; }
    thead { display: table-header-group !important; }
    tr { page-break-inside: avoid; }

    /* Configurator */
    .configurator, .cfg-wrap { border: 1px solid #e2e8e3 !important; border-radius: 8px !important; }
    .cfg-header { padding: 10px 14px !important; }
    .cfg-total-live { font-size: 18px !important; }

    /* Signature */
    .sign-card { page-break-inside: avoid; }
    .sign-line { border-bottom: 1px solid #141f18 !important; margin-top: 24px !important; }

    /* KPIs */
    .kpi-num { font-size: 22px !important; }
    .kpi-label { font-size: 10px !important; }

    /* Financial cards */
    .fin-value { font-size: 24px !important; }
    .fin-label { font-size: 10px !important; }
    .fin-sub { font-size: 9px !important; }
  </style>`;

  h = h.replace(/<\/head>/i, `${pdfCSS}\n</head>`);

  return h;
}
