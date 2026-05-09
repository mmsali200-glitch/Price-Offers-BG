"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink, Copy, Check, Eye } from "lucide-react";
import { fmtDateArabic } from "@/lib/utils";

type Survey = {
  id: string;
  token: string;
  company_name: string | null;
  contact_name: string | null;
  contact_email: string | null;
  industry: string | null;
  status: string;
  progress: number;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; cls: string }> = {
  pending: { label: "في الانتظار", cls: "bg-bg-line text-bg-text-2" },
  in_progress: { label: "قيد التعبئة", cls: "bg-amber-100 text-amber-700" },
  submitted: { label: "مكتمل", cls: "bg-bg-green-lt text-bg-green" },
};

export function SurveyTable({ surveys }: { surveys: Survey[] }) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  function handleCopy(token: string, id: string) {
    const url = `${window.location.origin}/survey/${token}`;
    navigator.clipboard?.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (surveys.length === 0) {
    return (
      <div className="card p-10 text-center space-y-2">
        <div className="text-4xl">📋</div>
        <h2 className="text-lg font-bold text-bg-green">لا توجد استبيانات بعد</h2>
        <p className="text-sm text-bg-text-3">أنشئ استبياناً وأرسل الرابط للعميل ليعبّئه.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {surveys.map((s) => {
        const badge = STATUS_META[s.status] || STATUS_META.pending;
        const url = `${window.location.origin}/survey/${s.token}`;
        const isCopied = copiedId === s.id;

        return (
          <div key={s.id} className="card p-4 hover:shadow-card transition-shadow">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <Link href={`/surveys/${s.id}`} className="text-sm font-black text-bg-green hover:underline block">
                  {s.company_name || "استبيان بدون اسم"}
                </Link>
                <div className="text-[10px] text-bg-text-3 mt-0.5">
                  {s.contact_name && <span>{s.contact_name}</span>}
                  {s.contact_email && <span className="mr-2">· {s.contact_email}</span>}
                  {s.industry && <span className="mr-2">· {s.industry}</span>}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
                  {badge.label}
                </span>
                <div className="flex items-center gap-1">
                  <div className="w-12 h-1.5 bg-bg-line rounded-full overflow-hidden">
                    <div className="h-full bg-bg-green rounded-full" style={{ width: `${s.progress}%` }} />
                  </div>
                  <span className="text-[10px] font-bold text-bg-green tabular">{s.progress}%</span>
                </div>
              </div>
            </div>

            {/* Link bar */}
            <div className="bg-bg-card-alt rounded-lg p-2.5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <div className="text-[10px] text-bg-text-3 mb-0.5">رابط الاستبيان:</div>
                <div className="text-[11px] font-mono text-bg-text-1 truncate" dir="ltr">{url}</div>
              </div>
              <button
                onClick={() => handleCopy(s.token, s.id)}
                className={`shrink-0 h-8 px-3 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                  isCopied
                    ? "bg-bg-green text-white"
                    : "bg-white border border-bg-line text-bg-green hover:bg-bg-green hover:text-white"
                }`}
              >
                {isCopied ? <><Check className="size-3" /> تم النسخ</> : <><Copy className="size-3" /> نسخ</>}
              </button>
              <a href={`/survey/${s.token}`} target="_blank"
                className="shrink-0 h-8 px-3 rounded-lg text-xs font-bold bg-white border border-bg-line text-bg-text-2 hover:text-bg-green hover:border-bg-green flex items-center gap-1.5">
                <ExternalLink className="size-3" /> فتح
              </a>
              <Link href={`/surveys/${s.id}`}
                className="shrink-0 h-8 px-3 rounded-lg text-xs font-bold bg-white border border-bg-line text-bg-text-2 hover:text-bg-green hover:border-bg-green flex items-center gap-1.5">
                <Eye className="size-3" /> النتائج
              </Link>
            </div>

            <div className="text-[10px] text-bg-text-3 mt-2">{fmtDateArabic(s.created_at)}</div>
          </div>
        );
      })}
    </div>
  );
}
