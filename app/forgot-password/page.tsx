"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("البريد الإلكتروني غير صحيح.");
      return;
    }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    try {
      // Send the reset email. The link lands on /reset-password where the
      // user sets a new password (Supabase establishes a recovery session
      // via the URL fragment automatically).
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
      });
      if (err) throw new Error(err.message);
      // Always show success even if the email isn't registered — avoids
      // leaking which emails exist.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر إرسال رابط الاستعادة");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bg-surface">
        <div className="w-full max-w-md card p-8 text-center space-y-4">
          <div className="inline-flex size-14 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="text-lg font-bold text-bg-green">تم إرسال رابط الاستعادة</h1>
          <p className="text-sm text-bg-text-2 leading-relaxed">
            لو كان <strong dir="ltr">{email}</strong> مسجّلاً لدينا، ستصلك رسالة فيها
            رابط لإعادة تعيين كلمة المرور. تحقّق من بريدك (ومن مجلد الـSpam).
          </p>
          <div className="pt-2">
            <Link href="/login" className="btn-primary inline-flex items-center gap-1.5">
              <ArrowLeft className="size-4" />
              العودة لتسجيل الدخول
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-bg-surface">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-2xl bg-bg-green text-bg-gold items-center justify-center text-2xl font-black mx-auto">
            BG
          </div>
          <h1 className="text-xl font-black text-bg-green">نسيت كلمة المرور</h1>
          <p className="text-xs text-bg-text-3">أدخل بريدك وسنرسل لك رابط إعادة التعيين</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="space-y-1">
            <label className="label block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input type="email" required autoFocus disabled={loading}
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input pr-10" placeholder="name@bg-tc.com" dir="ltr" />
            </div>
          </div>

          {error && (
            <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full inline-flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="size-4 animate-spin" /> جاري الإرسال...</> : <>إرسال رابط الاستعادة</>}
          </button>
        </form>

        <div className="text-center text-xs text-bg-text-3">
          تذكّرت كلمة المرور؟{" "}
          <Link href="/login" className="text-bg-green font-bold hover:underline">سجّل الدخول</Link>
        </div>
      </div>
    </main>
  );
}
