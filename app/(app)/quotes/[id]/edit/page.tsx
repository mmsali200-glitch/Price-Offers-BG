import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { QuoteBuilder } from "@/components/builder/quote-builder";
import { AutosaveInit } from "@/components/builder/autosave-init";
import { BuilderToolbar } from "@/components/builder/toolbar";
import type { QuoteBuilderState } from "@/lib/builder/types";

export const metadata = { title: "تعديل العرض · BG Quotes" };

export default async function EditQuotePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
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

  return (
    <>
      <AutosaveInit quoteId={id} initial={initial} />
      <BuilderToolbar
        quoteId={id}
        ref_={quote.ref}
        title={quote.title}
        status={quote.status}
        generatedAt={quote.generated_at}
      />
      <QuoteBuilder />
    </>
  );
}
