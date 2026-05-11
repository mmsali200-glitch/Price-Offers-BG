import Anthropic from "@anthropic-ai/sdk";
import { BG_QUOTE_SKILL } from "./bg-skill";
import { getReferenceTemplate } from "./reference-template";

/**
 * Anthropic client — used server-side only.
 * Uses prompt caching on the Skill + reference template so every quote
 * generation reuses the cached tokens (~75% cost reduction on cache hits).
 */
let _client: Anthropic | null = null;

export function anthropic() {
  if (_client) return _client;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");
  _client = new Anthropic({ apiKey });
  return _client;
}

export function getModel() {
  return process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
}

/**
 * Build the system prompt blocks:
 *   1. BG Skill (instructions) — cached.
 *   2. Reference HTML template — cached.
 * Claude consumes both as the authoritative style + structure guide.
 */
export function buildSystemWithCachedSkill() {
  const template = getReferenceTemplate();
  return [
    {
      type: "text" as const,
      text: BG_QUOTE_SKILL,
      cache_control: { type: "ephemeral" as const },
    },
    {
      type: "text" as const,
      text:
        "═══ REFERENCE TEMPLATE — MATCH THIS EXACTLY ═══\n\n" +
        "The following is the canonical HTML template you must reproduce. " +
        "Copy its structure, classes, IDs, SVG logo, CSS, JS, and styling " +
        "verbatim. Substitute ONLY the dynamic content (client name, ref, " +
        "date, modules list, prices, phases, signature) with the data the " +
        "user supplies.\n\n" +
        template,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}
