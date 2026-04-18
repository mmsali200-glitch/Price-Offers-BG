"use client";

import { useEffect, useRef, useCallback } from "react";
import { create } from "zustand";
import { useBuilderStore } from "@/lib/builder/store";
import { saveQuote } from "@/lib/actions/quotes";
import type { QuoteBuilderState } from "@/lib/builder/types";

type SaveStatus = "idle" | "saving" | "saved" | "error";

export const useSaveStatus = create<{
  status: SaveStatus;
  setStatus: (s: SaveStatus) => void;
}>((set) => ({
  status: "idle",
  setStatus: (status) => set({ status }),
}));

export function useBuilderAutosave(quoteId: string, initial: Partial<QuoteBuilderState>) {
  const hydrate = useBuilderStore((s) => s.hydrate);
  const hydratedRef = useRef(false);
  const setStatus = useSaveStatus((s) => s.setStatus);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    if (initial && Object.keys(initial).length > 0) {
      hydrate(initial);
    }
  }, [hydrate, initial]);

  const doSave = useCallback(async (state: QuoteBuilderState) => {
    setStatus("saving");
    try {
      const result = await saveQuote(quoteId, state);
      setStatus(result.ok ? "saved" : "error");
      if (result.ok) setTimeout(() => useSaveStatus.getState().setStatus("idle"), 2000);
    } catch {
      setStatus("error");
    }
  }, [quoteId, setStatus]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = useBuilderStore.subscribe((state) => {
      if (!hydratedRef.current) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        doSave(state as QuoteBuilderState);
      }, 2000);
    });

    return () => {
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [quoteId, doSave]);
}
