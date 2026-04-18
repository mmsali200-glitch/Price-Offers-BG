/**
 * Consolidated extended module data — merges all batches.
 * Used by renderers to show detailed features + workflow steps.
 */

import type { ExtendedModuleData } from "./modules-extended-1";
import { MODULE_EXTENDED as B1 } from "./modules-extended-1";
import { MODULE_EXTENDED_2 as B2 } from "./modules-extended-2";
import { MODULE_EXTENDED_3 as B3 } from "./modules-extended-3";
import { MODULE_EXTENDED_4 as B4 } from "./modules-extended-4";
import { MODULE_GUIDE_DATA as GUIDE } from "./modules-guide-data";

export type { ExtendedModuleData };

/**
 * Merged data: guide data (from odoo18_complete_guide.html) takes
 * priority over manually written data (modules-extended-1..4).
 * Guide has richer features + step descriptions from official Odoo docs.
 */
export const ALL_EXTENDED: Record<string, ExtendedModuleData> = {
  ...B1,
  ...B2,
  ...B3,
  ...B4,
  ...GUIDE, // Guide data wins — richer content
};

/** Get extended data for a module, falling back to empty arrays. */
export function getExtended(moduleId: string): ExtendedModuleData {
  return ALL_EXTENDED[moduleId] ?? { features: [], workflow: [] };
}
