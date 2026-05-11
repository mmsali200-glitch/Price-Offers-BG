import fs from "node:fs";
import path from "node:path";

/**
 * Canonical HTML templates for Business Gate quotes.
 * Source files:
 *   - samples/reference-quote.html    — English / LTR (IMKAN sample)
 *   - samples/reference-arabic.html   — Arabic / RTL (Osama Al-Sayed sample)
 *
 * Each file is read once per server process (cached in memory) and
 * used as the style reference by lib/render-quote.ts. Every generated
 * quote matches its template's structure, classes, and visual language
 * exactly — only dynamic content (client name, modules, prices, dates)
 * changes.
 */

const cache: { en?: string; ar?: string } = {};

function loadTemplate(file: string): string {
  const filePath = path.join(process.cwd(), "samples", file);
  return fs.readFileSync(filePath, "utf-8");
}

export function getReferenceTemplateEn(): string {
  if (!cache.en) cache.en = loadTemplate("reference-quote.html");
  return cache.en;
}

export function getReferenceTemplateAr(): string {
  if (!cache.ar) cache.ar = loadTemplate("reference-arabic.html");
  return cache.ar;
}

/** Back-compat alias pointing at the English template by default. */
export function getReferenceTemplate(): string {
  return getReferenceTemplateEn();
}
