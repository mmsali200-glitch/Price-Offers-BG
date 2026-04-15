import Link from "next/link";
import { Plus } from "lucide-react";

export const metadata = { title: "عروض الأسعار · BG Quotes" };

export default function QuotesPage() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-bg-green">عروض الأسعار</h1>
          <p className="text-sm text-bg-text-3 mt-1">
            جميع العروض المنشأة وحالتها الحالية.
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5">
          <Plus className="size-4" />
          عرض جديد
        </Link>
      </header>

      <div className="card p-10 text-center space-y-2">
        <div className="text-4xl">📝</div>
        <h2 className="text-lg font-bold text-bg-green">لا توجد عروض بعد</h2>
        <p className="text-sm text-bg-text-3">
          ابدأ بإنشاء عرضك الأول لعميل جديد.
        </p>
        <div className="pt-2">
          <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5">
            <Plus className="size-4" />
            أنشئ أول عرض
          </Link>
        </div>
      </div>
    </div>
  );
}
