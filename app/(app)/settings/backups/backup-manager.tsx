"use client";

import { useState } from "react";
import { Download, Trash2, RotateCcw, Plus, Loader2, Shield, Clock, HardDrive, AlertTriangle } from "lucide-react";
import { createBackup, deleteBackup, restoreBackup, getBackupData } from "@/lib/actions/backups";
import type { BackupRow } from "@/lib/actions/backups";

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("ar-KW", {
    year: "numeric", month: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function BackupManager({ initialBackups }: { initialBackups: BackupRow[] }) {
  const [backups, setBackups] = useState(initialBackups);
  const [creating, setCreating] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [confirmRestore, setConfirmRestore] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  function flash(msg: string, isError = false) {
    if (isError) { setError(msg); setTimeout(() => setError(null), 5000); }
    else { setSuccess(msg); setTimeout(() => setSuccess(null), 3000); }
  }

  async function handleCreate() {
    setCreating(true);
    setError(null);
    const r = await createBackup("manual");
    setCreating(false);
    if (!r.ok) return flash(r.error, true);
    flash("تم إنشاء نسخة احتياطية بنجاح");
    window.location.reload();
  }

  async function handleDownload(id: string) {
    setDownloading(id);
    const r = await getBackupData(id);
    setDownloading(null);
    if (!r.ok) return flash("فشل تحميل النسخة", true);
    const blob = new Blob([JSON.stringify(r.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bg-backup-${r.createdAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleRestore(id: string) {
    setRestoring(id);
    setConfirmRestore(null);
    const r = await restoreBackup(id);
    setRestoring(null);
    if (!r.ok) return flash(r.error, true);
    flash("تمت الاستعادة بنجاح — ستُحدَّث الصفحة");
    setTimeout(() => window.location.href = "/settings/backups", 1500);
  }

  async function handleDelete(id: string) {
    setConfirmDelete(null);
    const r = await deleteBackup(id);
    if (!r.ok) return flash(r.error, true);
    setBackups((prev) => prev.filter((b) => b.id !== id));
    flash("تم حذف النسخة");
  }

  const autoCount = backups.filter((b) => b.type === "auto").length;
  const manualCount = backups.filter((b) => b.type === "manual").length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-bg-green flex items-center gap-2">
            <Shield className="size-6" />
            النسخ الاحتياطية
          </h1>
          <p className="text-xs text-bg-text-3 mt-1">
            نسخ كاملة من قاعدة البيانات — تقدر تنشئ يدوية في أي وقت
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="btn-primary inline-flex items-center gap-1.5 h-9 text-xs"
        >
          {creating ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />}
          {creating ? "جاري الإنشاء..." : "نسخة جديدة الآن"}
        </button>
      </div>

      {error && (
        <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">
          {error}
        </div>
      )}
      {success && (
        <div className="text-xs text-bg-green bg-bg-green-lt border border-bg-green/20 rounded-sm2 px-3 py-2">
          {success}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "الإجمالي", value: backups.length, icon: <HardDrive className="size-4" /> },
          { label: "تلقائية", value: autoCount, icon: <Clock className="size-4" /> },
          { label: "يدوية", value: manualCount, icon: <Shield className="size-4" /> },
          { label: "آخر نسخة", value: backups[0] ? fmtDate(backups[0].created_at) : "—", icon: <Clock className="size-4" />, small: true },
        ].map((s) => (
          <div key={s.label} className="card p-3 text-center">
            <div className="text-bg-text-3 flex items-center justify-center gap-1 mb-1">{s.icon}<span className="text-[10px] font-bold">{s.label}</span></div>
            <div className={`font-black text-bg-green ${s.small ? "text-[10px]" : "text-lg"}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Info box */}
      <div className="card p-3 bg-bg-gold-lt border-bg-gold text-xs text-[#8a6010] flex items-start gap-2">
        <Clock className="size-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">الجدولة:</span> نحتفظ بآخر 30 نسخة ونحذف الأقدم تلقائياً. تقدر تنزّل أي نسخة وتحفظها خارج النظام (Google Drive / OneDrive) كحماية إضافية.
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-bg-green text-white">
              <th className="px-3 py-2.5 text-right font-bold">التاريخ</th>
              <th className="px-3 py-2.5 text-center font-bold">النوع</th>
              <th className="px-3 py-2.5 text-center font-bold">السجلات</th>
              <th className="px-3 py-2.5 text-center font-bold">الحجم</th>
              <th className="px-3 py-2.5 text-right font-bold">ملاحظات</th>
              <th className="px-3 py-2.5 text-center font-bold">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {backups.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-bg-text-3">
                  لا توجد نسخ احتياطية بعد — اضغط "نسخة جديدة الآن"
                </td>
              </tr>
            ) : backups.map((b) => (
              <tr key={b.id} className="border-t border-bg-line hover:bg-bg-card-alt">
                <td className="px-3 py-2 font-bold text-bg-text-1">{fmtDate(b.created_at)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    b.type === "auto" ? "bg-bg-info-lt text-bg-info" : "bg-bg-green-lt text-bg-green"
                  }`}>
                    {b.type === "auto" ? "تلقائي" : "يدوي"}
                  </span>
                </td>
                <td className="px-3 py-2 text-center tabular text-bg-text-2">{b.records.toLocaleString()} سجل</td>
                <td className="px-3 py-2 text-center tabular text-bg-text-2">{fmtSize(b.size_bytes)}</td>
                <td className="px-3 py-2 text-bg-text-3">{b.notes || "—"}</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button
                      onClick={() => handleDownload(b.id)}
                      disabled={downloading === b.id}
                      className="size-7 rounded bg-bg-card-alt border border-bg-line flex items-center justify-center text-bg-text-3 hover:text-bg-green hover:border-bg-green"
                      title="تحميل"
                    >
                      {downloading === b.id ? <Loader2 className="size-3 animate-spin" /> : <Download className="size-3" />}
                    </button>
                    <button
                      onClick={() => setConfirmRestore(b.id)}
                      disabled={restoring === b.id}
                      className="size-7 rounded bg-bg-card-alt border border-bg-line flex items-center justify-center text-bg-text-3 hover:text-amber-600 hover:border-amber-400"
                      title="استعادة"
                    >
                      {restoring === b.id ? <Loader2 className="size-3 animate-spin" /> : <RotateCcw className="size-3" />}
                    </button>
                    <button
                      onClick={() => setConfirmDelete(b.id)}
                      className="size-7 rounded bg-bg-card-alt border border-bg-line flex items-center justify-center text-bg-text-3 hover:text-bg-danger hover:border-red-300"
                      title="حذف"
                    >
                      <Trash2 className="size-3" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Restore warning */}
      <div className="card p-3 bg-red-50 border-red-200 text-xs text-bg-danger flex items-start gap-2">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">تحذير عن الاستعادة:</span> عملية الاستعادة تمسح جميع البيانات الحالية وتستبدلها بمحتوى النسخة. هذا يشمل العملاء والعروض والإعدادات. استعمل الميزة بحذر شديد.
        </div>
      </div>

      {/* Confirm Restore Modal */}
      {confirmRestore && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="size-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-base font-black text-bg-green">تأكيد الاستعادة</h3>
              <p className="text-xs text-bg-text-3 mt-2">
                ستُمسح جميع البيانات الحالية وتُستبدل بمحتوى هذه النسخة. هل أنت متأكد؟
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmRestore(null)} className="btn-outline flex-1 h-9 text-xs">إلغاء</button>
              <button
                onClick={() => handleRestore(confirmRestore)}
                className="flex-1 h-9 text-xs bg-amber-500 text-white font-bold rounded-sm2 hover:bg-amber-600"
              >
                نعم، استعد الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-card p-6 max-w-sm w-full space-y-4">
            <div className="text-center">
              <div className="size-12 rounded-full bg-red-100 text-bg-danger flex items-center justify-center mx-auto mb-3">
                <Trash2 className="size-6" />
              </div>
              <h3 className="text-base font-black text-bg-green">حذف النسخة</h3>
              <p className="text-xs text-bg-text-3 mt-2">هل تريد حذف هذه النسخة الاحتياطية نهائياً؟</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDelete(null)} className="btn-outline flex-1 h-9 text-xs">إلغاء</button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 h-9 text-xs bg-bg-danger text-white font-bold rounded-sm2 hover:bg-red-700"
              >
                نعم، احذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
