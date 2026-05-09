"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Mail, Lock, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || password.length < 6) return;
    setLoading(true);
    setError(null);

    const supabase = createClient();
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        const msg = err.message;
        if (msg.includes("Invalid login")) throw new Error("بريد أو كلمة مرور غير صحيحة");
        if (msg.includes("Email not confirmed")) throw new Error("البريد غير مُؤكَّد — تواصل مع المسؤول");
        if (msg.includes("disabled")) throw new Error("تسجيل الدخول معطّل — تواصل مع المسؤول");
        throw err;
      }
      router.push("/dashboard");
      router.refresh();
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
          <h1 className="text-xl font-black text-bg-green">تسجيل الدخول</h1>
          <p className="text-xs text-bg-text-3">Business Gate Technical Consulting</p>
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

          <div className="space-y-1">
            <label className="label block">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
              <input type="password" required minLength={6} disabled={loading}
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="input pr-10" placeholder="••••••••" dir="ltr" />
            </div>
          </div>

          {error && (
            <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">{error}</div>
          )}

          <button type="submit" disabled={loading || !email || password.length < 6}
            className="btn-primary w-full inline-flex items-center justify-center gap-2">
            {loading ? <><Loader2 className="size-4 animate-spin" /> جاري الدخول...</> : <>دخول <ArrowRight className="size-4" /></>}
          </button>
        </form>

        <div className="text-center text-[10px] text-bg-text-3">
          للحصول على حساب، تواصل مع المسؤول (Admin) ليُنشئ لك حساباً من الإعدادات.
        </div>
      </div>
    </main>
  );
}
