"use server";

import { createClient } from "@/lib/supabase/server";

export type ActivityEntry = {
  id: string;
  actor_name: string | null;
  actor_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_name: string | null;
  details: Record<string, unknown>;
  created_at: string;
};

export async function logActivity(params: {
  action: string;
  entityType: string;
  entityId?: string;
  entityName?: string;
  details?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  await supabase.from("activity_log").insert({
    actor_id: user.id,
    actor_name: profile?.full_name || user.email,
    actor_role: profile?.role || "sales",
    action: params.action,
    entity_type: params.entityType,
    entity_id: params.entityId || null,
    entity_name: params.entityName || null,
    details: params.details || {},
  }).then(null, (e) => console.warn("[activity-log]", e));
}

export async function getActivityLog(limit = 50): Promise<ActivityEntry[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []) as ActivityEntry[];
}
