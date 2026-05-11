"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity-log";

export async function requestApproval(
  quoteId: string,
  note?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, ref, title, status")
    .eq("id", quoteId)
    .single();

  if (!quote) return { ok: false, error: "العرض غير موجود" };
  if (quote.status !== "draft") return { ok: false, error: "العرض يجب أن يكون مسودة لطلب الاعتماد" };

  const { error } = await supabase
    .from("quotes")
    .update({
      requires_approval: true,
      approval_note: note || null,
    })
    .eq("id", quoteId);

  if (error) return { ok: false, error: error.message };

  await supabase.from("quote_events").insert({
    quote_id: quoteId,
    kind: "updated",
    actor_type: "user",
    actor_id: user.id,
    metadata: { action: "approval_requested", note },
  }).then(null, () => {});

  await logActivity({
    action: "طلب اعتماد",
    entityType: "quote",
    entityId: quoteId,
    entityName: quote.ref,
    details: { note },
  });

  revalidatePath("/quotes");
  return { ok: true };
}

export async function approveQuote(
  quoteId: string,
  note?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return { ok: false, error: "فقط المدير أو المسؤول يقدر يعتمد" };
  }

  const { data: quote } = await supabase
    .from("quotes")
    .select("id, ref, requires_approval")
    .eq("id", quoteId)
    .single();

  if (!quote) return { ok: false, error: "العرض غير موجود" };

  const { error } = await supabase
    .from("quotes")
    .update({
      requires_approval: false,
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      approval_note: note || "تم الاعتماد",
      status: "sent",
    })
    .eq("id", quoteId);

  if (error) return { ok: false, error: error.message };

  await supabase.from("quote_events").insert({
    quote_id: quoteId,
    kind: "sent",
    actor_type: "user",
    actor_id: user.id,
    metadata: { action: "approved", note },
  }).then(null, () => {});

  await logActivity({
    action: "اعتماد عرض",
    entityType: "quote",
    entityId: quoteId,
    entityName: quote.ref,
    details: { note },
  });

  revalidatePath("/quotes");
  return { ok: true };
}

export async function rejectApproval(
  quoteId: string,
  reason: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["manager", "admin"].includes(profile.role)) {
    return { ok: false, error: "فقط المدير أو المسؤول يقدر يرفض" };
  }

  const { error } = await supabase
    .from("quotes")
    .update({
      requires_approval: false,
      approval_note: `مرفوض: ${reason}`,
    })
    .eq("id", quoteId);

  if (error) return { ok: false, error: error.message };

  await logActivity({
    action: "رفض اعتماد",
    entityType: "quote",
    entityId: quoteId,
    details: { reason },
  });

  revalidatePath("/quotes");
  return { ok: true };
}

export async function getPendingApprovals(): Promise<
  Array<{ id: string; ref: string; title: string | null; owner_name: string | null; created_at: string; approval_note: string | null }>
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("quotes")
    .select("id, ref, title, created_at, approval_note, profiles:owner_id(full_name)")
    .eq("requires_approval", true)
    .eq("status", "draft")
    .order("created_at", { ascending: false });

  return (data ?? []).map((q) => {
    const profile = Array.isArray(q.profiles) ? q.profiles[0] : q.profiles;
    return {
      id: q.id,
      ref: q.ref,
      title: q.title,
      owner_name: profile?.full_name ?? null,
      created_at: q.created_at,
      approval_note: q.approval_note,
    };
  });
}
