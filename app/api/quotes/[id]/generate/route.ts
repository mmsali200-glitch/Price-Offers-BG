import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderQuoteHtml } from "@/lib/render-quote";
import { makeInitialState } from "@/lib/builder/defaults";
import type { QuoteBuilderState } from "@/lib/builder/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Generate the final HTML quote. Accepts the Builder state in two ways:
 *   1. POST body { state: QuoteBuilderState } — preferred, sent by GenerateButton
 *   2. Falls back to reading from quote_sections.payload in DB
 *
 * Renders via renderQuoteHtml() and saves to quotes.generated_html.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "يجب تسجيل الدخول" }, { status: 401 });
    }

    const { data: quote, error: qErr } = await supabase
      .from("quotes")
      .select("id, ref, title")
      .eq("id", id)
      .eq("owner_id", user.id)
      .single();
    if (qErr || !quote) {
      return NextResponse.json({ error: "العرض غير موجود" }, { status: 404 });
    }

    // ── Get state: prefer POST body, fall back to DB ────────
    let payload: QuoteBuilderState;
    const defaults = makeInitialState();

    try {
      const body = await request.json();
      if (body?.state && typeof body.state === "object" && body.state.meta) {
        // State sent directly from the browser — use it as-is.
        payload = { ...defaults, ...body.state } as QuoteBuilderState;
        payload.meta = { ...defaults.meta, ...body.state.meta, ref: quote.ref };

        // Also persist this state to DB for future reference.
        await supabase
          .from("quote_sections")
          .upsert({ quote_id: id, payload: body.state })
          .then(null, (e: unknown) => console.warn("[generate] save payload:", e));
      } else {
        throw new Error("no state in body");
      }
    } catch {
      // Fallback: read from DB.
      const { data: section } = await supabase
        .from("quote_sections")
        .select("payload")
        .eq("quote_id", id)
        .single();

      const saved = (section?.payload ?? {}) as Partial<QuoteBuilderState>;
      payload = {
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
    }

    // ── Render ───────────────────────────────────────────────
    let html: string;
    try {
      html = renderQuoteHtml(payload);
    } catch (err) {
      console.error("[generate] render error:", err);
      return NextResponse.json({ error: `فشل التوليد: ${err instanceof Error ? err.message : "unknown"}` }, { status: 500 });
    }

    // ── Save HTML ───────────────────────────────────────────
    const { error: saveErr } = await supabase
      .from("quotes")
      .update({ generated_html: html, generated_at: new Date().toISOString() })
      .eq("id", id);

    if (saveErr) {
      console.error("[generate] save error:", saveErr);
      return NextResponse.json({ error: `فشل الحفظ: ${saveErr.message}` }, { status: 500 });
    }

    await supabase.from("quote_events").insert({
      quote_id: id, kind: "regenerated", actor_type: "user", actor_id: user.id,
    }).then(null, () => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[generate] unhandled:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "خطأ" }, { status: 500 });
  }
}
