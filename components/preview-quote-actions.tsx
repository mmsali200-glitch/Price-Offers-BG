"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { markClientAcceptedAndSigned } from "@/lib/actions/quotes";

/**
 * Toolbar actions that gate contract creation behind explicit client
 * acceptance + signature. Until the quote is "accepted", the only
 * action available is "تأكيد قبول وتوقيع العميل"; once accepted, the
 * "إنشاء عقد" link becomes available instead.
 */
export function PreviewQuoteActions({
  quoteId,
  status,
}: {
  quoteId: string;
  status: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isAccepted = status === "accepted";

  function confirmAndAccept() {
    setError(null);
    const ok = window.confirm(
      "هل تؤكد أن العميل قَبِل العرض ووقّع عليه؟\n" +
        "بعد التأكيد سيُفتح زر «إنشاء عقد»."
    );
    if (!ok) return;
    startTransition(async () => {
      const res = await markClientAcceptedAndSigned(quoteId);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  if (isAccepted) {
    return (
      <Link
        href={`/quotes/${quoteId}/contract/new`}
        className="btn-primary inline-flex items-center gap-1.5 h-8 text-xs"
        title="إنشاء عقد مبني على هذا العرض"
      >
        <FileText className="size-3.5" />
        إنشاء عقد
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={confirmAndAccept}
        disabled={pending}
        className="btn-primary inline-flex items-center gap-1.5 h-8 text-xs disabled:opacity-60"
        title="تأكيد أن العميل قَبِل العرض ووقّع عليه"
      >
        <CheckCircle2 className="size-3.5" />
        {pending ? "جاري التأكيد..." : "تأكيد قبول وتوقيع العميل"}
      </button>
      {error && (
        <span className="inline-flex items-center gap-1 text-[11px] text-bg-danger">
          <AlertTriangle className="size-3" />
          {error}
        </span>
      )}
    </>
  );
}
