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
  quoteId?: string;
  clientId?: string;
}): Promise<{ ok: true; token: string; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { data: row, error } = await supabase
    .from("surveys")
    .insert({
      company_name: data.companyName || null,
      contact_name: data.contactName || null,
      contact_email: data.contactEmail || null,
      industry: data.industry || null,
      quote_id: data.quoteId || null,
      client_id: data.clientId || null,
      created_by: user.id,
    })
    .select("id, token")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/surveys");
  return { ok: true, token: row.token, id: row.id };
}

export async function listSurveys(): Promise<SurveyListItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select("id, token, company_name, contact_name, contact_email, industry, status, progress, created_at, updated_at")
    .order("created_at", { ascending: false });
  return (data ?? []) as SurveyListItem[];
}

export async function getSurveyByToken(token: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surveys")
    .select("*")
    .eq("token", token)
    .single();
  return data;
}

export async function saveSurveyResponses(
  token: string,
  responses: Record<string, unknown>,
  clientInfo?: Record<string, string>
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const progress = computeSurveyProgress(responses);

  const update: Record<string, unknown> = {
    responses,
    progress,
    status: "in_progress",
    updated_at: new Date().toISOString(),
  };

  if (clientInfo) {
    if (clientInfo.company_name) update.company_name = clientInfo.company_name;
    if (clientInfo.contact_name) update.contact_name = clientInfo.contact_name;
    if (clientInfo.contact_email) update.contact_email = clientInfo.contact_email;
    if (clientInfo.contact_phone) update.contact_phone = clientInfo.contact_phone;
    if (clientInfo.industry) update.industry = clientInfo.industry;
  }

  const { error } = await supabase
    .from("surveys")
    .update(update)
    .eq("token", token);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function submitSurvey(
  token: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();

  const { error } = await supabase
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
}
