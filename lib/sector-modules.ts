/**
 * Maps each business sector to the modules that are typically
 * relevant, and which questions to ask. This drives the
 * "needs assessment" step in the quote wizard.
 */

export type SectorConfig = {
  /** Modules always suggested for this sector */
  coreModules: string[];
  /** Modules that might be needed (shown as optional) */
  optionalModules: string[];
  /** Which question modules to show (from module-questions.ts) */
  questionModules: string[];
};

export const SECTOR_MODULES: Record<string, SectorConfig> = {
  trading: {
    coreModules: ["crm", "sales", "inventory", "purchase", "accounting", "invoicing"],
    optionalModules: ["barcode", "delivery", "pos", "hr", "payroll", "expenses"],
    questionModules: ["accounting", "sales", "crm", "inventory", "purchase"],
  },
  manufacturing: {
    coreModules: ["mrp", "inventory", "purchase", "sales", "accounting", "quality"],
    optionalModules: ["plm", "maintenance", "barcode", "hr", "payroll", "project"],
    questionModules: ["mrp", "accounting", "inventory", "purchase", "hr"],
  },
  services: {
    coreModules: ["project", "crm", "accounting", "invoicing", "hr"],
    optionalModules: ["timesheets", "helpdesk", "expenses", "payroll", "fieldservice"],
    questionModules: ["project", "accounting", "crm", "hr"],
  },
  healthcare: {
    coreModules: ["hms", "accounting", "hr", "payroll", "inventory"],
    optionalModules: ["lab", "purchase", "website", "crm"],
    questionModules: ["accounting", "hr", "inventory", "payroll"],
  },
  construction: {
    coreModules: ["project", "purchase", "accounting", "hr", "inventory"],
    optionalModules: ["timesheets", "fieldservice", "expenses", "payroll", "eam"],
    questionModules: ["project", "accounting", "purchase", "hr", "inventory"],
  },
  realestate: {
    coreModules: ["realestate", "accounting", "crm", "invoicing"],
    optionalModules: ["eam", "maintenance", "hr", "website"],
    questionModules: ["accounting", "crm"],
  },
  logistics: {
    coreModules: ["inventory", "purchase", "sales", "accounting", "delivery"],
    optionalModules: ["barcode", "crm", "hr", "payroll", "fieldservice"],
    questionModules: ["inventory", "purchase", "accounting", "sales"],
  },
  retail: {
    coreModules: ["pos", "inventory", "sales", "accounting", "purchase"],
    optionalModules: ["barcode", "crm", "website", "ecommerce", "hr", "payroll"],
    questionModules: ["pos", "inventory", "accounting", "sales"],
  },
  food: {
    coreModules: ["pos", "inventory", "purchase", "accounting", "hr"],
    optionalModules: ["barcode", "payroll", "attendance", "leaves"],
    questionModules: ["pos", "inventory", "accounting", "hr"],
  },
  education: {
    coreModules: ["accounting", "hr", "payroll", "website"],
    optionalModules: ["elearning", "crm", "project", "invoicing"],
    questionModules: ["accounting", "hr", "payroll"],
  },
  government: {
    coreModules: ["accounting", "hr", "payroll", "purchase", "project"],
    optionalModules: ["inventory", "eam", "helpdesk", "expenses"],
    questionModules: ["accounting", "purchase", "hr", "project"],
  },
  other: {
    coreModules: ["accounting", "crm", "sales"],
    optionalModules: ["inventory", "purchase", "hr", "payroll", "project"],
    questionModules: ["accounting", "sales", "crm"],
  },
};

export function getSectorConfig(sector: string): SectorConfig {
  return SECTOR_MODULES[sector] || SECTOR_MODULES.other;
}
