import Link from "next/link";
import { ClipboardList, Plus, ExternalLink, Check, Clock, FileText } from "lucide-react";
import { listSurveys } from "@/lib/actions/surveys";
import { fmtDateArabic } from "@/lib/utils";
import { CreateSurveyButton } from "./create-survey-button";

export const metadata = { title: "الاستبيانات · BG Quotes" };
export const dynamic = "force-dynamic";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "في الانتظار", cls: "bg-bg-line text-bg-text-2" },
  in_progress: { label: "قيد التعبئة", cls: "bg-amber-100 text-amber-700" },
  submitted: { label: "مكتمل", cls: "bg-bg-green-lt text-bg-green" },
};

export default async function SurveysPage() {
  const surveys = await listSurveys();

  return (
    <div className="page-padding space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-bg-green inline-flex items-center gap-2">
            <ClipboardList className="size-6" />
            استبيانات العملاء
          </h1>
          <p className="text-sm text-bg-text-3 mt-1">
            أنشئ استبيان اكتشاف متطلبات وأرسل الرابط للعميل — الإجابات تبني عرض السعر تلقائياً.
          </p>
        </div>
        <CreateSurveyButton />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-bg-green">{surveys.length}</div>
          <div className="text-xs text-bg-text-3">إجمالي الاستبيانات</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-amber-600">{surveys.filter((s) => s.status === "in_progress").length}</div>
          <div className="text-xs text-bg-text-3">قيد التعبئة</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-bg-green">{surveys.filter((s) => s.status === "submitted").length}</div>
          <div className="text-xs text-bg-text-3">مكتمل</div>
        </div>
      </div>

      {surveys.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <div className="text-4xl">📋</div>
          <h2 className="text-lg font-bold text-bg-green">لا توجد استبيانات بعد</h2>
          <p className="text-sm text-bg-text-3">أنشئ استبياناً وأرسل الرابط للعميل ليعبّئه.</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-bg-green text-white">
              <tr>
                <th className="text-right px-4 py-3 font-bold">العميل</th>
                <th className="text-right px-4 py-3 font-bold">القطاع</th>
                <th className="text-center px-4 py-3 font-bold">الحالة</th>
                <th className="text-center px-4 py-3 font-bold">التقدم</th>
                <th className="text-right px-4 py-3 font-bold">التاريخ</th>
                <th className="text-center px-4 py-3 font-bold">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {surveys.map((s) => {
                const badge = STATUS_META[s.status] || STATUS_META.pending;
                return (
                  <tr key={s.id} className="border-t border-bg-line hover:bg-bg-card-alt">
                    <td className="px-4 py-3">
                      <div className="font-bold text-bg-text-1">{s.company_name || "—"}</div>
                      <div className="text-[10px] text-bg-text-3">{s.contact_name} {s.contact_email && `· ${s.contact_email}`}</div>
                    </td>
                    <td className="px-4 py-3 text-bg-text-2">{s.industry || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.cls}`}>{badge.label}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 h-1.5 bg-bg-line rounded-full overflow-hidden">
                          <div className="h-full bg-bg-green rounded-full" style={{ width: `${s.progress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-bg-green tabular">{s.progress}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[10px] text-bg-text-3">{fmtDateArabic(s.created_at)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <a
                          href={`/survey/${s.token}`}
                          target="_blank"
                          className="size-7 rounded bg-bg-card-alt border border-bg-line flex items-center justify-center text-bg-text-3 hover:text-bg-green hover:border-bg-green"
                          title="فتح الاستبيان"
                        >
                          <ExternalLink className="size-3" />
                        </a>
                        <button
                          onClick={() => navigator.clipboard?.writeText(`${window.location.origin}/survey/${s.token}`)}
                          className="size-7 rounded bg-bg-card-alt border border-bg-line flex items-center justify-center text-bg-text-3 hover:text-bg-green hover:border-bg-green"
                          title="نسخ الرابط"
                        >
                          <ClipboardList className="size-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
