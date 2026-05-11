"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error.message, error.digest, error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md text-center space-y-4">
        <div className="size-16 rounded-2xl bg-red-50 text-bg-danger flex items-center justify-center text-3xl mx-auto">
          ⚠️
        </div>
        <h1 className="text-xl font-black text-bg-green">حدث خطأ</h1>
        <p className="text-sm text-bg-text-3 leading-relaxed">
          {error.message || "حدث خطأ غير متوقع في الخادم."}
        </p>
        {error.digest && (
          <p className="text-[10px] text-bg-text-3 tabular bg-bg-card-alt rounded px-3 py-1 inline-block" dir="ltr">
            Digest: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button onClick={reset} className="btn-primary text-sm">
            إعادة المحاولة
          </button>
          <Link href="/dashboard" className="btn-outline text-sm">
            لوحة التحكم
          </Link>
          <Link href="/quotes/new" className="btn-outline text-sm">
            عرض جديد
          </Link>
        </div>
      </div>
    </div>
  );
}
