import { ClipboardList } from "lucide-react";
import { listSurveys } from "@/lib/actions/surveys";
import { CreateSurveyButton } from "./create-survey-button";
import { SurveyTable } from "./survey-table";

export const metadata = { title: "الاستبيانات · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function SurveysPage() {
  const surveys = await listSurveys();

  const pending = surveys.filter((s) => s.status === "pending").length;
  const inProgress = surveys.filter((s) => s.status === "in_progress").length;
  const submitted = surveys.filter((s) => s.status === "submitted").length;

  return (
    <div className="page-padding space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-bg-green inline-flex items-center gap-2">
            <ClipboardList className="size-6" />
            استبيانات العملاء
          </h1>
          <p className="text-sm text-bg-text-3 mt-1">
            أنشئ استبيان حسب القطاع وأرسل الرابط للعميل — الإجابات تبني عرض السعر تلقائياً.
          </p>
        </div>
        <CreateSurveyButton />
      </header>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="card p-3 text-center">
          <div className="text-xl font-black text-bg-green">{surveys.length}</div>
          <div className="text-[10px] text-bg-text-3">الإجمالي</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-xl font-black text-bg-text-3">{pending}</div>
          <div className="text-[10px] text-bg-text-3">في الانتظار</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-xl font-black text-amber-600">{inProgress}</div>
          <div className="text-[10px] text-bg-text-3">قيد التعبئة</div>
        </div>
        <div className="card p-3 text-center">
          <div className="text-xl font-black text-bg-green">{submitted}</div>
          <div className="text-[10px] text-bg-text-3">مكتمل</div>
        </div>
      </div>

      <SurveyTable surveys={surveys} />
    </div>
  );
}
