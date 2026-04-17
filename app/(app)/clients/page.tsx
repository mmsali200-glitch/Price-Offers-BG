import Link from "next/link";
import { Users, Plus, Building, Phone, FileText, MapPin } from "lucide-react";
import { listClients } from "@/lib/actions/clients";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";

export const metadata = { title: "العملاء · BG Quotes" };
export const dynamic = "force-dynamic";

const SECTOR_AR: Record<string, string> = {
  trading: "تجارة", manufacturing: "تصنيع", services: "خدمات",
  healthcare: "صحة", construction: "مقاولات", realestate: "عقارات",
  logistics: "لوجستيات", retail: "تجزئة", food: "أغذية",
  education: "تعليم", government: "حكومي", other: "أخرى",
};

export default async function ClientsPage() {
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  try {
    clients = await listClients();
  } catch (err) {
    console.error("[clients]", err);
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-bg-green inline-flex items-center gap-2">
            <Users className="size-6" />
            العملاء
          </h1>
          <p className="text-sm text-bg-text-3 mt-1">
            {clients.length > 0
              ? `${clients.length} عميل — اضغط على أي عميل لعرض كل عروضه`
              : "يُضاف العملاء تلقائياً عند إنشاء أول عرض لهم."}
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5">
          <Plus className="size-4" />
          عرض جديد
        </Link>
      </header>

      {clients.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <div className="text-4xl">👥</div>
          <h2 className="text-lg font-bold text-bg-green">لا يوجد عملاء بعد</h2>
          <p className="text-sm text-bg-text-3">
            سيُضاف العملاء تلقائياً عند إنشاء أول عرض.
          </p>
          <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5 mt-2">
            <Plus className="size-4" />
            أنشئ أول عرض
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {clients.map((c) => (
            <Link
              key={c.id}
              href={`/clients/${c.id}`}
              className="card p-4 card-hover block"
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-bg-green-lt text-bg-green flex items-center justify-center">
                    <Building className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-black text-bg-text-1 truncate">
                      {c.name_ar}
                    </div>
                    {c.name_en && (
                      <div className="text-[10px] text-bg-text-3 truncate" dir="ltr">
                        {c.name_en}
                      </div>
                    )}
                  </div>
                </div>
                {c.sector && (
                  <span className="text-[10px] font-bold bg-bg-green-lt text-bg-green px-2 py-0.5 rounded-full shrink-0">
                    {SECTOR_AR[c.sector] ?? c.sector}
                  </span>
                )}
              </div>

              <div className="space-y-1.5 text-[11px] text-bg-text-2">
                {c.contact_name && (
                  <div className="flex items-center gap-2">
                    <Phone className="size-3 text-bg-text-3" />
                    <span>{c.contact_name}</span>
                    {c.contact_phone && <span className="text-bg-text-3 tabular" dir="ltr">{c.contact_phone}</span>}
                  </div>
                )}
                {c.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3 text-bg-text-3" />
                    <span>{[c.country, c.city].filter(Boolean).join(" · ")}</span>
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-bg-line flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs">
                  <FileText className="size-3.5 text-bg-green" />
                  <span className="font-bold text-bg-green tabular">{c.quote_count}</span>
                  <span className="text-bg-text-3">عرض</span>
                </div>
                <div className="text-xs tabular">
                  {c.total_value > 0 ? (
                    <span className="font-bold text-bg-gold">{fmtNum(c.total_value)} د.ك</span>
                  ) : (
                    <span className="text-bg-text-3">—</span>
                  )}
                </div>
                {c.last_quote_date && (
                  <div className="text-[10px] text-bg-text-3">
                    آخر عرض: {fmtDateArabic(c.last_quote_date)}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
