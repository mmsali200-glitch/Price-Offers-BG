import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/builder/quote-builder";
import { AutosaveInit } from "@/components/builder/autosave-init";
import { BuilderToolbar } from "@/components/builder/toolbar";
import { getAllBuilderPrices } from "@/lib/actions/pricing";
import { getUserContext } from "@/lib/auth/user-context";
import type { QuoteBuilderState } from "@/lib/builder/types";

export const metadata = { title: "تعديل العرض · BG Quotes" };

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const ctx = await getUserContext();
    if (!ctx.signedIn) notFound();
    const supabase = await createClient();

    let query = supabase
      .from("quotes")
      .select("id, ref, title, status, generated_at, client_id")
      .eq("id", id);

    if (ctx.role === "sales") {
      query = query.eq("owner_id", ctx.userId);
    }

    const { data: quote } = await query.single();

    if (!quote) notFound();

    const { data: section } = await supabase
      .from("quote_sections")
      .select("payload")
      .eq("quote_id", id)
      .single();

    const initial = (section?.payload ?? {}) as Partial<QuoteBuilderState>;

    // Enrich the saved payload with the latest clients row so any field
    // updated on the client record (legal rep, project manager…) flows
    // into the builder without re-entry. The payload still wins when it
    // already holds a non-empty value.
    if (quote.client_id) {
      try {
        const { data: c } = await supabase
          .from("clients")
          .select("*")
          .eq("id", quote.client_id)
          .single();
        if (c) {
          const row = c as Record<string, unknown>;
          const str = (v: unknown) => (typeof v === "string" ? v : "");
          const num = (v: unknown) => (typeof v === "number" ? v : 0);
          const existing = (initial.client ?? {}) as Partial<QuoteBuilderState["client"]>;
          const prefer = <T,>(a: T | undefined, b: T) => (a !== undefined && a !== "" ? a : b);
          initial.client = {
            ...existing,
            nameAr: prefer(existing.nameAr, str(row.name_ar)),
            nameEn: prefer(existing.nameEn, str(row.name_en)),
            sector: prefer(existing.sector, str(row.sector)),
            employeeSize: prefer(existing.employeeSize, str(row.employee_size)),
            businessActivity: prefer(existing.businessActivity, str(row.business_activity)),
            contactName: prefer(existing.contactName, str(row.contact_name)),
            contactPhone: prefer(existing.contactPhone, str(row.contact_phone)),
            contactEmail: prefer(existing.contactEmail, str(row.contact_email)),
            country: prefer(existing.country, str(row.country)),
            governorate: prefer(existing.governorate, str(row.governorate)),
            city: prefer(existing.city, str(row.city)),
            address: prefer(existing.address, str(row.address)),
            website: prefer(existing.website, str(row.website)),
            taxNumber: prefer(existing.taxNumber, str(row.tax_number)),
            crn: prefer(existing.crn, str(row.crn)),
            legalRep: prefer(existing.legalRep, str(row.legal_rep)),
            pmName: prefer(existing.pmName, str(row.pm_name)),
            pmPhone: prefer(existing.pmPhone, str(row.pm_phone)),
            pmEmail: prefer(existing.pmEmail, str(row.pm_email)),
            communicationLanguage: prefer(existing.communicationLanguage, (row.communication_language as "ar" | "en") || "ar"),
            commissionPct: existing.commissionPct ?? num(row.commission_pct),
          } as QuoteBuilderState["client"];
        }
      } catch {
        // Optional enrichment — fall back to whatever the payload has.
      }
    }

    // Load DB prices and apply to modules/apps/support that don't have overrides
    try {
      const { modules: dbModPrices, bgApps: dbBgPrices, support: dbSupportPrices, countryMultipliers, countryModulePrices } = await getAllBuilderPrices();

      if (Object.keys(countryMultipliers).length > 0) {
        initial.countryMultipliers = countryMultipliers;
      }
      if (Object.keys(countryModulePrices).length > 0) {
        initial.countryModulePrices = countryModulePrices;
      }

      if (initial.modules && Object.keys(dbModPrices).length > 0) {
        for (const [moduleId, modState] of Object.entries(initial.modules)) {
          if (dbModPrices[moduleId] !== undefined && !modState.priceOverride) {
            (modState as { priceOverride?: number }).priceOverride = dbModPrices[moduleId];
          }
        }
      }

      if (initial.bgApps && Object.keys(dbBgPrices).length > 0) {
        for (const [appId, appState] of Object.entries(initial.bgApps)) {
          if (dbBgPrices[appId] !== undefined) {
            (appState as { implementationPrice: number }).implementationPrice = dbBgPrices[appId];
          }
        }
      }

      if (initial.support && Object.keys(dbSupportPrices).length > 0) {
        const prices = initial.support.prices || { basic: 250, advanced: 350, premium: 450 };
        if (dbSupportPrices.basic) prices.basic = dbSupportPrices.basic;
        if (dbSupportPrices.advanced) prices.advanced = dbSupportPrices.advanced;
        if (dbSupportPrices.premium) prices.premium = dbSupportPrices.premium;
        initial.support = { ...initial.support, prices };
      }
    } catch {
      // DB pricing is optional — falls back to catalog prices
    }

    // Stage history — non-critical, catch errors
    let stageHistory: Record<string, string | null> = {};
    try {
      const { data: events } = await supabase
        .from("quote_events")
        .select("kind, metadata, created_at")
        .eq("quote_id", id)
        .order("created_at", { ascending: true });

      (events ?? []).forEach((e: { kind: string; created_at: string }) => {
        if (e.kind === "created" && !stageHistory.draft) stageHistory.draft = e.created_at;
        if (e.kind === "sent" && !stageHistory.sent) stageHistory.sent = e.created_at;
        if (e.kind === "opened" && !stageHistory.opened) stageHistory.opened = e.created_at;
        if (e.kind === "accepted" && !stageHistory.accepted) stageHistory.accepted = e.created_at;
        if (e.kind === "rejected" && !stageHistory.rejected) stageHistory.rejected = e.created_at;
      });
    } catch {
      // stage history is optional
    }

    return (
      <>
        <AutosaveInit quoteId={id} initial={initial} />
        <BuilderToolbar
          quoteId={id}
          ref_={quote.ref}
          title={quote.title}
          status={quote.status}
          generatedAt={quote.generated_at}
          stageHistory={stageHistory}
        />
        <QuoteBuilder quoteId={id} />
      </>
    );
  } catch (err) {
    console.error("[edit-page]", err);
    notFound();
  }
}
