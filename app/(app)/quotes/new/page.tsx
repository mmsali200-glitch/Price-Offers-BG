import { QuoteWizard } from "./wizard";
import { getAllClients } from "@/lib/actions/client-search";

export const metadata = { title: "عرض جديد · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function NewQuotePage() {
  const clients = await getAllClients();
  return <QuoteWizard existingClients={clients} />;
}
