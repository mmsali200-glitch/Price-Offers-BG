"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  html: string;
  fileName: string;
  language: "ar" | "en" | null;
};

/**
 * Professional PDF generator. Takes the generated quote HTML,
 * applies print-specific modifications (removes sidebar/topbar,
 * expands content to full A4 width, adds BG header/footer),
 * captures with html2canvas at 2× resolution, then assembles
 * multi-page A4 PDF with jsPDF — including branded headers
 * and page numbers on every page.
 */
export function PdfDownloadButton({ html, fileName, language }: Props) {
  const [state, setState] = useState<"idle" | "rendering" | "done" | "error">("idle");

  const handleDownload = useCallback(async () => {
    if (!html) return;
    setState("rendering");

    try {
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      // ── 1. Prepare print-optimized HTML ──────────────────────
      const printHtml = preparePrintHtml(html);

      // ── 2. Render in a hidden container ──────────────────────
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed; top:0; left:-9999px; width:794px; background:#fff; z-index:-1; overflow:visible;";
      document.body.appendChild(container);
      container.innerHTML = printHtml;

      // Wait for fonts + images + layout
      await new Promise((r) => setTimeout(r, 1200));

      // ── 3. Capture at 2× for crisp output ────────────────────
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
        logging: false,
      });

      document.body.removeChild(container);

      // ── 4. Build multi-page A4 PDF ───────────────────────────
      const pageW = 210; // mm
      const pageH = 297;
      const headerH = 12; // mm — space for BG header
      const footerH = 10; // mm — space for page number
      const marginX = 5;  // mm — side margins
      const contentW = pageW - marginX * 2;
      const contentH = pageH - headerH - footerH;

      const imgW = canvas.width;
      const imgH = canvas.height;
      const pxPerPage = imgW * (contentH / contentW);
      const totalPages = Math.ceil(imgH / pxPerPage);

      const isAr = language === "ar";

      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        // ── Header ─────────────────────────────────────────────
        drawHeader(pdf, pageW, isAr);

        // ── Content slice ──────────────────────────────────────
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgW;
        sliceCanvas.height = Math.min(pxPerPage, imgH - page * pxPerPage);

        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas, 0, page * pxPerPage, imgW, sliceCanvas.height,
            0, 0, imgW, sliceCanvas.height
          );
        }

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.95);
        const sliceH = (sliceCanvas.height / imgW) * contentW;
        pdf.addImage(sliceData, "JPEG", marginX, headerH, contentW, sliceH);

        // ── Footer ─────────────────────────────────────────────
        drawFooter(pdf, pageW, pageH, page + 1, totalPages, isAr);
      }

      // ── 5. Download ──────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────

/** Strip sidebar/topbar and expand content to full width for PDF. */
function preparePrintHtml(html: string): string {
  let h = html;

  // Remove sidebar + topbar + overlay elements entirely
  h = h.replace(/<aside[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/aside>/gi, "");
  h = h.replace(/<div[^>]*id="sidebar"[^>]*>[\s\S]*?<\/div>\s*(?=<!--)/gi, "");
  h = h.replace(/<div[^>]*id="topbar"[^>]*>[\s\S]*?<\/div>/gi, "");
  h = h.replace(/<div[^>]*class="topbar"[^>]*>[\s\S]*?<\/div>\s*(?=<!--|\s*<(?:section|main|div))/gi, "");
  h = h.replace(/<div[^>]*class="sidebar-overlay"[^>]*>[\s\S]*?<\/div>/gi, "");

  // Inject print-specific CSS overrides
  const printOverrides = `
  <style id="pdf-overrides">
    * { box-shadow: none !important; text-shadow: none !important; }
    html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
    .main, main.main, main { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    .wrap { display: block !important; }
    .section, section { padding: 28px 24px !important; border-bottom: 1px solid #e2e8e3 !important; background: #fff !important; max-width: 100% !important; }
    .section:nth-child(even), .section:nth-child(odd) { background: #fff !important; }
    .hero, #hero, section#hero { padding: 36px 24px !important; border-radius: 0 !important; }
    .hero-inner { padding: 0 !important; }

    /* Grids optimized for A4 width (794px) */
    .mod-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 10px !important; }
    .kpi-grid { grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; }
    .feat-grid, .exec-grid, .phases-grid, .fin-grid, .plans-grid { grid-template-columns: repeat(3, 1fr) !important; gap: 12px !important; }
    .resp-grid, .sign-grid, .terms-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 14px !important; }

    /* Cards tighter */
    .mod-card, .feat-card, .exec-card, .phase-card, .fin-card, .kpi-card, .card { padding: 12px !important; border-radius: 6px !important; }

    /* Tables */
    table { width: 100% !important; border-collapse: collapse !important; font-size: 11px !important; }
    th { background: #eaf3ed !important; color: #1a5c37 !important; padding: 8px 10px !important; }
    td { padding: 7px 10px !important; border-bottom: 1px solid #e2e8e3 !important; }

    /* Signature */
    .sign-card { min-height: auto !important; }
    .sign-line { margin-top: 28px !important; }

    /* Configurator */
    .configurator, .cfg-wrap { border-radius: 8px !important; }

    /* Typography */
    .hero-title { font-size: 28px !important; }
    .hero-client, .hero-client-name { font-size: 22px !important; }
    .section-title { font-size: 20px !important; }
    h2.section-title { font-size: 20px !important; }
    body { font-size: 13px !important; line-height: 1.55 !important; }
  </style>`;

  h = h.replace(/<\/head>/i, `${printOverrides}\n</head>`);

  return h;
}

/** Draw a branded header bar at the top of each PDF page. */
function drawHeader(pdf: InstanceType<typeof import("jspdf").jsPDF>, pageW: number, isAr: boolean) {
  // Green bar
  pdf.setFillColor(26, 92, 55); // --green #1a5c37
  pdf.rect(0, 0, pageW, 10, "F");

  // Gold accent line
  pdf.setFillColor(201, 168, 76); // --gold #c9a84c
  pdf.rect(0, 10, pageW, 1.2, "F");

  // BG text on the left (or right for Arabic)
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  const bgText = "BUSINESS GATE";
  const subText = "Technical Consulting";

  if (isAr) {
    pdf.text(bgText, pageW - 8, 5, { align: "right" });
    pdf.setFontSize(6);
    pdf.setTextColor(201, 168, 76);
    pdf.text(subText, pageW - 8, 8, { align: "right" });
  } else {
    pdf.text(bgText, 8, 5);
    pdf.setFontSize(6);
    pdf.setTextColor(201, 168, 76);
    pdf.text(subText, 8, 8);
  }

  // Gold "BG" badge on the opposite side
  pdf.setFillColor(201, 168, 76);
  const badgeX = isAr ? 8 : pageW - 18;
  pdf.roundedRect(badgeX, 2.5, 10, 5.5, 1.5, 1.5, "F");
  pdf.setFontSize(7);
  pdf.setTextColor(26, 92, 55);
  pdf.setFont("helvetica", "bold");
  pdf.text("BG", badgeX + 5, 6.3, { align: "center" });
}

/** Draw footer with page number and website. */
function drawFooter(
  pdf: InstanceType<typeof import("jspdf").jsPDF>,
  pageW: number, pageH: number,
  current: number, total: number,
  isAr: boolean,
) {
  const y = pageH - 6;

  // Thin green line
  pdf.setDrawColor(26, 92, 55);
  pdf.setLineWidth(0.3);
  pdf.line(8, y - 2, pageW - 8, y - 2);

  // Website on left
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(7);
  pdf.setTextColor(122, 142, 128); // --tgray
  pdf.text("www.businessesgates.com  |  OUN@businessesgates.com  |  +965 9999 0412", 8, y);

  // Page number on right
  const pageText = isAr
    ? `${current} / ${total} صفحة`
    : `Page ${current} of ${total}`;
  pdf.text(pageText, pageW - 8, y, { align: "right" });
}
