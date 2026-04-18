import Link from "next/link";
import { Users, Settings as SettingsIcon, Shield, DollarSign } from "lucide-react";
import { getCurrentRole } from "@/lib/actions/users";

export const metadata = { title: "الإعدادات · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const role = await getCurrentRole();
  const isAdmin = role === "admin";

  return (
    <div className="page-padding space-y-4 sm:space-y-6 max-w-4xl">
      <header>
        <h1 className="text-2xl font-black text-bg-green inline-flex items-center gap-2">
          <SettingsIcon className="size-6" />
          الإعدادات
        </h1>
        <p className="text-sm text-bg-text-3 mt-1">
          إدارة حسابك وصلاحيات الفريق.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/settings/pricing"
          className={`card p-5 card-hover block ${!isAdmin && "opacity-50 pointer-events-none"}`}
        >
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-bg-gold-lt text-bg-gold flex items-center justify-center">
              <DollarSign className="size-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-bg-green">جدول التسعير</h2>
              <p className="text-xs text-bg-text-3 mt-1 leading-relaxed">
                أسعار الموديولات، معاملات الدول، باقات الدعم — كلها قابلة للتعديل.
              </p>
              {!isAdmin && (
                <p className="text-[10px] text-bg-danger mt-2 inline-flex items-center gap-1">
                  <Shield className="size-3" /> متاح للمسؤولين فقط
                </p>
              )}
            </div>
          </div>
        </Link>
        <Link
          href="/settings/users"
          className={`card p-5 card-hover block ${!isAdmin && "opacity-50 pointer-events-none"}`}
        >
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-xl bg-bg-green-lt text-bg-green flex items-center justify-center">
              <Users className="size-5" />
            </div>
            <div className="flex-1">
              <h2 className="text-sm font-black text-bg-green">المستخدمون والصلاحيات</h2>
              <p className="text-xs text-bg-text-3 mt-1 leading-relaxed">
                إدارة أعضاء الفريق وتعيين أدوارهم: مندوب مبيعات، مدير، أو مسؤول.
              </p>
              {!isAdmin && (
                <p className="text-[10px] text-bg-danger mt-2 inline-flex items-center gap-1">
                  <Shield className="size-3" />
                  متاح للمسؤولين فقط
                </p>
              )}
            </div>
          </div>
        </Link>
      </div>

      <div className="card p-5 space-y-2">
        <h3 className="text-sm font-black text-bg-green">دورك الحالي</h3>
        <div className="flex items-center gap-2">
          <RoleBadge role={role ?? "sales"} />
          <span className="text-xs text-bg-text-3">
            {role === "admin"
              ? "لديك كل الصلاحيات"
              : role === "manager"
              ? "ترى كل العروض ولا تستطيع إدارة المستخدمين"
              : "ترى عروضك فقط"}
          </span>
        </div>
      </div>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    admin:   { label: "مسؤول",       cls: "bg-bg-green text-white" },
    manager: { label: "مدير",         cls: "bg-bg-gold text-bg-green" },
    sales:   { label: "مندوب مبيعات", cls: "bg-bg-green-lt text-bg-green" },
  };
  const b = map[role] ?? map.sales;
  return (
    <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${b.cls}`}>
      {b.label}
    </span>
  );
}
