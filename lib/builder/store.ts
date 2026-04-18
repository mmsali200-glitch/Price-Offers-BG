"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { ODOO_MODULES, BG_APPS, SUPPORT_PACKAGES, LICENSE_PRICING } from "@/lib/modules-catalog";
import { makeInitialState } from "./defaults";
import { calculateComplexity } from "@/lib/module-questions";
import { getCountryPricing } from "@/lib/country-pricing";
import type {
  QuoteBuilderState,
  ModuleState,
  BGAppState,
  OptionalComponent,
  ProjectPhase,
  MeetingNote,
  ModuleChange,
  ContactPerson,
} from "./types";

type Actions = {
  reset: () => void;
  hydrate: (state: Partial<QuoteBuilderState>) => void;

  setMeta: <K extends keyof QuoteBuilderState["meta"]>(key: K, value: QuoteBuilderState["meta"][K]) => void;
  setClient: <K extends keyof QuoteBuilderState["client"]>(key: K, value: QuoteBuilderState["client"][K]) => void;
  setOdooVersion: (v: QuoteBuilderState["odooVersion"]) => void;
  setLanguage: (lang: QuoteBuilderState["language"]) => void;

  toggleModule: (id: string) => void;
  setModule: (id: string, patch: Partial<ModuleState>) => void;

  setModuleAnswer: (moduleId: string, questionId: string, value: string | boolean) => void;
  toggleBGApp: (id: string) => void;
  setBGApp: (id: string, patch: Partial<BGAppState>) => void;

  setPriceMode: (mode: QuoteBuilderState["priceMode"]) => void;
  setTotalDiscount: (pct: number) => void;

  addOption: () => void;
  updateOption: (id: number, patch: Partial<OptionalComponent>) => void;
  removeOption: (id: number) => void;

  addPhase: () => void;
  updatePhase: (id: number, patch: Partial<ProjectPhase>) => void;
  removePhase: (id: number) => void;
  setDurationLabel: (label: string) => void;

  setPayment: <K extends keyof QuoteBuilderState["payment"]>(key: K, value: QuoteBuilderState["payment"][K]) => void;

  setLicense: <K extends keyof QuoteBuilderState["license"]>(key: K, value: QuoteBuilderState["license"][K]) => void;
  autoLicensePrices: () => void;

  setSupport: <K extends keyof QuoteBuilderState["support"]>(key: K, value: QuoteBuilderState["support"][K]) => void;
  setSupportPrice: (pkg: "basic" | "advanced" | "premium", price: number) => void;

  setDescription: (text: string) => void;
  setWorkflows: (text: string) => void;
  setExtraNotes: (text: string) => void;
  setExtraRequirements: (text: string) => void;

  addContact: (c: Omit<ContactPerson, "id" | "isDefault">) => void;
  selectContact: (id: string) => void;

  addMeetingNote: () => void;
  updateMeetingNote: (id: number, patch: Partial<MeetingNote>) => void;
  removeMeetingNote: (id: number) => void;

  addModuleChange: () => void;
  updateModuleChange: (id: number, patch: Partial<ModuleChange>) => void;
  removeModuleChange: (id: number) => void;
};

let nextId = 100;
const genId = () => ++nextId;

export const useBuilderStore = create<QuoteBuilderState & Actions>()(
  subscribeWithSelector((set, get) => ({
  ...makeInitialState(),

  reset: () => set(makeInitialState()),
  hydrate: (patch) => set((s) => {
    // Deep merge so saved payloads from before new fields were added
    // don't wipe out the nested defaults — important after schema changes.
    const defaults = makeInitialState();
    return {
      ...s,
      ...patch,
      meta: { ...defaults.meta, ...s.meta, ...(patch.meta ?? {}) },
      client: { ...defaults.client, ...s.client, ...(patch.client ?? {}) },
      modules: { ...defaults.modules, ...s.modules, ...(patch.modules ?? {}) },
      bgApps: { ...defaults.bgApps, ...s.bgApps, ...(patch.bgApps ?? {}) },
      license: { ...defaults.license, ...s.license, ...(patch.license ?? {}) },
      support: {
        ...defaults.support, ...s.support, ...(patch.support ?? {}),
        prices: { ...defaults.support.prices, ...s.support.prices, ...(patch.support?.prices ?? {}) },
      },
      payment: { ...defaults.payment, ...s.payment, ...(patch.payment ?? {}) },
    };
  }),

  setMeta: (key, value) => set((s) => ({ meta: { ...s.meta, [key]: value } })),
  setClient: (key, value) => set((s) => ({ client: { ...s.client, [key]: value } })),
  setOdooVersion: (v) => set({ odooVersion: v }),
  setLanguage: (lang) => set({ language: lang }),

  toggleModule: (id) =>
    set((s) => {
      const m = s.modules[id];
      if (!m) return s;
      const selected = !m.selected;
      return {
        modules: {
          ...s.modules,
          [id]: { ...m, selected, separate: selected ? m.separate : false },
        },
      };
    }),
  setModule: (id, patch) =>
    set((s) => {
      const m = s.modules[id];
      if (!m) return s;
      return { modules: { ...s.modules, [id]: { ...m, ...patch } } };
    }),

  setModuleAnswer: (moduleId, questionId, value) =>
    set((s) => ({
      moduleAnswers: {
        ...s.moduleAnswers,
        [moduleId]: { ...(s.moduleAnswers[moduleId] ?? {}), [questionId]: value },
      },
    })),
  toggleBGApp: (id) =>
    set((s) => {
      const a = s.bgApps[id];
      if (!a) return s;
      return { bgApps: { ...s.bgApps, [id]: { ...a, selected: !a.selected } } };
    }),
  setBGApp: (id, patch) =>
    set((s) => {
      const a = s.bgApps[id];
      if (!a) return s;
      return { bgApps: { ...s.bgApps, [id]: { ...a, ...patch } } };
    }),

  setPriceMode: (mode) => set({ priceMode: mode }),
  setTotalDiscount: (pct) => set({ totalDiscount: Math.max(0, Math.min(100, pct || 0)) }),

  addOption: () =>
    set((s) => ({
      options: [
        ...s.options,
        { id: genId(), name: "مكون جديد", price: 300, selected: false },
      ],
    })),
  updateOption: (id, patch) =>
    set((s) => ({
      options: s.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    })),
  removeOption: (id) =>
    set((s) => ({ options: s.options.filter((o) => o.id !== id) })),

  addPhase: () =>
    set((s) => ({
      phases: [
        ...s.phases,
        { id: genId(), name: "مرحلة جديدة", duration: "أسبوعان", deliverables: "المخرجات..." },
      ],
    })),
  updatePhase: (id, patch) =>
    set((s) => ({ phases: s.phases.map((p) => (p.id === id ? { ...p, ...patch } : p)) })),
  removePhase: (id) => set((s) => ({ phases: s.phases.filter((p) => p.id !== id) })),
  setDurationLabel: (label) => set({ durationLabel: label }),

  setPayment: (key, value) => set((s) => ({ payment: { ...s.payment, [key]: value } })),

  setLicense: (key, value) =>
    set((s) => {
      const license = { ...s.license, [key]: value };
      return { license };
    }),

  autoLicensePrices: () => {
    const { license } = get();
    const tier = LICENSE_PRICING[license.type];
    const pricing = tier?.[license.serverType] ?? { base: 0, perUser: 0 };
    const rate = license.exchangeRate || 1;
    set((s) => ({
      license: {
        ...s.license,
        serverMonthly: license.manualServer ? s.license.serverMonthly : Math.round(pricing.base * rate),
        perUserMonthly: license.manualPerUser ? s.license.perUserMonthly : Math.round(pricing.perUser * rate * 100) / 100,
      },
    }));
  },

  setSupport: (key, value) => set((s) => ({ support: { ...s.support, [key]: value } })),
  setSupportPrice: (pkg, price) =>
    set((s) => ({
      support: { ...s.support, prices: { ...s.support.prices, [pkg]: price } },
    })),

  setDescription: (text) => set({ projectDescription: text }),
  setWorkflows: (text) => set({ workflows: text }),
  setExtraNotes: (text) => set({ extraNotes: text }),
  setExtraRequirements: (text) => set({ extraRequirements: text }),

  addContact: (c) =>
    set((s) => {
      const id = `c${genId()}`;
      return {
        contacts: [...s.contacts, { ...c, id, isDefault: false }],
        selectedContactId: id,
      };
    }),
  selectContact: (id) => set({ selectedContactId: id }),

  addMeetingNote: () =>
    set((s) => ({
      meetingNotes: [...s.meetingNotes, { id: genId(), type: "note", text: "", owner: "" }],
    })),
  updateMeetingNote: (id, patch) =>
    set((s) => ({
      meetingNotes: s.meetingNotes.map((n) => (n.id === id ? { ...n, ...patch } : n)),
    })),
  removeMeetingNote: (id) =>
    set((s) => ({ meetingNotes: s.meetingNotes.filter((n) => n.id !== id) })),

  addModuleChange: () =>
    set((s) => ({
      moduleChanges: [
        ...s.moduleChanges,
        { id: genId(), moduleId: "", change: "", impact: "low" },
      ],
    })),
  updateModuleChange: (id, patch) =>
    set((s) => ({
      moduleChanges: s.moduleChanges.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),
  removeModuleChange: (id) =>
    set((s) => ({ moduleChanges: s.moduleChanges.filter((c) => c.id !== id) })),
})));

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

export function computeTotals(state: QuoteBuilderState) {
  const mods = selectedModules(state);
  const bgApps = selectedBGApps(state);
  const countryPricing = getCountryPricing(state.client?.country || "الكويت");

  // Apply country multiplier + complexity multiplier per module
  const modulesRaw = mods.reduce((s, m) => {
    const answers = state.moduleAnswers?.[m.id] ?? {};
    const { multiplier: complexity } = calculateComplexity(m.id, answers);
    const adjustedPrice = Math.round(m.price * countryPricing.priceMultiplier * complexity);
    return s + Math.round(adjustedPrice * (1 - (m.discount || 0) / 100));
  }, 0);
  const bgImpl = bgApps.reduce((s, a) => s + Math.round(a.implementationPrice * countryPricing.priceMultiplier), 0);
  const bgMonthly = bgApps.reduce((s, a) => s + a.monthlyPrice, 0);
  const devRaw = modulesRaw + bgImpl;
  const development = Math.round(devRaw * (1 - (state.totalDiscount || 0) / 100));

  const srv = state.license.serverMonthly || 0;
  const pu = state.license.perUserMonthly || 0;
  const licenseMonthly = Math.round(srv + pu * state.license.users);

  const pkg = SUPPORT_PACKAGES.find((p) => p.id === state.support.packageId);
  const supportMonthly = state.support.packageId === "none"
    ? 0
    : (state.support.prices as Record<string, number>)[state.support.packageId] ?? pkg?.price ?? 0;

  const installments = state.payment.installments > 1
    ? Math.round(development / state.payment.installments)
    : 0;

  return {
    development,
    developmentRaw: devRaw,
    bgImpl,
    bgMonthly,
    licenseMonthly,
    supportMonthly,
    installments,
    totalMonthly: licenseMonthly + supportMonthly + bgMonthly,
  };
}
