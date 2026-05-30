"use client";

import { Download, Printer } from "lucide-react";

export function ContractToolbar({ html, ref_ }: { html: string; ref_: string }) {
  function handleDownload() {
    if (!html) return;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const safe = ref_.replace(/[^\p{L}\p{N}_-]+/gu, "_");
    a.download = `عقد_${safe}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function handlePrint() {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div className="flex items-center gap-1.5">
      <button onClick={handlePrint} className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs">
        <Printer className="size-3.5" />
        طباعة
      </button>
      <button onClick={handleDownload} className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs">
        <Download className="size-3.5" />
        تحميل HTML
      </button>
    </div>
  );
}
