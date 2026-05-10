"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { computeSurveyProgress } from "@/lib/survey-data";

export type SurveyListItem = {
  id: string;
  token: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  industry: string | null;
  status: string;
  progress: number;
  created_at: string;
  updated_at: string;
};

export async function createSurvey(data: {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  industry?: string;
}): Promise<{ ok: true; token: string; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول" };

  try {
    // Use authenticated client so auth.uid() resolves inside the RPC.
    const { data: rows, error } = await supabase.rpc("create_survey", {
      p_company_name: data.companyName ?? "",
      p_contact_name: data.contactName ?? "",
      p_contact_email: data.contactEmail ?? "",
      p_industry: data.industry ?? "",
    });

    if (error) return { ok: false, error: error.message };
    const row = Array.isArray(rows) ? rows[0] : rows;
    if (!row?.id || !row?.token) {
      return { ok: false, error: "RPC create_survey returned no row — apply migration 0014" };
    }
    revalidatePath("/surveys");
    return { ok: true, token: row.token, id: row.id };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ غير متوقع" };
  }
}

export async function listSurveys(): Promise<SurveyListItem[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("surveys")
      .select("id, token, company_name, contact_name, contact_email, industry, status, progress, created_at, updated_at")
      .order("created_at", { ascending: false });
    return (data ?? []) as SurveyListItem[];
  } catch {
    return [];
  }
}

export async function getSurveyByToken(token: string) {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("surveys")
      .select("*")
      .eq("token", token)
      .single();
    return data;
  } catch {
    return null;
  }
}

export async function saveSurveyResponses(
  token: string,
  responses: Record<string, unknown>,
  clientInfo?: Record<string, string>
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient();
    const progress = computeSurveyProgress(responses);

    const update: Record<string, unknown> = {
      responses,
      progress,
      status: "in_progress",
      updated_at: new Date().toISOString(),
    };

    if (clientInfo?.company_name) update.company_name = clientInfo.company_name;
    if (clientInfo?.contact_name) update.contact_name = clientInfo.contact_name;
    if (clientInfo?.contact_email) update.contact_email = clientInfo.contact_email;

    const { error } = await admin
      .from("surveys")
      .update(update)
      .eq("token", token);

    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ" };
  }
}

export async function submitSurvey(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("surveys")
      .update({
        status: "submitted",
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("token", token);

    if (error) return { ok: false, error: error.message };
    revalidatePath("/surveys");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ" };
  }
}
