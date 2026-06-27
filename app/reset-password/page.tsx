"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Lock, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(false);
  const [noSession, setNoSession] = useState(false);

  // When the user arrives from the email link, Supabase puts a recovery
  // token in the URL hash and emits a PASSWORD_RECOVERY / SIGNED_IN event
  // once the client picks it up. Wait for a session before allowing submit.
  useEffect(() => {
    const supabase = createClient();
    let settled = false;

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        settled = true;
        setReady(true);
      }
    });

    // Fallback: check for an existing session directly.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        settled = true;
        setReady(true);
      } else {
        // Give the hash-based recovery a moment, then flag if still nothing.
        setTimeout(() => {
          if (!settled) setNoSession(true);
        }, 2500);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("كلمة المرور 8 أحرف على الأقل."); return; }
    if (password !== confirm) { setError("كلمتا المرور غير متطابقتين."); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    try {
      const { error: err } = await supabase.auth.updateUser({ password });
      if (err) throw new Error(err.message);
      setDone(true);
      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1800);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذّر تحديث كلمة المرور");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bg-surface">
        <div className="w-full max-w-md card p-8 text-center space-y-4">
          <div className="inline-flex size-14 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="text-lg font-bold text-bg-green">تم تحديث كلمة المرور</h1>
          <p className="text-sm text-bg-text-2">جاري تحويلك إلى لوحة التحكم…</p>
          <Loader2 className="size-5 animate-spin text-bg-green mx-auto" />
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
          <h1 className="text-xl font-black text-bg-green">تعيين كلمة مرور جديدة</h1>
          <p className="text-xs text-bg-text-3">اكتب كلمة المرور الجديدة لحسابك</p>
        </div>

        {noSession && !ready ? (
          <div className="card p-5 space-y-3 text-center">
            <AlertTriangle className="size-8 text-amber-500 mx-auto" />
            <p className="text-sm text-bg-text-2 leading-relaxed">
              انتهت صلاحية رابط الاستعادة أو فُتح بشكل غير صحيح. اطلب رابطاً جديداً.
            </p>
            <Link href="/forgot-password" className="btn-primary inline-flex items-center justify-center gap-1.5">
              طلب رابط جديد
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="card p-5 space-y-4">
            <div className="space-y-1">
              <label className="label block">كلمة المرور الجديدة</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
                <input type="password" required minLength={8} disabled={loading || !ready}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10" placeholder="٨ أحرف على الأقل" dir="ltr" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="label block">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
                <input type="password" required minLength={8} disabled={loading || !ready}
                  value={confirm} onChange={(e) => setConfirm(e.target.value)}
                  className="input pr-10" placeholder="••••••••" dir="ltr" />
              </div>
            </div>

            {error && (
              <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{error}</div>
            )}

            <button type="submit" disabled={loading || !ready}
              className="btn-primary w-full inline-flex items-center justify-center gap-2">
              {!ready ? <><Loader2 className="size-4 animate-spin" /> جاري التحقق من الرابط...</>
                : loading ? <><Loader2 className="size-4 animate-spin" /> جاري الحفظ...</>
                : <>حفظ كلمة المرور</>}
            </button>
          </form>
        )}

        <div className="text-center text-xs text-bg-text-3">
          <Link href="/login" className="text-bg-green font-bold hover:underline">العودة لتسجيل الدخول</Link>
        </div>
      </div>
    </main>
  );
}
