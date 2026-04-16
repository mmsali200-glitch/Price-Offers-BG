"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Eye, Loader2, Sparkles, CheckCircle2 } from "lucide-react";

export function BuilderToolbar({
  quoteId,
  ref_,
  title,
  status,
  generatedAt,
}: {
  quoteId: string;
  ref_: string;
  title: string | null;
  status: string;
  generatedAt: string | null;
}) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotes/${quoteId}/generate`, {
        method: "POST",
      });
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

  return (
    <div className="sticky top-0 z-30 bg-white border-b border-bg-line">
      <div className="max-w-5xl mx-auto px-3 lg:px-6 py-2.5 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="text-[11px] font-black bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full tabular">
            {ref_}
          </span>
          <span className="text-xs text-bg-text-3 truncate">{title || "بدون عنوان"}</span>
          <StatusPill status={status} />
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string; icon?: React.ReactNode }> = {
    draft: { label: "مسودة", cls: "bg-bg-line text-bg-text-2" },
    sent: { label: "مُرسل", cls: "bg-bg-info-lt text-bg-info" },
    opened: { label: "مفتوح", cls: "bg-bg-gold-lt text-[#8a6010]" },
    accepted: { label: "مقبول", cls: "bg-bg-green-lt text-bg-green", icon: <CheckCircle2 className="size-3" /> },
    rejected: { label: "مرفوض", cls: "bg-red-50 text-bg-danger" },
    expired: { label: "منتهٍ", cls: "bg-gray-100 text-gray-500" },
  };
  const badge = map[status] ?? map.draft;
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1 ${badge.cls}`}>
      {badge.icon}
      {badge.label}
    </span>
  );
}
