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

      // ── 1. Inject CSS to hide chrome (safer than regex HTML removal) ──
      const pdfHtml = html.replace(/<\/head>/i, `
        <style>
          #sidebar, .sidebar, aside, #topbar, .topbar,
          .sidebar-overlay, .mobile-toggle, #hamburger,
          #overlay { display:none !important; }
          .main, main, main.main { margin:0 !important; width:100% !important; }
          .wrap, .shell { display:block !important; }
          * { box-shadow:none !important; text-shadow:none !important; }
          body { background:#fff !important; }
          .section:nth-child(even), .section:nth-child(odd) { background:#fff !important; }
        </style>
        </head>`);

      // ── 2. Render in an iframe (most reliable for html2canvas) ──
      const iframe = document.createElement("iframe");
      iframe.style.cssText = "position:fixed;top:0;left:0;width:794px;height:900px;border:none;z-index:-1;";
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) throw new Error("Cannot access iframe document");

      iframeDoc.open();
      iframeDoc.write(pdfHtml);
      iframeDoc.close();

      // Wait for fonts + images + layout
      await new Promise((r) => setTimeout(r, 2000));

      // Resize iframe to full content height
      const body = iframeDoc.body;
      const fullH = Math.max(body.scrollHeight, body.offsetHeight, iframeDoc.documentElement.scrollHeight);
      iframe.style.height = fullH + "px";

      await new Promise((r) => setTimeout(r, 500));

      // ── 3. Capture ───────────────────────────────────────────
      const canvas = await html2canvas(body, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
        logging: false,
      });

      document.body.removeChild(iframe);

      if (canvas.height < 100) {
        throw new Error("Canvas is too small — content not rendered");
      }

      // ── 4. Build PDF pages ───────────────────────────────────
      const isAr = language === "ar";
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageW = 210;
      const pageH = 297;
      const hdrH = 13;
      const ftrH = 35;   // 3cm+ clear space before footer
      const padX = 5;
      const cW = pageW - padX * 2;
      const cH = pageH - hdrH - ftrH;

      const imgW = canvas.width;
      const imgH = canvas.height;
      const pxPerMm = imgW / cW;
      const pagePx = Math.floor(cH * pxPerMm);
      const pages = Math.max(1, Math.ceil(imgH / pagePx));

      for (let p = 0; p < pages; p++) {
        if (p > 0) pdf.addPage();
        drawHeader(pdf, pageW, isAr);

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

        const sliceH = srcH / pxPerMm;
        pdf.addImage(slice.toDataURL("image/jpeg", 0.94), "JPEG", padX, hdrH, cW, sliceH);

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

function drawHeader(pdf: InstanceType<typeof import("jspdf").jsPDF>, pageW: number, isAr: boolean) {
  pdf.setFillColor(26, 92, 55);
  pdf.rect(0, 0, pageW, 10.5, "F");
  pdf.setFillColor(201, 168, 76);
  pdf.rect(0, 10.5, pageW, 1, "F");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(255, 255, 255);
  const x = isAr ? pageW - 10 : 10;
  const align = isAr ? "right" as const : "left" as const;
  pdf.text("BUSINESS GATE", x, 5.5, { align });
  pdf.setFontSize(6.5);
  pdf.setTextColor(201, 168, 76);
  pdf.text("Technical Consulting", x, 8.5, { align });

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
