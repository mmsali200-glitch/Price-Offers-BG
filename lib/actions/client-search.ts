"use server";

import { createClient } from "@/lib/supabase/server";

export type ClientOption = {
  id: string;
  name_ar: string;
  name_en: string | null;
  sector: string | null;
  country: string | null;
  contact_name: string | null;
  contact_phone: string | null;
};

/**
 * Search clients by name (Arabic or English). Returns top 10 matches
 * for the autocomplete dropdown.
 */
export async function searchClients(query: string): Promise<ClientOption[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !query.trim()) return [];

  const q = query.trim();
  const { data } = await supabase
    .from("clients")
    .select("id, name_ar, name_en, sector, country, contact_name, contact_phone")
    .eq("owner_id", user.id)
    .or(`name_ar.ilike.%${q}%,name_en.ilike.%${q}%,contact_name.ilike.%${q}%`)
    .order("created_at", { ascending: false })
    .limit(10);

  return data ?? [];
}

/**
 * Get all clients for the current user (for the full list view).
 */
export async function getAllClients(): Promise<ClientOption[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("clients")
    .select("id, name_ar, name_en, sector, country, contact_name, contact_phone")
    .eq("owner_id", user.id)
    .order("name_ar", { ascending: true })
    .limit(100);

  return data ?? [];
}

/**
 * Get full client data by ID (for pre-filling the builder).
 */
export async function getClientById(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("owner_id", user.id)
    .single();

  return data;
}
