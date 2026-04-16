import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { anthropic, getModel, buildSystemWithCachedSkill } from "@/lib/claude";
import { buildQuotePrompt } from "@/lib/prompt-builder";
import { makeInitialState } from "@/lib/builder/defaults";
import type { QuoteBuilderState } from "@/lib/builder/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Generate the final HTML quote by sending the builder payload to Claude
 * with the BG Skill as a cached system prompt. Stores the result on
 * quotes.generated_html and emits a `regenerated` event.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    // ── Check API key first so we give a clear error ────────────────
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        {
          error:
            "ANTHROPIC_API_KEY غير مضبوط في متغيرات Railway. أضفه ثم أعد النشر.",
        },
        { status: 503 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "يجب تسجيل الدخول أولاً" },
        { status: 401 }
      );
    }

    // Ownership check
    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("id, ref, title")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (qErr || !quote) {
      console.error("[generate] quote fetch failed:", qErr);
      return NextResponse.json({ error: "العرض غير موجود" }, { status: 404 });
    }

    // Fetch saved payload (may be empty {} if autosave hasn't fired yet)
    const { data: section } = await supabase
      .from("quote_sections")
      .select("payload")
      .eq("quote_id", id)
      .single();

    // Merge partial payload with defaults so Claude always gets complete data
    const saved = (section?.payload ?? {}) as Partial<QuoteBuilderState>;
    const defaults = makeInitialState();
    const payload: QuoteBuilderState = {
      ...defaults,
      ...saved,
      meta: { ...defaults.meta, ...(saved.meta ?? {}), ref: quote.ref },
      client: { ...defaults.client, ...(saved.client ?? {}), nameAr: saved.client?.nameAr || quote.title || defaults.client.nameAr },
      modules: { ...defaults.modules, ...(saved.modules ?? {}) },
      bgApps: { ...defaults.bgApps, ...(saved.bgApps ?? {}) },
      license: { ...defaults.license, ...(saved.license ?? {}) },
      support: { ...defaults.support, ...(saved.support ?? {}), prices: { ...defaults.support.prices, ...(saved.support?.prices ?? {}) } },
      payment: { ...defaults.payment, ...(saved.payment ?? {}) },
    };

    const userPrompt = buildQuotePrompt(payload);

    // ── Call Claude ─────────────────────────────────────────────────
    const client = anthropic();
    let html = "";
    try {
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
      console.error("[generate] claude error:", err);
      const msg = err instanceof Error ? err.message : "خطأ في توليد Claude";
      // Surface the real Claude message (auth, rate-limit, model not found, etc.)
      return NextResponse.json(
        { error: `Claude: ${msg}` },
        { status: 502 }
      );
    }

    if (!html || html.trim().length < 100) {
      return NextResponse.json(
        { error: "استجابة Claude فارغة — حاول مرة أخرى" },
        { status: 502 }
      );
    }

    // Strip accidental markdown fences
    const cleaned = html
      .replace(/^```(?:html)?\s*/i, "")
      .replace(/\s*```\s*$/i, "")
      .trim();

    const { error: saveErr } = await supabase
      .from("quotes")
      .update({
        generated_html: cleaned,
        generated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (saveErr) {
      console.error("[generate] save error:", saveErr);
      return NextResponse.json(
        { error: `فشل الحفظ: ${saveErr.message}` },
        { status: 500 }
      );
    }

    await supabase.from("quote_events").insert({
      quote_id: id,
      kind: "regenerated",
      actor_type: "user",
      actor_id: user.id,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Catch-all so we never return Next's generic 500
    console.error("[generate] unhandled error:", err);
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
