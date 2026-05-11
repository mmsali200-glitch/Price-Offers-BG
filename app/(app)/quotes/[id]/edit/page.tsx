import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/builder/quote-builder";
import { AutosaveInit } from "@/components/builder/autosave-init";
import { BuilderToolbar } from "@/components/builder/toolbar";
import { getAllBuilderPrices } from "@/lib/actions/pricing";
import type { QuoteBuilderState } from "@/lib/builder/types";

export const metadata = { title: "تعديل العرض · BG Quotes" };

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) notFound();

    // Check role — admin/manager can edit any quote
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    const role = profile?.role ?? "sales";

    let query = supabase
      .from("quotes")
      .select("id, ref, title, status, generated_at")
      .eq("id", id);

    if (role === "sales") {
      query = query.eq("owner_id", user.id);
    }

    const { data: quote } = await query.single();

    if (!quote) notFound();

    const { data: section } = await supabase
      .from("quote_sections")
      .select("payload")
      .eq("quote_id", id)
      .single();

    const initial = (section?.payload ?? {}) as Partial<QuoteBuilderState>;

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
