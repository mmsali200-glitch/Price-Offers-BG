"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2, X, Check } from "lucide-react";
import { updateClientAction, deleteClientAction } from "@/lib/actions/admin";

export function EditClientButton({
  clientId,
  current,
}: {
  clientId: string;
  current: Record<string, string | null>;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [fields, setFields] = useState(current);
  const set = (k: string, v: string) => setFields((f) => ({ ...f, [k]: v }));

  async function handleSave() {
    setError(null);
    startTransition(async () => {
      const clean: Record<string, string | null> = {};
      Object.entries(fields).forEach(([k, v]) => { clean[k] = v?.trim() || null; });
      const r = await updateClientAction(clientId, clean);
      if (!r.ok) { setError(r.error); return; }
      setOpen(false);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline inline-flex items-center gap-1.5 text-xs h-8">
        <Pencil className="size-3.5" /> تعديل بيانات العميل
      </button>
    );
  }

  return (
    <div className="card p-4 space-y-3 border-bg-green">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-bg-green">تعديل بيانات العميل</h3>
        <button onClick={() => setOpen(false)} className="text-bg-text-3 hover:text-bg-danger"><X className="size-4" /></button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {[
          ["name_ar", "الاسم (عربي)"], ["name_en", "الاسم (إنجليزي)"],
          ["sector", "القطاع"], ["country", "الدولة"],
          ["city", "المدينة"], ["contact_name", "جهة الاتصال"],
          ["contact_phone", "الهاتف"], ["contact_email", "البريد"],
          ["business_activity", "النشاط"], ["website", "الموقع"],
        ].map(([key, label]) => (
          <div key={key} className="space-y-0.5">
            <label className="text-[10px] font-bold text-bg-text-3">{label}</label>
            <input
              className="input text-xs"
              value={fields[key] ?? ""}
              onChange={(e) => set(key, e.target.value)}
              dir={key === "name_en" || key === "contact_email" || key === "website" ? "ltr" : undefined}
            />
          </div>
        ))}
      </div>
      {error && <div className="text-xs text-bg-danger">{error}</div>}
      <div className="flex gap-2">
        <button onClick={handleSave} disabled={isPending} className="btn-primary inline-flex items-center gap-1 text-xs h-8">
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
          حفظ التعديلات
        </button>
        <button onClick={() => setOpen(false)} className="btn-outline text-xs h-8">إلغاء</button>
      </div>
    </div>
  );
}

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setError(null);
    startTransition(async () => {
      const r = await deleteClientAction(clientId);
      if (!r.ok) { setError(r.error); return; }
      router.push("/clients");
      router.refresh();
    });
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} className="btn-outline inline-flex items-center gap-1.5 text-xs h-8 text-bg-danger border-bg-danger hover:bg-red-50">
        <Trash2 className="size-3.5" /> حذف العميل
      </button>
    );
  }

  return (
    <div className="rounded-sm2 bg-red-50 border border-bg-danger p-3 space-y-2">
      <p className="text-xs text-bg-danger font-bold">
        ⚠️ هل تريد حذف &quot;{clientName}&quot; وجميع عروضه نهائياً؟
      </p>
      <p className="text-[10px] text-bg-text-3">
        سيتم حذف العميل + جميع عروض الأسعار المرتبطة به. لا يمكن التراجع.
      </p>
      {error && <div className="text-xs text-bg-danger">{error}</div>}
      <div className="flex gap-2">
        <button onClick={handleDelete} disabled={isPending} className="bg-bg-danger text-white px-3 py-1.5 rounded-sm2 text-xs font-bold inline-flex items-center gap-1">
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
          نعم، احذف نهائياً
        </button>
        <button onClick={() => setConfirm(false)} className="btn-outline text-xs">إلغاء</button>
      </div>
    </div>
  );
}

export function DeleteQuoteButton({ quoteId, quoteRef }: { quoteId: string; quoteRef: string }) {
  const [confirm, setConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleDelete() {
    setError(null);
    const { deleteQuoteAction } = await import("@/lib/actions/admin");
    startTransition(async () => {
      const r = await deleteQuoteAction(quoteId);
      if (!r.ok) { setError(r.error); return; }
      router.refresh();
    });
  }

  if (!confirm) {
    return (
      <button onClick={() => setConfirm(true)} title="حذف" className="text-bg-text-3 hover:text-bg-danger p-1 rounded">
        <Trash2 className="size-3.5" />
      </button>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] text-bg-danger">حذف {quoteRef}؟</span>
      <button onClick={handleDelete} disabled={isPending} className="text-[10px] bg-bg-danger text-white px-2 py-0.5 rounded font-bold">
        {isPending ? "..." : "نعم"}
      </button>
      <button onClick={() => setConfirm(false)} className="text-[10px] text-bg-text-3">لا</button>
      {error && <span className="text-[10px] text-bg-danger">{error}</span>}
    </div>
  );
}
