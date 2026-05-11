import { getBIReport } from "@/lib/actions/bi-reports";
import { getCurrentRole } from "@/lib/actions/users";
import { redirect } from "next/navigation";
import { BIReportView } from "./bi-report-view";

export const metadata = { title: "التقارير والتحليلات · BG Quotes" };
export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const role = await getCurrentRole();
  if (!role || !["manager", "admin"].includes(role)) {
    redirect("/dashboard?forbidden=reports");
  }

  const report = await getBIReport();
  return <BIReportView report={report} />;
}
