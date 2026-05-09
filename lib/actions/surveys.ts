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

export async function createSurvey(data: {
  companyName?: string;
  contactName?: string;
  contactEmail?: string;
  industry?: string;
}): Promise<{ ok: true; token: string; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول" };

  const { data: result, error } = await supabase.rpc("create_survey", {
    p_company_name: data.companyName || null,
    p_contact_name: data.contactName || null,
    p_contact_email: data.contactEmail || null,
    p_contact_phone: null,
    p_industry: data.industry || null,
    p_created_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  const row = result as { id: string; token: string };
  revalidatePath("/surveys");
  return { ok: true, token: row.token, id: row.id };
}

export async function listSurveys(): Promise<SurveyListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_surveys");
  if (error || !data) return [];
  return data as SurveyListItem[];
}

export async function getSurveyByToken(token: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_survey_by_token", { p_token: token });
  if (error || !data || (data as unknown[]).length === 0) return null;
  return (data as unknown[])[0];
}

export async function saveSurveyResponses(
  token: string,
  responses: Record<string, unknown>,
  clientInfo?: Record<string, string>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const progress = computeSurveyProgress(responses);

  const { error } = await supabase.rpc("update_survey_responses", {
    p_token: token,
    p_responses: responses,
    p_progress: progress,
    p_status: "in_progress",
    p_company_name: clientInfo?.company_name || null,
    p_contact_name: clientInfo?.contact_name || null,
    p_contact_email: clientInfo?.contact_email || null,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitSurvey(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_survey_responses", {
    p_token: token,
    p_responses: {},
    p_progress: 100,
    p_status: "submitted",
  });

  if (error) return { ok: false, error: error.message };
  revalidatePath("/surveys");
  return { ok: true };
}
