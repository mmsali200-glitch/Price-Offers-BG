import fs from "node:fs";
import path from "node:path";

/**
 * Canonical HTML template for Business Gate quotes.
 * Source: samples/reference-quote.html (the approved IMKAN sample).
 *
 * This file is read ONCE per server process and served as the style
 * reference to Claude. Every quote Claude generates must match this
 * template's structure, classes, and visual language exactly — only
 * dynamic content (client name, modules, prices, dates) changes.
 */

let _cached: string | null = null;

export function getReferenceTemplate(): string {
  if (_cached) return _cached;
  const filePath = path.join(process.cwd(), "samples", "reference-quote.html");
  _cached = fs.readFileSync(filePath, "utf-8");
  return _cached;
}
