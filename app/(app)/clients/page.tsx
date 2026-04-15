export const metadata = { title: "العملاء · BG Quotes" };

export default function ClientsPage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-bg-green">العملاء</h1>
        <p className="text-sm text-bg-text-3 mt-1">قائمة العملاء وبياناتهم.</p>
      </header>

      <div className="card p-10 text-center space-y-2">
        <div className="text-4xl">👥</div>
        <h2 className="text-lg font-bold text-bg-green">لا يوجد عملاء بعد</h2>
        <p className="text-sm text-bg-text-3">
          سيُضاف العملاء تلقائياً عند إنشاء أول عرض لهم.
        </p>
      </div>
    </div>
  );
}
