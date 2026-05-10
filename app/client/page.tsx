import { redirect } from "next/navigation";
import Link from "next/link";
import { ClipboardList, FileText, Lock, ArrowLeft } from "lucide-react";
import { getMyAccess } from "@/lib/actions/client-users";

export const dynamic = "force-dynamic";

export default async function ClientHomePage() {
  const access = await getMyAccess();
  if (!access || access.userType !== "client") redirect("/login");

  const canSurvey = access.accessLevel === "survey" || access.accessLevel === "both";
  const canQuote  = access.accessLevel === "quote"  || access.accessLevel === "both";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-bg-green">مرحباً بك</h1>
        <p className="text-xs text-bg-text-3 mt-1">اختر ما تريد إكماله</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <PortalCard
          title="استبيان اكتشاف المتطلبات"
          subtitle={
            access.surveyStatus === "submitted" ? "تم الإرسال — شكراً لك"
            : access.surveyStatus === "in_progress" ? "ابدأ من حيث توقفت"
            : "ابدأ الآن"
          }
          icon={<ClipboardList className="size-6" />}
          href={canSurvey && access.surveyToken ? `/survey/${access.surveyToken}` : null}
          locked={!canSurvey}
          done={access.surveyStatus === "submitted"}
        />
        <PortalCard
          title="عرض السعر"
          subtitle={
            !access.quoteId ? "لم يُجهَّز بعد"
            : access.quoteStatus === "accepted" ? "تم القبول ✓"
            : "اطّلع على العرض"
          }
          icon={<FileText className="size-6" />}
          href={canQuote && access.quoteId ? `/client/quote` : null}
          locked={!canQuote || !access.quoteId}
          done={access.quoteStatus === "accepted"}
        />
      </div>
    </div>
  );
}

function PortalCard({
  title, subtitle, icon, href, locked, done,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  href: string | null;
  locked: boolean;
  done: boolean;
}) {
  const body = (
    <div className={`card p-5 transition-all ${
      locked ? "opacity-50" : "hover:shadow-md hover:border-bg-green/40"
    }`}>
      <div className="flex items-start gap-3">
        <div className={`size-12 rounded-xl flex items-center justify-center ${
          done ? "bg-bg-green text-white" : locked ? "bg-bg-card-alt text-bg-text-3" : "bg-bg-green-lt text-bg-green"
        }`}>
          {locked ? <Lock className="size-5" /> : icon}
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-bg-text-1">{title}</h3>
          <p className="text-xs text-bg-text-3 mt-1">{subtitle}</p>
        </div>
        {!locked && href && <ArrowLeft className="size-4 text-bg-green" />}
      </div>
    </div>
  );
  return locked || !href ? body : <Link href={href}>{body}</Link>;
}
