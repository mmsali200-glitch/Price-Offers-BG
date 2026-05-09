"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { SURVEY_DATA, IMPACT_LABELS, getTotalQuestions, computeSurveyProgress } from "@/lib/survey-data";
import type { SurveyQuestion } from "@/lib/survey-data";
import { saveSurveyResponses, submitSurvey } from "@/lib/actions/surveys";
import { Check, ChevronLeft, ChevronRight, Loader2, Send, Save } from "lucide-react";

type Props = {
  token: string;
  initialResponses: Record<string, unknown>;
  initialClientInfo: Record<string, string>;
  initialProgress: number;
  isSubmitted: boolean;
};

export function SurveyForm({ token, initialResponses, initialClientInfo, initialProgress, isSubmitted }: Props) {
  const [step, setStep] = useState<"setup" | number | "thanks">(isSubmitted ? "thanks" : "setup");
  const [responses, setResponses] = useState<Record<string, unknown>>(initialResponses);
  const [clientInfo, setClientInfo] = useState(initialClientInfo);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const total = getTotalQuestions();
  const progress = computeSurveyProgress(responses);

  const doSave = useCallback(async () => {
    setSaving(true);
    await saveSurveyResponses(token, responses, clientInfo);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }, [token, responses, clientInfo]);

  function setAnswer(questionId: string, value: unknown) {
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => doSave(), 3000);
  }

  function setInfo(key: string, value: string) {
    setClientInfo((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit() {
    setSubmitting(true);
    await saveSurveyResponses(token, responses, clientInfo);
    await submitSurvey(token);
    setSubmitting(false);
    setStep("thanks");
  }

  const sections = SURVEY_DATA.sections;
  const currentSection = typeof step === "number" ? sections[step] : null;

  // Setup view
  if (step === "setup") {
    return (
      <Shell progress={progress} total={total}>
        <div className="max-w-2xl mx-auto">
          <div className="bg-gradient-to-br from-[#1a5c37] to-[#247a4a] rounded-2xl p-8 text-white mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#c9a84c] rounded-xl flex items-center justify-center font-black text-[#1a5c37] text-xl">BG</div>
              <div>
                <div className="font-black text-lg">BUSINESS GATE</div>
                <div className="text-[#c9a84c] text-xs">Technical Consulting · بوابة الأعمال</div>
              </div>
            </div>
            <h1 className="text-2xl font-black mb-2">{SURVEY_DATA.meta.title}</h1>
            <p className="text-white/80 text-sm leading-relaxed">{SURVEY_DATA.meta.description}</p>
            <div className="flex gap-6 mt-6 pt-4 border-t border-white/20">
              <div><div className="text-2xl font-black text-[#c9a84c]">15</div><div className="text-xs text-white/60">قسم تشغيلي</div></div>
              <div><div className="text-2xl font-black text-[#c9a84c]">{total}</div><div className="text-xs text-white/60">سؤال تفصيلي</div></div>
              <div><div className="text-2xl font-black text-[#c9a84c]">∞</div><div className="text-xs text-white/60">حفظ تلقائي</div></div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-[#e2e8e3] p-6 shadow-sm">
            <h2 className="text-lg font-black text-[#1a5c37] mb-1">معلومات أساسية عن شركتكم</h2>
            <p className="text-xs text-[#7a8e80] mb-6">معلومات بسيطة لنتمكن من تخصيص الاستبيان والمتابعة معكم.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SURVEY_DATA.client_info_fields.map((f) => (
                <div key={f.id} className={f.id === "company_name" ? "md:col-span-2" : ""}>
                  <label className="block text-sm font-bold text-[#1a5c37] mb-1.5">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type={f.type}
                    value={clientInfo[f.id] || ""}
                    onChange={(e) => setInfo(f.id, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e2e8e3] text-sm focus:border-[#1a5c37] focus:ring-2 focus:ring-[#1a5c37]/10 outline-none transition-all"
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => setStep(0)}
              disabled={!clientInfo.company_name?.trim()}
              className="w-full mt-6 h-12 bg-[#1a5c37] text-white font-bold rounded-xl hover:bg-[#247a4a] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              ابدأ الاستبيان <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>
      </Shell>
    );
  }

  // Thanks view
  if (step === "thanks") {
    return (
      <Shell progress={100} total={total}>
        <div className="max-w-lg mx-auto text-center py-12">
          <div className="w-20 h-20 rounded-full bg-[#eaf3ed] text-[#1a5c37] flex items-center justify-center mx-auto mb-6">
            <Check className="size-10" strokeWidth={3} />
          </div>
          <h2 className="text-2xl font-black text-[#1a5c37] mb-3">شكراً لكم — تم استلام إجاباتكم</h2>
          <p className="text-sm text-[#7a8e80] leading-relaxed mb-6">
            سيتولى فريق بوابة الأعمال مراجعة الإجابات وإعداد عرض سعر مبني على متطلباتكم الفعلية.
          </p>
          <button onClick={() => setStep(0)} className="text-sm text-[#1a5c37] font-bold hover:underline">
            تعديل الإجابات
          </button>
        </div>
      </Shell>
    );
  }

  // Section view
  if (!currentSection) return null;
  const impact = IMPACT_LABELS[currentSection.pricing_impact];
  const sectionAnswered = currentSection.questions.filter((q) => {
    const v = responses[q.id];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  }).length;

  return (
    <Shell progress={progress} total={total}>
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-6">
          {/* Sidebar navigation */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-24 space-y-2">
              <div className="bg-white rounded-xl border border-[#e2e8e3] p-4 mb-3">
                <div className="text-xs text-[#7a8e80] mb-1">نسبة الإكمال</div>
                <div className="text-2xl font-black text-[#1a5c37]">{progress}%</div>
                <div className="h-1.5 bg-[#e2e8e3] rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#c9a84c] rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              </div>
              <div className="bg-white rounded-xl border border-[#e2e8e3] p-2 max-h-[60vh] overflow-y-auto">
                {sections.map((s, i) => {
                  const active = step === i;
                  const sAnswered = s.questions.filter((q) => {
                    const v = responses[q.id];
                    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
                  }).length;
                  const done = sAnswered === s.questions.length;
                  return (
                    <button
                      key={s.id}
                      onClick={() => { doSave(); setStep(i); }}
                      className={`w-full text-right flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs transition-all ${
                        active ? "bg-[#1a5c37] text-white" : done ? "text-[#1a5c37]" : "text-[#7a8e80] hover:bg-[#f7f9f6]"
                      }`}
                    >
                      <span className={`size-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        active ? "bg-[#c9a84c] text-[#1a5c37]" : done ? "bg-[#1a5c37] text-white" : "bg-[#e2e8e3]"
                      }`}>
                        {done ? <Check className="size-3" /> : i + 1}
                      </span>
                      <span className="truncate">{s.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-[#e2e8e3] overflow-hidden shadow-sm">
              {/* Section header */}
              <div className="px-8 py-6 border-b border-[#e2e8e3] bg-gradient-to-l from-[#f7f9f6] to-white">
                <div className="flex items-center gap-2 text-xs text-[#c9a84c] font-bold mb-2">
                  <span className="w-4 h-[2px] bg-[#c9a84c]" />
                  القسم {(step as number) + 1} من {sections.length}
                </div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{currentSection.icon}</span>
                  <h2 className="text-xl font-black text-[#1a5c37]">{currentSection.title}</h2>
                </div>
                <p className="text-xs text-[#7a8e80] italic mb-2">{currentSection.subtitle}</p>
                <p className="text-sm text-[#3e5446] leading-relaxed">{currentSection.description}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="text-xs px-2.5 py-1 rounded-full font-bold" style={{ background: `${impact.color}15`, color: impact.color }}>
                    {impact.icon} تأثير على التسعير: {impact.label}
                  </span>
                  <span className="text-xs text-[#7a8e80]">{sectionAnswered}/{currentSection.questions.length} مُجاب</span>
                </div>
              </div>

              {/* Questions */}
              <div className="px-8 py-6 space-y-8">
                {currentSection.questions.map((q, qi) => (
                  <QuestionField
                    key={q.id}
                    question={q}
                    index={qi}
                    value={responses[q.id]}
                    onChange={(v) => setAnswer(q.id, v)}
                  />
                ))}
              </div>

              {/* Footer navigation */}
              <div className="px-8 py-4 border-t border-[#e2e8e3] bg-[#f7f9f6] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {saving && <span className="text-xs text-[#7a8e80] flex items-center gap-1"><Loader2 className="size-3 animate-spin" />جاري الحفظ...</span>}
                  {saved && <span className="text-xs text-[#1a5c37] flex items-center gap-1"><Check className="size-3" />تم الحفظ</span>}
                </div>
                <div className="flex items-center gap-2">
                  {(step as number) > 0 && (
                    <button onClick={() => { doSave(); setStep((step as number) - 1); }}
                      className="h-10 px-4 rounded-xl border border-[#e2e8e3] text-sm font-bold text-[#3e5446] hover:border-[#1a5c37] flex items-center gap-1">
                      <ChevronRight className="size-4" /> السابق
                    </button>
                  )}
                  {(step as number) < sections.length - 1 ? (
                    <button onClick={() => { doSave(); setStep((step as number) + 1); }}
                      className="h-10 px-5 rounded-xl bg-[#1a5c37] text-white text-sm font-bold hover:bg-[#247a4a] flex items-center gap-1">
                      التالي <ChevronLeft className="size-4" />
                    </button>
                  ) : (
                    <button onClick={handleSubmit} disabled={submitting}
                      className="h-10 px-5 rounded-xl bg-[#c9a84c] text-[#1a5c37] text-sm font-bold hover:bg-[#b08d44] flex items-center gap-1">
                      {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      {submitting ? "جاري الإرسال..." : "إرسال الاستبيان"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </Shell>
  );
}

function Shell({ children, progress, total }: { children: React.ReactNode; progress: number; total: number }) {
  return (
    <div className="min-h-screen bg-[#f5f6f4]" dir="rtl" style={{ fontFamily: "'Noto Sans Arabic', sans-serif" }}>
      {/* Top bar */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#e2e8e3]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#1a5c37] rounded-lg flex items-center justify-center font-black text-[#c9a84c] text-sm">BG</div>
            <div>
              <div className="text-sm font-black text-[#1a5c37]">Business Gate</div>
              <div className="text-[10px] text-[#7a8e80]">استبيان اكتشاف المتطلبات</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-[#7a8e80]">{progress}% مكتمل</div>
            <div className="w-24 h-1.5 bg-[#e2e8e3] rounded-full overflow-hidden">
              <div className="h-full bg-[#1a5c37] rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}

function QuestionField({ question: q, index, value, onChange }: {
  question: SurveyQuestion; index: number; value: unknown; onChange: (v: unknown) => void;
}) {
  if (q.type === "textarea") {
    return (
      <div className="border-b border-dashed border-[#e2e8e3] pb-7 last:border-0">
        <QLabel q={q} index={index} />
        <textarea
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e2e8e3] text-sm resize-y focus:border-[#1a5c37] focus:ring-2 focus:ring-[#1a5c37]/10 outline-none"
          placeholder="اكتب إجابتك هنا..."
        />
      </div>
    );
  }

  if (q.type === "text" || q.type === "number") {
    return (
      <div className="border-b border-dashed border-[#e2e8e3] pb-7 last:border-0">
        <QLabel q={q} index={index} />
        <input
          type={q.type}
          value={(value as string) || ""}
          onChange={(e) => onChange(q.type === "number" ? (e.target.value ? Number(e.target.value) : "") : e.target.value)}
          className="w-full px-4 py-3 rounded-xl border-[1.5px] border-[#e2e8e3] text-sm focus:border-[#1a5c37] focus:ring-2 focus:ring-[#1a5c37]/10 outline-none"
        />
      </div>
    );
  }

  if (q.type === "radio" && q.options) {
    return (
      <div className="border-b border-dashed border-[#e2e8e3] pb-7 last:border-0">
        <QLabel q={q} index={index} />
        <div className="space-y-2">
          {q.options.map((opt) => {
            const selected = value === opt;
            return (
              <label key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] cursor-pointer transition-all ${
                selected ? "border-[#1a5c37] bg-[#eaf3ed]" : "border-[#e2e8e3] hover:border-[#1a5c37]/40"
              }`}>
                <div className={`size-5 rounded-full border-[1.5px] flex items-center justify-center shrink-0 ${
                  selected ? "border-[#1a5c37] bg-[#1a5c37]" : "border-[#c4d0c8]"
                }`}>
                  {selected && <div className="size-2 rounded-full bg-[#c9a84c]" />}
                </div>
                <span className="text-sm text-[#3e5446]">{opt}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (q.type === "checkbox" && q.options) {
    const checked = (value as string[]) || [];
    return (
      <div className="border-b border-dashed border-[#e2e8e3] pb-7 last:border-0">
        <QLabel q={q} index={index} />
        <div className="space-y-2">
          {q.options.map((opt) => {
            const isChecked = checked.includes(opt);
            return (
              <label key={opt} className={`flex items-center gap-3 px-4 py-3 rounded-xl border-[1.5px] cursor-pointer transition-all ${
                isChecked ? "border-[#1a5c37] bg-[#eaf3ed]" : "border-[#e2e8e3] hover:border-[#1a5c37]/40"
              }`}>
                <div className={`size-5 rounded border-[1.5px] flex items-center justify-center shrink-0 ${
                  isChecked ? "border-[#1a5c37] bg-[#1a5c37]" : "border-[#c4d0c8]"
                }`}>
                  {isChecked && <Check className="size-3 text-[#c9a84c]" strokeWidth={3} />}
                </div>
                <span className="text-sm text-[#3e5446]">{opt}</span>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if ((q.type === "user-table" || q.type === "migration-table") && q.rows) {
    const tableData = (value as Record<string, string>) || {};
    return (
      <div className="border-b border-dashed border-[#e2e8e3] pb-7 last:border-0">
        <QLabel q={q} index={index} />
        <div className="rounded-xl border border-[#e2e8e3] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a5c37] text-white">
                <th className="text-right px-4 py-2.5 font-bold">{q.type === "user-table" ? "الدور الوظيفي" : "الكيان"}</th>
                <th className="text-center px-4 py-2.5 font-bold w-32">{q.type === "user-table" ? "العدد" : "الحجم/العدد"}</th>
              </tr>
            </thead>
            <tbody>
              {q.rows.map((row, i) => (
                <tr key={row} className={i % 2 === 0 ? "bg-white" : "bg-[#f7f9f6]"}>
                  <td className="px-4 py-2 text-[#3e5446]">{row}</td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={tableData[row] || ""}
                      onChange={(e) => onChange({ ...tableData, [row]: e.target.value })}
                      className="w-full text-center px-2 py-1.5 rounded-lg border border-transparent hover:border-[#e2e8e3] focus:border-[#1a5c37] outline-none text-sm"
                      placeholder="—"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  if (q.type === "approval-table" && q.rows) {
    const tableData = (value as Record<string, Record<string, string>>) || {};
    return (
      <div className="border-b border-dashed border-[#e2e8e3] pb-7 last:border-0">
        <QLabel q={q} index={index} />
        <div className="rounded-xl border border-[#e2e8e3] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1a5c37] text-white">
                <th className="text-right px-4 py-2.5 font-bold">نوع المستند</th>
                <th className="text-center px-3 py-2.5 font-bold">الحد المالي</th>
                <th className="text-center px-3 py-2.5 font-bold">الاعتماد الأولي</th>
                <th className="text-center px-3 py-2.5 font-bold">الاعتماد النهائي</th>
              </tr>
            </thead>
            <tbody>
              {q.rows.map((row, i) => {
                const rowData = tableData[row] || {};
                const updateRow = (col: string, val: string) => onChange({ ...tableData, [row]: { ...rowData, [col]: val } });
                return (
                  <tr key={row} className={i % 2 === 0 ? "bg-white" : "bg-[#f7f9f6]"}>
                    <td className="px-4 py-2 text-[#3e5446]">{row}</td>
                    {["limit", "initial", "final"].map((col) => (
                      <td key={col} className="px-1 py-1">
                        <input type="text" value={rowData[col] || ""} onChange={(e) => updateRow(col, e.target.value)}
                          className="w-full text-center px-2 py-1.5 rounded-lg border border-transparent hover:border-[#e2e8e3] focus:border-[#1a5c37] outline-none text-sm" placeholder="—" />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
}

function QLabel({ q, index }: { q: SurveyQuestion; index: number }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] text-[#7a8e80] font-mono mb-1">Q{index + 1}</div>
      <div className="text-sm font-bold text-[#1a5c37] leading-relaxed">{q.label}</div>
      {q.help && (
        <div className="text-xs text-[#5c6b82] mt-1.5 px-3 py-2 bg-[#e5eef8] border-r-2 border-[#1e5a8c] rounded-lg leading-relaxed">
          💡 {q.help}
        </div>
      )}
    </div>
  );
}
