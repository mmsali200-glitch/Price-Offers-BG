import Link from "next/link";
import { FileSignature, ExternalLink, Building2 } from "lucide-react";
import { listContracts } from "@/lib/actions/contracts";
import { fmtNum, curSymbol, fmtDateArabic } from "@/lib/utils";

export const metadata = { title: "العقود · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function ContractsPage() {
  const contracts = await listContracts().catch((err) => {
    console.error("[contracts]", err);
    return [] as Awaited<ReturnType<typeof listContracts>>;
  });

  // Group by client so the user can scan all contracts per customer.
  const groups = new Map<
    string,
    { clientName: string; clientCountry: string | null; items: typeof contracts }
  >();
  for (const c of contracts) {
    const key = c.clientId || `__nameonly__${c.clientName ?? ""}`;
    if (!groups.has(key)) {
      groups.set(key, {
        clientName: c.clientName || "بدون اسم",
        clientCountry: c.clientCountry,
        items: [],
      });
    }
    groups.get(key)!.items.push(c);
  }

  const sortedGroups = Array.from(groups.values()).sort((a, b) =>
    a.clientName.localeCompare(b.clientName, "ar")
  );

  return (
    <div className="page-padding space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-2xl font-black text-bg-green">العقود</h1>
        <p className="text-sm text-bg-text-3 mt-1">
          {contracts.length > 0
            ? `${contracts.length} عقد عبر ${sortedGroups.length} عميل — مجمّع حسب العميل`
            : "تظهر هنا كل العقود التي تم إصدارها لعملائك."}
        </p>
      </header>

      {contracts.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <div className="text-4xl">📜</div>
          <h2 className="text-lg font-bold text-bg-green">لا توجد عقود بعد</h2>
          <p className="text-sm text-bg-text-3 max-w-md mx-auto">
            عند تأكيد قبول وتوقيع العميل على عرض سعر، يمكنك إصدار عقد له من
            شاشة معاينة العرض وسيظهر هنا.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {sortedGroups.map((g) => (
            <section key={g.clientName} className="card overflow-hidden">
              <header className="bg-bg-green-lt/40 border-b border-bg-line px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="size-8 rounded-lg bg-bg-green text-white flex items-center justify-center">
                    <Building2 className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-bg-green text-sm truncate">
                      {g.clientName}
                    </div>
                    {g.clientCountry && (
                      <div className="text-[10px] text-bg-text-3">{g.clientCountry}</div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-bg-green text-white px-2 py-0.5 rounded-full">
                  {g.items.length} {g.items.length === 1 ? "عقد" : "عقود"}
                </span>
              </header>

              <table className="w-full text-sm">
                <thead className="bg-bg-card-alt">
                  <tr>
                    <th className="px-3 py-2 text-right text-[11px] font-bold text-bg-text-2">رقم العقد</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold text-bg-text-2">عرض السعر</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold text-bg-text-2">قيمة العرض</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold text-bg-text-2">تاريخ الإصدار</th>
                    <th className="px-3 py-2 text-right text-[11px] font-bold text-bg-text-2">المنشئ</th>
                    <th className="px-3 py-2 w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((c) => (
                    <tr key={c.quoteId} className="border-t border-bg-line hover:bg-bg-green-lt/20">
                      <td className="px-3 py-2.5">
                        <span className="inline-flex items-center gap-1.5 text-bg-green font-bold tabular">
                          <FileSignature className="size-3.5" />
                          {c.contractRef}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <Link
                          href={`/quotes/${c.quoteId}/preview`}
                          className="text-xs text-bg-info hover:underline tabular"
                        >
                          {c.quoteRef}
                        </Link>
                      </td>
                      <td className="px-3 py-2.5 text-bg-text-1 tabular">
                        {fmtNum(c.totalDevelopment)} {curSymbol(c.currency)}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-bg-text-2">
                        {c.contractCreatedAt ? fmtDateArabic(c.contractCreatedAt) : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-bg-text-2">
                        {c.ownerName ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-left">
                        <Link
                          href={`/contracts/${c.quoteId}`}
                          className="btn-outline h-7 text-xs inline-flex items-center gap-1"
                        >
                          <ExternalLink className="size-3" />
                          فتح العقد
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
