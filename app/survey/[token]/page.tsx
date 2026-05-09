import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { SurveyForm } from "./survey-form";

export const metadata = { title: "استبيان اكتشاف المتطلبات · Business Gate" };

export default async function SurveyPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: survey } = await supabase
    .from("surveys")
    .select("id, token, company_name, contact_name, contact_email, contact_phone, industry, status, progress, responses")
    .eq("token", token)
    .single();

  if (!survey) notFound();

  return (
    <SurveyForm
      token={survey.token}
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
