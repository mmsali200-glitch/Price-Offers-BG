import { getCurrentRole } from "@/lib/actions/users";
import { getPricingConfig } from "@/lib/actions/pricing";
import { redirect } from "next/navigation";
import { PricingEditor } from "./pricing-editor";

export const metadata = { title: "جدول التسعير · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const role = await getCurrentRole();
  if (role !== "admin") redirect("/settings?forbidden=pricing");

  let config: Record<string, Array<{ id: string; category: string; key: string; value: number; label: string | null; metadata: Record<string, unknown> | null; updated_at: string }>> = {};
  try {
    config = await getPricingConfig();
  } catch { /* table might not exist yet */ }

  return (
    <div className="page-padding space-y-4 sm:space-y-6">
      <header>
        <h1 className="text-2xl font-black text-bg-green">💰 جدول التسعير المركزي</h1>
        <p className="text-sm text-bg-text-3 mt-1">
          تحكم بأسعار الموديولات ومعاملات الدول وباقات الدعم. التغييرات تؤثر على العروض الجديدة فقط.
        </p>
      </header>
      <PricingEditor config={config} />
    </div>
  );
}
