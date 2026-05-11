"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowRight, AlertTriangle } from "lucide-react";
import { useBuilderStore, selectedModules } from "@/lib/builder/store";

export function GenerateButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [, startTransition] = useTransition();

  function validate(): string[] {
    const state = useBuilderStore.getState();
    const w: string[] = [];
    if (!state.client.nameAr?.trim()) w.push("اسم العميل (عربي) فارغ");
    if (!state.meta.ref?.trim()) w.push("رقم المرجع فارغ");
    const mods = selectedModules(state);
    if (mods.length === 0) w.push("لم يتم اختيار أي موديول");
    return w;
  }

  async function handleGenerate() {
    const w = validate();
    if (w.length > 0) {
      setWarnings(w);
      setTimeout(() => setWarnings([]), 5000);
    }

    setLoading(true);
    setError(null);
    try {
      const state = useBuilderStore.getState();
      const res = await fetch(`/api/quotes/${quoteId}/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `فشل التوليد (${res.status})`);
      }

      startTransition(() => router.push(`/quotes/${quoteId}/preview`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleGenerate}
        disabled={loading}
        className="btn-primary inline-flex items-center gap-1.5 h-8 text-xs"
      >
        {loading ? (
          <><Loader2 className="size-3.5 animate-spin" /> جاري التوليد...</>
        ) : (
          <><Sparkles className="size-3.5" /> توليد العرض <ArrowRight className="size-3.5" /></>
        )}
      </button>
      {warnings.length > 0 && (
        <div className="text-[10px] text-amber-600 mt-1 flex items-start gap-1">
          <AlertTriangle className="size-3 shrink-0 mt-0.5" />
          <span>{warnings.join(" · ")}</span>
        </div>
      )}
      {error && (
        <div className="text-[10px] text-bg-danger mt-1">{error}</div>
      )}
    </div>
  );
}
