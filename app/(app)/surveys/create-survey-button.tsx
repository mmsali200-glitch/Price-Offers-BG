"use client";

import { useState } from "react";
import { Plus, Loader2, Check, Copy, X, ChevronLeft, ArrowRight, Send, MessageCircle } from "lucide-react";
import { createSurvey } from "@/lib/actions/surveys";
import { SURVEY_SECTORS } from "@/lib/survey-sectors";
import { SURVEY_DATA } from "@/lib/survey-data";

export function CreateSurveyButton() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [result, setResult] = useState<{ token: string; url: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const sector = SURVEY_SECTORS.find((s) => s.id === selectedSector);
  const sectionIds = sector ? [...sector.commonSections, ...sector.specializedSections] : [];
  const sectionCount = sectionIds.length;
  const questionCount = SURVEY_DATA.sections
    .filter((s) => sectionIds.includes(s.id))
    .reduce((sum, s) => sum + s.questions.length, 0);

  const [createError, setCreateError] = useState<string | null>(null);

  async function handleCreate() {
    if (!selectedSector || !companyName.trim()) return;
    setCreating(true);
    setCreateError(null);
    try {
      const r = await createSurvey({
        companyName, contactName, contactEmail,
        industry: sector?.name || "",
      });
      setCreating(false);
      if (r.ok) {
        const url = `${window.location.origin}/survey/${r.token}?sector=${selectedSector}`;
        setResult({ token: r.token, url });
        setStep(3);
      } else {
        setCreateError(r.error || "فشل إنشاء الاستبيان — تأكد من تطبيق migration 0012");
      }
    } catch (err) {
      setCreating(false);
      setCreateError(err instanceof Error ? err.message : "خطأ غير متوقع");
    }
  }

  function handleCopy() {
    if (!result) return;
    navigator.clipboard?.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleWhatsApp() {
    if (!result) return;
    const msg = encodeURIComponent(
      `السلام عليكم ${contactName || ""}،\n\n` +
      `نرسل لكم استبيان اكتشاف المتطلبات لمشروع نظام Odoo ERP.\n` +
      `يرجى تعبئة الاستبيان من الرابط التالي:\n\n` +
      `${result.url}\n\n` +
      `الاستبيان يُحفظ تلقائياً — يمكنكم العودة لاستكماله في أي وقت.\n\n` +
      `مع تحيات،\nفريق بوابة الأعمال\nBusiness Gate Technical Consulting`
    );
    const phone = contactPhone.replace(/\s/g, "").replace(/^\+/, "");
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
  }

  function handleClose() {
    setOpen(false);
    setStep(1);
    setResult(null);
    setSelectedSector(null);
    setCompanyName("");
    setContactName("");
    setContactEmail("");
    setContactPhone("");
    setCopied(false);
    if (result) window.location.reload();
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
      <div className="bg-white rounded-card max-w-xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-bg-line flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-base font-black text-bg-green">
              {step === 1 ? "اختر قطاع العميل" : step === 2 ? "بيانات العميل" : "تم إنشاء الاستبيان"}
            </h3>
            <p className="text-[10px] text-bg-text-3 mt-0.5">
              {step === 1 ? "الأسئلة تتغير بناءً على القطاع" : step === 2 ? "اختياري — العميل يقدر يكمّلها بنفسه" : "انسخ الرابط وأرسله للعميل"}
            </p>
          </div>
          <button onClick={handleClose} className="text-bg-text-3 hover:text-bg-danger"><X className="size-5" /></button>
        </div>

        <div className="p-6">
          {/* ═══ Step 1: Choose Sector ═══ */}
          {step === 1 && (
            <div className="space-y-3">
              {SURVEY_SECTORS.map((s) => {
                const active = selectedSector === s.id;
                const secCount = [...s.commonSections, ...s.specializedSections].length;
                const qCount = SURVEY_DATA.sections
                  .filter((sec) => [...s.commonSections, ...s.specializedSections].includes(sec.id))
                  .reduce((sum, sec) => sum + sec.questions.length, 0);
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedSector(s.id)}
                    className={`w-full text-right rounded-xl border-[1.5px] p-4 flex items-start gap-4 transition-all ${
                      active ? "border-bg-green bg-bg-green-lt shadow-sm" : "border-bg-line hover:border-bg-green/40"
                    }`}
                  >
                    <div className="text-2xl mt-0.5">{s.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-black text-bg-text-1">{s.name}</div>
                      <div className="text-[10px] text-bg-text-3 mt-1 leading-relaxed">{s.description}</div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-bold bg-bg-card-alt px-2 py-0.5 rounded-full">{secCount} قسم</span>
                        <span className="text-[9px] font-bold bg-bg-card-alt px-2 py-0.5 rounded-full">{qCount} سؤال</span>
                      </div>
                    </div>
                    {active && (
                      <div className="size-6 rounded-full bg-bg-green text-white flex items-center justify-center shrink-0">
                        <Check className="size-4" />
                      </div>
                    )}
                  </button>
                );
              })}

              <button
                onClick={() => selectedSector && setStep(2)}
                disabled={!selectedSector}
                className="w-full h-11 mt-4 bg-bg-green text-white font-bold rounded-xl hover:bg-bg-green-2 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                التالي — بيانات العميل <ChevronLeft className="size-4" />
              </button>
            </div>
          )}

          {/* ═══ Step 2: Client Info ═══ */}
          {step === 2 && (
            <div className="space-y-4">
              {sector && (
                <div className="bg-bg-green-lt rounded-xl p-3 flex items-center gap-3">
                  <span className="text-xl">{sector.icon}</span>
                  <div>
                    <div className="text-xs font-black text-bg-green">{sector.name}</div>
                    <div className="text-[10px] text-bg-text-3">{sectionCount} قسم · {questionCount} سؤال</div>
                  </div>
                  <button onClick={() => setStep(1)} className="text-[10px] text-bg-green hover:underline mr-auto">تغيير</button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-bg-text-2 block mb-1.5">اسم الشركة <span className="text-bg-danger">*</span></label>
                <input value={companyName} onChange={(e) => setCompanyName(e.target.value)}
                  className="input" placeholder="مثال: شركة النور للمقاولات" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-bg-text-2 block mb-1.5">جهة الاتصال</label>
                  <input value={contactName} onChange={(e) => setContactName(e.target.value)}
                    className="input" placeholder="أحمد محمد" />
                </div>
                <div>
                  <label className="text-xs font-bold text-bg-text-2 block mb-1.5">الهاتف</label>
                  <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                    className="input" dir="ltr" placeholder="+965 9999 0000" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-bg-text-2 block mb-1.5">البريد الإلكتروني</label>
                <input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                  className="input" dir="ltr" placeholder="ahmed@company.com" />
              </div>

              {createError && (
                <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{createError}</div>
              )}

              <div className="flex gap-2 mt-2">
                <button onClick={() => setStep(1)} className="btn-outline flex-1 h-10 text-xs flex items-center justify-center gap-1">
                  <ArrowRight className="size-3" /> السابق
                </button>
                <button onClick={handleCreate} disabled={creating || !companyName.trim()}
                  className="flex-1 h-10 bg-bg-green text-white font-bold rounded-sm2 text-xs hover:bg-bg-green-2 disabled:opacity-40 flex items-center justify-center gap-1">
                  {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
                  {creating ? "جاري الإنشاء..." : "إنشاء الاستبيان"}
                </button>
              </div>
            </div>
          )}

          {/* ═══ Step 3: Link Ready ═══ */}
          {step === 3 && result && (
            <div className="space-y-5">
              <div className="text-center">
                <div className="size-16 rounded-full bg-bg-green-lt text-bg-green flex items-center justify-center mx-auto mb-4">
                  <Check className="size-8" strokeWidth={3} />
                </div>
                <h3 className="text-lg font-black text-bg-green">الاستبيان جاهز!</h3>
                <p className="text-xs text-bg-text-3 mt-1">انسخ الرابط وأرسله للعميل عبر البريد أو WhatsApp</p>
              </div>

              {/* Link */}
              <div className="bg-bg-card-alt rounded-xl p-3 flex items-center gap-2">
                <input type="text" readOnly value={result.url}
                  className="flex-1 bg-transparent text-[11px] text-bg-text-1 outline-none font-mono" dir="ltr" />
                <button onClick={handleCopy}
                  className={`shrink-0 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                    copied ? "bg-bg-green text-white" : "bg-white border border-bg-line text-bg-green hover:bg-bg-green hover:text-white"
                  }`}>
                  {copied ? <><Check className="size-3 inline" /> تم النسخ</> : <><Copy className="size-3 inline" /> نسخ الرابط</>}
                </button>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                {contactPhone && (
                  <button onClick={handleWhatsApp}
                    className="h-11 rounded-xl bg-[#25D366] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#1da851]">
                    <MessageCircle className="size-4" /> أرسل عبر WhatsApp
                  </button>
                )}
                <a href={result.url} target="_blank"
                  className={`h-11 rounded-xl bg-bg-green-lt text-bg-green font-bold text-xs flex items-center justify-center gap-2 hover:bg-bg-green hover:text-white ${
                    contactPhone ? "" : "col-span-2"
                  }`}>
                  معاينة الاستبيان
                </a>
              </div>

              {/* Preview message */}
              {contactPhone && (
                <div className="bg-[#e5f7ed] rounded-xl p-4 text-xs text-[#1a5c37] leading-relaxed">
                  <div className="font-bold mb-2">📱 رسالة WhatsApp الجاهزة:</div>
                  <div className="bg-white rounded-lg p-3 text-[11px] text-bg-text-2 whitespace-pre-line">
                    السلام عليكم {contactName}،{"\n\n"}
                    نرسل لكم استبيان اكتشاف المتطلبات لمشروع نظام Odoo ERP.{"\n"}
                    يرجى تعبئة الاستبيان من الرابط التالي:{"\n\n"}
                    <span className="text-bg-green font-bold">{result.url}</span>{"\n\n"}
                    الاستبيان يُحفظ تلقائياً — يمكنكم العودة لاستكماله في أي وقت.{"\n\n"}
                    مع تحيات،{"\n"}
                    فريق بوابة الأعمال
                  </div>
                </div>
              )}

              <button onClick={handleClose} className="btn-outline w-full h-9 text-xs">إغلاق</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
