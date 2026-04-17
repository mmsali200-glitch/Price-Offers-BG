"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

type Mode = "signin" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [okMessage, setOkMessage] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setLoading(true);
    setError(null);
    setOkMessage(null);

    const supabase = createClient();
    try {
      if (mode === "signup") {
        const { data: signUpData, error: err } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { full_name: email.split("@")[0] } },
        });
        if (err) throw err;
        // If email confirmation is required, signUpData.user exists but session is null.
        if (signUpData?.user && !signUpData.session) {
          setOkMessage(
            "تم إنشاء الحساب. إذا لم يتطلب تأكيد البريد، سجّل دخول الآن."
          );
        } else {
          setOkMessage("تم إنشاء حسابك بنجاح! سجّل دخول الآن.");
        }
        setMode("signin");
      } else {
        const { error: err } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (err) {
          // Translate common Supabase errors to Arabic
          const msg = err.message;
          if (msg.includes("Invalid login")) throw new Error("بريد أو كلمة مرور غير صحيحة");
          if (msg.includes("Email not confirmed")) throw new Error("البريد غير مُؤكَّد — تحقق من صندوق الوارد أو اطلب من المسؤول تعطيل تأكيد البريد");
          if (msg.includes("disabled")) throw new Error("تسجيل الدخول بالبريد معطّل — فعّله من إعدادات Supabase");
          throw err;
        }
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 bg-bg-surface">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex size-14 rounded-2xl bg-bg-green text-bg-gold items-center justify-center text-2xl font-black mx-auto">
            BG
          </div>
          <h1 className="text-xl font-black text-bg-green">
            {mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب مسؤول"}
          </h1>
          <p className="text-xs text-bg-text-3">
            Business Gate Technical Consulting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          <div className="space-y-1">
            <label className="label block">البريد الإلكتروني</label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input
                type="email"
                required
                autoFocus
                disabled={loading}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input pr-10"
                placeholder="name@bg-tc.com"
                dir="ltr"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="label block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input
                type="password"
                required
                minLength={6}
                disabled={loading}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input pr-10"
                placeholder="••••••••"
                dir="ltr"
              />
            </div>
            {mode === "signup" && (
              <span className="text-[10px] text-bg-text-3">
                6 أحرف على الأقل
              </span>
            )}
          </div>

          {error && (
            <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">
              {error}
            </div>
          )}

          {okMessage && (
            <div className="text-xs text-bg-green bg-bg-green-lt border border-bg-green/20 rounded-sm2 px-3 py-2">
              {okMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || password.length < 6}
            className="btn-primary w-full inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {mode === "signin" ? "جاري الدخول..." : "جاري الإنشاء..."}
              </>
            ) : (
              <>
                {mode === "signin" ? "دخول" : "إنشاء حساب"}
                <ArrowRight className="size-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center text-xs">
          {mode === "signin" ? (
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
                setOkMessage(null);
              }}
              className="text-bg-text-3 hover:text-bg-green"
            >
              لا يوجد لديك حساب؟{" "}
              <span className="text-bg-green font-bold">إنشاء حساب مسؤول</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
                setOkMessage(null);
              }}
              className="text-bg-text-3 hover:text-bg-green"
            >
              عندك حساب؟{" "}
              <span className="text-bg-green font-bold">تسجيل الدخول</span>
            </button>
          )}
        </div>
      </div>
    </main>
  );
}
