"use server";

import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";

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
  const ctx = await getUserContext();
  if (!ctx.signedIn) return [];
  const supabase = await createClient();

  let clientQuery = supabase
    .from("clients")
    .select("id, name_ar, name_en, sector, country, city, contact_name, contact_phone, contact_email, created_at")
    .order("created_at", { ascending: false });

  let statsQuery = supabase
    .from("client_quote_stats")
    .select("client_id, quote_count, total_value, last_quote_date");

  if (ctx.role === "sales") {
    clientQuery = clientQuery.eq("owner_id", ctx.userId);
    statsQuery = statsQuery.eq("owner_id", ctx.userId);
  }

  const [clientsRes, statsRes] = await Promise.all([clientQuery, statsQuery]);
  const clients = clientsRes.data;
  if (!clients || clients.length === 0) return [];

  const agg = new Map<string, { count: number; value: number; lastDate: string | null }>();
  (statsRes.data ?? []).forEach((row: {
    client_id: string;
    quote_count: number;
    total_value: number | null;
    last_quote_date: string | null;
  }) => {
    agg.set(row.client_id, {
      count: row.quote_count,
      value: row.total_value ?? 0,
      lastDate: row.last_quote_date,
    });
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
  const ctx = await getUserContext();
  if (!ctx.signedIn) return null;
  const supabase = await createClient();

  let clientQuery = supabase.from("clients").select("*").eq("id", clientId);
  if (ctx.role === "sales") {
    clientQuery = clientQuery.eq("owner_id", ctx.userId);
  }

  let quotesQuery = supabase
    .from("quotes")
    .select("id, ref, title, status, currency, total_development, created_at, updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });
  if (ctx.role === "sales") {
    quotesQuery = quotesQuery.eq("owner_id", ctx.userId);
  }

  const [clientRes, quotesRes] = await Promise.all([clientQuery.single(), quotesQuery]);
  if (!clientRes.data) return null;

  return { client: clientRes.data, quotes: (quotesRes.data ?? []) as ClientQuote[] };
}

/**
 * List only the quotes for a given client (respects role).
 * Used by the sidebar quick-view in /clients.
 */
export async function listQuotesForClient(clientId: string): Promise<ClientQuote[]> {
  const ctx = await getUserContext();
  if (!ctx.signedIn) return [];
  const supabase = await createClient();
  const role = ctx.role;

  let query = supabase
    .from("quotes")
    .select("id, ref, title, status, currency, total_development, created_at, updated_at")
    .eq("client_id", clientId)
    .order("created_at", { ascending: false });

  if (role === "sales") {
    query = query.eq("owner_id", ctx.userId);
  }

  const { data: quotes } = await query;
  return (quotes ?? []) as ClientQuote[];
}
