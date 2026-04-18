import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/builder/quote-builder";
import { AutosaveInit } from "@/components/builder/autosave-init";
import { BuilderToolbar } from "@/components/builder/toolbar";
import { getModulePrices } from "@/lib/actions/pricing";
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

    const { data: quote } = await supabase
      .from("quotes")
      .select("id, ref, title, status, generated_at")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();

    if (!quote) notFound();

    const { data: section } = await supabase
      .from("quote_sections")
      .select("payload")
      .eq("quote_id", id)
      .single();

    const initial = (section?.payload ?? {}) as Partial<QuoteBuilderState>;

    // Load DB prices and apply to modules that don't have overrides
    try {
      const dbPrices = await getModulePrices();
      if (initial.modules && Object.keys(dbPrices).length > 0) {
        for (const [moduleId, modState] of Object.entries(initial.modules)) {
          if (dbPrices[moduleId] !== undefined && !modState.priceOverride) {
            (modState as { priceOverride?: number }).priceOverride = dbPrices[moduleId];
          }
        }
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
        <QuoteBuilder />
      </>
    );
  } catch (err) {
    console.error("[edit-page]", err);
    notFound();
  }
}
