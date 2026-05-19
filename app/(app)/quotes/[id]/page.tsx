import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function QuoteIndexPage({
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
    .select("id, generated_html")
    .eq("id", id);

  if (role === "sales") {
    query = query.eq("owner_id", user.id);
  }

  const { data: quote } = await query.single();
  if (!quote) notFound();

  redirect(quote.generated_html ? `/quotes/${id}/preview` : `/quotes/${id}/edit`);
}
