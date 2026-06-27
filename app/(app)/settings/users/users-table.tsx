"use client";

import { useState, useTransition } from "react";
import {
  Loader2, Check, ChevronDown, ChevronUp,
  KeyRound, Ban, CircleCheck, Trash2, X, Pencil,
} from "lucide-react";
import type { UserProfile, UserRole } from "@/lib/actions/users";
import {
  updateUserRole,
  deleteUserAccount,
  setUserSuspended,
  adminSetUserPassword,
  adminUpdateUser,
} from "@/lib/actions/users";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: Array<{ v: UserRole; label: string; cls: string }> = [
  { v: "sales",   label: "مندوب مبيعات", cls: "bg-bg-green-lt text-bg-green" },
  { v: "manager", label: "مدير",           cls: "bg-bg-gold text-bg-green" },
  { v: "admin",   label: "مسؤول",         cls: "bg-bg-green text-white" },
];

const PERMS: Record<UserRole, Record<string, Record<string, boolean>>> = {
  sales: {
    "عروض الأسعار": { "إنشاء": true, "عرض عروضه": true, "كل العروض": false, "تعديل": true, "حذف": false, "توليد": true, "طلب اعتماد": true, "اعتماد": false },
    "العملاء": { "إضافة": true, "عرض عملائه": true, "كل العملاء": false, "تعديل": false, "حذف": false },
    "المستخدمين": { "عرض": false, "إضافة": false, "تغيير دور": false, "حذف": false },
    "لوحة التحكم": { "شخصية": true, "الفريق": false },
  },
  manager: {
    "عروض الأسعار": { "إنشاء": true, "عرض عروضه": true, "كل العروض": true, "تعديل": true, "حذف": true, "توليد": true, "اعتماد": true },
    "العملاء": { "إضافة": true, "عرض عملائه": true, "كل العملاء": true, "تعديل": true, "حذف": true },
    "المستخدمين": { "عرض": true, "إضافة": false, "تغيير دور": false, "حذف": false },
    "لوحة التحكم": { "شخصية": true, "الفريق": true },
    "سجل النشاط": { "عرض": true },
  },
  admin: {
    "عروض الأسعار": { "إنشاء": true, "عرض عروضه": true, "كل العروض": true, "تعديل": true, "حذف": true, "توليد": true, "اعتماد": true },
    "العملاء": { "إضافة": true, "عرض عملائه": true, "كل العملاء": true, "تعديل": true, "حذف": true },
    "المستخدمين": { "عرض": true, "إضافة": true, "تغيير دور": true, "حذف": true },
    "لوحة التحكم": { "شخصية": true, "الفريق": true },
    "سجل النشاط": { "عرض": true, "تصدير": true },
    "النسخ الاحتياطية": { "إنشاء": true, "استعادة": true, "تحميل": true },
  },
};

export function UsersTable({
  users,
  currentUserId,
}: {
  users: UserProfile[];
  currentUserId: string;
}) {
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Per-user management UI state
  const [busyAction, setBusyAction] = useState<string | null>(null); // `${id}:${action}`
  const [pwOpenId, setPwOpenId] = useState<string | null>(null);
  const [pwValue, setPwValue] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [editOpenId, setEditOpenId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ full_name: string; email: string; phone: string }>(
    { full_name: "", email: "", phone: "" }
  );

  function openEdit(u: UserProfile) {
    setEditOpenId(editOpenId === u.id ? null : u.id);
    setEditForm({ full_name: u.full_name ?? "", email: u.email ?? "", phone: u.phone ?? "" });
    setError(null);
  }

  async function handleSaveEdit(u: UserProfile) {
    setBusyAction(`${u.id}:edit`);
    setError(null); setNotice(null);
    const res = await adminUpdateUser(u.id, {
      full_name: editForm.full_name,
      email: editForm.email,
      phone: editForm.phone,
    });
    setBusyAction(null);
    if (!res.ok) { setError(res.error); return; }
    setEditOpenId(null);
    setNotice("تم تحديث بيانات المستخدم.");
    startTransition(() => {});
  }

  async function handleRoleChange(userId: string, role: UserRole) {
    setPendingId(userId);
    setError(null);
    const res = await updateUserRole(userId, role);
    setPendingId(null);
    if (!res.ok) { setError(res.error); return; }
    setJustUpdated(userId);
    setTimeout(() => setJustUpdated(null), 1500);
    startTransition(() => {});
  }

  async function handleToggleSuspend(u: UserProfile) {
    setBusyAction(`${u.id}:suspend`);
    setError(null); setNotice(null);
    const res = await setUserSuspended(u.id, !u.suspended);
    setBusyAction(null);
    if (!res.ok) { setError(res.error); return; }
    setNotice(u.suspended ? "تم تفعيل المستخدم." : "تم إيقاف المستخدم.");
    startTransition(() => {});
  }

  async function handleDelete(u: UserProfile) {
    const ok = window.confirm(
      `حذف المستخدم "${u.full_name}" نهائياً؟\nلا يمكن التراجع عن هذه العملية.`
    );
    if (!ok) return;
    setBusyAction(`${u.id}:delete`);
    setError(null); setNotice(null);
    const res = await deleteUserAccount(u.id);
    setBusyAction(null);
    if (!res.ok) { setError(res.error); return; }
    setNotice("تم حذف المستخدم.");
    startTransition(() => {});
  }

  async function handleSavePassword(u: UserProfile) {
    if (pwValue.length < 8) { setError("كلمة المرور 8 أحرف على الأقل."); return; }
    setBusyAction(`${u.id}:pw`);
    setError(null); setNotice(null);
    const res = await adminSetUserPassword(u.id, pwValue);
    setBusyAction(null);
    if (!res.ok) { setError(res.error); return; }
    setPwOpenId(null); setPwValue("");
    setNotice(`تم تغيير كلمة مرور ${u.full_name}.`);
  }

  if (users.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-bg-text-3">لا يوجد مستخدمون.</p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">
          {error}
        </div>
      )}
      {notice && (
        <div className="text-xs text-bg-green bg-bg-green-lt border border-bg-green/30 rounded-sm2 px-3 py-2">
          {notice}
        </div>
      )}
      <div className="space-y-3">
        {users.map((u) => {
          const isExpanded = expandedId === u.id;
          const perms = PERMS[u.role] || PERMS.sales;

          return (
            <div key={u.id} className="card overflow-hidden">
              {/* User row */}
              <div className="p-4 flex items-center gap-3 flex-wrap">
                <span className="size-10 rounded-full bg-bg-green-lt text-bg-green flex items-center justify-center text-sm font-black shrink-0">
                  {u.full_name.slice(0, 2)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-black text-bg-text-1 flex items-center gap-2">
                    {u.full_name}
                    {u.suspended && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-bg-danger">
                        موقوف
                      </span>
                    )}
                    {u.id === currentUserId && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-bg-gold-lt text-[#8a6010]">
                        أنت
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-bg-text-3" dir="ltr">{u.email ?? "—"}</div>
                  {u.phone && <div className="text-[10px] text-bg-text-3">{u.phone}</div>}
                </div>

                {/* Role selector */}
                <div className="flex items-center gap-1.5">
                  {pendingId === u.id ? (
                    <Loader2 className="size-4 animate-spin text-bg-green" />
                  ) : justUpdated === u.id ? (
                    <span className="inline-flex items-center gap-1 text-[11px] text-bg-green font-bold">
                      <Check className="size-3.5" /> تم
                    </span>
                  ) : (
                    ROLE_OPTIONS.map((r) => {
                      const active = u.role === r.v;
                      return (
                        <button
                          key={r.v}
                          onClick={() => handleRoleChange(u.id, r.v)}
                          className={cn(
                            "text-[10px] font-bold px-2.5 py-1 rounded-full border transition-colors min-h-[28px]",
                            active
                              ? r.cls + " border-transparent"
                              : "bg-white border-bg-line text-bg-text-3 hover:border-bg-green"
                          )}
                          title={`تغيير إلى ${r.label}`}
                        >
                          {r.label}
                        </button>
                      );
                    })
                  )}
                </div>

                {/* Expand permissions */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : u.id)}
                  className="text-[10px] text-bg-text-3 hover:text-bg-green border border-bg-line rounded px-2 py-1 inline-flex items-center gap-1"
                >
                  صلاحيات {isExpanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>

                {/* Stats */}
                <div className="text-xs text-bg-text-3 text-center">
                  <div className="font-bold text-bg-green tabular">{u.quote_count}</div>
                  <div className="text-[9px]">عرض</div>
                </div>
              </div>

              {/* Management actions */}
              <div className="border-t border-bg-line bg-bg-card-alt/50 px-4 py-2.5 flex flex-wrap items-center gap-2">
                {/* Edit user data */}
                <button
                  onClick={() => openEdit(u)}
                  className="text-[11px] font-bold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm2 border border-bg-line text-bg-text-2 hover:border-bg-green hover:text-bg-green"
                >
                  <Pencil className="size-3.5" /> تعديل البيانات
                </button>

                {/* Change password */}
                <button
                  onClick={() => { setPwOpenId(pwOpenId === u.id ? null : u.id); setPwValue(""); setError(null); }}
                  className="text-[11px] font-bold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm2 border border-bg-line text-bg-text-2 hover:border-bg-green hover:text-bg-green"
                >
                  <KeyRound className="size-3.5" /> تغيير كلمة السر
                </button>

                {/* Suspend / activate */}
                <button
                  onClick={() => handleToggleSuspend(u)}
                  disabled={busyAction === `${u.id}:suspend` || u.id === currentUserId}
                  className={cn(
                    "text-[11px] font-bold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm2 border disabled:opacity-40",
                    u.suspended
                      ? "border-bg-green/40 text-bg-green hover:bg-bg-green-lt"
                      : "border-amber-300 text-amber-700 hover:bg-amber-50"
                  )}
                  title={u.id === currentUserId ? "لا يمكنك إيقاف حسابك" : ""}
                >
                  {busyAction === `${u.id}:suspend`
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : u.suspended ? <CircleCheck className="size-3.5" /> : <Ban className="size-3.5" />}
                  {u.suspended ? "تفعيل" : "إيقاف"}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDelete(u)}
                  disabled={busyAction === `${u.id}:delete` || u.id === currentUserId}
                  className="text-[11px] font-bold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-sm2 border border-red-200 text-bg-danger hover:bg-red-50 disabled:opacity-40"
                  title={u.id === currentUserId ? "لا يمكنك حذف حسابك" : ""}
                >
                  {busyAction === `${u.id}:delete`
                    ? <Loader2 className="size-3.5 animate-spin" />
                    : <Trash2 className="size-3.5" />}
                  حذف
                </button>

                {/* Inline data editor */}
                {editOpenId === u.id && (
                  <div className="w-full pt-2 mt-1 border-t border-bg-line space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <label className="block">
                        <span className="block text-[10px] font-bold text-bg-text-2 mb-1">الاسم الكامل</span>
                        <input
                          className="input w-full text-xs"
                          value={editForm.full_name}
                          onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                          placeholder="الاسم"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-bold text-bg-text-2 mb-1">البريد الإلكتروني</span>
                        <input
                          className="input w-full text-xs" dir="ltr"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          placeholder="name@example.com"
                        />
                      </label>
                      <label className="block">
                        <span className="block text-[10px] font-bold text-bg-text-2 mb-1">الهاتف</span>
                        <input
                          className="input w-full text-xs" dir="ltr"
                          value={editForm.phone}
                          onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                          placeholder="+9665..."
                        />
                      </label>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveEdit(u)}
                        disabled={busyAction === `${u.id}:edit`}
                        className="btn-primary h-9 text-xs inline-flex items-center gap-1.5"
                      >
                        {busyAction === `${u.id}:edit`
                          ? <Loader2 className="size-3.5 animate-spin" />
                          : <Check className="size-3.5" />}
                        حفظ
                      </button>
                      <button
                        onClick={() => setEditOpenId(null)}
                        className="h-9 px-2 text-xs text-bg-text-3 hover:text-bg-danger inline-flex items-center gap-1"
                      >
                        <X className="size-3.5" /> إلغاء
                      </button>
                    </div>
                  </div>
                )}

                {/* Inline password editor */}
                {pwOpenId === u.id && (
                  <div className="w-full flex flex-wrap items-center gap-2 pt-2 mt-1 border-t border-bg-line">
                    <input
                      type="text"
                      dir="ltr"
                      value={pwValue}
                      onChange={(e) => setPwValue(e.target.value)}
                      placeholder="كلمة المرور الجديدة (8 أحرف+)"
                      className="input flex-1 min-w-[200px] text-xs"
                    />
                    <button
                      onClick={() => handleSavePassword(u)}
                      disabled={busyAction === `${u.id}:pw`}
                      className="btn-primary h-9 text-xs inline-flex items-center gap-1.5"
                    >
                      {busyAction === `${u.id}:pw`
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Check className="size-3.5" />}
                      حفظ
                    </button>
                    <button
                      onClick={() => { setPwOpenId(null); setPwValue(""); }}
                      className="h-9 px-2 text-xs text-bg-text-3 hover:text-bg-danger inline-flex items-center gap-1"
                    >
                      <X className="size-3.5" /> إلغاء
                    </button>
                  </div>
                )}
              </div>

              {/* Expanded permissions — EDITABLE */}
              {isExpanded && (
                <div className="border-t border-bg-line bg-bg-card-alt p-4">
                  <div className="text-[10px] font-black text-bg-green uppercase tracking-wider mb-3">
                    صلاحيات {u.full_name} — اضغط على أي صلاحية لتغييرها
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(perms).map(([section, sPerms]) => (
                      <div key={section} className="rounded-sm2 bg-white border border-bg-line p-3">
                        <div className="text-[10px] font-bold text-bg-text-2 mb-2">{section}</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(sPerms).map(([key, allowed]) => {
                            // Determine which role gives/removes this permission
                            const needsAdmin = !PERMS.manager[section]?.[key] && PERMS.admin[section]?.[key];
                            const needsManager = !PERMS.sales[section]?.[key] && PERMS.manager[section]?.[key];

                            return (
                              <button
                                key={key}
                                onClick={() => {
                                  if (allowed) {
                                    // Downgrade: if currently admin perm, go to manager; if manager perm, go to sales
                                    if (needsAdmin) handleRoleChange(u.id, "manager");
                                    else if (needsManager) handleRoleChange(u.id, "sales");
                                  } else {
                                    // Upgrade: if needs admin, set admin; if needs manager, set manager
                                    if (needsAdmin) handleRoleChange(u.id, "admin");
                                    else if (needsManager) handleRoleChange(u.id, "manager");
                                    else handleRoleChange(u.id, "admin");
                                  }
                                }}
                                className={`text-[9px] font-bold px-2 py-1 rounded-full cursor-pointer transition-all hover:scale-105 active:scale-95 ${
                                  allowed
                                    ? "bg-bg-green-lt text-bg-green hover:bg-bg-green hover:text-white"
                                    : "bg-red-50 text-bg-danger hover:bg-bg-danger hover:text-white"
                                }`}
                                title={allowed
                                  ? `اضغط لإلغاء "${key}" — سيتغيّر الدور تلقائياً`
                                  : `اضغط لتفعيل "${key}" — سيتغيّر الدور تلقائياً`
                                }
                              >
                                {allowed ? "✓" : "✕"} {key}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-2 bg-bg-gold-lt border border-bg-gold rounded-sm2 text-[10px] text-[#8a6010]">
                    💡 الضغط على صلاحية يغيّر الدور تلقائياً:
                    <b> مندوب</b> (صلاحيات محدودة) →
                    <b> مدير</b> (يرى كل شي) →
                    <b> مسؤول</b> (تحكم كامل)
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
