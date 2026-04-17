"use client";

import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle2 } from "lucide-react";

type Props = {
  html: string;
  fileName: string;
  language: "ar" | "en" | null;
};

/**
 * Client-side PDF generator. Renders the quote HTML in a hidden iframe,
 * captures it with html2canvas, then splits into A4 pages with jsPDF.
 *
 * No server-side dependency — works entirely in the browser.
 */
export function PdfDownloadButton({ html, fileName, language }: Props) {
  const [state, setState] = useState<"idle" | "rendering" | "done" | "error">("idle");

  const handleDownload = useCallback(async () => {
    if (!html) return;
    setState("rendering");

    try {
      // Dynamic imports so the ~800KB bundle only loads on click.
      const [{ default: jsPDF }, { default: html2canvas }] = await Promise.all([
        import("jspdf"),
        import("html2canvas"),
      ]);

      // Create a hidden container with the HTML content.
      const container = document.createElement("div");
      container.style.cssText =
        "position:fixed; top:0; left:-9999px; width:794px; background:#fff; z-index:-1;";
      // 794px ≈ A4 width at 96 DPI (210mm).
      document.body.appendChild(container);

      // Insert HTML into a shadow-free div (not iframe — html2canvas
      // can't capture cross-origin iframes but CAN capture inline HTML).
      container.innerHTML = html;

      // Wait for fonts + images to load.
      await new Promise((r) => setTimeout(r, 800));

      // Capture the full content as a high-res canvas.
      const canvas = await html2canvas(container, {
        scale: 2, // 2× for crisp text on retina / print
        useCORS: true,
        allowTaint: true,
        backgroundColor: "#ffffff",
        width: 794,
        windowWidth: 794,
        logging: false,
      });

      document.body.removeChild(container);

      // A4 dimensions in mm.
      const pageW = 210;
      const pageH = 297;
      const marginX = 0; // our print CSS already has internal padding
      const marginY = 0;
      const contentW = pageW - marginX * 2;
      const contentH = pageH - marginY * 2;

      // Convert canvas pixels → PDF pages.
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const imgW = canvas.width;
      const imgH = canvas.height;

      // How many PDF-points tall is one A4 page worth of the image?
      const pxPerPage = imgW * (contentH / contentW);
      const totalPages = Math.ceil(imgH / pxPerPage);

      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();

        // Crop a slice of the full image for this page.
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = imgW;
        sliceCanvas.height = Math.min(pxPerPage, imgH - page * pxPerPage);

        const ctx = sliceCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
          ctx.drawImage(
            canvas,
            0,
            page * pxPerPage,
            imgW,
            sliceCanvas.height,
            0,
            0,
            imgW,
            sliceCanvas.height
          );
        }

        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        const sliceH = (sliceCanvas.height / imgW) * contentW;

        pdf.addImage(sliceData, "JPEG", marginX, marginY, contentW, sliceH);
      }

      // Save the file.
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
