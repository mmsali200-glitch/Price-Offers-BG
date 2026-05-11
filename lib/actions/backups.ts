"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type BackupRow = {
  id: string;
  type: "manual" | "auto";
  records: number;
  size_bytes: number;
  notes: string | null;
  created_by: string | null;
  created_at: string;
};

const TABLES = [
  "profiles",
  "clients",
  "quotes",
  "quote_sections",
  "quote_events",
  "pricing_config",
] as const;

export async function listBackups(): Promise<BackupRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("backups")
    .select("id, type, records, size_bytes, notes, created_by, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  return (data ?? []) as BackupRow[];
}

export async function createBackup(
  type: "manual" | "auto" = "manual",
  notes?: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "يجب تسجيل الدخول" };

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return { ok: false, error: "فقط المسؤول يقدر ينشئ نسخة احتياطية" };

  const backup: Record<string, unknown[]> = {};
  let totalRecords = 0;

  for (const table of TABLES) {
    const { data, error } = await supabase.from(table).select("*").limit(50000);
    if (error) {
      console.warn(`[backup] failed to read ${table}:`, error.message);
      backup[table] = [];
      continue;
    }
    backup[table] = data ?? [];
    totalRecords += (data ?? []).length;
  }

  const jsonStr = JSON.stringify(backup);
  const sizeBytes = new TextEncoder().encode(jsonStr).length;

  const { data: row, error: insertErr } = await supabase
    .from("backups")
    .insert({
      type,
      records: totalRecords,
      size_bytes: sizeBytes,
      notes: notes || (type === "auto" ? "تلقائي يومي" : null),
      data: backup,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (insertErr) return { ok: false, error: insertErr.message };

  // Keep only last 30 backups — delete older ones
  const { data: allBackups } = await supabase
    .from("backups")
    .select("id")
    .order("created_at", { ascending: false });

  if (allBackups && allBackups.length > 30) {
    const toDelete = allBackups.slice(30).map((b) => b.id);
    await supabase.from("backups").delete().in("id", toDelete);
  }

  revalidatePath("/settings/backups");
  return { ok: true, id: row?.id ?? "" };
}

export async function getBackupData(
  backupId: string
): Promise<{ ok: true; data: Record<string, unknown[]>; createdAt: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return { ok: false, error: "admin_only" };

  const { data, error } = await supabase
    .from("backups")
    .select("data, created_at")
    .eq("id", backupId)
    .single();

  if (error || !data) return { ok: false, error: error?.message || "not_found" };
  return { ok: true, data: data.data as Record<string, unknown[]>, createdAt: data.created_at };
}

export async function restoreBackup(
  backupId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { data: prof } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (prof?.role !== "admin") return { ok: false, error: "فقط المسؤول يقدر يستعيد النسخ" };

  const result = await getBackupData(backupId);
  if (!result.ok) return { ok: false, error: result.error };

  const backup = result.data;

  // Delete in reverse dependency order
  const deleteOrder = ["quote_events", "quote_sections", "quotes", "clients", "pricing_config"];
  for (const table of deleteOrder) {
    await supabase.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  // Insert in dependency order
  const insertOrder = ["clients", "quotes", "quote_sections", "quote_events", "pricing_config"];
  for (const table of insertOrder) {
    const rows = backup[table];
    if (!rows || rows.length === 0) continue;
    const { error } = await supabase.from(table).insert(rows as Record<string, unknown>[]);
    if (error) console.warn(`[restore] ${table}:`, error.message);
  }

  revalidatePath("/");
  return { ok: true };
}

export async function deleteBackup(
  backupId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "auth" };

  const { error } = await supabase.from("backups").delete().eq("id", backupId);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/backups");
  return { ok: true };
}
