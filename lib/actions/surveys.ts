"use server";

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

export type SurveyRow = SurveyListItem & {
  contact_phone: string | null;
  responses: Record<string, unknown>;
  notes: Record<string, unknown>;
  submitted_at: string | null;
  quote_id: string | null;
  client_id: string | null;
  created_by: string | null;
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
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("list_surveys");
    if (error || !data) return [];
    return (data as SurveyRow[]).map((r) => ({
      id: r.id,
      token: r.token,
      company_name: r.company_name,
      contact_name: r.contact_name,
      contact_email: r.contact_email,
      industry: r.industry,
      status: r.status,
      progress: r.progress,
      created_at: r.created_at,
      updated_at: r.updated_at,
    }));
  } catch {
    return [];
  }
}

export async function getSurveyByToken(token: string): Promise<SurveyRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_survey_by_token", { p_token: token });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as SurveyRow) ?? null;
  } catch {
    return null;
  }
}

export async function getSurveyById(id: string): Promise<SurveyRow | null> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_survey_by_id", { p_id: id });
    if (error || !data) return null;
    const row = Array.isArray(data) ? data[0] : data;
    return (row as SurveyRow) ?? null;
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
    const supabase = await createClient();
    const progress = computeSurveyProgress(responses);

    const { error } = await supabase.rpc("update_survey_responses", {
      p_token: token,
      p_responses: responses,
      p_progress: progress,
      p_company_name: clientInfo?.company_name ?? null,
      p_contact_name: clientInfo?.contact_name ?? null,
      p_contact_email: clientInfo?.contact_email ?? null,
    });

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
    const supabase = await createClient();
    const { error } = await supabase.rpc("submit_survey", { p_token: token });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/surveys");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "خطأ" };
  }
}
