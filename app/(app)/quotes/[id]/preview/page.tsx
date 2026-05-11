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

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  const role = profile?.role ?? "sales";

  let query = supabase
    .from("quotes")
    .select("id, ref, title, generated_html, generated_at")
    .eq("id", id);

  if (role === "sales") {
    query = query.eq("owner_id", user.id);
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
