/**
 * Type definitions for the quote builder state.
 * Mirrors the payload JSONB stored in quote_sections.payload.
 */

export type QuoteCurrency = "KWD" | "SAR" | "AED" | "QAR" | "BHD" | "OMR" | "EGP" | "JOD" | "USD";

export type PriceMode = "total" | "items" | "hidden";

export type QuoteLanguage = "ar" | "en";

export type ClientInfo = {
  nameAr: string;
  nameEn: string;
  sector: string;
  employeeSize: string;
  businessDesc: string;
  businessActivity: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  country: string;
  governorate: string;
  city: string;
  address: string;
  website: string;
  taxNumber: string;
  crn: string;
  communicationLanguage: QuoteLanguage;
  commissionPct: number;
};

export type QuoteMeta = {
  ref: string;
  date: string;
  currency: QuoteCurrency;
  validity: string;
};

export type ModuleState = {
  id: string;
  categoryId: string;
  selected: boolean;
  priceOverride?: number;
  discount: number; // percentage 0-100
  separate: boolean; // show as separate line item
};

export type BGAppState = {
  id: string;
  selected: boolean;
  implementationPrice: number;
  monthlyPrice: number;
};

export type OptionalComponent = {
  id: number;
  name: string;
  price: number;
  selected: boolean;
};

export type ProjectPhase = {
  id: number;
  name: string;
  duration: string;
  deliverables: string;
};

export type LicenseState = {
  type: "Community" | "Odoo.sh" | "Enterprise On-Premise";
  serverType: "cloud" | "vps" | "dedicated" | "onprem";
  users: number;
  exchangeRate: number;
  serverMonthly: number;
  perUserMonthly: number;
  manualServer: boolean;
  manualPerUser: boolean;
  includeOdooInTotal: boolean;
  licenseMonths: number;
};

export type SupportState = {
  packageId: "none" | "basic" | "advanced" | "premium";
  freeSupport: string;
  paidSupport: string;
  prices: { basic: number; advanced: number; premium: number };
};

export type PaymentState = {
  method: string;
  installments: number;
  startDate: string;
  firstPaymentPct: number;
  note: string;
};

export type MeetingNote = {
  id: number;
  type: "note" | "important" | "request" | "concern";
  text: string;
  owner: string;
};

export type ModuleChange = {
  id: number;
  moduleId: string;
  change: string;
  impact: "low" | "med" | "high";
};

export type ContactPerson = {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  isDefault: boolean;
};

export type QuoteBuilderState = {
  meta: QuoteMeta;
  client: ClientInfo;
  odooVersion: "16" | "17" | "18" | "19";
  language: QuoteLanguage;
  priceMode: PriceMode;
  totalDiscount: number;
  modules: Record<string, ModuleState>;
  moduleAnswers: Record<string, Record<string, string | boolean>>;
  bgApps: Record<string, BGAppState>;
  options: OptionalComponent[];
  phases: ProjectPhase[];
  durationLabel: string;
  payment: PaymentState;
  license: LicenseState;
  support: SupportState;
  projectDescription: string;
  workflows: string;
  extraNotes: string;
  extraRequirements: string;
  contacts: ContactPerson[];
  selectedContactId: string;
  meetingNotes: MeetingNote[];
  moduleChanges: ModuleChange[];
};
