import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { renderQuoteHtml } from "@/lib/render-quote";
import { makeInitialState } from "@/lib/builder/defaults";
import type { QuoteBuilderState } from "@/lib/builder/types";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Generate the final HTML quote by rendering the approved reference
 * template (samples/reference-quote.html) with the user's builder data.
 * Entirely server-side — no AI call — so generation is instant and
 * produces a guaranteed visual match every time.
 *
 * Stores the HTML on quotes.generated_html + emits a regenerated event.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
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

    const { data: section } = await supabase
      .from("quote_sections")
      .select("payload")
      .eq("quote_id", id)
      .single();

    // Merge the saved payload with defaults so missing fields never break
    // the renderer. Also inject the quote's ref (source of truth on the quotes row).
    const saved = (section?.payload ?? {}) as Partial<QuoteBuilderState>;
    const defaults = makeInitialState();
    const payload: QuoteBuilderState = {
      ...defaults,
      ...saved,
      meta: {
        ...defaults.meta,
        ...(saved.meta ?? {}),
        ref: quote.ref,
      },
      client: {
        ...defaults.client,
        ...(saved.client ?? {}),
        nameAr: saved.client?.nameAr || quote.title || defaults.client.nameAr,
      },
      modules: { ...defaults.modules, ...(saved.modules ?? {}) },
      bgApps: { ...defaults.bgApps, ...(saved.bgApps ?? {}) },
      license: { ...defaults.license, ...(saved.license ?? {}) },
      support: {
        ...defaults.support,
        ...(saved.support ?? {}),
        prices: {
          ...defaults.support.prices,
          ...(saved.support?.prices ?? {}),
        },
      },
      payment: { ...defaults.payment, ...(saved.payment ?? {}) },
    };

    let html: string;
    try {
      html = renderQuoteHtml(payload);
    } catch (err) {
      console.error("[generate] render error:", err);
      const msg = err instanceof Error ? err.message : "خطأ في توليد HTML";
      return NextResponse.json(
        { error: `فشل التوليد: ${msg}` },
        { status: 500 }
      );
    }

    const { error: saveErr } = await supabase
      .from("quotes")
      .update({
        generated_html: html,
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
    }).then(null, () => {});

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[generate] unhandled error:", err);
    const msg = err instanceof Error ? err.message : "خطأ غير متوقع";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
