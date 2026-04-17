"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { findTemplate } from "@/lib/templates/catalog";
import { makeInitialState } from "@/lib/builder/defaults";
import { LICENSE_PRICING } from "@/lib/modules-catalog";
import { generateQuoteRef } from "./ref-generator";

/**
 * Create a new quote pre-filled from the chosen sector template.
 * Redirects straight into the builder so the user can tweak from there.
 */
export async function createQuoteFromTemplate(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/templates");

  const templateId = formData.get("template") as string;
  const clientName = (formData.get("name") as string) || "عميل جديد";
  const ref = (formData.get("ref") as string) || await generateQuoteRef();

  const template = findTemplate(templateId);
  if (!template) throw new Error("Template not found");

  // Build the quote state starting from defaults + apply the template
  const state = makeInitialState();

  // Meta + client
  state.meta.ref = ref;
  state.client.nameAr = clientName;
  state.client.sector = template.sector;
  state.odooVersion = template.odooVersion;
  state.durationLabel = template.durationLabel;

  // Reset all module selections, then apply template's picks
  Object.values(state.modules).forEach((m) => { m.selected = false; });
  template.moduleIds.forEach((id) => {
    if (state.modules[id]) state.modules[id].selected = true;
  });

  // BG apps
  Object.values(state.bgApps).forEach((a) => { a.selected = false; });
  template.bgAppIds.forEach((id) => {
    if (state.bgApps[id]) state.bgApps[id].selected = true;
  });

  // License + users
  state.license.type = template.licenseType;
  state.license.users = template.userCount;
  const tier = LICENSE_PRICING[template.licenseType];
  const pricing = tier?.[state.license.serverType] ?? { base: 0, perUser: 0 };
  state.license.serverMonthly = Math.round(pricing.base * state.license.exchangeRate);
  state.license.perUserMonthly = Math.round(pricing.perUser * state.license.exchangeRate * 100) / 100;

  // Support
  state.support.packageId = template.supportPackage;

  // Resilient client insert — try with extended columns then fall back.
  const baseClient = {
    owner_id: user.id,
    name_ar: clientName,
    sector: template.sector,
  };
  let clientRow: { id: string } | null = null;
  const { data: full, error: fullErr } = await supabase
    .from("clients")
    .insert({ ...baseClient, country: "الكويت", communication_language: "ar" })
    .select("id")
    .single();
  if (!fullErr && full) {
    clientRow = full;
  } else {
    const { data: base } = await supabase
      .from("clients")
      .insert(baseClient)
      .select("id")
      .single();
    clientRow = base ?? null;
  }

  const { data: quote, error } = await supabase
    .from("quotes")
    .insert({
      owner_id: user.id,
      client_id: clientRow?.id ?? null,
      ref,
      title: clientName,
      status: "draft",
      currency: "KWD",
      odoo_version: template.odooVersion,
      user_count: template.userCount,
    })
    .select("id")
    .single();

  if (error || !quote) {
    throw new Error(error?.message || "Failed to create quote");
  }

  await supabase
    .from("quote_sections")
    .insert({ quote_id: quote.id, payload: state })
    .then(null, (e: unknown) => console.warn("[template] sections:", e));

  await supabase.from("quote_events").insert({
    quote_id: quote.id,
    kind: "created",
    actor_type: "user",
    actor_id: user.id,
    metadata: { template: template.id, templateName: template.name },
  }).then(null, (e: unknown) => console.warn("[template] event:", e));

  revalidatePath("/quotes");
  revalidatePath("/dashboard");
  redirect(`/quotes/${quote.id}/edit`);
}
