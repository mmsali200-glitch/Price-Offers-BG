"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, ArrowLeft, ArrowRight, Check, Building,
  Sparkles, UserPlus, Users, Loader2,
} from "lucide-react";
import type { ClientOption } from "@/lib/actions/client-search";
import { createQuoteAndReturnId } from "@/lib/actions/create-quote";

type Step = 1 | 2 | 3;

const SECTORS = [
  ["trading", "تجارة وتوزيع"], ["manufacturing", "تصنيع وإنتاج"],
  ["services", "خدمات مهنية"], ["healthcare", "رعاية صحية"],
  ["construction", "مقاولات وتشييد"], ["realestate", "عقارات وأملاك"],
  ["logistics", "لوجستيات ونقل"], ["retail", "تجزئة ومتاجر"],
  ["food", "أغذية ومطاعم"], ["education", "تعليم وتدريب"],
  ["government", "جهة حكومية"], ["other", "أخرى"],
] as const;

const COUNTRIES = [
  "الكويت", "السعودية", "الإمارات", "قطر", "البحرين", "عمان", "مصر", "الأردن", "أخرى",
] as const;

const COUNTRY_CURRENCY: Record<string, string> = {
  "الكويت": "KWD", "السعودية": "SAR", "الإمارات": "AED",
  "قطر": "QAR", "البحرين": "BHD", "عمان": "OMR",
  "مصر": "EGP", "الأردن": "JOD", "أخرى": "USD",
};

export function QuoteWizard({ existingClients }: { existingClients: ClientOption[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<"select" | "new">(existingClients.length > 0 ? "select" : "new");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [sector, setSector] = useState("trading");
  const [country, setCountry] = useState("الكويت");
  const [city, setCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [businessActivity, setBusinessActivity] = useState("");
  const [quoteLanguage, setQuoteLanguage] = useState<"ar" | "en">("ar");
  const [validity, setValidity] = useState("30 يوم");

  const currency = COUNTRY_CURRENCY[country] || "KWD";
  const selectedClient = useMemo(() => existingClients.find((c) => c.id === selectedClientId), [existingClients, selectedClientId]);
  const filteredClients = useMemo(() => {
    if (!search.trim()) return existingClients;
    const q = search.toLowerCase();
    return existingClients.filter((c) => c.name_ar?.toLowerCase().includes(q) || c.name_en?.toLowerCase().includes(q) || c.contact_name?.toLowerCase().includes(q));
  }, [existingClients, search]);

  const canGoStep2 = mode === "select" ? !!selectedClientId : nameAr.trim().length > 0;
  const currentName = mode === "select" ? (selectedClient?.name_ar || "عميل") : nameAr;
  const currentCountry = mode === "select" ? (selectedClient?.country || "الكويت") : country;

  async function handleSubmit() {
    setIsPending(true);
    setSubmitError(null);
    const fd = new FormData();
    if (mode === "select" && selectedClientId) {
      fd.set("clientId", selectedClientId);
      fd.set("nameAr", selectedClient?.name_ar || "عميل");
    } else {
      fd.set("nameAr", nameAr); fd.set("nameEn", nameEn);
      fd.set("sector", sector); fd.set("country", country);
      fd.set("city", city); fd.set("contactName", contactName);
      fd.set("contactPhone", contactPhone); fd.set("contactEmail", contactEmail);
      fd.set("businessActivity", businessActivity);
    }
    fd.set("currency", currency); fd.set("quoteLanguage", quoteLanguage); fd.set("validity", validity);

    try {
      const result = await createQuoteAndReturnId(fd);
      if (result.ok) {
        router.push(`/quotes/${result.quoteId}/edit`);
      } else {
        setSubmitError(result.error);
        setIsPending(false);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "خطأ");
      setIsPending(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Steps */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {[{ n: 1, label: "العميل" }, { n: 2, label: "إعدادات العرض" }, { n: 3, label: "تأكيد وإنشاء" }].map((s, i) => (
          <div key={s.n} className="flex items-center gap-1.5">
            <div className={`size-8 rounded-full flex items-center justify-center text-xs font-black ${step >= s.n ? "bg-bg-green text-white" : "bg-bg-line text-bg-text-3"}`}>
              {step > s.n ? <Check className="size-3.5" /> : s.n}
            </div>
            <span className={`text-xs font-bold ${step >= s.n ? "text-bg-green" : "text-bg-text-3"}`}>{s.label}</span>
            {i < 2 && <div className={`w-6 h-0.5 ${step > s.n ? "bg-bg-green" : "bg-bg-line"}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <Link href="/templates" className="card p-3 flex items-center gap-3 card-hover block bg-gradient-to-br from-bg-gold-lt to-white border-bg-gold">
          <Sparkles className="size-5 text-bg-gold" /><div className="flex-1"><div className="text-xs font-black text-[#8a6010]">ابدأ من قالب جاهز — 8 قوالب</div></div><ArrowLeft className="size-4 text-bg-gold" />
        </Link>
      )}

      {/* ═══ STEP 1: Client ═══ */}
      {step === 1 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-bg-green flex items-center gap-2"><Building className="size-5" /> الخطوة 1: العميل</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => { setMode("select"); setSelectedClientId(null); }} className={`flex-1 rounded-sm2 border-2 px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 ${mode === "select" ? "border-bg-green bg-bg-green-lt text-bg-green" : "border-bg-line text-bg-text-3"}`}>
              <Users className="size-4" /> عميل موجود ({existingClients.length})
            </button>
            <button type="button" onClick={() => setMode("new")} className={`flex-1 rounded-sm2 border-2 px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 ${mode === "new" ? "border-bg-green bg-bg-green-lt text-bg-green" : "border-bg-line text-bg-text-3"}`}>
              <UserPlus className="size-4" /> عميل جديد
            </button>
          </div>

          {mode === "select" ? (
            <div className="space-y-3">
              <div className="relative"><Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" /><input type="search" value={search} onChange={(e) => setSearch(e.target.value)} className="input pr-10" placeholder="ابحث..." /></div>
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-6 text-sm text-bg-text-3">لا يوجد — <button type="button" onClick={() => setMode("new")} className="text-bg-green font-bold">أنشئ جديداً</button></div>
                ) : filteredClients.map((c) => (
                  <button key={c.id} type="button" onClick={() => setSelectedClientId(c.id)} className={`w-full text-right rounded-sm2 border-[1.5px] p-3 flex items-start gap-3 ${selectedClientId === c.id ? "border-bg-green bg-bg-green-lt" : "border-bg-line hover:border-bg-green-2"}`}>
                    <div className="size-9 rounded-lg bg-bg-green-lt text-bg-green flex items-center justify-center text-xs font-black shrink-0">{c.name_ar.slice(0, 2)}</div>
                    <div className="flex-1 min-w-0"><div className="text-sm font-bold truncate">{c.name_ar}</div><div className="text-[10px] text-bg-text-3">{c.contact_name && `📞 ${c.contact_name}`} {c.country && `📍 ${c.country}`}</div></div>
                    {selectedClientId === c.id && <div className="size-6 rounded-full bg-bg-green text-white flex items-center justify-center"><Check className="size-4" /></div>}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Fld label="اسم العميل (عربي)" required><input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="شركة النور" /></Fld>
                <Fld label="اسم العميل (إنجليزي)"><input className="input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Al-Noor Co." /></Fld>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Fld label="القطاع"><select className="input" value={sector} onChange={(e) => setSector(e.target.value)}>{SECTORS.map(([id, l]) => <option key={id} value={id}>{l}</option>)}</select></Fld>
                <Fld label="الدولة"><select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>{COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}</select></Fld>
                <Fld label="المدينة"><input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="الرياض" /></Fld>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Fld label="جهة الاتصال"><input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="أحمد" /></Fld>
                <Fld label="الهاتف"><input className="input tabular" dir="ltr" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+966" /></Fld>
                <Fld label="البريد"><input className="input" dir="ltr" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="a@co.com" /></Fld>
              </div>
            </div>
          )}
          <button type="button" onClick={() => canGoStep2 && setStep(2)} disabled={!canGoStep2} className="btn-primary w-full h-10 inline-flex items-center justify-center gap-2">التالي <ArrowLeft className="size-4" /></button>
        </div>
      )}

      {/* ═══ STEP 2: Settings ═══ */}
      {step === 2 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-bg-green">💼 الخطوة 2: إعدادات العرض</h2>
          <div className="rounded-sm2 bg-bg-green-lt border border-bg-green/20 p-3 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-bg-green text-white flex items-center justify-center text-sm font-black">{currentName.slice(0, 2)}</div>
            <div className="flex-1"><div className="text-sm font-bold text-bg-green">{currentName}</div><div className="text-[10px] text-bg-text-3">{currentCountry} · {currency}</div></div>
            <button type="button" onClick={() => setStep(1)} className="text-xs text-bg-green hover:underline">تغيير</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Fld label="العملة (تلقائي)"><div className="input bg-bg-card-alt cursor-not-allowed"><b className="text-bg-green">{currency}</b> ← {currentCountry}</div></Fld>
            <Fld label="لغة العرض"><select className="input" value={quoteLanguage} onChange={(e) => setQuoteLanguage(e.target.value as "ar"|"en")}><option value="ar">🇰🇼 العربية</option><option value="en">🇬🇧 English</option></select></Fld>
            <Fld label="الصلاحية"><select className="input" value={validity} onChange={(e) => setValidity(e.target.value)}><option>30 يوم</option><option>45 يوم</option><option>60 يوم</option></select></Fld>
          </div>
          <div className="bg-bg-gold-lt border border-bg-gold rounded-sm2 p-3 text-xs text-[#8a6010]">
            💡 الموديولات والأسعار والأسئلة ستُحدَّد داخل Builder — تقدر تكتفي بالسعر الأساسي أو تجاوب الأسئلة لتعديل السعر
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(1)} className="btn-outline flex-1 h-10 inline-flex items-center justify-center gap-2"><ArrowRight className="size-4" /> السابق</button>
            <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1 h-10 inline-flex items-center justify-center gap-2">التالي <ArrowLeft className="size-4" /></button>
          </div>
        </div>
      )}

      {/* ═══ STEP 3: Confirm ═══ */}
      {step === 3 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-bg-green">✅ الخطوة 3: تأكيد وإنشاء</h2>
          <div className="grid grid-cols-2 gap-3">
            <SI label="العميل" value={currentName} />
            <SI label="الدولة" value={currentCountry} />
            <SI label="العملة" value={currency} />
            <SI label="لغة العرض" value={quoteLanguage === "ar" ? "العربية" : "English"} />
          </div>
          <div className="bg-bg-green-lt border border-bg-green/20 rounded-sm2 p-3 text-xs text-bg-green">
            ✅ بعد الإنشاء ستنتقل لـ Builder حيث تختار الموديولات وتُحدد الأسعار وتجيب على أسئلة التعقيد
          </div>
          {submitError && <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">⚠️ {submitError}</div>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1 h-10 inline-flex items-center justify-center gap-2"><ArrowRight className="size-4" /> السابق</button>
            <button type="button" onClick={handleSubmit} disabled={isPending} className="btn-primary flex-1 h-11 inline-flex items-center justify-center gap-2 text-base">
              {isPending ? <><Loader2 className="size-4 animate-spin" /> جاري الإنشاء...</> : "🚀 إنشاء العرض وفتح Builder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Fld({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return <div className="space-y-1"><label className="text-xs font-bold text-bg-text-2">{label} {required && <span className="text-bg-danger">*</span>}</label>{children}</div>;
}
function SI({ label, value }: { label: string; value: string }) {
  return <div className="rounded-sm2 bg-bg-card-alt border border-bg-line p-3"><div className="text-[10px] font-bold text-bg-text-3 uppercase tracking-wider">{label}</div><div className="text-sm font-bold text-bg-text-1 mt-0.5">{value}</div></div>;
}
