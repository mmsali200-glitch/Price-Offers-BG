import Anthropic from "@anthropic-ai/sdk";
import { BG_QUOTE_SKILL } from "./bg-skill";

/**
 * Anthropic client — used server-side only.
 * Uses prompt caching on the Skill system prompt so every quote generation
 * reuses the cached tokens (~75% cost reduction on cache hits).
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
 * Build the system prompt block with cache_control so the Skill is cached
 * between requests. Returns the typed system array expected by Messages API.
 */
export function buildSystemWithCachedSkill() {
  return [
    {
      type: "text" as const,
      text: BG_QUOTE_SKILL,
      cache_control: { type: "ephemeral" as const },
    },
  ];
}
