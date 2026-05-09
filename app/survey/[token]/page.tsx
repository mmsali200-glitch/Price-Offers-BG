import { createAdminClient } from "@/lib/supabase/admin";
import { notFound } from "next/navigation";
import { SurveyForm } from "./survey-form";

export const metadata = { title: "استبيان اكتشاف المتطلبات · Business Gate" };

export default async function SurveyPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ sector?: string }>;
}) {
  const { token } = await params;
  const { sector } = await searchParams;

  const admin = createAdminClient();
  const { data: survey } = await admin
    .from("surveys")
    .select("*")
    .eq("token", token)
    .single();

  if (!survey) notFound();

  return (
    <SurveyForm
      token={survey.token}
      sectorId={sector || "other"}
      initialResponses={(survey.responses ?? {}) as Record<string, unknown>}
      initialClientInfo={{
        company_name: survey.company_name || "",
        contact_name: survey.contact_name || "",
        contact_email: survey.contact_email || "",
        contact_phone: survey.contact_phone || "",
        industry: survey.industry || "",
      }}
      initialProgress={survey.progress}
      isSubmitted={survey.status === "submitted"}
    />
  );
}
