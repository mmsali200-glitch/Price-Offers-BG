"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { adminCreateUser } from "@/lib/actions/signup-admin";
import { Mail, Lock, User, Loader2, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [adminBootstrapped, setAdminBootstrapped] = useState(false);

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

    try {
      // 1. Server-side: create the user with email already confirmed (via
      //    service role). Bypasses the email-link flow entirely so the
      //    user can log in immediately. Also promotes the first signup
      //    to admin so the system has a real administrator from the start.
      const res = await adminCreateUser(fullName.trim(), email.trim(), password);
      if (!res.ok) {
        // Fallback when the server is missing SUPABASE_SERVICE_ROLE_KEY —
        // use the regular client signUp. It still works, just may require
        // email confirmation depending on project settings.
        if (/SUPABASE_SERVICE_ROLE_KEY/i.test(res.error)) {
          const supabase = createClient();
          const { data, error: signErr } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: { data: { full_name: fullName.trim() } },
          });
          if (signErr) throw new Error(signErr.message);
          if (data.session) {
            router.push("/dashboard");
            router.refresh();
            return;
          }
          setPendingConfirm(true);
          return;
        }
        throw new Error(res.error);
      }

      // 2. Client-side: sign in with the same credentials. The user now
      //    has a confirmed account and an active session.
      const supabase = createClient();
      const { error: loginErr } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (loginErr) throw new Error(loginErr.message);

      if (res.promotedToAdmin) {
        setAdminBootstrapped(true);
        // Show the bootstrap confirmation for a moment, then redirect.
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1800);
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ أثناء إنشاء الحساب");
    } finally {
      setLoading(false);
    }
  }

  if (adminBootstrapped) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4 bg-bg-surface">
        <div className="w-full max-w-md card p-8 text-center space-y-4">
          <div className="inline-flex size-14 rounded-full bg-emerald-100 text-emerald-600 items-center justify-center mx-auto">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-lg font-bold text-bg-green">تم إنشاء حسابك كأول مسؤول للنظام</h1>
          <p className="text-sm text-bg-text-2 leading-relaxed">
            حسابك <strong dir="ltr">{email}</strong> صار <strong>Admin</strong> بكل الصلاحيات.
            جاري تحويلك إلى لوحة التحكم…
          </p>
          <Loader2 className="size-5 animate-spin text-bg-green mx-auto" />
        </div>
      </main>
    );
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
