"use server";

import { createClient } from "@/lib/supabase/server";
import { ODOO_MODULES } from "@/lib/modules-catalog";

export type RevenueByMonth = { month: string; value: number; count: number };
export type RevenueByCountry = { country: string; value: number; count: number; currency: string };
export type RevenueBySector = { sector: string; value: number; count: number };
export type ModulePopularity = { id: string; name: string; count: number; revenue: number };
export type ConversionFunnel = { stage: string; count: number; value: number };
export type AvgDealSize = { sector: string; avg: number; count: number };
export type SalesPerformance = { name: string; quotes: number; accepted: number; value: number; rate: number };
export type QuoteDuration = { status: string; avgDays: number };

export type BIReport = {
  revenueByMonth: RevenueByMonth[];
  revenueByCountry: RevenueByCountry[];
  revenueBySector: RevenueBySector[];
  modulePopularity: ModulePopularity[];
  conversionFunnel: ConversionFunnel[];
  avgDealBySector: AvgDealSize[];
  salesPerformance: SalesPerformance[];
  totalRevenue: number;
  totalAccepted: number;
  totalQuotes: number;
  avgDealSize: number;
  avgCloseRate: number;
  currency: string;
};

const SECTOR_AR: Record<string, string> = {
  trading: "تجارة", manufacturing: "تصنيع", services: "خدمات",
  healthcare: "صحة", construction: "مقاولات", realestate: "عقارات",
  logistics: "لوجستيات", retail: "تجزئة", food: "أغذية",
  education: "تعليم", government: "حكومي", other: "أخرى",
};

export async function getBIReport(): Promise<BIReport> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const empty: BIReport = {
    revenueByMonth: [], revenueByCountry: [], revenueBySector: [],
    modulePopularity: [], conversionFunnel: [], avgDealBySector: [],
    salesPerformance: [], totalRevenue: 0, totalAccepted: 0,
    totalQuotes: 0, avgDealSize: 0, avgCloseRate: 0, currency: "KWD",
  };
  if (!user) return empty;

  const { data: quotes } = await supabase
    .from("quotes")
    .select(`
      id, ref, status, currency, total_development, created_at, updated_at,
      owner_id, profiles:owner_id(full_name),
      clients:client_id(sector, country)
    `)
    .order("created_at", { ascending: true })
    .limit(1000);

  if (!quotes || quotes.length === 0) return empty;

  // --- Revenue by Month ---
  const monthMap = new Map<string, { value: number; count: number }>();
  quotes.forEach((q) => {
    const d = new Date(q.created_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = monthMap.get(key) ?? { value: 0, count: 0 };
    cur.value += q.total_development || 0;
    cur.count += 1;
    monthMap.set(key, cur);
  });
  const revenueByMonth = Array.from(monthMap.entries())
    .map(([month, d]) => ({ month, ...d }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // --- Revenue by Country ---
  const countryMap = new Map<string, { value: number; count: number; currency: string }>();
  quotes.forEach((q) => {
    const client = Array.isArray(q.clients) ? q.clients[0] : q.clients;
    const country = (client as Record<string, string>)?.country || "غير محدد";
    const cur = countryMap.get(country) ?? { value: 0, count: 0, currency: q.currency };
    cur.value += q.total_development || 0;
    cur.count += 1;
    countryMap.set(country, cur);
  });
  const revenueByCountry = Array.from(countryMap.entries())
    .map(([country, d]) => ({ country, ...d }))
    .sort((a, b) => b.value - a.value);

  // --- Revenue by Sector ---
  const sectorMap = new Map<string, { value: number; count: number }>();
  quotes.forEach((q) => {
    const client = Array.isArray(q.clients) ? q.clients[0] : q.clients;
    const sector = (client as Record<string, string>)?.sector || "other";
    const cur = sectorMap.get(sector) ?? { value: 0, count: 0 };
    cur.value += q.total_development || 0;
    cur.count += 1;
    sectorMap.set(sector, cur);
  });
  const revenueBySector = Array.from(sectorMap.entries())
    .map(([sector, d]) => ({ sector: SECTOR_AR[sector] || sector, ...d }))
    .sort((a, b) => b.value - a.value);

  // --- Module Popularity ---
  const { data: sections } = await supabase
    .from("quote_sections")
    .select("quote_id, payload")
    .in("quote_id", quotes.map((q) => q.id));

  const moduleMap = new Map<string, { count: number; revenue: number }>();
  const quoteValueMap = new Map<string, number>();
  quotes.forEach((q) => quoteValueMap.set(q.id, q.total_development || 0));

  const nameMap = new Map<string, string>();
  ODOO_MODULES.forEach((c) => c.modules.forEach((m) => nameMap.set(m.id, m.name)));

  (sections ?? []).forEach((s) => {
    const modules = (s.payload?.modules ?? {}) as Record<string, { selected?: boolean }>;
    const qValue = quoteValueMap.get(s.quote_id) || 0;
    Object.entries(modules).forEach(([id, st]) => {
      if (st?.selected) {
        const cur = moduleMap.get(id) ?? { count: 0, revenue: 0 };
        cur.count += 1;
        cur.revenue += qValue;
        moduleMap.set(id, cur);
      }
    });
  });
  const modulePopularity = Array.from(moduleMap.entries())
    .map(([id, d]) => ({ id, name: nameMap.get(id) || id, ...d }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);

  // --- Conversion Funnel ---
  const stages = ["draft", "sent", "opened", "accepted", "rejected"];
  const stageLabels: Record<string, string> = {
    draft: "مسودة", sent: "مُرسل", opened: "مفتوح", accepted: "مقبول", rejected: "مرفوض",
  };
  const conversionFunnel = stages.map((stage) => {
    const matching = quotes.filter((q) => q.status === stage);
    return {
      stage: stageLabels[stage] || stage,
      count: matching.length,
      value: matching.reduce((s, q) => s + (q.total_development || 0), 0),
    };
  });

  // --- Avg Deal by Sector ---
  const avgDealBySector = Array.from(sectorMap.entries()).map(([sector, d]) => ({
    sector: SECTOR_AR[sector] || sector,
    avg: d.count > 0 ? Math.round(d.value / d.count) : 0,
    count: d.count,
  })).sort((a, b) => b.avg - a.avg);

  // --- Sales Performance ---
  const ownerMap = new Map<string, { name: string; quotes: number; accepted: number; value: number }>();
  quotes.forEach((q) => {
    const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    const name = (profile as Record<string, string>)?.full_name || "غير محدد";
    const cur = ownerMap.get(name) ?? { name, quotes: 0, accepted: 0, value: 0 };
    cur.quotes += 1;
    if (q.status === "accepted") { cur.accepted += 1; cur.value += q.total_development || 0; }
    ownerMap.set(name, cur);
  });
  const salesPerformance = Array.from(ownerMap.values())
    .map((o) => ({ ...o, rate: o.quotes > 0 ? Math.round((o.accepted / o.quotes) * 100) : 0 }))
    .sort((a, b) => b.value - a.value);

  // --- Totals ---
  const accepted = quotes.filter((q) => q.status === "accepted");
  const totalRevenue = accepted.reduce((s, q) => s + (q.total_development || 0), 0);
  const nonDraft = quotes.filter((q) => q.status !== "draft").length;

  return {
    revenueByMonth, revenueByCountry, revenueBySector,
    modulePopularity, conversionFunnel, avgDealBySector,
    salesPerformance,
    totalRevenue,
    totalAccepted: accepted.length,
    totalQuotes: quotes.length,
    avgDealSize: accepted.length > 0 ? Math.round(totalRevenue / accepted.length) : 0,
    avgCloseRate: nonDraft > 0 ? Math.round((accepted.length / nonDraft) * 100) : 0,
    currency: quotes[0]?.currency || "KWD",
  };
}
