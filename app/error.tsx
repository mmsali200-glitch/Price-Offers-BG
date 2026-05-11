"use client";

import Link from "next/link";

export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-[#eef0ec]" dir="rtl">
      <div className="max-w-md text-center space-y-4">
        <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32, margin: "0 auto" }}>
          ⚠️
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 900, color: "#1a5c37" }}>حدث خطأ في التطبيق</h1>
        <p style={{ fontSize: 14, color: "#7a8e80" }}>
          {error.message || "خطأ غير متوقع."}
        </p>
        {error.digest && (
          <p style={{ fontSize: 10, color: "#7a8e80", direction: "ltr" }}>
            Digest: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: 12, justifyContent: "center", paddingTop: 8 }}>
          <button
            onClick={reset}
            style={{ background: "#1a5c37", color: "#fff", border: "none", padding: "10px 20px", borderRadius: 8, fontWeight: 700, cursor: "pointer" }}
          >
            إعادة المحاولة
          </button>
          <Link
            href="/"
            style={{ background: "#fff", color: "#1a5c37", border: "1px solid #e2e8e3", padding: "10px 20px", borderRadius: 8, fontWeight: 700 }}
          >
            الصفحة الرئيسية
          </Link>
        </div>
      </div>
    </div>
  );
}
