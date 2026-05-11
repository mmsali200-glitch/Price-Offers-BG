import { redirect } from "next/navigation";
import { getMyAccess } from "@/lib/actions/client-users";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "عرض السعر · Business Gate" };

export default async function ClientQuotePage() {
  const access = await getMyAccess();
  if (!access || access.userType !== "client") redirect("/login");

  const allowed = access.accessLevel === "quote" || access.accessLevel === "both";
  if (!allowed || !access.quoteId) {
    return (
      <div className="card p-6 text-center">
        <p className="text-sm font-bold text-bg-text-2">عرض السعر غير متاح حالياً</p>
        <p className="text-xs text-bg-text-3 mt-1">سيتواصل معك المسؤول عند جاهزيته.</p>
      </div>
    );
  }

  const supabase = await createClient();
  const { data: quote } = await supabase
    .from("quotes")
    .select("ref, title, status, currency, total_development, generated_html, created_at")
    .eq("id", access.quoteId)
    .single();

  if (!quote) {
    return <div className="card p-6 text-center text-sm text-bg-text-3">تعذّر تحميل العرض</div>;
  }

  return (
    <div className="space-y-4">
      <div className="card p-5 flex items-center justify-between">
        <div>
          <h1 className="text-base font-black text-bg-green">{quote.title ?? quote.ref}</h1>
          <p className="text-[11px] text-bg-text-3 mt-1">المرجع: {quote.ref}</p>
        </div>
        <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-bg-green-lt text-bg-green">
          {quote.status}
        </span>
      </div>

      {quote.generated_html ? (
        <div
          className="card p-6 prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ __html: quote.generated_html }}
        />
      ) : (
        <div className="card p-6 text-center text-sm text-bg-text-3">
          محتوى العرض قيد الإعداد
        </div>
      )}
    </div>
  );
}
