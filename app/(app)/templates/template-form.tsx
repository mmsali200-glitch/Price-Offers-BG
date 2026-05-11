"use client";

import { useState, useTransition } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { createQuoteFromTemplate } from "@/lib/actions/templates";

export function TemplateForm({
  templateId,
  templateName,
}: {
  templateId: string;
  templateName: string;
}) {
  const [open, setOpen] = useState(false);
  const [clientName, setClientName] = useState("");
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!clientName.trim()) return;
    const formData = new FormData();
    formData.set("template", templateId);
    formData.set("name", clientName.trim());
    startTransition(() => {
      createQuoteFromTemplate(formData);
    });
  }

  return (
    <div className="border-t border-bg-line bg-bg-card-alt">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full py-3 text-xs font-bold text-bg-green hover:bg-bg-green-lt transition-colors inline-flex items-center justify-center gap-2"
        >
          استخدام هذا القالب
          <ArrowRight className="size-3.5" />
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-3 space-y-2">
          <label className="label block text-[11px]">
            اسم العميل (سيُستخدم في العرض)
          </label>
          <div className="flex gap-2">
            <input
              required
              autoFocus
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="شركة النور للتجارة"
              className="input flex-1 text-xs"
              disabled={isPending}
            />
            <button
              type="submit"
              disabled={isPending || !clientName.trim()}
              className="btn-primary text-xs inline-flex items-center gap-1"
            >
              {isPending ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  ...
                </>
              ) : (
                <>
                  فتح
                  <ArrowRight className="size-3.5" />
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setClientName("");
              }}
              disabled={isPending}
              className="text-[11px] text-bg-text-3 px-2 hover:text-bg-danger"
              aria-label="إلغاء"
            >
              إلغاء
            </button>
          </div>
          <p className="text-[10px] text-bg-text-3">
            راح يفتح Builder بقالب &quot;{templateName}&quot; جاهز للتعديل.
          </p>
        </form>
      )}
    </div>
  );
}
