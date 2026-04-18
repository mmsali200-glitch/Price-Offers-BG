"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { generateQuoteRef } from "./ref-generator";
import { ODOO_MODULES } from "@/lib/modules-catalog";

/**
 * Creates a quote and returns the ID (no redirect).
 * The client-side wizard handles navigation.
 */
export async function createQuoteAndReturnId(
  formData: FormData
): Promise<{ ok: true; quoteId: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول" };

  const f = (k: string) => (formData.get(k) as string | null) ?? "";
  const existingClientId = f("clientId");
  const nameAr = f("nameAr") || f("name") || "عميل جديد";
  const nameEn = f("nameEn");
  const ref = f("ref") || await generateQuoteRef();
  const currency = f("currency") || "KWD";
  const quoteLanguage = f("quoteLanguage") || "ar";

  // Create or reuse client
  let clientId: string | null = existingClientId || null;
  if (!clientId) {
    const { data, error } = await supabase
      .from("clients")
      .insert({
        owner_id: user.id,
        name_ar: nameAr,
        name_en: nameEn || null,
        sector: f("sector") || "other",
        contact_name: f("contactName") || null,
        contact_phone: f("contactPhone") || null,
        contact_email: f("contactEmail") || null,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: `فشل إنشاء العميل: ${error.message}` };
    }
    clientId = data?.id ?? null;
  }

  if (!clientId) return { ok: false, error: "فشل تحديد العميل" };

  // Create quote (retry with new ref if duplicate)
  let quoteId: string | null = null;
  let lastError = "";
  for (let attempt = 0; attempt < 3; attempt++) {
    const currentRef = attempt === 0 ? ref : await generateQuoteRef();
    const { data, error: qErr } = await supabase
      .from("quotes")
      .insert({
        owner_id: user.id,
        client_id: clientId,
        ref: currentRef,
        title: nameAr,
        status: "draft",
        currency,
      })
      .select("id")
      .single();

    if (!qErr && data) {
      quoteId = data.id;
      break;
    }
    lastError = qErr?.message || "unknown";
    if (!lastError.includes("duplicate")) {
      return { ok: false, error: `فشل إنشاء العرض: ${lastError}` };
    }
  }
  if (!quoteId) return { ok: false, error: `فشل بعد 3 محاولات: ${lastError}` };

  // Build modules from assessment list
  const assessmentList = f("assessmentModulesList");
  let modulesState: Record<string, unknown> | null = null;
  if (assessmentList) {
    const selectedIds = assessmentList.split(",").filter(Boolean);
    if (selectedIds.length > 0) {
      const mods: Record<string, unknown> = {};
      ODOO_MODULES.forEach((cat) => {
        cat.modules.forEach((m) => {
          mods[m.id] = {
            id: m.id, categoryId: cat.id,
            selected: selectedIds.includes(m.id),
            discount: 0, separate: false,
          };
        });
      });
      modulesState = mods;
    }
  }

  // Seed payload
  const seedPayload: Record<string, unknown> = {
    meta: { ref, date: f("date") || "", currency, validity: f("validity") || "30 يوم" },
    language: quoteLanguage,
    client: {
      nameAr, nameEn,
      sector: f("sector") || "other",
      employeeSize: f("employeeSize") || "medium",
      contactName: f("contactName") || "",
      contactPhone: f("contactPhone") || "",
      contactEmail: f("contactEmail") || "",
      country: f("country") || "الكويت",
      city: f("city") || "",
      businessActivity: f("businessActivity") || "",
      businessDesc: "",
      governorate: "", address: "", website: "", taxNumber: "", crn: "",
      communicationLanguage: "ar", commissionPct: 0,
    },
  };
  if (modulesState) seedPayload.modules = modulesState;

  await supabase.from("quote_sections")
    .insert({ quote_id: quoteId, payload: seedPayload })
    .then(null, () => {});

  await supabase.from("quote_events")
    .insert({ quote_id: quoteId, kind: "created", actor_type: "user", actor_id: user.id })
    .then(null, () => {});

  revalidatePath("/quotes");
  return { ok: true, quoteId: quoteId };
}
