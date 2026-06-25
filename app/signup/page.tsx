"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, User, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);

  function validate(): string | null {
    if (!fullName.trim()) return "الرجاء كتابة الاسم الكامل.";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "البريد الإلكتروني غير صحيح.";
    if (password.length < 8) return "كلمة المرور يجب أن تكون 8 أحرف على الأقل.";
    if (password !== confirm) return "كلمتا المرور غير متطابقتين.";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setLoading(true);
    setError(null);

    const supabase = createClient();
    try {
      const { data, error: signErr } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim() } },
      });
      if (signErr) {
        const msg = signErr.message;
        if (/already registered|already exists/i.test(msg)) {
          throw new Error("هذا البريد مسجّل سابقاً. سجّل دخول مباشرة.");
        }
        if (/weak password/i.test(msg)) {
          throw new Error("كلمة المرور ضعيفة — اختر كلمة أقوى.");
        }
        if (/email.*invalid/i.test(msg)) {
          throw new Error("البريد الإلكتروني غير صالح.");
        }
        throw new Error(msg);
      }

      // Two paths depending on Supabase project settings:
      // (a) Email confirmations enabled  → session is null, user must confirm via email.
      // (b) Auto-confirm or disabled     → session present, user is signed in.
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
        return;
      }
      setPendingConfirm(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  if (pendingConfirm) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bg-surface">
        <div className="w-full max-w-md card p-8 text-center space-y-4">
          <div className="inline-flex size-14 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mx-auto">
            <CheckCircle2 className="size-7" />
          </div>
          <h1 className="text-lg font-bold text-bg-green">تم إنشاء الحساب — تأكيد البريد مطلوب</h1>
          <p className="text-sm text-bg-text-2 leading-relaxed">
            أرسلنا رابط تفعيل إلى <strong dir="ltr">{email}</strong>. اضغط الرابط في البريد ثم
            عُد لتسجيل الدخول. لو لم يصلك خلال دقائق، تحقّق من مجلد الـSpam.
          </p>
          <p className="text-[11px] text-bg-text-3 leading-relaxed">
            في حال كنت مديراً وتريد تخطّي تأكيد البريد، عطّله من
            Supabase Dashboard → Authentication → Providers → Email →
            "Confirm email" (off).
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
    <main className="min-h-screen flex items-center justify-center px-4 py-6 bg-bg-surface">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-2xl bg-bg-green text-bg-gold items-center justify-center text-2xl font-black mx-auto">
            BG
          </div>
          <h1 className="text-xl font-black text-bg-green">إنشاء حساب جديد</h1>
          <p className="text-xs text-bg-text-3">Business Gate Technical Consulting</p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="space-y-1">
            <label className="label block">الاسم الكامل</label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input type="text" required autoFocus disabled={loading}
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="input pr-10" placeholder="أحمد محمد" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input type="email" required disabled={loading}
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="input pr-10" placeholder="name@bg-tc.com" dir="ltr" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input type="password" required minLength={8} disabled={loading}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input pr-10" placeholder="٨ أحرف على الأقل" dir="ltr" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label block">تأكيد كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input type="password" required minLength={8} disabled={loading}
                value={confirm} onChange={(e) => setConfirm(e.target.value)}
                className="input pr-10" placeholder="••••••••" dir="ltr" />
            </div>
          </div>

          {error && (
            <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{error}</div>
          )}

          <button type="submit" disabled={loading}
            className="btn-primary w-full inline-flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="size-4 animate-spin" /> جاري الإنشاء...</> : <>إنشاء الحساب</>}
          </button>
        </form>

        <div className="text-center text-xs text-bg-text-3">
          لديك حساب بالفعل؟{" "}
          <Link href="/login" className="text-bg-green font-bold hover:underline">سجّل الدخول</Link>
        </div>
      </div>
    </main>
  );
}
