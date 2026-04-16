import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PreviewShell } from "@/components/preview-shell";

export const metadata = { title: "معاينة العرض · BG Quotes" };

export default async function PreviewPage({
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
    .select("id, ref, title, generated_html, generated_at")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();

  if (!quote) notFound();

  return (
    <PreviewShell
      quoteId={quote.id}
      ref_={quote.ref}
      title={quote.title}
      html={quote.generated_html}
      generatedAt={quote.generated_at}
    />
  );
}
