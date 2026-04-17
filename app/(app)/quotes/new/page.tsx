import { QuoteWizard } from "./wizard";

export const metadata = { title: "عرض جديد · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  let clients: Array<{
    id: string;
    name_ar: string;
    name_en: string | null;
    sector: string | null;
    country: string | null;
    contact_name: string | null;
    contact_phone: string | null;
  }> = [];

  try {
    const { getAllClients } = await import("@/lib/actions/client-search");
    clients = await getAllClients();
  } catch (err) {
    console.error("[new-quote] failed to load clients:", err);
  }

  return <QuoteWizard existingClients={clients} />;
}
