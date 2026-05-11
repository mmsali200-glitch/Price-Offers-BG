"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2 } from "lucide-react";
import { createQuoteAndReturnId } from "@/lib/actions/create-quote";
import type { SurveyAnalysis } from "@/lib/survey-analyzer";

type Props = {
  surveyId: string;
  analysis: SurveyAnalysis;
  clientInfo: { nameAr: string; contactName: string; contactEmail: string; industry: string };
};

export function CreateQuoteFromSurvey({ surveyId, analysis, clientInfo }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    setLoading(true);
    setError(null);

    const fd = new FormData();
    fd.set("nameAr", clientInfo.nameAr);
    fd.set("contactName", clientInfo.contactName);
    fd.set("contactEmail", clientInfo.contactEmail);
    fd.set("sector", mapIndustryToSector(clientInfo.industry));
    fd.set("currency", "KWD");
    fd.set("quoteLanguage", "ar");

    const moduleIds = analysis.suggestedModules
      .filter((m) => m.confidence === "high")
      .map((m) => m.id);
    if (moduleIds.length > 0) {
      fd.set("assessmentModulesList", moduleIds.join(","));
    }

    const result = await createQuoteAndReturnId(fd);
    setLoading(false);

    if (result.ok) {
      router.push(`/quotes/${result.quoteId}/edit`);
    } else {
      setError(result.error);
    }
  }

  return (
    <div>
      <button onClick={handleCreate} disabled={loading}
        className="btn-primary inline-flex items-center gap-1.5 h-8 text-xs">
        {loading ? <Loader2 className="size-3.5 animate-spin" /> : <FileText className="size-3.5" />}
        {loading ? "جاري الإنشاء..." : "إنشاء عرض من الاستبيان"}
      </button>
      {error && <div className="text-[10px] text-bg-danger mt-1">{error}</div>}
    </div>
  );
}

function mapIndustryToSector(industry: string): string {
  const lower = (industry || "").toLowerCase();
  if (lower.includes("تجار") || lower.includes("trading")) return "trading";
  if (lower.includes("مقاول") || lower.includes("construct")) return "construction";
  if (lower.includes("عقار") || lower.includes("real estate")) return "realestate";
  if (lower.includes("صح") || lower.includes("health")) return "healthcare";
  if (lower.includes("تصني") || lower.includes("manufactur")) return "manufacturing";
  if (lower.includes("خدم") || lower.includes("service")) return "services";
  if (lower.includes("لوج") || lower.includes("logist")) return "logistics";
  if (lower.includes("تجزئ") || lower.includes("retail")) return "retail";
  if (lower.includes("أغذ") || lower.includes("food")) return "food";
  if (lower.includes("تعل") || lower.includes("educ")) return "education";
  return "other";
}
