"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: string;
  title: string;
  subtitle?: string;
  tone?: "green" | "gold" | "info";
  defaultOpen?: boolean;
  children: ReactNode;
};

const TONE: Record<NonNullable<Props["tone"]>, string> = {
  green: "bg-bg-green-lt text-bg-green",
  gold: "bg-bg-gold-lt text-[#8a6010]",
  info: "bg-bg-info-lt text-bg-info",
};

export function SectionCard({
  icon,
  title,
  subtitle,
  tone = "green",
  defaultOpen = true,
  children,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className="card overflow-hidden">
      <header
        className="px-4 py-3 border-b border-bg-line bg-bg-card-alt flex items-center gap-3 cursor-pointer select-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className={cn("size-8 rounded-full flex items-center justify-center text-sm shrink-0", TONE[tone])}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-black text-bg-green">{title}</h2>
          {subtitle && <p className="text-[10px] text-bg-text-3 mt-0.5">{subtitle}</p>}
        </div>
        <ChevronDown className={cn("size-4 text-bg-text-3 transition-transform shrink-0", open && "rotate-180")} />
      </header>
      {open && <div className="p-4">{children}</div>}
    </section>
  );
}

export function Field({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-1">
      <label className="label block">
        {label} {required && <span className="text-bg-danger">*</span>}
      </label>
      {children}
      {hint && <span className="text-[10px] text-bg-text-3">{hint}</span>}
    </div>
  );
}
