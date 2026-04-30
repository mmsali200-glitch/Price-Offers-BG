import Link from "next/link";
import { Users, Plus } from "lucide-react";
import { listClients } from "@/lib/actions/clients";
import { getCurrentRole } from "@/lib/actions/users";
import { ClientsGrid } from "./clients-grid";

export const metadata = { title: "العملاء · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  let clients: Awaited<ReturnType<typeof listClients>> = [];
  try {
    clients = await listClients();
  } catch (err) {
    console.error("[clients]", err);
  }

  const role = await getCurrentRole();
  const canDelete = role === "admin" || role === "manager";

  return (
    <div className="page-padding space-y-4 sm:space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-bg-green inline-flex items-center gap-2">
            <Users className="size-6" />
            العملاء
          </h1>
          <p className="text-sm text-bg-text-3 mt-1">
            {clients.length > 0
              ? `${clients.length} عميل — اضغط على أي عميل لعرض كل عروضه`
              : "يُضاف العملاء تلقائياً عند إنشاء أول عرض لهم."}
          </p>
        </div>
        <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5">
          <Plus className="size-4" />
          عرض جديد
        </Link>
      </header>

      {clients.length === 0 ? (
        <div className="card p-10 text-center space-y-2">
          <div className="text-4xl">👥</div>
          <h2 className="text-lg font-bold text-bg-green">لا يوجد عملاء بعد</h2>
          <p className="text-sm text-bg-text-3">
            سيُضاف العملاء تلقائياً عند إنشاء أول عرض.
          </p>
          <Link href="/quotes/new" className="btn-primary inline-flex items-center gap-1.5 mt-2">
            <Plus className="size-4" />
            أنشئ أول عرض
          </Link>
        </div>
      ) : (
        <ClientsGrid clients={clients} canDelete={canDelete} />
      )}
    </div>
  );
}
