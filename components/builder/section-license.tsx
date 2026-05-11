"use client";

import { SectionCard, Field } from "./section-card";
import { useBuilderStore } from "@/lib/builder/store";
import { LICENSE_PRICING } from "@/lib/modules-catalog";
import { cn, fmtNum, curSymbol } from "@/lib/utils";
import { useEffect } from "react";

const LICENSES = [
  { id: "Community", name: "Community", note: "مفتوح المصدر — بدون دعم Odoo الرسمي", tag: "" },
  { id: "Odoo.sh", name: "Odoo.sh", note: "سعر الخادم + 15$/user — سحابي رسمي", tag: "موصى به" },
  { id: "Enterprise On-Premise", name: "Enterprise", note: "استضافة خاصة — صلاحية كاملة على الكود", tag: "⭐" },
] as const;

export function SectionLicense() {
  const lic = useBuilderStore((s) => s.license);
  const setLic = useBuilderStore((s) => s.setLicense);
  const autoLicensePrices = useBuilderStore((s) => s.autoLicensePrices);
  const currency = useBuilderStore((s) => s.meta.currency);
  const cur = curSymbol(currency);

  // Auto-price on license/server change (unless manually overridden)
  useEffect(() => {
    autoLicensePrices();
  }, [lic.type, lic.serverType, lic.exchangeRate, lic.users, autoLicensePrices]);

  const licMonthly = Math.round(lic.serverMonthly + lic.perUserMonthly * lic.users);

  return (
    <SectionCard icon="🔑" title="الترخيص والاستضافة" subtitle="السعر يتغير بناءً على نوع الخادم وعدد المستخدمين والعملة">
      {/* Warning banner */}
      <div className="rounded-sm2 p-3 mb-3 bg-gradient-to-br from-bg-danger to-[#e74c3c] text-white flex items-start gap-3">
        <div className="text-2xl shrink-0">⚠️</div>
        <div className="flex-1 space-y-1">
          <div className="text-sm font-black">الأسعار إرشادية من Odoo — تخضع لسعر الصرف</div>
          <div className="text-[11px] text-white/85 leading-relaxed">
            الأسعار المعروضة محسوبة من الأسعار الرسمية لـ Odoo بالدولار الأمريكي (USD) ومُحوَّلة تقريبياً
            للعملة المحددة.{" "}
            <strong className="text-white">يجب تأكيدها بعرض رسمي مباشر من Odoo</strong> قبل إدراجها في أي عقد.
          </div>
        </div>
      </div>

      {/* Exchange rate */}
      <div className="bg-bg-gold-lt border-[1.5px] border-bg-gold rounded-sm2 px-3 py-2.5 mb-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-[#8a6010]">💱 سعر الصرف:</span>
        <span className="text-xs text-bg-text-2">1 USD =</span>
        <input
          type="number"
          value={lic.exchangeRate}
          min={0.001}
          step={0.001}
          onChange={(e) => setLic("exchangeRate", parseFloat(e.target.value) || 1)}
          className="w-[90px] rounded-sm2 border-2 border-bg-gold px-2 py-1 text-sm font-black text-bg-green"
        />
        <span className="text-xs font-bold text-bg-green">{cur}</span>
        <span className="text-[10px] text-bg-text-3 italic">الأسعار الإرشادية أدناه ستُحوَّل تلقائياً</span>
      </div>

      {/* License cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
        {LICENSES.map((l) => {
          const active = lic.type === l.id;
          const isGold = l.id === "Enterprise On-Premise";
          const pricing = LICENSE_PRICING[l.id][lic.serverType] ?? { base: 0, perUser: 0 };
          const total = Math.round((pricing.base + pricing.perUser * lic.users) * lic.exchangeRate);
          return (
            <button
              key={l.id}
              type="button"
              onClick={() => setLic("type", l.id)}
              className={cn(
                "rounded-sm2 border-[1.5px] p-3 text-right transition-colors",
                active && isGold && "border-bg-gold bg-bg-gold-lt",
                active && !isGold && "border-bg-green bg-bg-green-lt",
                !active && "border-bg-line hover:border-bg-green-2"
              )}
            >
              <div className={cn("text-xs font-black", isGold && "text-[#8a6010]")}>
                {l.name}
                {l.tag && (
                  <span className="text-[9px] font-black bg-bg-gold text-bg-green px-1.5 py-0.5 rounded-full mr-1.5">
                    {l.tag}
                  </span>
                )}
              </div>
              <div className={cn("text-lg font-black mt-1", isGold ? "text-[#8a6010]" : "text-bg-green")}>
                {l.id === "Community" ? "مجاني" : `${fmtNum(total)} ${cur}/شهر`}
              </div>
              <div className="text-[10px] text-bg-text-3 mt-1 leading-relaxed">{l.note}</div>
            </button>
          );
        })}
      </div>

      {/* User slider */}
      <div className="p-3 bg-bg-card-alt rounded-sm2 border border-bg-line mb-3">
        <label className="flex justify-between text-xs font-bold text-bg-text-2 mb-2">
          عدد المستخدمين
          <span className="text-base font-black text-bg-green">{lic.users}</span>
        </label>
        <input
          type="range"
          min={1}
          max={100}
          step={1}
          value={lic.users}
          onChange={(e) => setLic("users", parseInt(e.target.value))}
          className="w-full accent-bg-green"
        />
        <div className="flex justify-between text-[10px] text-bg-text-3 mt-1">
          <span>1</span>
          <span>25</span>
          <span>50</span>
          <span>75</span>
          <span>100</span>
        </div>
      </div>

      <div className="h-px bg-bg-line my-3" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Field label="نوع الخادم">
          <select
            className="input"
            value={lic.serverType}
            onChange={(e) => setLic("serverType", e.target.value as typeof lic.serverType)}
          >
            <option value="cloud">Cloud — سحابي (Odoo.sh)</option>
            <option value="vps">VPS — خادم افتراضي</option>
            <option value="dedicated">Dedicated — مخصص</option>
            <option value="onprem">On-Premise — داخلي</option>
          </select>
        </Field>
        <Field label="سعر الخادم/شهر">
          <input
            type="number"
            className="input"
            value={lic.serverMonthly}
            onChange={(e) => {
              setLic("manualServer", true);
              setLic("serverMonthly", parseFloat(e.target.value) || 0);
            }}
          />
        </Field>
        <Field label="سعر المستخدم/شهر">
          <input
            type="number"
            className="input"
            value={lic.perUserMonthly}
            onChange={(e) => {
              setLic("manualPerUser", true);
              setLic("perUserMonthly", parseFloat(e.target.value) || 0);
            }}
          />
        </Field>
      </div>

      {/* Green summary box */}
      <div className="mt-3 bg-bg-green rounded-sm2 overflow-hidden">
        <div className="p-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[10px] text-white/60 mb-1">التكلفة الشهرية الإجمالية</div>
            <div className="text-xl font-black text-white">
              {fmtNum(licMonthly)} <span className="text-xs text-white/70">/{cur}</span>
            </div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/60 mb-1">التكلفة السنوية</div>
            <div className="text-base font-black text-bg-gold">{fmtNum(licMonthly * 12)} {cur}</div>
          </div>
          <div className="text-center">
            <div className="text-[10px] text-white/60 mb-1">لمدة 3 سنوات</div>
            <div className="text-base font-black text-bg-gold">{fmtNum(licMonthly * 36)} {cur}</div>
          </div>
        </div>
        <div className="px-3 py-1.5 bg-white/10 text-[10px] text-white/70 flex gap-3 flex-wrap">
          <span>خادم: {fmtNum(lic.serverMonthly)} {cur}</span>
          <span>+</span>
          <span>{lic.users} مستخدم × {fmtNum(lic.perUserMonthly)} = {fmtNum(Math.round(lic.perUserMonthly * lic.users))} {cur}</span>
        </div>
        <div className="px-3 py-1.5 bg-bg-danger/40 text-[10px] text-[#ffcccc]">
          ⚠ الأسعار إرشادية من Odoo — تخضع لسعر الصرف وتُؤكَّد بعرض رسمي
        </div>
      </div>

      <div className="mt-3 rounded-sm2 border-[1.5px] border-bg-gold bg-bg-gold-lt p-3">
        <label className="flex items-start gap-2 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5"
            checked={lic.includeOdooInTotal}
            onChange={(e) => setLic("includeOdooInTotal", e.target.checked)}
          />
          <div className="flex-1">
            <div className="text-xs font-bold text-[#8a6010]">
              إضافة تكلفة Odoo للإجمالي الكلي في العرض
            </div>
            <div className="text-[10px] text-bg-text-3 mt-0.5">
              عند التفعيل يظهر في الملخص المالي: تطوير + تكلفة Odoo × N شهر
            </div>
          </div>
        </label>
        {lic.includeOdooInTotal && (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-bg-text-2">عدد الأشهر:</span>
            <select
              className="input py-1 text-xs w-auto"
              value={lic.licenseMonths}
              onChange={(e) => setLic("licenseMonths", parseInt(e.target.value) || 12)}
            >
              {[3, 6, 12, 24, 36].map((m) => (
                <option key={m} value={m}>{m} شهر</option>
              ))}
            </select>
            <span className="text-[11px] text-bg-text-3">
              = {fmtNum(licMonthly * lic.licenseMonths)} {cur}
            </span>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
