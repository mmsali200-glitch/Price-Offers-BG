"use client";

import { useBuilderAutosave } from "@/lib/builder/use-autosave";
import type { QuoteBuilderState } from "@/lib/builder/types";

/**
 * Client-only wrapper that hydrates the builder with `initial` then
 * autosaves to Supabase on every change (debounced 2s).
 */
export function AutosaveInit({
  quoteId,
  initial,
}: {
  quoteId: string;
  initial: Partial<QuoteBuilderState>;
}) {
  useBuilderAutosave(quoteId, initial);
  return null;
}
