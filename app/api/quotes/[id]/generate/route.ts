import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, getModel, buildSystemWithCachedSkill } from "@/lib/claude";
import { buildQuotePrompt } from "@/lib/prompt-builder";
import type { QuoteBuilderState } from "@/lib/builder/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generate the final HTML quote by sending the builder payload to Claude
 * with the BG Skill as a cached system prompt. Stores the result on
 * quotes.generated_html and emits a `regenerated` event.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "auth_required" }, { status: 401 });
  }

  // Ownership check + payload fetch
  const { data: quote } = await supabase
    .from("quotes")
    .select("id, ref, title")
    .eq("id", id)
    .eq("owner_id", user.id)
    .single();
  if (!quote) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: section } = await supabase
    .from("quote_sections")
    .select("payload")
    .eq("quote_id", id)
    .single();
  const payload = (section?.payload ?? null) as QuoteBuilderState | null;
  if (!payload) {
    return NextResponse.json({ error: "no_payload" }, { status: 400 });
  }

  const userPrompt = buildQuotePrompt(payload);

  let html = "";
  try {
    const client = anthropic();
    const stream = await client.messages.stream({
      model: getModel(),
      max_tokens: 8192,
      system: buildSystemWithCachedSkill(),
      messages: [{ role: "user", content: userPrompt }],
    });
    const final = await stream.finalMessage();
    html = final.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("");
  } catch (err) {
    const msg = err instanceof Error ? err.message : "claude_error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // Strip accidental markdown fences around the HTML
  const cleaned = html
    .replace(/^```(?:html)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();

  await supabase
    .from("quotes")
    .update({ generated_html: cleaned, generated_at: new Date().toISOString() })
    .eq("id", id);

  await supabase.from("quote_events").insert({
    quote_id: id,
    kind: "regenerated",
    actor_type: "user",
    actor_id: user.id,
  });

  return NextResponse.json({ ok: true });
}
