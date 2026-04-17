"use server";

import { createClient } from "@/lib/supabase/server";

export type ClientWithQuotes = {
  id: string;
  name_ar: string;
  name_en: string | null;
  sector: string | null;
  country: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  created_at: string;
  quote_count: number;
  total_value: number;
  last_quote_date: string | null;
};

/**
 * List all clients for the current user with aggregated quote stats.
 */
export async function listClients(): Promise<ClientWithQuotes[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name_ar, name_en, sector, country, city, contact_name, contact_phone, contact_email, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false });

  if (!clients || clients.length === 0) return [];

  // Aggregate quotes per client
  const { data: quotes } = await supabase
    .from("quotes")
    .select("client_id, total_development, updated_at")
    .eq("owner_id", user.id);

  const agg = new Map<string, { count: number; value: number; lastDate: string | null }>();
  (quotes ?? []).forEach((q) => {
    if (!q.client_id) return;
    const cur = agg.get(q.client_id) ?? { count: 0, value: 0, lastDate: null };
    cur.count += 1;
    cur.value += q.total_development || 0;
    if (!cur.lastDate || q.updated_at > cur.lastDate) cur.lastDate = q.updated_at;
    agg.set(q.client_id, cur);
  });

  return clients.map((c) => {
    const stats = agg.get(c.id) ?? { count: 0, value: 0, lastDate: null };
    return {
      ...c,
      quote_count: stats.count,
      total_value: stats.value,
      last_quote_date: stats.lastDate,
    };
  });
}

export type ClientQuote = {
  id: string;
  ref: string;
  title: string | null;
  status: string;
  currency: string;
  total_development: number | null;
  created_at: string;
  updated_at: string;
};

/**
 * Get a single client's details + all their quotes.
 */
export async function getClientWithQuotes(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: client } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .eq("owner_id", user.id)
    .single();

  if (!client) return null;

  const { data: quotes } = await supabase
    .from("quotes")
    .select("id, ref, title, status, currency, total_development, created_at, updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  return { client, quotes: (quotes ?? []) as ClientQuote[] };
}
