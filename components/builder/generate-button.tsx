"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Loader2, ArrowRight } from "lucide-react";
import { useBuilderStore } from "@/lib/builder/store";

/**
 * Standalone generate button that reads the CURRENT Zustand state
 * and sends it directly to the generate API as POST body.
 * This ensures the generated HTML always reflects what the user sees.
 */
export function GenerateButton({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    try {
      // Read the CURRENT state directly from the Zustand store.
      const state = useBuilderStore.getState();

      // Send it to the API so it doesn't depend on what's saved in DB.
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
      {error && (
        <div className="text-[10px] text-bg-danger mt-1">{error}</div>
      )}
    </div>
  );
}
