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
 * Aggregation runs in SQL (see migration 0013) — single round-trip.
 */
export async function listClients(): Promise<ClientWithQuotes[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.rpc("list_clients_with_stats");
  if (error || !data) return [];

  return (data as Array<{
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
    quote_count: number | string;
    total_value: number | string;
    last_quote_date: string | null;
  }>).map((row) => ({
    id: row.id,
    name_ar: row.name_ar,
    name_en: row.name_en,
    sector: row.sector,
    country: row.country,
    city: row.city,
    contact_name: row.contact_name,
    contact_phone: row.contact_phone,
    contact_email: row.contact_email,
    created_at: row.created_at,
    quote_count: Number(row.quote_count) || 0,
    total_value: Number(row.total_value) || 0,
    last_quote_date: row.last_quote_date,
  }));
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
