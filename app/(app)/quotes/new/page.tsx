import { createQuote } from "@/lib/actions/quotes";
import { Plus } from "lucide-react";

export const metadata = { title: "عرض جديد · BG Quotes" };

export default function NewQuotePage() {
  const year = new Date().getFullYear();
  const suggestedRef = `BG-${year}-XXX-001`;

  return (
    <div className="max-w-lg mx-auto p-6 space-y-5">
      <header>
        <h1 className="text-2xl font-black text-bg-green">عرض جديد</h1>
        <p className="text-sm text-bg-text-3 mt-1">
          أدخل اسم العميل ورقم العرض لبدء Builder. يمكنك تعديل كل شيء لاحقاً.
        </p>
      </header>

      <form action={createQuote} className="card p-5 space-y-4">
        <div className="space-y-1">
          <label className="label block" htmlFor="name">
            اسم العميل (عربي) <span className="text-bg-danger">*</span>
          </label>
          <input
            id="name"
            name="name"
            required
            autoFocus
            className="input"
            placeholder="شركة النور للتجارة"
          />
        </div>
        <div className="space-y-1">
          <label className="label block" htmlFor="ref">
            رقم العرض
          </label>
          <input
            id="ref"
            name="ref"
            className="input tabular"
            placeholder={suggestedRef}
            dir="ltr"
          />
          <span className="text-[10px] text-bg-text-3">
            الصيغة: BG-{year}-[كود العميل 3 حروف]-[NNN]
          </span>
        </div>

        <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-1.5">
          <Plus className="size-4" />
          إنشاء وفتح Builder
        </button>
      </form>
    </div>
  );
}
