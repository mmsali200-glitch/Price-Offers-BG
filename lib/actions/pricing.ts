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

/** Create or update a country-module price. Admin only. */
export async function upsertCountryModulePrice(
  country: string,
  moduleKey: string,
  value: number,
  label?: string
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const key = `${country}:${moduleKey}`;

  const { data, error } = await supabase
    .from("pricing_config")
    .upsert({
      category: "country_module_price",
      key,
      value,
      label: label || moduleKey,
      metadata: { country, module: moduleKey },
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }, { onConflict: "category,key" })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/settings/pricing");
  return { ok: true, id: data?.id };
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

/** Get all builder-relevant prices: modules, BG apps, support, country multipliers. */
export async function getAllBuilderPrices(): Promise<{
  modules: Record<string, number>;
  bgApps: Record<string, number>;
  support: Record<string, number>;
  countryMultipliers: Record<string, { multiplier: number; currency: string; symbol: string; exchange: number }>;
  countryModulePrices: Record<string, number>;
}> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pricing_config")
    .select("category, key, value, metadata")
    .in("category", ["module_price", "bg_app_price", "support_price", "country_multiplier", "country_module_price"]);

  const modules: Record<string, number> = {};
  const bgApps: Record<string, number> = {};
  const support: Record<string, number> = {};
  const countryMultipliers: Record<string, { multiplier: number; currency: string; symbol: string; exchange: number }> = {};

  (data ?? []).forEach((r) => {
    const v = Number(r.value);
    if (r.category === "module_price") modules[r.key] = v;
    else if (r.category === "bg_app_price") bgApps[r.key] = v;
    else if (r.category === "support_price") support[r.key] = v;
    else if (r.category === "country_multiplier") {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      countryMultipliers[r.key] = {
        multiplier: v,
        currency: (meta.currency as string) || "KWD",
        symbol: (meta.symbol as string) || "",
        exchange: Number(meta.exchange) || 1,
      };
    }
  });

  // Country-specific module prices: key format "country:module" → price
  const countryModulePrices: Record<string, number> = {};
  (data ?? []).forEach((r) => {
    if (r.category === "country_module_price") {
      countryModulePrices[r.key] = Number(r.value);
    }
  });

  return { modules, bgApps, support, countryMultipliers, countryModulePrices };
}
