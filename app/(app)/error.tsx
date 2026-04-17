"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-bg-surface">
      <div className="max-w-sm text-center space-y-4">
        <div className="size-16 rounded-2xl bg-red-50 text-bg-danger flex items-center justify-center text-3xl mx-auto">
          ⚠️
        </div>
        <h1 className="text-xl font-black text-bg-green">حدث خطأ</h1>
        <p className="text-sm text-bg-text-3 leading-relaxed">
          حدث خطأ غير متوقع في الخادم. يمكنك المحاولة مرة أخرى أو
          العودة للصفحة الرئيسية.
        </p>
        {error.digest && (
          <p className="text-[10px] text-bg-text-3 tabular" dir="ltr">
            Digest: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={reset} className="btn-primary">
            إعادة المحاولة
          </button>
          <Link href="/" className="btn-outline">
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
