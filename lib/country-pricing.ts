/**
 * Country-based pricing multipliers.
 * Base prices are set for Kuwait (KWD). Other countries get a
 * multiplier applied to the base price.
 */

export type CountryPricing = {
  country: string;
  currency: string;
  currencySymbol: string;
  /** Multiplier applied to base module prices */
  priceMultiplier: number;
  /** Multiplier for license costs (Odoo) */
  licenseMultiplier: number;
  /** Multiplier for support packages */
  supportMultiplier: number;
  /** Exchange rate from KWD (for display conversion) */
  exchangeFromKWD: number;
};

export const COUNTRY_PRICING: Record<string, CountryPricing> = {
  "الكويت": {
    country: "الكويت",
    currency: "KWD",
    currencySymbol: "د.ك",
    priceMultiplier: 1.0,      // Base
    licenseMultiplier: 1.0,
    supportMultiplier: 1.0,
    exchangeFromKWD: 1.0,
  },
  "السعودية": {
    country: "السعودية",
    currency: "SAR",
    currencySymbol: "ر.س",
    priceMultiplier: 0.85,     // أقل بـ 15% من الكويت
    licenseMultiplier: 0.90,
    supportMultiplier: 0.85,
    exchangeFromKWD: 12.2,     // 1 KWD ≈ 12.2 SAR
  },
  "الإمارات": {
    country: "الإمارات",
    currency: "AED",
    currencySymbol: "د.إ",
    priceMultiplier: 0.95,
    licenseMultiplier: 0.95,
    supportMultiplier: 0.95,
    exchangeFromKWD: 12.0,
  },
  "قطر": {
    country: "قطر",
    currency: "QAR",
    currencySymbol: "ر.ق",
    priceMultiplier: 0.90,
    licenseMultiplier: 0.95,
    supportMultiplier: 0.90,
    exchangeFromKWD: 11.9,
  },
  "البحرين": {
    country: "البحرين",
    currency: "BHD",
    currencySymbol: "د.ب",
    priceMultiplier: 0.95,
    licenseMultiplier: 1.0,
    supportMultiplier: 0.95,
    exchangeFromKWD: 1.23,
  },
  "عمان": {
    country: "عمان",
    currency: "OMR",
    currencySymbol: "ر.ع",
    priceMultiplier: 0.90,
    licenseMultiplier: 0.95,
    supportMultiplier: 0.90,
    exchangeFromKWD: 1.26,
  },
  "مصر": {
    country: "مصر",
    currency: "EGP",
    currencySymbol: "ج.م",
    priceMultiplier: 0.55,     // أقل بكثير
    licenseMultiplier: 0.70,
    supportMultiplier: 0.50,
    exchangeFromKWD: 160.0,
  },
  "الأردن": {
    country: "الأردن",
    currency: "JOD",
    currencySymbol: "د.أ",
    priceMultiplier: 0.65,
    licenseMultiplier: 0.80,
    supportMultiplier: 0.60,
    exchangeFromKWD: 2.32,
  },
};

/**
 * Get pricing for a country. Falls back to Kuwait if not found.
 */
export function getCountryPricing(country: string): CountryPricing {
  return COUNTRY_PRICING[country] || COUNTRY_PRICING["الكويت"];
}

/**
 * Calculate adjusted price: base × country × complexity
 */
export function adjustPrice(
  basePrice: number,
  country: string,
  complexityMultiplier: number = 1.0
): number {
  const cp = getCountryPricing(country);
  return Math.round(basePrice * cp.priceMultiplier * complexityMultiplier);
}
