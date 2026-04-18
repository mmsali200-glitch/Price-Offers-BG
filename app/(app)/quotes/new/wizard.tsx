"use client";

import { useState, useMemo, useTransition } from "react";
import Link from "next/link";
import {
  Search, Plus, ArrowLeft, ArrowRight, Check, Building,
  Phone, MapPin, Sparkles, UserPlus, Users,
} from "lucide-react";
import type { ClientOption } from "@/lib/actions/client-search";
import { createQuote } from "@/lib/actions/quotes";
import { NeedsAssessment } from "./needs-assessment";

type Step = 1 | 2 | 3 | 4;

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

export function QuoteWizard({ existingClients }: { existingClients: ClientOption[] }) {
  const [step, setStep] = useState<Step>(1);
  const [mode, setMode] = useState<"select" | "new">(existingClients.length > 0 ? "select" : "new");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Client form fields
  const [nameAr, setNameAr] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [sector, setSector] = useState("trading");
  const [country, setCountry] = useState("الكويت");
  const [city, setCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [businessActivity, setBusinessActivity] = useState("");

  // Quote settings
  const [quoteLanguage, setQuoteLanguage] = useState<"ar" | "en">("ar");
  const [validity, setValidity] = useState("30 يوم");

  // Currency auto-set from country
  const COUNTRY_CURRENCY: Record<string, string> = {
    "الكويت": "KWD", "السعودية": "SAR", "الإمارات": "AED",
    "قطر": "QAR", "البحرين": "BHD", "عمان": "OMR",
    "مصر": "EGP", "الأردن": "JOD", "أخرى": "USD",
  };
  const currency = COUNTRY_CURRENCY[country] || "KWD";

  // Assessment results (step 2)
  const [assessmentData, setAssessmentData] = useState<{
    selectedModules: string[];
    answers: Record<string, Record<string, string | boolean>>;
    prices: Record<string, number>;
  } | null>(null);

  const selectedClient = useMemo(
    () => existingClients.find((c) => c.id === selectedClientId),
    [existingClients, selectedClientId]
  );

  const filteredClients = useMemo(() => {
    if (!search.trim()) return existingClients;
    const q = search.toLowerCase();
    return existingClients.filter(
      (c) =>
        c.name_ar?.toLowerCase().includes(q) ||
        c.name_en?.toLowerCase().includes(q) ||
        c.contact_name?.toLowerCase().includes(q)
    );
  }, [existingClients, search]);

  const canGoStep2 = mode === "select" ? !!selectedClientId : nameAr.trim().length > 0;
  const currentSector = mode === "select" ? (selectedClient?.sector || "other") : sector;
  const currentCountry = mode === "select" ? (selectedClient?.country || "الكويت") : country;
  const currentName = mode === "select" ? (selectedClient?.name_ar || "عميل") : nameAr;

  function handleSubmit() {
    const formData = new FormData();
    if (mode === "select" && selectedClientId) {
      formData.set("clientId", selectedClientId);
      formData.set("nameAr", selectedClient?.name_ar || "عميل");
    } else {
      formData.set("nameAr", nameAr);
      formData.set("nameEn", nameEn);
      formData.set("sector", sector);
      formData.set("country", country);
      formData.set("city", city);
      formData.set("contactName", contactName);
      formData.set("contactPhone", contactPhone);
      formData.set("contactEmail", contactEmail);
      formData.set("businessActivity", businessActivity);
    }
    formData.set("currency", currency);
    formData.set("quoteLanguage", quoteLanguage);
    formData.set("validity", validity);

    // Pass assessment data as simple module list (avoid complex JSON that breaks SSR)
    if (assessmentData) {
      formData.set("assessmentModulesList", assessmentData.selectedModules.join(","));
    }

    setSubmitError(null);
    startTransition(async () => {
      try {
        await createQuote(formData);
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "فشل إنشاء العرض");
      }
    });
  }

  return (
    <div className="max-w-3xl mx-auto p-3 sm:p-6 space-y-5">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-2 flex-wrap">
        {[
          { n: 1, label: "العميل" },
          { n: 2, label: "تقييم الاحتياج" },
          { n: 3, label: "إعدادات العرض" },
          { n: 4, label: "تأكيد وإنشاء" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-1.5">
            <div
              className={`size-7 sm:size-8 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black ${
                step >= s.n ? "bg-bg-green text-white" : "bg-bg-line text-bg-text-3"
              }`}
            >
              {step > s.n ? <Check className="size-3.5" /> : s.n}
            </div>
            <span className={`text-[10px] sm:text-xs font-bold ${step >= s.n ? "text-bg-green" : "text-bg-text-3"}`}>
              {s.label}
            </span>
            {i < 3 && <div className={`w-4 sm:w-6 h-0.5 ${step > s.n ? "bg-bg-green" : "bg-bg-line"}`} />}
          </div>
        ))}
      </div>

      {/* Template shortcut */}
      {step === 1 && (
        <Link
          href="/templates"
          className="card p-3 flex items-center gap-3 card-hover block bg-gradient-to-br from-bg-gold-lt to-white border-bg-gold"
        >
          <Sparkles className="size-5 text-bg-gold" />
          <div className="flex-1">
            <div className="text-xs font-black text-[#8a6010]">ابدأ من قالب جاهز — 8 قوالب</div>
          </div>
          <ArrowLeft className="size-4 text-bg-gold" />
        </Link>
      )}

      {/* ═══ STEP 1: Select or Create Client ═══ */}
      {step === 1 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-bg-green flex items-center gap-2">
            <Building className="size-5" />
            الخطوة 1: اختر العميل
          </h2>

          <div className="flex gap-2">
            <button type="button" onClick={() => { setMode("select"); setSelectedClientId(null); }}
              className={`flex-1 rounded-sm2 border-2 px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 ${
                mode === "select" ? "border-bg-green bg-bg-green-lt text-bg-green" : "border-bg-line text-bg-text-3"
              }`}>
              <Users className="size-4" /> عميل موجود ({existingClients.length})
            </button>
            <button type="button" onClick={() => setMode("new")}
              className={`flex-1 rounded-sm2 border-2 px-3 py-2 text-xs font-bold flex items-center justify-center gap-2 ${
                mode === "new" ? "border-bg-green bg-bg-green-lt text-bg-green" : "border-bg-line text-bg-text-3"
              }`}>
              <UserPlus className="size-4" /> عميل جديد
            </button>
          </div>

          {mode === "select" ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
                <input type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                  className="input pr-10" placeholder="ابحث بالاسم أو جهة الاتصال..." />
              </div>
              <div className="max-h-[300px] overflow-y-auto space-y-1.5">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-6 text-sm text-bg-text-3">
                    لا يوجد عملاء —{" "}
                    <button type="button" onClick={() => setMode("new")} className="text-bg-green font-bold">أنشئ جديداً</button>
                  </div>
                ) : filteredClients.map((c) => (
                  <button key={c.id} type="button" onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-right rounded-sm2 border-[1.5px] p-3 flex items-start gap-3 transition-colors ${
                      selectedClientId === c.id ? "border-bg-green bg-bg-green-lt" : "border-bg-line hover:border-bg-green-2"
                    }`}>
                    <div className="size-9 rounded-lg bg-bg-green-lt text-bg-green flex items-center justify-center text-xs font-black shrink-0">
                      {c.name_ar.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-bg-text-1 truncate">{c.name_ar}</div>
                      <div className="text-[10px] text-bg-text-3 mt-0.5 flex items-center gap-2 flex-wrap">
                        {c.contact_name && <span>📞 {c.contact_name}</span>}
                        {c.country && <span>📍 {c.country}</span>}
                      </div>
                    </div>
                    {selectedClientId === c.id && (
                      <div className="size-6 rounded-full bg-bg-green text-white flex items-center justify-center shrink-0">
                        <Check className="size-4" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Fld label="اسم العميل (عربي)" required>
                  <input className="input" value={nameAr} onChange={(e) => setNameAr(e.target.value)} placeholder="شركة النور" />
                </Fld>
                <Fld label="اسم العميل (إنجليزي)">
                  <input className="input" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="Al-Noor Co." />
                </Fld>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Fld label="القطاع">
                  <select className="input" value={sector} onChange={(e) => setSector(e.target.value)}>
                    {SECTORS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </Fld>
                <Fld label="الدولة">
                  <select className="input" value={country} onChange={(e) => setCountry(e.target.value)}>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </Fld>
                <Fld label="المدينة">
                  <input className="input" value={city} onChange={(e) => setCity(e.target.value)} placeholder="السالمية" />
                </Fld>
              </div>
              <Fld label="النشاط">
                <input className="input" value={businessActivity} onChange={(e) => setBusinessActivity(e.target.value)} placeholder="توزيع مواد غذائية..." />
              </Fld>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Fld label="جهة الاتصال">
                  <input className="input" value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="أحمد" />
                </Fld>
                <Fld label="الهاتف">
                  <input className="input tabular" dir="ltr" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="+965" />
                </Fld>
                <Fld label="البريد">
                  <input className="input" dir="ltr" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="email@co.com" />
                </Fld>
              </div>
            </div>
          )}

          <button type="button" onClick={() => canGoStep2 && setStep(2)} disabled={!canGoStep2}
            className="btn-primary w-full inline-flex items-center justify-center gap-2 h-10">
            التالي: تقييم الاحتياج <ArrowLeft className="size-4" />
          </button>
        </div>
      )}

      {/* ═══ STEP 2: Needs Assessment ═══ */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-lg font-black text-bg-green flex items-center gap-2">
            📋 الخطوة 2: تقييم الاحتياج — {currentName}
          </h2>
          <div className="text-xs text-bg-text-3 bg-bg-card-alt rounded-sm2 p-2 flex items-center gap-2">
            <span>📍 {currentCountry}</span> · <span>🏷 {SECTORS.find(([id]) => id === currentSector)?.[1] || currentSector}</span>
          </div>
          <NeedsAssessment
            sector={currentSector}
            country={currentCountry}
            onComplete={(data) => {
              setAssessmentData(data);
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        </div>
      )}

      {/* ═══ STEP 3: Quote Settings ═══ */}
      {step === 3 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-bg-green flex items-center gap-2">
            💼 الخطوة 3: إعدادات العرض
          </h2>

          <div className="rounded-sm2 bg-bg-green-lt border border-bg-green/20 p-3 flex items-center gap-3">
            <div className="size-10 rounded-lg bg-bg-green text-white flex items-center justify-center text-sm font-black">
              {currentName.slice(0, 2)}
            </div>
            <div className="flex-1">
              <div className="text-sm font-bold text-bg-green">{currentName}</div>
              <div className="text-[10px] text-bg-text-3">
                {currentCountry} · {assessmentData ? `${assessmentData.selectedModules.length} موديول` : ""}
              </div>
            </div>
            <button type="button" onClick={() => setStep(1)} className="text-xs text-bg-green hover:underline">تغيير</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Fld label="العملة (تلقائي من الدولة)">
              <div className="input bg-bg-card-alt flex items-center gap-2 cursor-not-allowed">
                <span className="font-bold text-bg-green">{currency}</span>
                <span className="text-xs text-bg-text-3">← {currentCountry}</span>
              </div>
            </Fld>
            <Fld label="لغة العرض المطبوع" required>
              <select className="input" value={quoteLanguage} onChange={(e) => setQuoteLanguage(e.target.value as "ar" | "en")}>
                <option value="ar">🇰🇼 العربية — RTL</option>
                <option value="en">🇬🇧 English — LTR</option>
              </select>
            </Fld>
            <Fld label="صلاحية العرض">
              <select className="input" value={validity} onChange={(e) => setValidity(e.target.value)}>
                <option>30 يوم</option>
                <option>45 يوم</option>
                <option>60 يوم</option>
                <option>15 يوم</option>
              </select>
            </Fld>
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(2)} className="btn-outline flex-1 inline-flex items-center justify-center gap-2 h-10">
              <ArrowRight className="size-4" /> السابق
            </button>
            <button type="button" onClick={() => setStep(4)} className="btn-primary flex-1 inline-flex items-center justify-center gap-2 h-10">
              التالي: تأكيد <ArrowLeft className="size-4" />
            </button>
          </div>
        </div>
      )}

      {/* ═══ STEP 4: Confirm + Create ═══ */}
      {step === 4 && (
        <div className="card p-5 space-y-4">
          <h2 className="text-lg font-black text-bg-green flex items-center gap-2">
            ✅ الخطوة 4: تأكيد وإنشاء
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <SummaryItem label="العميل" value={currentName} />
            <SummaryItem label="الدولة" value={currentCountry} />
            <SummaryItem label="العملة" value={currency} />
            <SummaryItem label="لغة العرض" value={quoteLanguage === "ar" ? "العربية" : "English"} />
            <SummaryItem label="الصلاحية" value={validity} />
            <SummaryItem label="الموديولات" value={assessmentData ? `${assessmentData.selectedModules.length} موديول` : "—"} />
          </div>

          {assessmentData && (
            <div className="rounded-sm2 bg-bg-green text-white p-3">
              <div className="text-xs opacity-70 mb-1">إجمالي التطوير المقدّر</div>
              <div className="text-xl font-black tabular">
                {Object.values(assessmentData.prices).reduce((s, p) => s + p, 0).toLocaleString("en-US")}
              </div>
            </div>
          )}

          {submitError && (
            <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">
              ⚠️ {submitError}
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={() => setStep(3)} className="btn-outline flex-1 inline-flex items-center justify-center gap-2 h-10">
              <ArrowRight className="size-4" /> السابق
            </button>
            <button type="button" onClick={handleSubmit} disabled={isPending}
              className="btn-primary flex-1 inline-flex items-center justify-center gap-2 h-11 text-base">
              {isPending ? "جاري الإنشاء..." : "🚀 إنشاء العرض وفتح Builder"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Fld({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold text-bg-text-2">{label} {required && <span className="text-bg-danger">*</span>}</label>
      {children}
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm2 bg-bg-card-alt border border-bg-line p-3">
      <div className="text-[10px] font-bold text-bg-text-3 uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-bg-text-1 mt-0.5">{value}</div>
    </div>
  );
}
