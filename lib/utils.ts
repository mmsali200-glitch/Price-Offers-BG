import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const CUR_SYMBOLS: Record<string, string> = {
  KWD: "د.ك",
  SAR: "ر.س",
  AED: "د.إ",
  USD: "$",
};

export function curSymbol(code: string | undefined | null) {
  return CUR_SYMBOLS[code ?? "KWD"] ?? "د.ك";
}

export function fmtNum(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "0";
  return n.toLocaleString("en-US");
}

export function fmtMoney(n: number | null | undefined, code: string | null = "KWD") {
  return `${fmtNum(n ?? 0)} ${curSymbol(code)}`;
}

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function fmtDateArabic(d: Date | string | number) {
  const date = d instanceof Date ? d : new Date(d);
  return `${date.getDate()} ${AR_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

/** Generate a quote reference like BG-2026-NOR-001 */
export function buildQuoteRef(opts: { year: number; clientCode: string; seq: number }) {
  const code = opts.clientCode.slice(0, 3).toUpperCase().padEnd(3, "X");
  return `BG-${opts.year}-${code}-${String(opts.seq).padStart(3, "0")}`;
}
