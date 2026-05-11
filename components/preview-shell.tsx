"use client";

import { ArrowRight, Download, Printer, Edit3 } from "lucide-react";
import Link from "next/link";
import { useRef } from "react";
import { fmtDateArabic } from "@/lib/utils";
import { PdfDownloadButton } from "./pdf-download";

export function PreviewShell({
  quoteId,
  ref_,
  title,
  html,
  generatedAt,
  language,
}: {
  quoteId: string;
  ref_: string;
  title: string | null;
  html: string | null;
  generatedAt: string | null;
  language: "ar" | "en" | null;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  function handleDownload() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = (title || "quote").replace(/[^\p{L}\p{N}_-]+/gu, "_");
    a.download = `عرض_سعر_${safe}_${ref_}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const win = iframeRef.current?.contentWindow;
    if (win) {
      win.focus();
      win.print();
    }
  }

  if (!html) {
    return (
      <div className="p-6">
        <div className="card p-10 text-center space-y-3">
          <div className="text-4xl">✨</div>
          <h2 className="text-lg font-bold text-bg-green">لم يُولَّد العرض بعد</h2>
          <p className="text-sm text-bg-text-3 max-w-md mx-auto">
            ارجع إلى تحرير العرض واضغط على &quot;توليد العرض&quot; لإنتاج نسخة HTML جاهزة للإرسال.
          </p>
          <Link href={`/quotes/${quoteId}/edit`} className="btn-primary inline-flex items-center gap-1.5">
            <Edit3 className="size-4" />
            العودة للتحرير
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="border-b border-bg-line bg-white px-4 py-2.5 flex flex-wrap items-center gap-3">
        <Link
          href={`/quotes/${quoteId}/edit`}
          className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs"
        >
          <ArrowRight className="size-3.5" />
          العودة للتحرير
        </Link>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-black bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full tabular">
            {ref_}
          </span>
          {language === "ar" && (
            <span className="text-[10px] font-bold bg-bg-green text-white px-2 py-0.5 rounded-full">
              🇰🇼 العربية — RTL
            </span>
          )}
          {language === "en" && (
            <span className="text-[10px] font-bold bg-bg-info text-white px-2 py-0.5 rounded-full">
              🇬🇧 English — LTR
            </span>
          )}
          <span className="text-xs text-bg-text-3 truncate">{title || "بدون عنوان"}</span>
          {generatedAt && (
            <span className="text-[10px] text-bg-text-3">
              · وُلِّد في {fmtDateArabic(generatedAt)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handlePrint}
            className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs"
          >
            <Printer className="size-3.5" />
            طباعة
          </button>
          <PdfDownloadButton
            html={html}
            fileName={`عرض_سعر_${(title || "quote").replace(/[^\p{L}\p{N}_-]+/gu, "_")}_${ref_}`}
            language={language}
          />
          <button
            onClick={handleDownload}
            className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs"
          >
            <Download className="size-3.5" />
            HTML
          </button>
        </div>
      </div>

      {/* Sandboxed iframe */}
      <iframe
        ref={iframeRef}
        srcDoc={html}
        sandbox="allow-same-origin allow-scripts allow-modals allow-popups"
        className="flex-1 w-full border-0 bg-white"
        title="معاينة العرض"
      />
    </div>
  );
}
