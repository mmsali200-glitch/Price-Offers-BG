"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type PricingRow = {
  id: string;
  category: string;
  key: string;
  value: number;
  label: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
};

/** Get all pricing config rows, grouped by category. */
export async function getPricingConfig(): Promise<Record<string, PricingRow[]>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pricing_config")
    .select("*")
    .order("category")
    .order("label");

  const grouped: Record<string, PricingRow[]> = {};
  (data ?? []).forEach((row) => {
    const cat = row.category;
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(row as PricingRow);
  });
  return grouped;
}

/** Update a single pricing value. Admin only (RLS enforced). */
export async function updatePricingValue(
  id: string,
  value: number
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { error } = await supabase
    .from("pricing_config")
    .update({ value, updated_by: user.id, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/pricing");
  return { ok: true };
}

/** Get module prices as a simple map (for use in Builder/Wizard). */
export async function getModulePrices(): Promise<Record<string, number>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pricing_config")
    .select("key, value")
    .eq("category", "module_price");

  const map: Record<string, number> = {};
  (data ?? []).forEach((r) => { map[r.key] = Number(r.value); });
  return map;
}
