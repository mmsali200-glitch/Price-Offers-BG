"use client";

import { useState } from "react";
import Link from "next/link";
import { Building, Phone, MapPin, FileText, Trash2, Loader2, X, CheckSquare, Square } from "lucide-react";
import { bulkDeleteClientsAction } from "@/lib/actions/admin";
import { fmtNum, fmtDateArabic } from "@/lib/utils";

type Client = {
  id: string;
  name_ar: string;
  name_en: string | null;
  sector: string | null;
  country: string | null;
  city: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  quote_count: number;
  total_value: number;
  last_quote_date: string | null;
};

const SECTOR_AR: Record<string, string> = {
  trading: "تجارة", manufacturing: "تصنيع", services: "خدمات",
  healthcare: "صحة", construction: "مقاولات", realestate: "عقارات",
  logistics: "لوجستيات", retail: "تجزئة", food: "أغذية",
  education: "تعليم", government: "حكومي", other: "أخرى",
};

export function ClientsGrid({ clients, canDelete }: { clients: Client[]; canDelete: boolean }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectionMode = selected.size > 0;
  const allSelected = selected.size === clients.length && clients.length > 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(clients.map((c) => c.id)));
  }

  async function handleBulkDelete() {
    setDeleting(true);
    setConfirmDelete(false);
    setError(null);
    const r = await bulkDeleteClientsAction(Array.from(selected));
    setDeleting(false);
    if (!r.ok) { setError(r.error); return; }
    setSelected(new Set());
    window.location.reload();
  }

  return (
    <>
      {/* Selection toolbar */}
      {canDelete && (
        <div className={`flex items-center justify-between rounded-sm2 px-3 py-2 transition-all ${
          selectionMode ? "bg-red-50 border border-red-200" : "bg-bg-card-alt border border-bg-line"
        }`}>
          <div className="flex items-center gap-2">
            <button onClick={toggleAll} className="flex items-center gap-1.5 text-xs text-bg-text-2 hover:text-bg-green">
              {allSelected ? <CheckSquare className="size-4 text-bg-green" /> : <Square className="size-4" />}
              {allSelected ? "إلغاء الكل" : "تحديد الكل"}
            </button>
            {selectionMode && (
              <span className="text-xs font-bold text-bg-danger">
                {selected.size} محدد
              </span>
            )}
          </div>
          {selectionMode && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelected(new Set())}
                className="text-xs text-bg-text-3 hover:text-bg-text-1 flex items-center gap-1"
              >
                <X className="size-3" /> إلغاء
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                disabled={deleting}
                className="text-xs font-bold text-white bg-bg-danger hover:bg-red-700 px-3 py-1.5 rounded-sm2 flex items-center gap-1"
              >
                {deleting ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />}
                حذف {selected.size} عميل
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{error}</div>
      )}

      {/* Clients grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {clients.map((c) => {
          const isSelected = selected.has(c.id);
          return (
            <div
              key={c.id}
              className={`card p-4 relative transition-all ${
                isSelected ? "ring-2 ring-bg-danger bg-red-50/30" : "card-hover"
              }`}
            >
              {/* Checkbox */}
              {canDelete && (
                <button
                  onClick={() => toggleSelect(c.id)}
                  className={`absolute top-3 left-3 z-10 size-5 rounded border-[1.5px] flex items-center justify-center transition-colors ${
                    isSelected ? "bg-bg-danger border-bg-danger" : "border-bg-line hover:border-bg-green"
                  }`}
                >
                  {isSelected && <span className="text-white text-[10px] font-bold">✓</span>}
                </button>
              )}

              <Link href={`/clients/${c.id}`} className="block">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="size-10 rounded-xl bg-bg-green-lt text-bg-green flex items-center justify-center">
                      <Building className="size-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-black text-bg-text-1 truncate">{c.name_ar}</div>
                      {c.name_en && <div className="text-[10px] text-bg-text-3 truncate" dir="ltr">{c.name_en}</div>}
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
            </div>
          );
        })}
      </div>

      {/* Confirm modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="size-12 rounded-full bg-red-100 text-bg-danger flex items-center justify-center mx-auto mb-3">
                <Trash2 className="size-6" />
              </div>
              <h3 className="text-base font-black text-bg-green">حذف {selected.size} عميل</h3>
              <p className="text-xs text-bg-text-3 mt-2">
                سيتم حذف العملاء المحددين وجميع عروض الأسعار المرتبطة بهم نهائياً. هل أنت متأكد؟
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(false)} className="btn-outline flex-1 h-9 text-xs">إلغاء</button>
              <button
                onClick={handleBulkDelete}
                className="flex-1 h-9 text-xs bg-bg-danger text-white font-bold rounded-sm2 hover:bg-red-700"
              >
                نعم، احذف الكل
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
