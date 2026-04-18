"use client";

import { useState, useTransition } from "react";
import { Loader2, Check, ChevronDown, ChevronUp } from "lucide-react";
import type { UserProfile, UserRole } from "@/lib/actions/users";
import { updateUserRole } from "@/lib/actions/users";
import { fmtDateArabic, cn } from "@/lib/utils";

const ROLE_OPTIONS: Array<{ v: UserRole; label: string; cls: string }> = [
  { v: "sales",   label: "مندوب مبيعات", cls: "bg-bg-green-lt text-bg-green" },
  { v: "manager", label: "مدير",           cls: "bg-bg-gold text-bg-green" },
  { v: "admin",   label: "مسؤول",         cls: "bg-bg-green text-white" },
];

const PERMS: Record<UserRole, Record<string, Record<string, boolean>>> = {
  sales: {
    "عروض الأسعار": { "إنشاء": true, "عرض عروضه": true, "كل العروض": false, "تعديل": true, "حذف": false, "توليد": true },
    "العملاء": { "إضافة": true, "عرض عملائه": true, "كل العملاء": false, "تعديل": false, "حذف": false },
    "المستخدمين": { "عرض": false, "إضافة": false, "تغيير دور": false, "حذف": false },
    "لوحة التحكم": { "شخصية": true, "الفريق": false },
  },
  manager: {
    "عروض الأسعار": { "إنشاء": true, "عرض عروضه": true, "كل العروض": true, "تعديل": true, "حذف": false, "توليد": true },
    "العملاء": { "إضافة": true, "عرض عملائه": true, "كل العملاء": true, "تعديل": false, "حذف": false },
    "المستخدمين": { "عرض": true, "إضافة": false, "تغيير دور": false, "حذف": false },
    "لوحة التحكم": { "شخصية": true, "الفريق": true },
  },
  admin: {
    "عروض الأسعار": { "إنشاء": true, "عرض عروضه": true, "كل العروض": true, "تعديل": true, "حذف": true, "توليد": true },
    "العملاء": { "إضافة": true, "عرض عملائه": true, "كل العملاء": true, "تعديل": true, "حذف": true },
    "المستخدمين": { "عرض": true, "إضافة": true, "تغيير دور": true, "حذف": true },
    "لوحة التحكم": { "شخصية": true, "الفريق": true },
  },
};

export function UsersTable({ users }: { users: UserProfile[] }) {
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
                  <div className="text-sm font-black text-bg-text-1">{u.full_name}</div>
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

              {/* Expanded permissions */}
              {isExpanded && (
                <div className="border-t border-bg-line bg-bg-card-alt p-4">
                  <div className="text-[10px] font-black text-bg-green uppercase tracking-wider mb-3">
                    صلاحيات {u.full_name} ({ROLE_OPTIONS.find(r => r.v === u.role)?.label})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(perms).map(([section, sPerms]) => (
                      <div key={section} className="rounded-sm2 bg-white border border-bg-line p-3">
                        <div className="text-[10px] font-bold text-bg-text-2 mb-2">{section}</div>
                        <div className="flex flex-wrap gap-1">
                          {Object.entries(sPerms).map(([key, allowed]) => (
                            <span
                              key={key}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                                allowed
                                  ? "bg-bg-green-lt text-bg-green"
                                  : "bg-red-50 text-bg-danger line-through opacity-50"
                              }`}
                            >
                              {allowed ? "✓" : "✕"} {key}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-bg-text-3 mt-2">
                    انضم في {fmtDateArabic(u.created_at)} · لتغيير الصلاحيات، غيّر الدور من الأزرار أعلاه
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
