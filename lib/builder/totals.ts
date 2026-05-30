/**
 * Pure pricing/totals selectors. Kept in a directive-free module (no
 * "use client") so they can be imported from both client components
 * (via the store re-export) and server code (contract template, server
 * actions) without Next.js treating them as client references.
 */

import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES } from "@/lib/modules-catalog";
import { calculateComplexity } from "@/lib/module-questions";
import { getCountryPricing, getVatRate } from "@/lib/country-pricing";
import type { QuoteBuilderState } from "./types";

/** Selectors (derived values). Exported as plain functions that take state. */
export function selectedModules(state: QuoteBuilderState) {
  const result: Array<{ id: string; name: string; price: number; discount: number; separate: boolean; features: string[] }> = [];
  ODOO_MODULES.forEach((cat) => {
    cat.modules.forEach((m) => {
      const st = state.modules[m.id];
      if (st?.selected) {
        result.push({
          id: m.id,
          name: m.name,
          price: st.priceOverride ?? m.price,
          discount: st.discount,
          separate: st.separate,
          features: m.features,
        });
      }
    });
  });
  return result;
}

export function selectedBGApps(state: QuoteBuilderState) {
  return BG_APPS.filter((a) => state.bgApps[a.id]?.selected).map((a) => ({
    ...a,
    implementationPrice: state.bgApps[a.id].implementationPrice,
    monthlyPrice: state.bgApps[a.id].monthlyPrice,
  }));
}

function getMultiplier(state: QuoteBuilderState): number {
  const country = state.client?.country || "الكويت";
  const dbEntry = state.countryMultipliers?.[country];
  if (dbEntry) return dbEntry.multiplier;
  return getCountryPricing(country).priceMultiplier;
}

function getModulePrice(state: QuoteBuilderState, moduleId: string, basePrice: number): number {
  const country = state.client?.country || "الكويت";
  const countryKey = `${country}:${moduleId}`;
  const dbPrice = state.countryModulePrices?.[countryKey];
  if (dbPrice !== undefined) return dbPrice;
  return Math.round(basePrice * getMultiplier(state));
}

export function computeTotals(state: QuoteBuilderState) {
  const mods = selectedModules(state);
  const bgApps = selectedBGApps(state);
  const cm = getMultiplier(state);

  const modulesRaw = mods.reduce((s, m) => {
    const answers = state.moduleAnswers?.[m.id] ?? {};
    const { multiplier: complexity } = calculateComplexity(m.id, answers);
    const countryPrice = getModulePrice(state, m.id, m.price);
    const adjustedPrice = Math.round(countryPrice * complexity);
    return s + Math.round(adjustedPrice * (1 - (m.discount || 0) / 100));
  }, 0);
  const bgImpl = bgApps.reduce((s, a) => s + Math.round(a.implementationPrice * cm), 0);
  const bgMonthly = bgApps.reduce((s, a) => s + a.monthlyPrice, 0);
  const optionsTotal = (state.options ?? [])
    .filter((o) => o.selected)
    .reduce((s, o) => s + Math.round((o.price || 0) * cm), 0);
  const devRaw = modulesRaw + bgImpl + optionsTotal;
  const development = Math.round(devRaw * (1 - (state.totalDiscount || 0) / 100));

  const srv = state.license?.serverMonthly || 0;
  const pu = state.license?.perUserMonthly || 0;
  const licenseMonthly = Math.round(srv + pu * (state.license?.users || 0));

  const pkg = SUPPORT_PACKAGES.find((p) => p.id === state.support?.packageId);
  const supportMonthly = !state.support || state.support.packageId === "none"
    ? 0
    : (state.support.prices as Record<string, number>)?.[state.support.packageId] ?? pkg?.price ?? 0;

  // VAT (e.g. 15% for Saudi Arabia) on the one-time development total only.
  const vatRate = getVatRate(state.client?.country || "");
  const vat = Math.round(development * vatRate);
  const developmentWithVat = development + vat;

  // Offer total & installments are based on development + VAT only.
  // The Odoo license value is never included in the total.
  const installments = (state.payment?.installments ?? 0) > 1
    ? Math.round(developmentWithVat / state.payment.installments)
    : 0;

  return {
    development,
    developmentRaw: devRaw,
    bgImpl,
    bgMonthly,
    licenseMonthly,
    supportMonthly,
    installments,
    vatRate,
    vat,
    developmentWithVat,
    totalMonthly: licenseMonthly + supportMonthly + bgMonthly,
  };
}
