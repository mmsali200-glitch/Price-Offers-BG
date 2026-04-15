export const metadata = { title: "عرض جديد · BG Quotes" };

export default function NewQuotePage() {
  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-black text-bg-green">إنشاء عرض جديد</h1>
        <p className="text-sm text-bg-text-3 mt-1">
          Builder كامل بـ 15 قسماً — قيد البناء في المرحلة 2.
        </p>
      </header>

      <div className="card p-10 text-center space-y-3">
        <div className="text-4xl">🚧</div>
        <h2 className="text-lg font-bold text-bg-green">Builder قيد التطوير</h2>
        <p className="text-sm text-bg-text-3 max-w-lg mx-auto">
          سيحتوي على: بيانات العميل، إصدار Odoo، 46 موديول، تطبيقات BG الحصرية، الترخيص،
          الدعم الفني، طريقة الدفع، مراحل التنفيذ، وتوليد العرض بـ AI — كل هذا في المرحلة 2.
        </p>
      </div>
    </div>
  );
}
