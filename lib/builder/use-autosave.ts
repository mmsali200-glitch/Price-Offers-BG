"use client";

import { useEffect, useRef } from "react";
import { useBuilderStore } from "@/lib/builder/store";
import { saveQuote } from "@/lib/actions/quotes";
import type { QuoteBuilderState } from "@/lib/builder/types";

/**
 * Hydrates the builder store with a saved payload, then debounce-saves any
 * subsequent changes back to the database every 2s.
 */
export function useBuilderAutosave(quoteId: string, initial: Partial<QuoteBuilderState>) {
  const hydrate = useBuilderStore((s) => s.hydrate);
  const hydratedRef = useRef(false);

  // Hydrate once on mount
  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (initial && Object.keys(initial).length > 0) {
      hydrate(initial);
    }
  }, [hydrate, initial]);

  // Subscribe to store changes and debounce save
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useBuilderStore.subscribe((state) => {
      if (!hydratedRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        saveQuote(quoteId, state as QuoteBuilderState).catch(() => {
          // Silent failure; user can manually save
        });
      }, 2000);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [quoteId]);
}
