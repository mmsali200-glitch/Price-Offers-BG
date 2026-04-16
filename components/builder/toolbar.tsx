"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Loader2, Sparkles, ChevronDown } from "lucide-react";
import { QuoteStagesWithDates } from "@/components/quote-stages-with-dates";
import { updateQuoteStatus } from "@/lib/actions/quotes";

type StatusKey = "draft" | "sent" | "opened" | "accepted" | "rejected" | "expired";

const STATUS_OPTIONS: Array<{ v: StatusKey; label: string }> = [
  { v: "draft",    label: "مسودة" },
  { v: "sent",     label: "مُرسل للعميل" },
  { v: "opened",   label: "فتحه العميل" },
  { v: "accepted", label: "مقبول وموقَّع" },
  { v: "rejected", label: "مرفوض" },
  { v: "expired",  label: "منتهي الصلاحية" },
];

export function BuilderToolbar({
  quoteId,
  ref_,
  title,
  status,
  generatedAt,
  stageHistory,
}: {
  quoteId: string;
  ref_: string;
  title: string | null;
  status: string;
  generatedAt: string | null;
  stageHistory: Record<string, string | null>;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);

  const currentStatus = STATUS_OPTIONS.find((s) => s.v === status) ?? STATUS_OPTIONS[0];

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/generate`, { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Generation failed (${res.status})`);
      }
      startTransition(() => router.push(`/quotes/${quoteId}/preview`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء التوليد");
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleStatusChange(newStatus: StatusKey) {
    setStatusOpen(false);
    setIsChangingStatus(true);
    try {
      const r = await updateQuoteStatus(quoteId, newStatus);
      if (!r.ok) throw new Error(r.error);
      startTransition(() => router.refresh());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحديث الحالة");
    } finally {
      setIsChangingStatus(false);
    }
  }

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-bg-line">
      <div className="max-w-5xl mx-auto px-3 lg:px-6 py-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-black bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full tabular">
            {ref_}
          </span>
          <span className="text-xs text-bg-text-3 truncate">{title || "بدون عنوان"}</span>
        </div>

        {/* Status selector */}
        <div className="relative">
          <button
            onClick={() => setStatusOpen((v) => !v)}
            disabled={isChangingStatus}
            className="inline-flex items-center gap-1.5 h-8 rounded-sm2 border border-bg-line px-3 text-xs font-bold text-bg-text-2 hover:border-bg-green hover:text-bg-green"
          >
            {isChangingStatus ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <>
                <span className="size-2 rounded-full bg-bg-green" />
                {currentStatus.label}
                <ChevronDown className="size-3.5" />
              </>
            )}
          </button>
          {statusOpen && (
            <div className="absolute top-full left-0 mt-1 w-44 bg-white border border-bg-line rounded-sm2 shadow-card-hover z-40 py-1">
              {STATUS_OPTIONS.map((s) => (
                <button
                  key={s.v}
                  onClick={() => handleStatusChange(s.v)}
                  className={`w-full text-right px-3 py-1.5 text-xs hover:bg-bg-green-lt ${
                    s.v === status ? "text-bg-green font-black" : "text-bg-text-2"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {generatedAt && (
            <button
              onClick={() => router.push(`/quotes/${quoteId}/preview`)}
              className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs"
            >
              <Eye className="size-3.5" />
              المعاينة
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="btn-primary inline-flex items-center gap-1.5 h-8 text-xs"
          >
            {isGenerating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                جاري التوليد...
              </>
            ) : (
              <>
                <Sparkles className="size-3.5" />
                {generatedAt ? "إعادة التوليد" : "توليد العرض"}
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stages timeline with timestamps */}
      <div className="max-w-5xl mx-auto px-3 lg:px-6 pb-2">
        <QuoteStagesWithDates status={status} stageHistory={stageHistory} />
      </div>

      {error && (
        <div className="max-w-5xl mx-auto px-3 lg:px-6 pb-2">
          <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-1.5">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
