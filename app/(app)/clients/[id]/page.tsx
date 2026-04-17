import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowRight, Building, Phone, Mail, MapPin, Globe,
  FileText, Plus, Hash,
} from "lucide-react";
import { getClientWithQuotes } from "@/lib/actions/clients";
import { getCurrentRole } from "@/lib/actions/users";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";
import { EditClientButton, DeleteClientButton, DeleteQuoteButton } from "./admin-actions";

export const metadata = { title: "بيانات العميل · BG Quotes" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "مسودة", color: "bg-bg-line text-bg-text-2" },
  sent: { label: "مُرسل", color: "bg-bg-info-lt text-bg-info" },
  opened: { label: "مفتوح", color: "bg-bg-gold-lt text-[#8a6010]" },
  accepted: { label: "مقبول", color: "bg-bg-green-lt text-bg-green" },
  rejected: { label: "مرفوض", color: "bg-red-50 text-bg-danger" },
  expired: { label: "منتهٍ", color: "bg-gray-100 text-gray-500" },
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getClientWithQuotes(id);
  if (!result) notFound();

  const { client: c, quotes } = result;
  const totalValue = quotes.reduce((s, q) => s + (q.total_development || 0), 0);
  const role = await getCurrentRole();
  const isAdmin = role === "admin";

  return (
    <div className="page-padding space-y-4 sm:space-y-6 max-w-5xl">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/clients" className="btn-outline inline-flex items-center gap-1.5 h-8 text-xs">
          <ArrowRight className="size-3.5" />
          العملاء
        </Link>
      </div>

      {/* Client card */}
      <div className="card p-5">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="size-14 rounded-xl bg-bg-green text-bg-gold flex items-center justify-center text-2xl font-black">
            {c.name_ar?.slice(0, 2) || ".."}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-black text-bg-green">{c.name_ar}</h1>
            {c.name_en && (
              <div className="text-sm text-bg-text-3" dir="ltr">{c.name_en}</div>
            )}
          </div>
          <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5 text-xs">
            <Plus className="size-4" />
            عرض جديد لهذا العميل
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-5 pt-5 border-t border-bg-line">
          <InfoItem icon={<Building className="size-4" />} label="القطاع" value={c.sector || "—"} />
          <InfoItem icon={<MapPin className="size-4" />} label="الموقع" value={[c.country, c.city].filter(Boolean).join(" · ") || "—"} />
          <InfoItem icon={<Phone className="size-4" />} label="جهة الاتصال" value={c.contact_name || "—"} sub={c.contact_phone || undefined} />
          <InfoItem icon={<Mail className="size-4" />} label="البريد" value={c.contact_email || "—"} />
        </div>

        {(c.website || c.tax_number || c.crn || c.address) && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3 pt-3 border-t border-bg-line">
            {c.website && <InfoItem icon={<Globe className="size-4" />} label="الموقع الإلكتروني" value={c.website} />}
            {c.crn && <InfoItem icon={<Hash className="size-4" />} label="الرقم التجاري" value={c.crn} />}
            {c.tax_number && <InfoItem icon={<Hash className="size-4" />} label="الرقم الضريبي" value={c.tax_number} />}
            {c.address && <InfoItem icon={<MapPin className="size-4" />} label="العنوان" value={c.address} />}
          </div>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-bg-green tabular">{quotes.length}</div>
          <div className="text-xs text-bg-text-3">إجمالي العروض</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-bg-gold tabular">{fmtNum(totalValue)}</div>
          <div className="text-xs text-bg-text-3">القيمة الإجمالية (د.ك)</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-2xl font-black text-bg-green tabular">
            {quotes.filter((q) => q.status === "accepted").length}
          </div>
          <div className="text-xs text-bg-text-3">عروض مقبولة</div>
        </div>
      </div>

      {/* Admin actions */}
      {isAdmin && (
        <div className="flex flex-wrap gap-2">
          <EditClientButton
            clientId={c.id}
            current={{
              name_ar: c.name_ar, name_en: c.name_en,
              sector: c.sector, country: c.country,
              city: c.city, contact_name: c.contact_name,
              contact_phone: c.contact_phone, contact_email: c.contact_email,
              business_activity: c.business_activity, website: c.website,
            }}
          />
          <DeleteClientButton clientId={c.id} clientName={c.name_ar} />
        </div>
      )}

      {/* Quotes list */}
      <div className="card overflow-hidden">
        <div className="px-5 py-3 border-b border-bg-line flex items-center justify-between">
          <h2 className="text-sm font-black text-bg-green">عروض الأسعار</h2>
          <span className="text-[10px] text-bg-text-3">{quotes.length} عرض</span>
        </div>
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-sm text-bg-text-3">
            لا توجد عروض لهذا العميل بعد.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-bg-card-alt">
              <tr>
                <th className="px-3 py-2 text-right text-xs font-bold text-bg-text-3">رقم العرض</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-bg-text-3">الحالة</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-bg-text-3">القيمة</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-bg-text-3">تاريخ الإنشاء</th>
                <th className="px-3 py-2 text-right text-xs font-bold text-bg-text-3">آخر تحديث</th>
                {isAdmin && <th className="px-3 py-2 w-10"></th>}
              </tr>
            </thead>
            <tbody>
              {quotes.map((q) => {
                const badge = STATUS_LABELS[q.status] ?? STATUS_LABELS.draft;
                return (
                  <tr key={q.id} className="border-t border-bg-line hover:bg-bg-green-lt/30">
                    <td className="px-3 py-2.5">
                      <Link
                        href={`/quotes/${q.id}/edit`}
                        className="inline-flex items-center gap-1.5 text-bg-green font-bold hover:underline"
                      >
                        <FileText className="size-3.5" />
                        <span className="tabular">{q.ref}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.color}`}>
                        {badge.label}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 tabular">
                      {q.total_development
                        ? `${fmtNum(q.total_development)} ${curSymbol(q.currency)}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-bg-text-3">
                      {fmtDateArabic(q.created_at)}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-bg-text-3">
                      {fmtDateArabic(q.updated_at)}
                    </td>
                    {isAdmin && (
                      <td className="px-2 py-2.5">
                        <DeleteQuoteButton quoteId={q.id} quoteRef={q.ref} />
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function InfoItem({
  icon, label, value, sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-bg-text-3 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <div className="text-[10px] text-bg-text-3 font-bold">{label}</div>
        <div className="text-xs text-bg-text-1 truncate">{value}</div>
        {sub && <div className="text-[10px] text-bg-text-3 tabular" dir="ltr">{sub}</div>}
      </div>
    </div>
  );
}
