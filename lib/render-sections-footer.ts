/** §13 Support + §14 Terms + §15 Signature — dynamic */
import type { QuoteBuilderState } from "./builder/types";
import { SUPPORT_PACKAGES } from "./modules-catalog";
import { fmtNum, curSymbol } from "./utils";

function esc(s: string) { return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;"); }

export function renderSupportHtml(state: QuoteBuilderState, isAr: boolean): string {
  const cur = curSymbol(state.meta.currency);
  const title = isAr ? "باقات الدعم الفني" : "Technical Support Packages";

  let html = `<section id="support" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;background:#f7f9f6;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">🛟</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div>
      <div style="font-size:11px;color:#7a8e80;">${isAr ? `الدعم المجاني: ${state.support.freeSupport}` : `Free support: ${state.support.freeSupport}`}</div></div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;">`;

  SUPPORT_PACKAGES.forEach(pk => {
    const active = state.support.packageId === pk.id;
    const price = pk.id === "none" ? 0 : state.support.prices[pk.id as "basic"|"advanced"|"premium"] ?? pk.price;
    html += `<div style="border:1.5px solid ${active ? "#1a5c37" : "#e2e8e3"};border-radius:8px;padding:14px;background:${active ? "#eaf3ed" : "#fff"};page-break-inside:avoid;${active ? "box-shadow:0 2px 12px rgba(26,92,55,0.12);" : ""}">
      ${active ? `<div style="font-size:8px;font-weight:800;background:#c9a84c;color:#1a5c37;display:inline-block;padding:1px 8px;border-radius:8px;margin-bottom:6px;">${isAr ? "محدّد" : "SELECTED"}</div>` : ""}
      <div style="font-size:12px;font-weight:800;color:${active ? "#1a5c37" : "#3e5446"};margin-bottom:4px;">${esc(pk.name)}</div>
      <div style="font-size:20px;font-weight:800;color:#1a5c37;margin-bottom:2px;">${price > 0 ? fmtNum(price) : "—"}</div>
      <div style="font-size:10px;color:#7a8e80;margin-bottom:8px;">${price > 0 ? `${cur}/${isAr ? "شهر" : "mo"}` : ""} · ${pk.hoursNote}</div>
      <ul style="list-style:none;padding:0;margin:0;">
        ${pk.features.map(f => `<li style="font-size:10px;color:#3e5446;padding:3px 0;border-bottom:1px solid #f0f2ef;position:relative;padding-right:14px;">
          <span style="position:absolute;right:0;color:#1a5c37;font-weight:800;font-size:9px;">✓</span>${esc(f)}
        </li>`).join("")}
      </ul>
    </div>`;
  });

  html += `</div></section>`;
  return html;
}

export function renderTermsHtml(state: QuoteBuilderState, isAr: boolean): string {
  const title = isAr ? "الشروط والأحكام" : "Terms & Conditions";
  const terms = isAr ? [
    {t:"الاعتماد",d:"النسخة الموقعة أو الموافقة الخطية تعتبر قبولاً رسمياً."},
    {t:"السرّية",d:"يلتزم الطرفان بمعاملة جميع المعلومات المتبادلة بسرّية تامة."},
    {t:"الضمان",d:"تُعالج الأخطاء المكتشفة خلال 3 أشهر من الإطلاق مجاناً."},
    {t:"التأخير",d:"التأخيرات الناتجة عن العميل لا تُمدّد التزامات بوابة الأعمال."},
    {t:"الملكية الفكرية",d:"التطويرات المخصصة تبقى ملكاً لـ Business Gate حتى السداد الكامل."},
    {t:"الصلاحية",d:`هذا العرض صالح لمدة ${state.meta.validity || "30 يوم"} من تاريخ الإصدار.`},
  ] : [
    {t:"Acceptance",d:"A signed copy or written approval constitutes formal acceptance."},
    {t:"Confidentiality",d:"Both parties agree to treat all shared information as strictly confidential."},
    {t:"Warranty",d:"Bugs identified within 3 months of go-live will be resolved at no charge."},
    {t:"Delays",d:"Delays caused by client-side factors will not extend Business Gate's obligations."},
    {t:"IP",d:"Custom developments remain Business Gate property until full payment."},
    {t:"Validity",d:`This quotation is valid for ${state.meta.validity || "30 days"} from the issue date.`},
  ];

  return `<section id="terms" style="padding:28px 20px;border-bottom:1px solid #e2e8e3;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#1a5c37;color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">📜</div>
      <div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
      ${terms.map(t => `<div style="border:1px solid #e2e8e3;border-radius:8px;padding:12px;page-break-inside:avoid;">
        <div style="font-size:11px;font-weight:700;color:#1a5c37;margin-bottom:4px;">${esc(t.t)}</div>
        <div style="font-size:10px;color:#3e5446;line-height:1.6;">${esc(t.d)}</div>
      </div>`).join("")}
    </div>
  </section>`;
}

export function renderSignatureHtml(state: QuoteBuilderState, isAr: boolean): string {
  // The SIGNATORY is always م. محمود عون (CEO) — fixed.
  const signatory = {
    name: isAr ? "م. محمود عون" : "Eng. Mahmoud Oun",
    role: isAr ? "المدير التنفيذي والمؤسس المشارك" : "CEO & Co-Founder",
    phone: "+965 9999 0412",
    email: "OUN@businessesgates.com",
  };

  // The CONTACT PERSON is whoever was selected in the Builder.
  const contact = state.contacts.find(c => c.id === state.selectedContactId) || state.contacts[0];

  const client = isAr ? state.client.nameAr : (state.client.nameEn || state.client.nameAr);
  const title = isAr ? "الاعتماد والتوقيع" : "Approval & Signature";
  const ref = state.meta.ref || "";

  return `<section id="sign" style="padding:28px 20px;page-break-inside:avoid;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      <div style="width:30px;height:30px;background:#c9a84c;color:#1a5c37;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:800;">✍</div>
      <div><div style="font-size:17px;font-weight:700;color:#1a5c37;">${title}</div>
      <div style="font-size:11px;color:#7a8e80;">${ref} — ${state.meta.date||""}</div></div>
    </div>
    <div style="background:#eaf3ed;border:1px solid #1a5c37;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:11px;color:#1a5c37;">
      ${isAr ? "بالتوقيع أدناه، يُعتمد العرض ويبدأ التنفيذ بحسب مراحل المشروع المحددة." : "By signing below, both parties agree to the terms and scope outlined in this quotation."}
    </div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:20px;">

      <!-- BG Side — ALWAYS م. محمود عون -->
      <div style="border:1.5px solid #1a5c37;border-radius:10px;overflow:hidden;">
        <div style="background:#1a5c37;color:#fff;padding:10px 16px;font-size:12px;font-weight:700;">Business Gate Technical Consulting</div>
        <div style="padding:16px;">
          <div style="font-size:13px;font-weight:700;color:#141f18;margin-bottom:10px;">${esc(signatory.name)}</div>
          ${[
            [isAr?"المسمى":"Title", signatory.role],
            [isAr?"الهاتف":"Phone", signatory.phone],
            [isAr?"البريد":"Email", signatory.email],
            [isAr?"رقم العرض":"Ref", ref],
          ].map(([l,v]) => `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f0f2ef;font-size:11px;">
            <span style="color:#7a8e80;font-weight:600;">${l}:</span><span style="color:#141f18;">${esc(v||"")}</span>
          </div>`).join("")}
          <div style="border-bottom:1px solid #141f18;margin-top:30px;"></div>
          <div style="font-size:10px;color:#7a8e80;margin-top:4px;text-align:center;">${isAr ? "التوقيع والختم" : "Signature & Stamp"}</div>
        </div>
      </div>

      <!-- Client Side -->
      <div style="border:1.5px solid #c9a84c;border-radius:10px;overflow:hidden;">
        <div style="background:#c9a84c;color:#1a5c37;padding:10px 16px;font-size:12px;font-weight:700;">${esc(client||"العميل")}</div>
        <div style="padding:16px;">
          ${[
            [isAr?"الاسم":"Name",""],
            [isAr?"المنصب":"Title",""],
            [isAr?"التاريخ":"Date",""],
          ].map(([l]) => `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #f0f2ef;font-size:11px;">
            <span style="color:#7a8e80;font-weight:600;">${l}:</span><span style="color:#c4d0c8;">________________________</span>
          </div>`).join("")}
          <div style="border:1.5px dashed #c4d0c8;border-radius:6px;height:40px;margin-top:12px;"></div>
          <div style="font-size:10px;color:#7a8e80;margin-top:4px;text-align:center;">${isAr?"ختم الشركة":"Company Stamp"}</div>
          <div style="border-bottom:1px solid #141f18;margin-top:20px;"></div>
          <div style="font-size:10px;color:#7a8e80;margin-top:4px;text-align:center;">${isAr?"توقيع مفوّض":"Authorized Signature"}</div>
        </div>
      </div>
    </div>

    <!-- Footer: جهة الاتصال المحددة (ليست المفوّض بالتوقيع) -->
    <div style="margin-top:16px;padding-top:12px;border-top:1px solid #e2e8e3;">
      <div style="font-size:10px;color:#7a8e80;margin-bottom:4px;">${isAr ? "جهة الاتصال لهذا العرض:" : "Quote Contact Person:"}</div>
      <div style="font-size:12px;font-weight:700;color:#1a5c37;">${esc(contact?.name || signatory.name)}</div>
      <div style="font-size:10px;color:#3e5446;">${esc(contact?.role || signatory.role)} | ${esc(contact?.email || signatory.email)} | ${esc(contact?.phone || signatory.phone)}</div>
      <div style="font-size:10px;color:#7a8e80;margin-top:4px;">www.businessesgates.com</div>
    </div>
  </section>`;
}
