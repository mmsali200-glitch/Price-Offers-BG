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
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      // ── 1. Build print-ready HTML ────────────────────────────
      const printHtml = stripChrome(html);

      // ── 2. Render in hidden container ────────────────────────
      const wrap = document.createElement("div");
      wrap.style.cssText = "position:absolute;top:0;left:0;width:794px;background:#fff;z-index:99999;opacity:0;pointer-events:none;overflow:visible;";
      document.body.appendChild(wrap);
      wrap.innerHTML = printHtml;

      await new Promise((r) => setTimeout(r, 1200));

      // ── 3. Capture full content ──────────────────────────────
      const canvas = await html2canvas(wrap, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
        logging: false,
        scrollY: 0,
        scrollX: 0,
      });

      document.body.removeChild(wrap);

      // ── 4. Slice into A4 pages ───────────────────────────────
      const isAr = language === "ar";
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const hdrH = 13;   // header height mm
      const ftrH = 9;    // footer height mm
      const padX = 5;    // side padding mm
      const cW = pageW - padX * 2;  // content width mm
      const cH = pageH - hdrH - ftrH; // content height mm

      const imgW = canvas.width;
      const imgH = canvas.height;
      // How many source pixels fit in one page's content area?
      const pxPerMm = imgW / cW;
      const pagePx = cH * pxPerMm;
      const pages = Math.max(1, Math.ceil(imgH / pagePx));

      for (let p = 0; p < pages; p++) {
        if (p > 0) pdf.addPage();

        // Header
        drawHeader(pdf, pageW, isAr);

        // Slice this page's portion of the canvas
        const srcY = p * pagePx;
        const srcH = Math.min(pagePx, imgH - srcY);
        if (srcH <= 0) continue;

        const slice = document.createElement("canvas");
        slice.width = imgW;
        slice.height = srcH;
        const ctx = slice.getContext("2d")!;
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, imgW, srcH);
        ctx.drawImage(canvas, 0, srcY, imgW, srcH, 0, 0, imgW, srcH);

        const sliceH = (srcH / pxPerMm); // mm
        pdf.addImage(slice.toDataURL("image/jpeg", 0.94), "JPEG", padX, hdrH, cW, sliceH);

        // Footer
        drawFooter(pdf, pageW, pageH, p + 1, pages, isAr);
      }

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
        <><Loader2 className="size-3.5 animate-spin" /> جاري إنشاء PDF...</>
      ) : state === "done" ? (
        <><CheckCircle2 className="size-3.5" /> تم التحميل ✓</>
      ) : state === "error" ? (
        <>خطأ — حاول مرة أخرى</>
      ) : (
        <><Download className="size-3.5" /> تحميل PDF</>
      )}
    </button>
  );
}

/** Remove sidebar + topbar + overlay; inject print sizing CSS. */
function stripChrome(html: string): string {
  let h = html;
  h = h.replace(/<aside[^>]*class="[^"]*sidebar[^"]*"[^>]*>[\s\S]*?<\/aside>/gi, "");
  h = h.replace(/<div[^>]*id="sidebar"[^>]*>[\s\S]*?<\/div>\s*(?=<!--)/gi, "");
  h = h.replace(/<div[^>]*id="topbar"[^>]*>[\s\S]*?<\/div>/gi, "");
  h = h.replace(/<div[^>]*class="topbar"[^>]*>[\s\S]*?<\/div>\s*(?=<!--|\s*<(?:section|main|div))/gi, "");
  h = h.replace(/<div[^>]*class="sidebar-overlay"[^>]*>[\s\S]*?<\/div>/gi, "");

  const css = `<style>
    *{box-shadow:none!important;text-shadow:none!important}
    html,body{background:#fff!important;margin:0!important;padding:0!important;width:794px!important}
    body{font-size:13px!important;line-height:1.6!important}
    .main,main,.wrap,.shell{margin:0!important;padding:0!important;width:100%!important;display:block!important}
    .content{width:100%!important}
    .section,section.section,section{padding:24px 20px!important;border-bottom:1px solid #e2e8e3!important;background:#fff!important;max-width:100%!important}
    .section:nth-child(even),.section:nth-child(odd){background:#fff!important}
    .hero,#hero,section#hero,section.hero{padding:30px 20px!important;border-radius:0!important}
    .hero-inner{padding:0!important}
    .hero-title{font-size:26px!important}.hero-client,.hero-client-name{font-size:20px!important}
    .section-title,h2.section-title{font-size:18px!important;color:#1a5c37!important}
    .section-num{width:26px!important;height:26px!important;font-size:11px!important}
    .mod-grid{grid-template-columns:repeat(3,1fr)!important;gap:10px!important}
    .kpi-grid{grid-template-columns:repeat(4,1fr)!important;gap:10px!important}
    .feat-grid,.exec-grid,.fin-grid,.plans-grid,.phases-grid,.sup-grid{grid-template-columns:repeat(3,1fr)!important;gap:10px!important}
    .resp-grid,.sign-grid,.terms-grid,.lic-grid{grid-template-columns:repeat(2,1fr)!important;gap:12px!important}
    .mod-card,.feat-card,.exec-card,.phase-card,.fin-card,.kpi-card,.card{padding:10px!important;border-radius:6px!important}
    table{width:100%!important;border-collapse:collapse!important;font-size:10px!important}
    th{background:#eaf3ed!important;color:#1a5c37!important;padding:7px 8px!important}
    td{padding:6px 8px!important;border-bottom:1px solid #e2e8e3!important}
  </style>`;
  h = h.replace(/<\/head>/i, css + "</head>");
  return h;
}

function drawHeader(pdf: InstanceType<typeof import("jspdf").jsPDF>, pageW: number, isAr: boolean) {
  // Green bar
  pdf.setFillColor(26, 92, 55);
  pdf.rect(0, 0, pageW, 10.5, "F");
  // Gold line
  pdf.setFillColor(201, 168, 76);
  pdf.rect(0, 10.5, pageW, 1, "F");

  // BG text
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  const x = isAr ? pageW - 10 : 10;
  const align = isAr ? "right" as const : "left" as const;
  pdf.text("BUSINESS GATE", x, 5.5, { align });
  pdf.setFontSize(6.5);
  pdf.setTextColor(201, 168, 76);
  pdf.text("Technical Consulting", x, 8.5, { align });

  // BG badge
  pdf.setFillColor(201, 168, 76);
  const bx = isAr ? 10 : pageW - 20;
  pdf.roundedRect(bx, 2.5, 12, 6, 1.5, 1.5, "F");
  pdf.setFontSize(8);
  pdf.setTextColor(26, 92, 55);
  pdf.text("BG", bx + 6, 6.5, { align: "center" });
}

function drawFooter(pdf: InstanceType<typeof import("jspdf").jsPDF>, pageW: number, pageH: number, cur: number, total: number, isAr: boolean) {
  const y = pageH - 5.5;
  pdf.setDrawColor(26, 92, 55);
  pdf.setLineWidth(0.3);
  pdf.line(10, y - 2, pageW - 10, y - 2);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(6.5);
  pdf.setTextColor(122, 142, 128);
  pdf.text("www.businessesgates.com  ·  OUN@businessesgates.com  ·  +965 9999 0412  ·  Kuwait", 10, y);

  pdf.setFontSize(7);
  pdf.setTextColor(26, 92, 55);
  pdf.text(isAr ? `${cur} / ${total}` : `Page ${cur} of ${total}`, pageW - 10, y, { align: "right" });
}
