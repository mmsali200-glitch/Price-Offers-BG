import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SURVEY_DATA, IMPACT_LABELS } from "@/lib/survey-data";
import { analyzeSurvey } from "@/lib/survey-analyzer";
import { fmtNum, fmtDateArabic } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowRight, ExternalLink, FileText, Users, TrendingUp,
  AlertTriangle, Check, Clock, Target, Briefcase,
} from "lucide-react";
import { CreateQuoteFromSurvey } from "./create-quote-button";

export const metadata = { title: "تفاصيل الاستبيان · BG Quotes" };
export const dynamic = "force-dynamic";

const COMPLEXITY_LABELS: Record<string, { label: string; color: string }> = {
  standard: { label: "قياسي", color: "bg-emerald-100 text-emerald-700" },
  medium: { label: "متوسط", color: "bg-amber-100 text-amber-700" },
  advanced: { label: "متقدم", color: "bg-orange-100 text-orange-700" },
  complex: { label: "معقد", color: "bg-red-100 text-red-700" },
};

export default async function SurveyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) notFound();

  const { data: survey } = await supabase.from("surveys").select("*").eq("id", id).single();
  if (!survey) notFound();

  const responses = (survey.responses ?? {}) as Record<string, unknown>;
  const analysis = analyzeSurvey(responses, { company_name: survey.company_name, industry: survey.industry });
  const cLevel = COMPLEXITY_LABELS[analysis.complexityLevel];

  return (
    <div className="page-padding space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <Link href="/surveys" className="text-xs text-bg-info hover:underline inline-flex items-center gap-1 mb-2">
            <ArrowRight className="size-3" /> عودة للاستبيانات
          </Link>
          <h1 className="text-xl font-black text-bg-green">{survey.company_name || "استبيان بدون اسم"}</h1>
          <p className="text-xs text-bg-text-3 mt-1">
            {survey.contact_name} · {survey.industry || "—"} · {fmtDateArabic(survey.created_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a href={`/survey/${survey.token}`} target="_blank"
            className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs">
            <ExternalLink className="size-3" /> فتح الاستبيان
          </a>
          <CreateQuoteFromSurvey surveyId={survey.id} analysis={analysis} clientInfo={{
            nameAr: survey.company_name || "", contactName: survey.contact_name || "",
            contactEmail: survey.contact_email || "", industry: survey.industry || "",
          }} />
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card p-4">
          <div className="text-bg-text-3 flex items-center gap-1 text-[10px] font-bold mb-1"><Target className="size-3" />التقدم</div>
          <div className="text-xl font-black text-bg-green">{survey.progress}%</div>
        </div>
        <div className="card p-4">
          <div className="text-bg-text-3 flex items-center gap-1 text-[10px] font-bold mb-1"><Users className="size-3" />المستخدمون</div>
          <div className="text-xl font-black text-bg-green">{analysis.estimatedUsers.full}<span className="text-xs text-bg-text-3 mr-1">+ {analysis.estimatedUsers.portal} بوابة</span></div>
        </div>
        <div className="card p-4">
          <div className="text-bg-text-3 flex items-center gap-1 text-[10px] font-bold mb-1"><Briefcase className="size-3" />الموديولات</div>
          <div className="text-xl font-black text-bg-green">{analysis.suggestedModules.length}</div>
        </div>
        <div className="card p-4">
          <div className="text-bg-text-3 flex items-center gap-1 text-[10px] font-bold mb-1"><Clock className="size-3" />المدة المتوقعة</div>
          <div className="text-lg font-black text-bg-green">{analysis.estimatedDuration}</div>
        </div>
        <div className="card p-4">
          <div className="text-bg-text-3 flex items-center gap-1 text-[10px] font-bold mb-1"><TrendingUp className="size-3" />التقدير</div>
          <div className="text-lg font-black text-bg-gold">{fmtNum(analysis.estimatedBudgetRange.min)} - {fmtNum(analysis.estimatedBudgetRange.max)}</div>
          <div className="text-[10px] text-bg-text-3">{analysis.estimatedBudgetRange.currency}</div>
        </div>
      </div>

      {/* Two columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Suggested modules */}
        <div className="lg:col-span-2 card p-5">
          <h2 className="text-sm font-black text-bg-green mb-4">📦 الموديولات المقترحة</h2>
          <div className="space-y-2">
            {analysis.suggestedModules.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3 rounded-sm2 border border-bg-line">
                <div className={`size-8 rounded-lg flex items-center justify-center text-xs font-black ${
                  m.confidence === "high" ? "bg-bg-green-lt text-bg-green" :
                  m.confidence === "medium" ? "bg-amber-100 text-amber-700" :
                  "bg-bg-card-alt text-bg-text-3"
                }`}>
                  {m.confidence === "high" ? <Check className="size-4" /> : "?"}
                </div>
                <div className="flex-1">
                  <div className="text-xs font-bold text-bg-text-1">{m.name}</div>
                  <div className="text-[10px] text-bg-text-3">{m.reason}</div>
                </div>
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                  m.confidence === "high" ? "bg-bg-green-lt text-bg-green" :
                  m.confidence === "medium" ? "bg-amber-100 text-amber-700" :
                  "bg-bg-card-alt text-bg-text-3"
                }`}>
                  {m.confidence === "high" ? "مؤكد" : m.confidence === "medium" ? "محتمل" : "اقتراح"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Complexity + pricing factors */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="text-sm font-black text-bg-green mb-3">📊 مستوى التعقيد</h2>
            <div className={`text-center p-4 rounded-xl ${cLevel.color}`}>
              <div className="text-2xl font-black">{cLevel.label}</div>
              <div className="text-xs mt-1">{analysis.complexityScore} نقطة</div>
            </div>
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-black text-bg-green mb-3">💰 عوامل التسعير</h2>
            <div className="space-y-2">
              {analysis.pricingFactors.map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <span className={`mt-0.5 ${f.impact === "increase" ? "text-red-500" : f.impact === "decrease" ? "text-emerald-500" : "text-bg-text-3"}`}>
                    {f.impact === "increase" ? "▲" : f.impact === "decrease" ? "▼" : "●"}
                  </span>
                  <div>
                    <div className="font-bold text-bg-text-1">{f.factor}</div>
                    <div className="text-bg-text-3">{f.detail}</div>
                  </div>
                </div>
              ))}
              {analysis.pricingFactors.length === 0 && <p className="text-xs text-bg-text-3">لا توجد عوامل مؤثرة بعد</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Discussion points */}
      {analysis.discussionPoints.length > 0 && (
        <div className="card p-5 border-amber-200 bg-amber-50">
          <h2 className="text-sm font-black text-amber-700 mb-3 flex items-center gap-2">
            <AlertTriangle className="size-4" /> نقاط تحتاج مناقشة ({analysis.discussionPoints.length})
          </h2>
          <div className="space-y-2">
            {analysis.discussionPoints.map((d, i) => (
              <div key={i} className="bg-white rounded-sm2 p-3 border border-amber-200">
                <div className="text-xs font-bold text-amber-800">{d.question}</div>
                <div className="text-[10px] text-amber-600 mt-1">{d.concern}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Section-by-section answers */}
      <div className="card overflow-hidden">
        <div className="bg-bg-green text-white px-5 py-3">
          <h2 className="text-sm font-black">📝 تفاصيل الإجابات حسب القسم</h2>
        </div>
        <div className="divide-y divide-bg-line">
          {SURVEY_DATA.sections.map((section) => {
            const answered = section.questions.filter((q) => {
              const v = responses[q.id];
              return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
            }).length;
            const impact = IMPACT_LABELS[section.pricing_impact];

            return (
              <details key={section.id} className="group">
                <summary className="px-5 py-3 cursor-pointer hover:bg-bg-card-alt flex items-center gap-3">
                  <span className="text-lg">{section.icon}</span>
                  <div className="flex-1">
                    <span className="text-xs font-bold text-bg-green">{section.title}</span>
                    <span className="text-[10px] text-bg-text-3 mr-2">{section.subtitle}</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: `${impact.color}15`, color: impact.color }}>
                    {impact.icon} {impact.label}
                  </span>
                  <span className="text-[10px] text-bg-text-3">{answered}/{section.questions.length}</span>
                </summary>
                <div className="px-5 pb-4 space-y-3">
                  {section.questions.map((q) => {
                    const v = responses[q.id];
                    const hasAnswer = v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
                    return (
                      <div key={q.id} className="bg-bg-card-alt rounded-sm2 p-3">
                        <div className="text-[10px] text-bg-text-3 font-bold mb-1">{q.label}</div>
                        {hasAnswer ? (
                          <div className="text-xs text-bg-text-1">
                            {Array.isArray(v) ? (v as string[]).join("، ") :
                             typeof v === "object" ? <pre className="text-[10px] bg-white rounded p-2 mt-1 whitespace-pre-wrap" dir="ltr">{JSON.stringify(v, null, 2)}</pre> :
                             String(v)}
                          </div>
                        ) : (
                          <div className="text-[10px] text-bg-text-3 italic">— لم يُجَب</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </div>
  );
}
