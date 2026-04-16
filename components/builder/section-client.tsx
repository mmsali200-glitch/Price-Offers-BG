"use client";

import { SectionCard, Field } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { ODOO_VERSIONS } from "@/lib/modules-catalog";
import { cn } from "@/lib/utils";

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

export function SectionClient() {
  const meta = useBuilderStore((s) => s.meta);
  const client = useBuilderStore((s) => s.client);
  const setMeta = useBuilderStore((s) => s.setMeta);
  const setClient = useBuilderStore((s) => s.setClient);

  return (
    <SectionCard icon="🏢" title="بيانات الشركة والمشروع" subtitle="معلومات العميل وقطاع النشاط">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Field label="اسم العميل (عربي)" required>
          <input className="input" value={client.nameAr ?? ""} onChange={(e) => setClient("nameAr", e.target.value)} placeholder="شركة النور للتجارة" />
        </Field>
        <Field label="اسم العميل (إنجليزي)">
          <input className="input" value={client.nameEn ?? ""} onChange={(e) => setClient("nameEn", e.target.value)} placeholder="Al-Noor Trading Co." />
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="رقم العرض" required hint="BG-YYYY-XXX-NNN">
          <input className="input" value={meta.ref} onChange={(e) => setMeta("ref", e.target.value)} placeholder="BG-2026-NOR-001" />
        </Field>
        <Field label="تاريخ الإصدار">
          <input className="input" value={meta.date} onChange={(e) => setMeta("date", e.target.value)} placeholder="أبريل 2026" />
        </Field>
        <Field label="العملة">
          <select
            className="input"
            value={meta.currency}
            onChange={(e) => setMeta("currency", e.target.value as typeof meta.currency)}
          >
            <option value="KWD">KWD — د.ك</option>
            <option value="SAR">SAR — ر.س</option>
            <option value="AED">AED — د.إ</option>
            <option value="USD">USD — $</option>
          </select>
        </Field>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="قطاع النشاط">
          <select className="input" value={client.sector ?? ""} onChange={(e) => setClient("sector", e.target.value)}>
            {SECTORS.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="حجم الشركة">
          <select className="input" value={client.employeeSize ?? ""} onChange={(e) => setClient("employeeSize", e.target.value)}>
            {SIZES.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </Field>
        <Field label="صلاحية العرض">
          <select className="input" value={meta.validity} onChange={(e) => setMeta("validity", e.target.value)}>
            <option>30 يوم</option>
            <option>45 يوم</option>
            <option>60 يوم</option>
            <option>15 يوم</option>
          </select>
        </Field>
      </div>
      <Field label="نشاط العميل (وصف مختصر)">
        <input
          className="input"
          value={client.businessActivity ?? ""}
          onChange={(e) => setClient("businessActivity", e.target.value)}
          placeholder="مثال: توزيع مواد غذائية على المحلات التجارية"
        />
      </Field>

      <div className="h-px bg-bg-line my-4" />

      <div className="text-[10px] font-black text-bg-green uppercase tracking-wider mb-2">
        📞 جهة الاتصال
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="الاسم">
          <input className="input" value={client.contactName ?? ""}
            onChange={(e) => setClient("contactName", e.target.value)}
            placeholder="أحمد الخالد" />
        </Field>
        <Field label="الهاتف">
          <input className="input tabular" dir="ltr" value={client.contactPhone ?? ""}
            onChange={(e) => setClient("contactPhone", e.target.value)}
            placeholder="+965 9999 0000" />
        </Field>
        <Field label="البريد الإلكتروني">
          <input className="input" dir="ltr" value={client.contactEmail ?? ""}
            onChange={(e) => setClient("contactEmail", e.target.value)}
            placeholder="name@example.com" />
        </Field>
      </div>

      <div className="text-[10px] font-black text-bg-green uppercase tracking-wider mb-2">
        📍 الموقع
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
        <Field label="الدولة">
          <select className="input" value={client.country ?? ""}
            onChange={(e) => setClient("country", e.target.value)}>
            <option value="الكويت">🇰🇼 الكويت</option>
            <option value="السعودية">🇸🇦 السعودية</option>
            <option value="الإمارات">🇦🇪 الإمارات</option>
            <option value="قطر">🇶🇦 قطر</option>
            <option value="البحرين">🇧🇭 البحرين</option>
            <option value="عمان">🇴🇲 عمان</option>
            <option value="مصر">🇪🇬 مصر</option>
            <option value="الأردن">🇯🇴 الأردن</option>
            <option value="أخرى">🌍 أخرى</option>
          </select>
        </Field>
        <Field label="المحافظة">
          <input className="input" value={client.governorate ?? ""}
            onChange={(e) => setClient("governorate", e.target.value)}
            placeholder="حولي" />
        </Field>
        <Field label="المدينة">
          <input className="input" value={client.city ?? ""}
            onChange={(e) => setClient("city", e.target.value)}
            placeholder="السالمية" />
        </Field>
        <Field label="العنوان">
          <input className="input" value={client.address ?? ""}
            onChange={(e) => setClient("address", e.target.value)}
            placeholder="شارع، مبنى..." />
        </Field>
      </div>

      <div className="text-[10px] font-black text-bg-green uppercase tracking-wider mb-2">
        🧾 الوثائق
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <Field label="الرقم التجاري (CRN)">
          <input className="input tabular" dir="ltr" value={client.crn ?? ""}
            onChange={(e) => setClient("crn", e.target.value)} placeholder="12345" />
        </Field>
        <Field label="الرقم الضريبي">
          <input className="input tabular" dir="ltr" value={client.taxNumber ?? ""}
            onChange={(e) => setClient("taxNumber", e.target.value)} placeholder="VAT" />
        </Field>
        <Field label="الموقع الإلكتروني">
          <input className="input" dir="ltr" value={client.website ?? ""}
            onChange={(e) => setClient("website", e.target.value)}
            placeholder="https://example.com" />
        </Field>
      </div>

      <div className="text-[10px] font-black text-bg-green uppercase tracking-wider mb-2">
        💼 الشروط التجارية
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
        <Field label="لغة التواصل">
          <select className="input" value={client.communicationLanguage ?? ""}
            onChange={(e) => setClient("communicationLanguage", e.target.value as "ar" | "en")}>
            <option value="ar">العربية</option>
            <option value="en">English</option>
          </select>
        </Field>
        <Field label="عمولة (%)">
          <input type="number" min={0} max={100} step={0.5} className="input tabular" dir="ltr"
            value={client.commissionPct ?? 0}
            onChange={(e) => setClient("commissionPct", parseFloat(e.target.value) || 0)} />
        </Field>
      </div>

      <Field label="وصف نشاط الشركة (للتوليد التلقائي)">
        <textarea
          className="input min-h-[70px] resize-y"
          value={client.businessDesc ?? ""}
          onChange={(e) => setClient("businessDesc", e.target.value)}
          placeholder="مثال: شركة متخصصة في توزيع المواد الغذائية على المحلات التجارية في الكويت..."
        />
      </Field>
    </SectionCard>
  );
}

export function SectionVersion() {
  const version = useBuilderStore((s) => s.odooVersion);
  const setVersion = useBuilderStore((s) => s.setOdooVersion);
  const current = ODOO_VERSIONS[version];

  return (
    <SectionCard icon="⚙️" title="إصدار Odoo" subtitle="اختر الإصدار المناسب للمشروع">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.keys(ODOO_VERSIONS) as Array<keyof typeof ODOO_VERSIONS>).map((v) => {
          const meta = ODOO_VERSIONS[v];
          const active = version === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setVersion(v)}
              className={cn(
                "rounded-sm2 border-2 px-3 py-3 text-center transition-colors",
                active
                  ? "border-bg-green bg-bg-green-lt text-bg-green"
                  : "border-bg-line text-bg-text-2 hover:border-bg-green-2 hover:text-bg-green",
              )}
            >
              <div className="text-sm font-black">Odoo {v}</div>
              <div className={cn("text-[10px] mt-0.5", active ? "text-bg-green-2" : "text-bg-text-3")}>
                {meta.sub}
              </div>
            </button>
          );
        })}
      </div>
      <div className="mt-3 text-xs leading-relaxed text-bg-text-2 bg-bg-card-alt rounded-sm2 border border-bg-line px-3 py-2.5">
        {current.description}
      </div>
    </SectionCard>
  );
}

export function SectionLanguage() {
  const language = useBuilderStore((s) => s.language);
  const setLanguage = useBuilderStore((s) => s.setLanguage);
  return (
    <SectionCard icon="🌐" title="لغة العرض" subtitle="يظهر محتوى العرض بالعربية أو بالإنجليزية" tone="info">
      <div className="flex gap-2">
        {[
          { v: "ar" as const, label: "العربية", sub: "RTL + Noto Sans Arabic" },
          { v: "en" as const, label: "English", sub: "LTR + Inter font" },
        ].map((opt) => (
          <button
            key={opt.v}
            type="button"
            onClick={() => setLanguage(opt.v)}
            className={cn(
              "flex-1 rounded-sm2 border-2 px-4 py-3 text-center transition-colors",
              language === opt.v
                ? "border-bg-green bg-bg-green-lt text-bg-green"
                : "border-bg-line text-bg-text-2 hover:border-bg-green-2"
            )}
          >
            <div className="text-sm font-black">{opt.label}</div>
            <div className={cn("text-[10px] mt-0.5", language === opt.v ? "text-bg-green-2" : "text-bg-text-3")}>
              {opt.sub}
            </div>
          </button>
        ))}
      </div>
    </SectionCard>
  );
}
