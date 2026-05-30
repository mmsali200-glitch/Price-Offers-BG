/**
 * Default static parties for the contract template.
 * Provider (Business Gate) and bank details rarely change between contracts,
 * so they default from here and can still be overridden per contract via the
 * extras form.
 */

export type ContractParty = {
  name: string;
  cr: string;
  vat: string;
  address: string;
  rep: string;
  email: string;
};

export type ContractBank = {
  beneficiary: string;
  name: string;
  account: string;
  iban: string;
};

export const DEFAULT_PROVIDER: ContractParty = {
  name: "شركة بوابة الأعمال التقنية للتصميم",
  cr: "7042463930",
  vat: "312665826600003",
  address: "6451 شارع البرق — الرويس — الرياض",
  rep: "محمود محمد اسماعيل عون — مدير عام",
  email: "info@businessesgates.com",
};

export const DEFAULT_BANK: ContractBank = {
  beneficiary: "شركة بوابة الأعمال التقنية للتصميم",
  name: "مصرف الراجحي — حي الربوة، الرياض (29600)",
  account: "29600-001-0006080993239",
  iban: "SA83 8000 0296 6080 1099 3239",
};

/** Jurisdiction city derived from the market / country. */
export function defaultJurisdiction(country: string): string {
  const map: Record<string, string> = {
    "السعودية": "الرياض",
    "الكويت": "مدينة الكويت",
    "الإمارات": "دبي",
    "قطر": "الدوحة",
    "البحرين": "المنامة",
    "عمان": "مسقط",
    "مصر": "القاهرة",
    "الأردن": "عمّان",
  };
  return map[country] || "الرياض";
}
