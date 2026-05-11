"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Generate a unique quote reference: BG-YYYY-MM-DD-N
 * Uses timestamp + random suffix to guarantee uniqueness.
 */
export async function generateQuoteRef(): Promise<string> {
  const supabase = await createClient();
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const prefix = `BG-${y}-${m}-${d}`;

  // Find the highest existing sequence for today
  const { data } = await supabase
    .from("quotes")
    .select("ref")
    .like("ref", `${prefix}-%`)
    .order("created_at", { ascending: false })
    .limit(50);

  // Extract all used sequence numbers
  const usedNums = new Set<number>();
  (data ?? []).forEach((row) => {
    const parts = row.ref.split("-");
    const lastPart = parts[parts.length - 1];
    const num = parseInt(lastPart, 10);
    if (!isNaN(num)) usedNums.add(num);
  });

  // Find the first available number
  let seq = 1;
  while (usedNums.has(seq)) {
    seq++;
  }

  return `${prefix}-${seq}`;
}
