"use client";

import { useState, useTransition } from "react";
import { Loader2, Check } from "lucide-react";
import type { UserProfile, UserRole } from "@/lib/actions/users";
import { updateUserRole } from "@/lib/actions/users";
import { fmtDateArabic, cn } from "@/lib/utils";

const ROLE_OPTIONS: Array<{ v: UserRole; label: string; cls: string; desc: string }> = [
  { v: "sales",   label: "مندوب مبيعات", cls: "bg-bg-green-lt text-bg-green",  desc: "عروضه فقط" },
  { v: "manager", label: "مدير",           cls: "bg-bg-gold text-bg-green",       desc: "كل العروض" },
  { v: "admin",   label: "مسؤول",         cls: "bg-bg-green text-white",         desc: "كل الصلاحيات" },
];

export function UsersTable({ users }: { users: UserProfile[] }) {
  const [, startTransition] = useTransition();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [justUpdated, setJustUpdated] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRoleChange(userId: string, role: UserRole) {
    setPendingId(userId);
    setError(null);
    const res = await updateUserRole(userId, role);
    setPendingId(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setJustUpdated(userId);
    setTimeout(() => setJustUpdated(null), 1500);
    startTransition(() => {});
  }

  if (users.length === 0) {
    return (
      <div className="card p-10 text-center">
        <p className="text-sm text-bg-text-3">لا يوجد مستخدمون حتى الآن.</p>
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
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-bg-green text-white">
            <tr>
              <th className="px-3 py-2.5 text-right text-xs font-bold">العضو</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">البريد</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">الدور</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">عدد العروض</th>
              <th className="px-3 py-2.5 text-right text-xs font-bold">انضم في</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t border-bg-line hover:bg-bg-green-lt/30">
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="size-8 rounded-full bg-bg-green-lt text-bg-green flex items-center justify-center text-[11px] font-black">
                      {u.full_name.slice(0, 2)}
                    </span>
                    <div>
                      <div className="text-xs font-black text-bg-text-1">{u.full_name}</div>
                      {u.phone && <div className="text-[10px] text-bg-text-3">{u.phone}</div>}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-bg-text-2" dir="ltr">{u.email ?? "—"}</td>
                <td className="px-3 py-2.5">
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
                              "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors",
                              active
                                ? r.cls + " border-transparent"
                                : "bg-white border-bg-line text-bg-text-3 hover:border-bg-green"
                            )}
                            title={r.desc}
                          >
                            {r.label}
                          </button>
                        );
                      })
                    )}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-xs text-bg-text-1 tabular">{u.quote_count}</td>
                <td className="px-3 py-2.5 text-[10px] text-bg-text-3">
                  {fmtDateArabic(u.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
