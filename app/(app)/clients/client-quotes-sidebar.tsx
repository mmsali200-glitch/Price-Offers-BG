"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, FileText, Loader2, Plus, ExternalLink } from "lucide-react";
import { listQuotesForClient } from "@/lib/actions/clients";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";
import type { ClientQuote } from "@/lib/actions/clients";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "bg-bg-line text-bg-text-2" },
  sent: { label: "مُرسل", color: "bg-bg-info-lt text-bg-info" },
  opened: { label: "مفتوح", color: "bg-bg-gold-lt text-[#8a6010]" },
  accepted: { label: "مقبول", color: "bg-bg-green-lt text-bg-green" },
  rejected: { label: "مرفوض", color: "bg-red-50 text-bg-danger" },
  expired: { label: "منتهٍ", color: "bg-gray-100 text-gray-500" },
};

export function ClientQuotesSidebar({
  clientId,
  clientName,
  open,
  onClose,
}: {
  clientId: string | null;
  clientName: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const [quotes, setQuotes] = useState<ClientQuote[] | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !clientId) return;
    setLoading(true);
    setQuotes(null);
    listQuotesForClient(clientId)
      .then((qs) => setQuotes(qs))
      .finally(() => setLoading(false));
  }, [open, clientId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        onClick={onClose}
        className={`fixed inset-0 bg-black/40 z-40 transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed top-0 bottom-0 left-0 w-full sm:w-[420px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <header className="px-4 py-3 border-b border-bg-line flex items-center justify-between gap-3 bg-bg-card-alt">
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-bg-text-3 uppercase tracking-wide">عروض العميل</div>
            <h2 className="text-sm font-black text-bg-green truncate">{clientName ?? "—"}</h2>
          </div>
          <button
            onClick={onClose}
            className="size-8 rounded-full hover:bg-bg-line flex items-center justify-center shrink-0"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <div className="flex items-center justify-center py-12 text-bg-text-3 gap-2 text-xs">
              <Loader2 className="size-4 animate-spin" />
              جاري التحميل...
            </div>
          )}

          {!loading && quotes !== null && quotes.length === 0 && (
            <div className="text-center py-10 space-y-3">
              <div className="text-3xl">📋</div>
              <p className="text-xs text-bg-text-3">لا توجد عروض لهذا العميل بعد</p>
              <Link
                href="/quotes/new"
                onClick={onClose}
                className="btn-primary inline-flex items-center gap-1.5 h-8 text-xs"
              >
                <Plus className="size-3.5" />
                أنشئ أول عرض
              </Link>
            </div>
          )}

          {!loading && quotes !== null && quotes.length > 0 && (
            <ul className="space-y-2">
              {quotes.map((q) => {
                const badge = STATUS_LABELS[q.status] ?? STATUS_LABELS.draft;
                return (
                  <li key={q.id}>
                    <Link
                      href={`/quotes/${q.id}/edit`}
                      onClick={onClose}
                      className="block border border-bg-line rounded-sm2 p-3 hover:border-bg-green hover:bg-bg-green-lt/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="size-3.5 text-bg-green shrink-0" />
                          <span className="text-xs font-black text-bg-green tabular truncate">{q.ref}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      {q.title && (
                        <div className="text-[11px] text-bg-text-2 truncate mb-1.5">{q.title}</div>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-bg-text-3">
                        <span className="tabular">
                          {q.total_development
                            ? `${fmtNum(q.total_development)} ${curSymbol(q.currency)}`
                            : "—"}
                        </span>
                        <span>{fmtDateArabic(q.updated_at)}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {clientId && (
          <footer className="px-4 py-3 border-t border-bg-line bg-bg-card-alt">
            <Link
              href={`/clients/${clientId}`}
              onClick={onClose}
              className="btn-outline w-full h-8 text-xs inline-flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="size-3.5" />
              فتح صفحة العميل الكاملة
            </Link>
          </footer>
        )}
      </aside>
    </>
  );
}
