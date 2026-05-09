"use client";

import { useState } from "react";
import { UserPlus, Loader2, Check } from "lucide-react";
import { createUserAccount } from "@/lib/actions/users";

export function InviteUserForm() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<"sales" | "manager" | "admin">("sales");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || password.length < 6 || !fullName) return;
    setError(null);
    setLoading(true);

    const result = await createUserAccount({ email, password, fullName, role });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setEmail("");
    setPassword("");
    setFullName("");
    setTimeout(() => {
      setSuccess(false);
      setOpen(false);
      window.location.reload();
    }, 2000);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="btn-primary inline-flex items-center gap-1.5"
      >
        <UserPlus className="size-4" />
        إضافة مستخدم جديد
      </button>
    );
  }

  return (
    <div className="card p-5 space-y-4 border-bg-green">
      <h3 className="text-sm font-black text-bg-green inline-flex items-center gap-2">
        <UserPlus className="size-4" />
        إضافة مستخدم جديد للفريق
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-bg-text-2">الاسم الكامل</label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input"
              placeholder="م. أسامة أحمد"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-bg-text-2">البريد الإلكتروني</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="osama@bg-tc.com"
              dir="ltr"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-bg-text-2">كلمة المرور</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="6 أحرف على الأقل"
              dir="ltr"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-bg-text-2">الدور والصلاحيات</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as typeof role)}
              className="input"
            >
              <option value="sales">💼 مندوب مبيعات — عروضه فقط</option>
              <option value="manager">📊 مدير — يرى كل عروض الفريق</option>
              <option value="admin">👔 مسؤول — كل الصلاحيات</option>
            </select>
          </div>
        </div>

        {/* Permission preview */}
        <div className="rounded-sm2 bg-bg-card-alt border border-bg-line p-3">
          <div className="text-[10px] font-black text-bg-text-3 uppercase tracking-wider mb-2">
            صلاحيات الدور المحدد
          </div>
          <PermissionPreview role={role} />
        </div>

        {error && (
          <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">
            {error}
          </div>
        )}

        {success && (
          <div className="text-xs text-bg-green bg-bg-green-lt border border-bg-green/20 rounded-sm2 px-3 py-2 inline-flex items-center gap-1">
            <Check className="size-3.5" /> تم إنشاء الحساب بنجاح!
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading || !email || password.length < 6}
            className="btn-primary inline-flex items-center gap-1.5 text-xs"
          >
            {loading ? (
              <><Loader2 className="size-3.5 animate-spin" /> جاري الإنشاء...</>
            ) : (
              <><UserPlus className="size-3.5" /> إنشاء الحساب</>
            )}
          </button>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); }}
            className="btn-outline text-xs"
          >
            إلغاء
          </button>
        </div>
      </form>
    </div>
  );
}

const PERMISSIONS = {
  sales: {
    quotes: { create: true, readOwn: true, readAll: false, edit: true, delete: false, generate: true },
    clients: { create: true, readOwn: true, readAll: false, edit: false, delete: false },
    templates: { use: true, create: false, edit: false, delete: false },
    users: { view: false, invite: false, changeRole: false, delete: false },
    dashboard: { viewOwn: true, viewAll: false },
    settings: { access: false },
  },
  manager: {
    quotes: { create: true, readOwn: true, readAll: true, edit: true, delete: false, generate: true },
    clients: { create: true, readOwn: true, readAll: true, edit: false, delete: false },
    templates: { use: true, create: true, edit: true, delete: false },
    users: { view: true, invite: false, changeRole: false, delete: false },
    dashboard: { viewOwn: true, viewAll: true },
    settings: { access: false },
  },
  admin: {
    quotes: { create: true, readOwn: true, readAll: true, edit: true, delete: true, generate: true },
    clients: { create: true, readOwn: true, readAll: true, edit: true, delete: true },
    templates: { use: true, create: true, edit: true, delete: true },
    users: { view: true, invite: true, changeRole: true, delete: true },
    dashboard: { viewOwn: true, viewAll: true },
    settings: { access: true },
  },
};

const PERM_LABELS: Record<string, Record<string, string>> = {
  quotes: {
    create: "إنشاء عرض سعر",
    readOwn: "عرض عروضه",
    readAll: "عرض كل العروض",
    edit: "تعديل العروض",
    delete: "حذف العروض",
    generate: "توليد HTML/PDF",
  },
  clients: {
    create: "إضافة عميل",
    readOwn: "عرض عملائه",
    readAll: "عرض كل العملاء",
    edit: "تعديل بيانات العميل",
    delete: "حذف العميل",
  },
  templates: {
    use: "استخدام القوالب",
    create: "إنشاء قالب",
    edit: "تعديل القوالب",
    delete: "حذف القوالب",
  },
  users: {
    view: "عرض المستخدمين",
    invite: "إضافة مستخدم",
    changeRole: "تغيير الأدوار",
    delete: "حذف مستخدم",
  },
  dashboard: {
    viewOwn: "لوحة تحكم شخصية",
    viewAll: "إحصائيات الفريق",
  },
  settings: {
    access: "الوصول للإعدادات",
  },
};

const SECTION_LABELS: Record<string, string> = {
  quotes: "📝 عروض الأسعار",
  clients: "👥 العملاء",
  templates: "✨ القوالب",
  users: "👔 المستخدمين",
  dashboard: "📊 لوحة التحكم",
  settings: "⚙️ الإعدادات",
};

function PermissionPreview({ role }: { role: "sales" | "manager" | "admin" }) {
  const perms = PERMISSIONS[role];

  return (
    <div className="space-y-2">
      {Object.entries(perms).map(([section, sPerms]) => (
        <div key={section}>
          <div className="text-[10px] font-bold text-bg-text-2 mb-1">
            {SECTION_LABELS[section] || section}
          </div>
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
                {allowed ? "✓" : "✕"} {PERM_LABELS[section]?.[key] || key}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
