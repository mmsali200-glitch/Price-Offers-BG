"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Mail, Loader2, ArrowRight } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("loading");
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        },
      });
      if (error) throw error;
      setState("sent");
      setMessage("أرسلنا لك رابط دخول — تحقق من بريدك الإلكتروني.");
    } catch (err) {
      setState("error");
      setMessage(err instanceof Error ? err.message : "حدث خطأ");
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
          <p className="text-xs text-bg-text-3">
            Business Gate Technical Consulting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card p-5 space-y-4">
          {state !== "sent" && (
            <>
              <div className="space-y-1">
                <label className="label block">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
                  <input
                    type="email"
                    required
                    disabled={state === "loading"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="input pr-10"
                    placeholder="name@bg-tc.com"
                    dir="ltr"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={state === "loading" || !email}
                className="btn-primary w-full inline-flex items-center justify-center gap-2"
              >
                {state === "loading" ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    جاري الإرسال...
                  </>
                ) : (
                  <>
                    أرسل رابط الدخول
                    <ArrowRight className="size-4" />
                  </>
                )}
              </button>
            </>
          )}

          {state === "sent" && (
            <div className="text-center space-y-2 py-2">
              <div className="text-3xl">📬</div>
              <div className="text-sm font-bold text-bg-green">تحقق من بريدك</div>
              <div className="text-xs text-bg-text-3">{message}</div>
              <button
                type="button"
                onClick={() => {
                  setState("idle");
                  setMessage("");
                }}
                className="text-xs text-bg-info hover:underline"
              >
                إرسال مرة أخرى
              </button>
            </div>
          )}

          {state === "error" && (
            <div className="text-xs text-bg-danger bg-red-50 border border-red-200 rounded-sm2 px-3 py-2">
              {message}
            </div>
          )}
        </form>

        <p className="text-center text-[11px] text-bg-text-3">
          لا يوجد لديك حساب؟ تواصل مع المدير التنفيذي.
        </p>
      </div>
    </main>
  );
}
