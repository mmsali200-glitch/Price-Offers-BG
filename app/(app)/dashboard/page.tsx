import { FileText, TrendingUp, Users, CheckCircle2 } from "lucide-react";

export const metadata = { title: "لوحة التحكم · BG Quotes" };

export default function DashboardPage() {
  const kpis = [
    { label: "عروض الشهر", value: "—", icon: FileText, color: "text-bg-green" },
    { label: "القيمة الإجمالية", value: "—", icon: TrendingUp, color: "text-bg-gold" },
    { label: "العملاء", value: "—", icon: Users, color: "text-bg-info" },
    { label: "معدل القبول", value: "—", icon: CheckCircle2, color: "text-bg-green" },
  ];

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-bg-green">لوحة التحكم</h1>
        <p className="text-sm text-bg-text-3 mt-1">نظرة عامة على نشاط عروض الأسعار.</p>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="card p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-bg-text-3">{k.label}</span>
                <Icon className={`size-4 ${k.color}`} />
              </div>
              <div className="text-2xl font-black text-bg-text-1 tabular">
                {k.value}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card p-10 text-center space-y-2">
        <div className="text-4xl">📊</div>
        <h2 className="text-lg font-bold text-bg-green">
          مرحباً بك في منصة Business Gate
        </h2>
        <p className="text-sm text-bg-text-3 max-w-md mx-auto">
          الإحصائيات ستظهر هنا بعد ربط قاعدة البيانات (Supabase) وإنشاء أول عرض سعر.
        </p>
      </div>
    </div>
  );
}
