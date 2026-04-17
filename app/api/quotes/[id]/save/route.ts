import { NextRequest, NextResponse } from "next/server";

/**
 * Dummy save endpoint — the actual saving is done by the autosave
 * hook. This route just returns OK to signal the toolbar that
 * a save cycle should have completed.
 */
export async function POST(_request: NextRequest) {
  return NextResponse.json({ ok: true });
}
