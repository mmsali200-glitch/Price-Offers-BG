"use client";

import { useState } from "react";
import { Plus, Loader2, Check, Copy, X } from "lucide-react";
import { createSurvey } from "@/lib/actions/surveys";

export function CreateSurveyButton() {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ token: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");

  async function handleCreate() {
    setCreating(true);
    const r = await createSurvey({ companyName, contactName, contactEmail });
    setCreating(false);
    if (r.ok) {
      setResult({ token: r.token });
    }
  }

  function handleCopy() {
    const url = `${window.location.origin}/survey/${result?.token}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setOpen(false);
    setResult(null);
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    window.location.reload();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary inline-flex items-center gap-1.5">
        <Plus className="size-4" /> استبيان جديد
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-card p-6 max-w-md w-full space-y-4">
        {result ? (
          <>
            <div className="text-center">
              <div className="size-12 rounded-full bg-bg-green-lt text-bg-green flex items-center justify-center mx-auto mb-3">
                <Check className="size-6" />
              </div>
              <h3 className="text-base font-black text-bg-green">تم إنشاء الاستبيان</h3>
              <p className="text-xs text-bg-text-3 mt-2">انسخ الرابط وأرسله للعميل عبر البريد أو WhatsApp</p>
            </div>
            <div className="bg-bg-card-alt rounded-sm2 p-3 flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/survey/${result.token}`}
                className="flex-1 bg-transparent text-xs text-bg-text-1 outline-none" dir="ltr"
              />
              <button onClick={handleCopy} className={`shrink-0 px-3 py-1.5 rounded text-xs font-bold ${copied ? "bg-bg-green text-white" : "bg-bg-green-lt text-bg-green hover:bg-bg-green hover:text-white"}`}>
                {copied ? <><Check className="size-3 inline" /> تم</> : <><Copy className="size-3 inline" /> نسخ</>}
              </button>
            </div>
            <button onClick={handleClose} className="btn-outline w-full h-9 text-xs">إغلاق</button>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-bg-green">إنشاء استبيان جديد</h3>
              <button onClick={handleClose} className="text-bg-text-3 hover:text-bg-danger"><X className="size-4" /></button>
            </div>
            <p className="text-xs text-bg-text-3">اختياري — يمكنك ترك الحقول فارغة والعميل يملأها بنفسه.</p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-bg-text-2 block mb-1">اسم الشركة</label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="input" placeholder="مثال: شركة النور" />
              </div>
              <div>
                <label className="text-xs font-bold text-bg-text-2 block mb-1">جهة الاتصال</label>
                <input value={contactName} onChange={(e) => setContactName(e.target.value)}
                  className="input" placeholder="اسم الشخص المسؤول" />
              </div>
              <div>
                <label className="text-xs font-bold text-bg-text-2 block mb-1">البريد الإلكتروني</label>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  className="input" dir="ltr" placeholder="email@company.com" />
              </div>
            </div>
            <button onClick={handleCreate} disabled={creating}
              className="btn-primary w-full h-10 text-sm flex items-center justify-center gap-2">
              {creating ? <><Loader2 className="size-4 animate-spin" /> جاري الإنشاء...</> : <><Plus className="size-4" /> إنشاء ونسخ الرابط</>}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
