import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getUserContext } from "@/lib/auth/user-context";

export default async function QuoteIndexPage({
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
    .select("generated_html")
    .eq("id", id);

  if (ctx.role === "sales") {
    query = query.eq("owner_id", ctx.userId);
  }

  const { data: quote } = await query.single();
  if (!quote) notFound();

  redirect(quote.generated_html ? `/quotes/${id}/preview` : `/quotes/${id}/edit`);
}
