import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { PreviewShell } from "@/components/preview-shell";
import { getUserContext } from "@/lib/auth/user-context";

export const metadata = { title: "معاينة العرض · BG Quotes" };

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await getUserContext();
  if (!ctx.signedIn) notFound();
  const supabase = await createClient();

  let query = supabase
    .from("quotes")
    .select("id, ref, title, generated_html, generated_at")
    .eq("id", id);

  if (ctx.role === "sales") {
    query = query.eq("owner_id", ctx.userId);
  }

  const { data: quote } = await query.single();

  if (!quote) notFound();

  // Derive the generated language from the HTML itself — the renderer
  // always forces <html lang="..." dir="..."> based on state.language.
  const html = quote.generated_html;
  const language: "ar" | "en" | null = html
    ? /dir="rtl"/.test(html)
      ? "ar"
      : "en"
    : null;

  return (
    <PreviewShell
      quoteId={quote.id}
      ref_={quote.ref}
      title={quote.title}
      html={html}
      generatedAt={quote.generated_at}
      language={language}
    />
  );
}
