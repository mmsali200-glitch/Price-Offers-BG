import { getActivityLog } from "@/lib/actions/activity-log";
import { getCurrentRole } from "@/lib/actions/users";
import { redirect } from "next/navigation";
import { Clock, User, FileText, Users, DollarSign, Shield } from "lucide-react";

export const metadata = { title: "سجل النشاط · BG Quotes" };
export const dynamic = "force-dynamic";

const ACTION_ICONS: Record<string, string> = {
  "طلب اعتماد": "📋",
  "اعتماد عرض": "✅",
  "رفض اعتماد": "❌",
  "إنشاء عرض": "📝",
  "تعديل عرض": "✏️",
  "حذف عرض": "🗑️",
  "إنشاء عميل": "👤",
  "تعديل عميل": "✏️",
  "حذف عميل": "🗑️",
  "تغيير دور": "🔐",
  "نسخة احتياطية": "💾",
  "استعادة": "🔄",
};

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  admin: { label: "مسؤول", cls: "bg-bg-green text-white" },
  manager: { label: "مدير", cls: "bg-bg-gold text-bg-green" },
  sales: { label: "مندوب", cls: "bg-bg-green-lt text-bg-green" },
};

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ar-KW", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default async function ActivityPage() {
  const role = await getCurrentRole();
  if (!role || !["manager", "admin"].includes(role)) {
    redirect("/settings?forbidden=activity");
  }

  const log = await getActivityLog(100);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-xl font-black text-bg-green flex items-center gap-2">
          <Clock className="size-6" />
          سجل النشاط
        </h1>
        <p className="text-xs text-bg-text-3 mt-1">
          جميع الإجراءات المسجّلة في النظام — من فعل ماذا ومتى
        </p>
      </header>

      <div className="card overflow-hidden">
        {log.length === 0 ? (
          <div className="p-10 text-center text-bg-text-3 text-sm">
            لا توجد أنشطة مسجّلة بعد
          </div>
        ) : (
          <div className="divide-y divide-bg-line">
            {log.map((entry) => {
              const icon = ACTION_ICONS[entry.action] || "📌";
              const roleBadge = ROLE_LABELS[entry.actor_role || "sales"];
              return (
                <div key={entry.id} className="px-4 py-3 flex items-start gap-3 hover:bg-bg-card-alt">
                  <div className="text-lg shrink-0 mt-0.5">{icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-bg-text-1">{entry.actor_name || "مستخدم"}</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${roleBadge.cls}`}>
                        {roleBadge.label}
                      </span>
                      <span className="text-xs text-bg-green font-bold">{entry.action}</span>
                    </div>
                    <div className="text-[10px] text-bg-text-3 mt-0.5">
                      {entry.entity_type === "quote" && "عرض سعر: "}
                      {entry.entity_type === "client" && "عميل: "}
                      {entry.entity_type === "user" && "مستخدم: "}
                      <span className="font-bold text-bg-text-2">{entry.entity_name || entry.entity_id || ""}</span>
                      {entry.details && Object.keys(entry.details).length > 0 && (
                        <span className="mr-2 text-bg-text-3">
                          {(entry.details as Record<string, string>).note && `— ${(entry.details as Record<string, string>).note}`}
                          {(entry.details as Record<string, string>).reason && `— ${(entry.details as Record<string, string>).reason}`}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-[10px] text-bg-text-3 tabular shrink-0">{fmtDate(entry.created_at)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
