"use client";

import { useState, useTransition, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, AlertTriangle, Eye, Printer, Download, CheckCircle2, ArrowRight } from "lucide-react";
import { createContract, previewContract } from "@/lib/actions/contracts";
import type { ContractParty, ContractBank } from "@/lib/contract-defaults";

type Initial = {
  ref: string;
  contractDate: string;
  jurisdiction: string;
  pmName: string;
  pmPhone: string;
  pmEmail: string;
  provider: ContractParty;
  bank: ContractBank;
  clientSnapshot: {
    nameAr: string;
    crn: string;
    taxNumber: string;
    address: string;
    rep: string;
    email: string;
  };
};

function Field({
  label,
  value,
  onChange,
  placeholder,
  dir,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  dir?: "ltr" | "rtl";
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-bold text-bg-text-2 mb-1">
        {label}
        {required && <span className="text-bg-danger"> *</span>}
      </span>
      <input
        className="input w-full"
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

function Card({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div className="card p-5 space-y-3">
      <h2 className="text-sm font-bold text-bg-green flex items-center gap-2">
        <span className="text-base">{icon}</span>
        {title}
      </h2>
      {children}
    </div>
  );
}

export function ContractForm({ quoteId, initial }: { quoteId: string; initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [ref, setRef] = useState(initial.ref);
  const [contractDate, setContractDate] = useState(initial.contractDate);
  const [jurisdiction, setJurisdiction] = useState(initial.jurisdiction);

  const [pmName, setPmName] = useState(initial.pmName);
  const [pmPhone, setPmPhone] = useState(initial.pmPhone);
  const [pmEmail, setPmEmail] = useState(initial.pmEmail);

  const [client, setClient] = useState(initial.clientSnapshot);
  const [provider, setProvider] = useState(initial.provider);
  const [bank, setBank] = useState(initial.bank);

  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [savedRef, setSavedRef] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement | null>(null);

  function triggerDownload(html: string, fileRef: string) {
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `عقد_${fileRef || "draft"}.html`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  function buildExtras() {
    return {
      ref,
      contractDate,
      jurisdiction,
      pmName,
      pmPhone,
      pmEmail,
      provider,
      bank,
      client: {
        name: client.nameAr,
        cr: client.crn,
        vat: client.taxNumber,
        address: client.address,
        rep: client.rep,
        email: client.email,
      },
    };
  }

  function validate(): string | null {
    if (!client.nameAr || !client.crn || !pmName || !pmPhone) {
      return "الرجاء تعبئة بيانات العميل ومدير المشروع الأساسية.";
    }
    return null;
  }

  function preview() {
    setError(null);
    const v = validate();
    if (v) { setError(v); return; }
    startTransition(async () => {
      const res = await previewContract(quoteId, buildExtras());
      if (res.ok) {
        setPreviewHtml(res.html);
        setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
      } else {
        setError(res.error);
      }
    });
  }

  function submit() {
    setError(null);
    setSavedRef(null);
    const v = validate();
    if (v) { setError(v); return; }
    startTransition(async () => {
      const res = await createContract(quoteId, buildExtras());
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Successful save: only the contract REF is persisted on the quote.
      // Trigger an automatic HTML download so the user has the final file,
      // surface a success banner with the saved reference, and stop here
      // (we intentionally don't navigate away — they can re-preview / edit
      // and download fresh copies as needed).
      setSavedRef(res.ref);
      setPreviewHtml(res.html);
      triggerDownload(res.html, res.ref);
      setTimeout(() => previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    });
  }

  function downloadPreview() {
    if (!previewHtml) return;
    triggerDownload(previewHtml, ref);
  }

  function printPreview() {
    if (!previewHtml) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.open();
    win.document.write(previewHtml);
    win.document.close();
    win.focus();
    setTimeout(() => win.print(), 300);
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-card border border-bg-danger bg-bg-danger/10 text-bg-danger p-3 text-sm flex items-start gap-2">
          <AlertTriangle className="size-4 mt-0.5 flex-shrink-0" />
          <span className="flex-1">{error}</span>
        </div>
      )}

      {savedRef && (
        <div className="rounded-card border-2 border-emerald-300 bg-emerald-50 text-emerald-900 p-4 flex items-start gap-3">
          <CheckCircle2 className="size-5 mt-0.5 text-emerald-600 flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="font-bold">
              تم حفظ رقم العقد <span className="font-mono bg-emerald-100 px-2 py-0.5 rounded">{savedRef}</span> على هذا العرض.
            </div>
            <div className="text-xs text-emerald-700">
              تم تحميل ملف العقد تلقائياً. لا يُحفظ من العقد سوى رقمه — يُعاد توليد المحتوى من بيانات العميل والعرض في كل مرة.
            </div>
            <div className="flex gap-2 pt-1">
              {previewHtml && (
                <button
                  type="button"
                  onClick={() => previewHtml && triggerDownload(previewHtml, savedRef)}
                  className="btn-outline h-8 text-xs inline-flex items-center gap-1.5 border-emerald-400 text-emerald-700 hover:bg-emerald-100"
                >
                  <Download className="size-3.5" />
                  تحميل مرة أخرى
                </button>
              )}
              <Link
                href={`/quotes/${quoteId}/preview`}
                className="btn-outline h-8 text-xs inline-flex items-center gap-1.5 border-emerald-400 text-emerald-700 hover:bg-emerald-100"
              >
                <ArrowRight className="size-3.5" />
                العودة إلى معاينة العرض
              </Link>
            </div>
          </div>
        </div>
      )}

      <Card title="بيانات العقد" icon="📋">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="رقم العقد" value={ref} onChange={setRef} placeholder="CT-BG-2026-001" />
          <label className="block">
            <span className="block text-xs font-bold text-bg-text-2 mb-1">تاريخ العقد</span>
            <input
              type="date"
              className="input w-full"
              value={contractDate}
              onChange={(e) => setContractDate(e.target.value)}
            />
          </label>
          <Field label="مدينة الاختصاص القضائي" value={jurisdiction} onChange={setJurisdiction} placeholder="الرياض" />
        </div>
      </Card>

      <Card title="بيانات الطرف الثاني — العميل" icon="🏢">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الاسم التجاري" value={client.nameAr} onChange={(v) => setClient({ ...client, nameAr: v })} required />
          <Field label="السجل التجاري" value={client.crn} onChange={(v) => setClient({ ...client, crn: v })} dir="ltr" required />
          <Field label="الرقم الضريبي" value={client.taxNumber} onChange={(v) => setClient({ ...client, taxNumber: v })} dir="ltr" />
          <Field label="الممثل القانوني" value={client.rep} onChange={(v) => setClient({ ...client, rep: v })} placeholder="الاسم — الصفة" />
          <Field label="البريد الإلكتروني" value={client.email} onChange={(v) => setClient({ ...client, email: v })} dir="ltr" />
          <Field label="العنوان" value={client.address} onChange={(v) => setClient({ ...client, address: v })} />
        </div>
      </Card>

      <Card title="مدير المشروع لدى العميل" icon="👤">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="الاسم" value={pmName} onChange={setPmName} required />
          <Field label="الجوال" value={pmPhone} onChange={setPmPhone} dir="ltr" placeholder="+9665..." required />
          <Field label="البريد الإلكتروني" value={pmEmail} onChange={setPmEmail} dir="ltr" />
        </div>
      </Card>

      <Card title="الطرف الأول — مزوّد الخدمة (افتراضي)" icon="🏛️">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="الاسم التجاري" value={provider.name} onChange={(v) => setProvider({ ...provider, name: v })} />
          <Field label="السجل التجاري" value={provider.cr} onChange={(v) => setProvider({ ...provider, cr: v })} dir="ltr" />
          <Field label="الرقم الضريبي" value={provider.vat} onChange={(v) => setProvider({ ...provider, vat: v })} dir="ltr" />
          <Field label="البريد" value={provider.email} onChange={(v) => setProvider({ ...provider, email: v })} dir="ltr" />
          <Field label="الممثل القانوني" value={provider.rep} onChange={(v) => setProvider({ ...provider, rep: v })} />
          <Field label="العنوان" value={provider.address} onChange={(v) => setProvider({ ...provider, address: v })} />
        </div>
      </Card>

      <Card title="الحساب البنكي" icon="🏦">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="اسم المستفيد" value={bank.beneficiary} onChange={(v) => setBank({ ...bank, beneficiary: v })} />
          <Field label="البنك / الفرع" value={bank.name} onChange={(v) => setBank({ ...bank, name: v })} />
          <Field label="رقم الحساب" value={bank.account} onChange={(v) => setBank({ ...bank, account: v })} dir="ltr" />
          <Field label="الآيبان (IBAN)" value={bank.iban} onChange={(v) => setBank({ ...bank, iban: v })} dir="ltr" />
        </div>
      </Card>

      <div className="flex items-center gap-3 justify-end">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-outline h-10"
          disabled={pending}
        >
          إلغاء
        </button>
        <button
          type="button"
          onClick={preview}
          disabled={pending}
          className="btn-outline h-10 inline-flex items-center gap-2"
          title="عرض العقد بشكله النهائي قبل الحفظ"
        >
          <Eye className="size-4" />
          {pending && !previewHtml ? "جاري التوليد..." : "معاينة العقد"}
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="btn-primary h-10 inline-flex items-center gap-2"
          title="حفظ العقد نهائياً في قاعدة البيانات"
        >
          <FileText className="size-4" />
          {pending ? "جاري الحفظ..." : previewHtml ? "حفظ نهائي" : "إنشاء العقد"}
        </button>
      </div>

      {previewHtml && (
        <div ref={previewRef} className="card p-0 overflow-hidden border-2 border-bg-green/30">
          <div className="bg-bg-green text-white px-4 py-2.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Eye className="size-4 text-bg-gold" />
              <strong className="text-sm">معاينة العقد قبل الحفظ</strong>
              <span className="text-[10px] bg-white/15 px-2 py-0.5 rounded-full">غير محفوظ بعد</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={printPreview}
                className="bg-white/10 hover:bg-white/20 text-white text-xs h-7 px-2.5 rounded inline-flex items-center gap-1"
              >
                <Printer className="size-3.5" />
                طباعة
              </button>
              <button
                type="button"
                onClick={downloadPreview}
                className="bg-white/10 hover:bg-white/20 text-white text-xs h-7 px-2.5 rounded inline-flex items-center gap-1"
              >
                <Download className="size-3.5" />
                HTML
              </button>
              <button
                type="button"
                onClick={() => setPreviewHtml(null)}
                className="bg-white/10 hover:bg-white/20 text-white text-xs h-7 px-2.5 rounded"
              >
                إغلاق
              </button>
            </div>
          </div>
          <iframe
            srcDoc={previewHtml}
            sandbox="allow-same-origin allow-scripts allow-modals allow-popups"
            className="w-full bg-white"
            style={{ height: "75vh", border: 0 }}
            title="معاينة العقد"
          />
          <div className="bg-bg-card-alt px-4 py-3 border-t border-bg-line text-[12px] text-bg-text-2 flex flex-wrap items-center justify-between gap-2">
            <span>راجع المحتوى ثم اضغط <strong className="text-bg-green">«حفظ نهائي»</strong> أعلاه — أو عدّل البيانات وأعد المعاينة.</span>
            <button
              type="button"
              onClick={submit}
              disabled={pending}
              className="btn-primary h-8 text-xs inline-flex items-center gap-1.5"
            >
              <FileText className="size-3.5" />
              {pending ? "جاري الحفظ..." : "حفظ نهائي"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
