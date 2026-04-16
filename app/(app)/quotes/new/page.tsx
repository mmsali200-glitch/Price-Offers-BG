import Link from "next/link";
import { createQuote } from "@/lib/actions/quotes";
import { Plus, Sparkles, ArrowRight } from "lucide-react";

export const metadata = { title: "عرض جديد · BG Quotes" };

export default function NewQuotePage() {
  const year = new Date().getFullYear();
  const suggestedRef = `BG-${year}-XXX-001`;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-5">
      <header>
        <h1 className="text-2xl font-black text-bg-green">عرض جديد</h1>
        <p className="text-sm text-bg-text-3 mt-1">
          ابدأ من الصفر، أو اختر قالباً جاهزاً لقطاعك.
        </p>
      </header>

      {/* Template shortcut */}
      <Link
        href="/templates"
        className="card p-4 flex items-center gap-4 card-hover block bg-gradient-to-br from-bg-gold-lt to-white border-bg-gold"
      >
        <div className="size-12 rounded-xl bg-bg-gold text-bg-green flex items-center justify-center">
          <Sparkles className="size-6" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-black text-[#8a6010]">
            ابدأ من قالب جاهز
          </div>
          <div className="text-xs text-bg-text-3 mt-0.5">
            8 قوالب مُعدّة مسبقاً لقطاعات الأعمال الشائعة — تجارة، صحة، تصنيع، عقارات،
            تجزئة، خدمات، مطاعم.
          </div>
        </div>
        <ArrowRight className="size-5 text-bg-gold" />
      </Link>

      {/* Blank form */}
      <div className="text-center text-[10px] text-bg-text-3 uppercase tracking-wider">
        أو ابدأ فارغاً
      </div>

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
