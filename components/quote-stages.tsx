import { FileText, Send, Eye, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Stage = { key: string; label: string; icon: React.ReactNode };

const STAGES: Stage[] = [
  { key: "draft",    label: "مسودة",    icon: <FileText className="size-3.5" /> },
  { key: "sent",     label: "مُرسل",    icon: <Send className="size-3.5" /> },
  { key: "opened",   label: "مفتوح",    icon: <Eye className="size-3.5" /> },
  { key: "accepted", label: "مقبول",    icon: <CheckCircle2 className="size-3.5" /> },
];

const ORDER = ["draft", "sent", "opened", "accepted"] as const;

/**
 * Visual timeline showing the lifecycle progress of a quote.
 * Rejected/expired statuses are rendered as a special red terminal pill.
 */
export function QuoteStages({ status }: { status: string }) {
  const isRejected = status === "rejected" || status === "expired";
  const currentIndex = ORDER.indexOf(status as (typeof ORDER)[number]);

  return (
    <div className="flex items-center gap-0 flex-wrap" aria-label="حالة العرض">
      {STAGES.map((s, i) => {
        const reached = !isRejected && currentIndex >= i;
        const active = !isRejected && currentIndex === i;
        return (
          <div key={s.key} className="flex items-center">
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold transition-colors",
                reached
                  ? active
                    ? "bg-bg-green text-white"
                    : "bg-bg-green-lt text-bg-green"
                  : "bg-bg-line text-bg-text-3"
              )}
            >
              {s.icon}
              <span>{s.label}</span>
            </div>
            {i < STAGES.length - 1 && (
              <div
                className={cn(
                  "w-5 h-[2px] mx-0.5",
                  reached && currentIndex > i ? "bg-bg-green" : "bg-bg-line"
                )}
              />
            )}
          </div>
        );
      })}
      {isRejected && (
        <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold bg-red-50 text-bg-danger mr-2">
          <XCircle className="size-3.5" />
          {status === "rejected" ? "مرفوض" : "منتهٍ"}
        </div>
      )}
    </div>
  );
}
