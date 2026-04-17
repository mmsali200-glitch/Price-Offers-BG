"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Generate a unique, non-repeating quote reference in the format:
 *   BG-YYYY-MM-DD-N
 * where N is a daily sequence number starting from 1.
 *
 * Example: BG-2026-04-17-1, BG-2026-04-17-2, ...
 *          BG-2026-04-18-1 (resets next day)
 *
 * The function queries existing refs with today's prefix, finds the
 * highest sequence, and returns max+1. Thread-safe because the
 * quotes.ref column has a UNIQUE constraint — if two users race,
 * the second INSERT will fail and the action can retry.
 */
export async function generateQuoteRef(): Promise<string> {
  const supabase = await createClient();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `BG-${y}-${m}-${d}`;

  // Find existing refs with today's prefix
  const { data } = await supabase
    .from("quotes")
    .select("ref")
    .like("ref", `${prefix}-%`)
    .order("ref", { ascending: false })
    .limit(1);

  let seq = 1;
  if (data && data.length > 0) {
    const lastRef = data[0].ref; // e.g. "BG-2026-04-17-3"
    const lastSeq = parseInt(lastRef.split("-").pop() || "0", 10);
    if (!isNaN(lastSeq)) {
      seq = lastSeq + 1;
    }
  }

  return `${prefix}-${seq}`;
}
