import Link from "next/link";
import { createQuote } from "@/lib/actions/quotes";
import { Plus, Sparkles, ArrowRight, Building, Phone, MapPin, Globe, Briefcase } from "lucide-react";

export const metadata = { title: "عرض جديد · BG Quotes" };

const SECTORS = [
  ["trading", "تجارة وتوزيع"],
  ["manufacturing", "تصنيع وإنتاج"],
  ["services", "خدمات مهنية"],
  ["healthcare", "رعاية صحية"],
  ["construction", "مقاولات وتشييد"],
  ["realestate", "عقارات وأملاك"],
  ["logistics", "لوجستيات ونقل"],
  ["retail", "تجزئة ومتاجر"],
  ["food", "أغذية ومطاعم"],
  ["education", "تعليم وتدريب"],
  ["government", "جهة حكومية"],
  ["other", "أخرى"],
] as const;

const SIZES = [
  ["small", "أقل من 20 موظف"],
  ["medium", "20–100 موظف"],
  ["large", "100–500 موظف"],
  ["enterprise", "أكثر من 500"],
] as const;

const COUNTRIES = [
  ["الكويت", "🇰🇼"],
  ["السعودية", "🇸🇦"],
  ["الإمارات", "🇦🇪"],
  ["قطر", "🇶🇦"],
  ["البحرين", "🇧🇭"],
  ["عمان", "🇴🇲"],
  ["مصر", "🇪🇬"],
  ["الأردن", "🇯🇴"],
  ["أخرى", "🌍"],
] as const;

export default function NewQuotePage() {
  const year = new Date().getFullYear();
  const suggestedRef = `BG-${year}-XXX-001`;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-5">
      <header>
        <h1 className="text-2xl font-black text-bg-green">عرض جديد</h1>
        <p className="text-sm text-bg-text-3 mt-1">
          أدخل بيانات العميل الكاملة لتوليد عرض سعر شامل. كل البيانات تُحفَظ
          ويُعاد استخدامها في تفاصيل العرض المطبوع.
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
          <div className="text-sm font-black text-[#8a6010]">ابدأ من قالب جاهز</div>
          <div className="text-xs text-bg-text-3 mt-0.5">
            8 قوالب مُعدّة مسبقاً — تجارة، صحة، تصنيع، عقارات، تجزئة، خدمات، مطاعم.
          </div>
        </div>
        <ArrowRight className="size-5 text-bg-gold" />
      </Link>

      <div className="text-center text-[10px] text-bg-text-3 uppercase tracking-wider">
        أو أدخل بيانات كاملة
      </div>

      <form action={createQuote} className="card p-5 space-y-5">
        {/* ── Section 1: Client identity ───────────────── */}
        <section>
          <h2 className="text-sm font-black text-bg-green inline-flex items-center gap-2 mb-3">
            <Building className="size-4" />
            هوية العميل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="اسم العميل (عربي)" required>
              <input name="nameAr" required className="input" placeholder="شركة النور للتجارة" />
            </Field>
            <Field label="اسم العميل (إنجليزي)">
              <input name="nameEn" className="input" placeholder="Al-Noor Trading Co." />
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <Field label="رقم العرض" required hint={`الصيغة: ${suggestedRef}`}>
              <input name="ref" required className="input tabular" placeholder={suggestedRef} dir="ltr" />
            </Field>
            <Field label="تاريخ الإصدار">
              <input name="date" className="input" placeholder={`أبريل ${year}`} />
            </Field>
          </div>
        </section>

        {/* ── Section 2: Business ────────────────────── */}
        <section className="border-t border-bg-line pt-4">
          <h2 className="text-sm font-black text-bg-green inline-flex items-center gap-2 mb-3">
            <Briefcase className="size-4" />
            نشاط العميل
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="قطاع النشاط" required>
              <select name="sector" required className="input">
                {SECTORS.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </Field>
            <Field label="حجم الشركة">
              <select name="employeeSize" className="input">
                {SIZES.map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))}
              </select>
            </Field>
          </div>
          <Field label="وصف مختصر للنشاط" className="mt-3">
            <input
              name="businessActivity"
              className="input"
              placeholder="مثال: توزيع المواد الغذائية على المحلات التجارية"
            />
          </Field>
        </section>

        {/* ── Section 3: Contact ─────────────────────── */}
        <section className="border-t border-bg-line pt-4">
          <h2 className="text-sm font-black text-bg-green inline-flex items-center gap-2 mb-3">
            <Phone className="size-4" />
            جهة الاتصال
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="الاسم" required>
              <input name="contactName" required className="input" placeholder="أحمد الخالد" />
            </Field>
            <Field label="الهاتف" required>
              <input name="contactPhone" required className="input tabular" placeholder="+965 9999 0000" dir="ltr" />
            </Field>
            <Field label="البريد الإلكتروني">
              <input name="contactEmail" type="email" className="input" placeholder="name@example.com" dir="ltr" />
            </Field>
          </div>
        </section>

        {/* ── Section 4: Location ────────────────────── */}
        <section className="border-t border-bg-line pt-4">
          <h2 className="text-sm font-black text-bg-green inline-flex items-center gap-2 mb-3">
            <MapPin className="size-4" />
            الموقع
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="الدولة" required>
              <select name="country" required className="input" defaultValue="الكويت">
                {COUNTRIES.map(([name, flag]) => (
                  <option key={name} value={name}>
                    {flag} {name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="المحافظة / المنطقة">
              <input name="governorate" className="input" placeholder="مثال: حولي" />
            </Field>
            <Field label="المدينة">
              <input name="city" className="input" placeholder="مثال: السالمية" />
            </Field>
          </div>
          <Field label="العنوان التفصيلي" className="mt-3">
            <input name="address" className="input" placeholder="شارع، مبنى، طابق..." />
          </Field>
        </section>

        {/* ── Section 5: Legal + web ────────────────── */}
        <section className="border-t border-bg-line pt-4">
          <h2 className="text-sm font-black text-bg-green inline-flex items-center gap-2 mb-3">
            <Globe className="size-4" />
            الوثائق والموقع
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="الرقم التجاري (CRN)">
              <input name="crn" className="input tabular" placeholder="12345" dir="ltr" />
            </Field>
            <Field label="الرقم الضريبي">
              <input name="taxNumber" className="input tabular" placeholder="VAT No." dir="ltr" />
            </Field>
            <Field label="الموقع الإلكتروني">
              <input name="website" className="input" placeholder="https://example.com" dir="ltr" />
            </Field>
          </div>
        </section>

        {/* ── Section 6: Commercial + languages ────── */}
        <section className="border-t border-bg-line pt-4 bg-bg-green-lt/40 -mx-5 px-5 pt-5 pb-4 rounded-b-card">
          <h2 className="text-sm font-black text-bg-green inline-flex items-center gap-2 mb-3">
            💼 الشروط التجارية ولغة العرض
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="العملة" required>
              <select name="currency" required className="input" defaultValue="KWD">
                <option value="KWD">KWD — د.ك (الكويت)</option>
                <option value="SAR">SAR — ر.س (السعودية)</option>
                <option value="AED">AED — د.إ (الإمارات)</option>
                <option value="USD">USD — $ (عالمي)</option>
              </select>
            </Field>
            <Field label="صلاحية العرض">
              <select name="validity" className="input" defaultValue="30 يوم">
                <option>30 يوم</option>
                <option>45 يوم</option>
                <option>60 يوم</option>
                <option>15 يوم</option>
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <Field
              label="لغة العرض المطبوع"
              hint="لغة ملف HTML النهائي"
              required
            >
              <select name="quoteLanguage" required className="input" defaultValue="ar">
                <option value="ar">🇰🇼 العربية — RTL</option>
                <option value="en">🇬🇧 English — LTR</option>
              </select>
            </Field>
            <Field label="لغة التواصل مع العميل">
              <select name="communicationLanguage" className="input" defaultValue="ar">
                <option value="ar">العربية</option>
                <option value="en">الإنجليزية</option>
              </select>
            </Field>
            <Field label="عمولة (%) إن وجدت">
              <input
                name="commissionPct"
                type="number"
                step="0.5"
                min={0}
                max={100}
                defaultValue={0}
                className="input tabular"
                dir="ltr"
              />
            </Field>
          </div>
        </section>

        <button type="submit" className="btn-primary w-full inline-flex items-center justify-center gap-1.5 h-11">
          <Plus className="size-5" />
          إنشاء العرض وفتح Builder
        </button>
        <p className="text-[10px] text-bg-text-3 text-center">
          سيُنشأ للعميل ملف كامل في قاعدة البيانات ويُربط تلقائياً بكل العروض
          المستقبلية لنفس العميل.
        </p>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  hint,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`space-y-1 ${className ?? ""}`}>
      <label className="text-xs font-bold text-bg-text-2 block">
        {label} {required && <span className="text-bg-danger">*</span>}
      </label>
      {children}
      {hint && <span className="text-[10px] text-bg-text-3">{hint}</span>}
    </div>
  );
}
