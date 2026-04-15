import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-bg-green-lt px-4 py-1.5 text-xs font-bold text-bg-green">
            <span className="size-2 rounded-full bg-bg-green" />
            Business Gate Technical Consulting
          </div>
          <h1 className="text-4xl font-black text-bg-green">
            مُعِد عروض الأسعار — v3
          </h1>
          <p className="text-bg-text-2">
            منصة متكاملة لإنشاء عروض أسعار Odoo ERP، إرسالها للعملاء، وتوقيعها إلكترونياً.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { n: "📝", t: "بناء العرض", d: "15 قسم تفاعلي" },
            { n: "🤖", t: "توليد بـ AI", d: "Claude يكتب المحتوى" },
            { n: "✍️", t: "توقيع إلكتروني", d: "رابط آمن للعميل" },
          ].map((f) => (
            <div key={f.t} className="card p-4 text-center space-y-1">
              <div className="text-2xl">{f.n}</div>
              <div className="text-sm font-bold text-bg-green">{f.t}</div>
              <div className="text-xs text-bg-text-3">{f.d}</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-center gap-3">
          <Link href="/dashboard" className="btn-primary">
            الدخول إلى لوحة التحكم
          </Link>
          <Link href="/login" className="btn-outline">
            تسجيل الدخول
          </Link>
        </div>

        <p className="text-xs text-bg-text-3">
          www.businessesgates.com · info@bg-tc.com · +965 9999 0412
        </p>
      </div>
    </main>
  );
}
