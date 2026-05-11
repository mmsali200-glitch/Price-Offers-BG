"use client";

import { useState, useTransition } from "react";
import { KeyRound, UserPlus, Loader2, Check, Save, Trash2 } from "lucide-react";
import {
  createClientUser, updateClientUserAccess, resetClientUserPassword,
  deleteClientUser,
  type ClientAccessLevel, type ClientUserInfo,
} from "@/lib/actions/client-users";

type Props = {
  clientId: string;
  clientName: string;
  defaultEmail: string | null;
  defaultContactName: string | null;
  current: ClientUserInfo | null;
};

const LEVEL_LABEL: Record<ClientAccessLevel, string> = {
  none: "بدون صلاحية",
  survey: "استبيان فقط",
  quote: "عرض سعر فقط",
  both: "استبيان + عرض",
};

export function ClientAccountCard({ clientId, clientName, defaultEmail, defaultContactName, current }: Props) {
  return current
    ? <ExistingAccount clientId={clientId} info={current} />
    : <CreateAccount
        clientId={clientId}
        clientName={clientName}
        defaultEmail={defaultEmail ?? ""}
        defaultContactName={defaultContactName ?? clientName}
      />;
}

function CreateAccount({ clientId, clientName, defaultEmail, defaultContactName }: {
  clientId: string;
  clientName: string;
  defaultEmail: string;
  defaultContactName: string;
}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState(defaultEmail);
  const [fullName, setFullName] = useState(defaultContactName);
  const [password, setPassword] = useState("");
  const [accessLevel, setAccessLevel] = useState<ClientAccessLevel>("survey");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();

  function submit() {
    setError(null);
    start(async () => {
      const r = await createClientUser({
        clientId, email: email.trim(), password, fullName: fullName.trim() || clientName, accessLevel,
      });
      if (r.ok) { setSaved(true); setPassword(""); }
      else setError(r.error);
    });
  }

  if (!open) {
    return (
      <div className="card p-4 flex items-center justify-between border-dashed">
        <div>
          <div className="text-sm font-bold text-bg-text-1 flex items-center gap-2">
            <UserPlus className="size-4 text-bg-green" /> حساب دخول للعميل
          </div>
          <div className="text-xs text-bg-text-3 mt-1">ينشئ حساب login للعميل بصلاحية استبيان أو عرض سعر</div>
        </div>
        <button onClick={() => setOpen(true)} className="btn-primary text-xs">إنشاء حساب</button>
      </div>
    );
  }

  return (
    <div className="card p-5 space-y-4 border-bg-green/40">
      <div className="flex items-center gap-2">
        <UserPlus className="size-4 text-bg-green" />
        <h3 className="text-sm font-black text-bg-green">إنشاء حساب دخول</h3>
      </div>

      {saved ? (
        <div className="bg-bg-green-lt rounded-sm2 px-3 py-3 text-xs text-bg-green flex items-center gap-2">
          <Check className="size-4" /> تم إنشاء الحساب بنجاح. يمكن للعميل الدخول الآن من /login
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label="البريد الإلكتروني *">
              <input dir="ltr" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="input" placeholder="client@company.com" />
            </Field>
            <Field label="الاسم الكامل">
              <input value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="input" />
            </Field>
            <Field label="كلمة المرور (8+) *">
              <input dir="ltr" type="text" value={password} onChange={(e) => setPassword(e.target.value)}
                className="input font-mono" placeholder="********" />
            </Field>
            <Field label="الصلاحية الأولية">
              <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as ClientAccessLevel)}
                className="input">
                <option value="survey">استبيان فقط</option>
                <option value="quote">عرض سعر فقط</option>
                <option value="both">استبيان + عرض</option>
                <option value="none">بدون صلاحية (مغلق)</option>
              </select>
            </Field>
          </div>

          {error && <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{error}</div>}

          <div className="flex items-center gap-2 justify-end">
            <button onClick={() => setOpen(false)} className="btn-outline text-xs h-9 px-4">إلغاء</button>
            <button onClick={submit} disabled={pending || password.length < 8 || !email.includes("@")}
              className="btn-primary text-xs h-9 px-4 inline-flex items-center gap-1.5">
              {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              {pending ? "جاري الإنشاء..." : "إنشاء الحساب"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function ExistingAccount({ clientId, info }: { clientId: string; info: ClientUserInfo }) {
  const [accessLevel, setAccessLevel] = useState<ClientAccessLevel>(info.accessLevel);
  const [newPwd, setNewPwd] = useState("");
  const [showPwdField, setShowPwdField] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [pending, start] = useTransition();

  function saveLevel() {
    setMsg(null);
    start(async () => {
      const r = await updateClientUserAccess({ clientId, accessLevel });
      setMsg(r.ok ? { type: "ok", text: "تم تحديث الصلاحية" } : { type: "err", text: r.error });
    });
  }

  function resetPwd() {
    if (!info.authUserId) return;
    setMsg(null);
    start(async () => {
      const r = await resetClientUserPassword({ authUserId: info.authUserId!, clientId, newPassword: newPwd });
      if (r.ok) {
        setMsg({ type: "ok", text: "تم تغيير كلمة المرور" });
        setNewPwd(""); setShowPwdField(false);
      } else setMsg({ type: "err", text: r.error });
    });
  }

  function removeAccount() {
    if (!info.authUserId) return;
    if (!confirm("سيتم حذف حساب العميل نهائياً. هل أنت متأكد؟")) return;
    start(async () => {
      const r = await deleteClientUser({ authUserId: info.authUserId!, clientId });
      setMsg(r.ok ? { type: "ok", text: "تم حذف الحساب" } : { type: "err", text: r.error });
    });
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-sm font-black text-bg-green flex items-center gap-2">
            <KeyRound className="size-4" /> حساب الدخول
          </h3>
          <div className="text-xs text-bg-text-2 mt-2" dir="ltr">{info.email}</div>
          <div className="text-[10px] text-bg-text-3 mt-1">
            الصلاحية الحالية: <span className="font-bold">{LEVEL_LABEL[info.accessLevel]}</span>
          </div>
        </div>
        <button onClick={removeAccount} disabled={pending}
          className="text-xs text-bg-danger hover:underline inline-flex items-center gap-1">
          <Trash2 className="size-3" /> حذف الحساب
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-bg-line">
        <Field label="تغيير الصلاحية">
          <div className="flex gap-2">
            <select value={accessLevel} onChange={(e) => setAccessLevel(e.target.value as ClientAccessLevel)}
              className="input flex-1">
              <option value="survey">استبيان فقط</option>
              <option value="quote">عرض سعر فقط</option>
              <option value="both">استبيان + عرض</option>
              <option value="none">بدون صلاحية</option>
            </select>
            <button onClick={saveLevel} disabled={pending || accessLevel === info.accessLevel}
              className="btn-primary px-3 text-xs">حفظ</button>
          </div>
        </Field>

        <Field label="كلمة المرور">
          {!showPwdField ? (
            <button onClick={() => setShowPwdField(true)} className="btn-outline text-xs h-9">
              إعادة تعيين كلمة المرور
            </button>
          ) : (
            <div className="flex gap-2">
              <input dir="ltr" type="text" value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                placeholder="كلمة مرور جديدة (8+)" className="input flex-1 font-mono" />
              <button onClick={resetPwd} disabled={pending || newPwd.length < 8}
                className="btn-primary px-3 text-xs">حفظ</button>
            </div>
          )}
        </Field>
      </div>

      {msg && (
        <div className={`text-xs px-3 py-2 rounded-sm2 ${
          msg.type === "ok" ? "bg-bg-green-lt text-bg-green" : "bg-red-50 text-bg-danger border border-red-200"
        }`}>{msg.text}</div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-bold text-bg-text-3 block mb-1">{label}</label>
      {children}
    </div>
  );
}
