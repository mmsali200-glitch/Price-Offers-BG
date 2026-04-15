"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "لوحة التحكم", icon: LayoutDashboard },
  { href: "/quotes", label: "عروض الأسعار", icon: FileText },
  { href: "/clients", label: "العملاء", icon: Users },
  { href: "/templates", label: "القوالب الجاهزة", icon: Sparkles },
  { href: "/settings", label: "الإعدادات", icon: Settings },
  { href: "/help", label: "المساعدة", icon: HelpCircle },
];

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      dir="rtl"
      className="h-full w-[260px] shrink-0 bg-bg-green text-white flex flex-col"
    >
      {/* Logo */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-lg bg-bg-gold text-bg-green flex items-center justify-center font-black">
            BG
          </div>
          <div className="min-w-0">
            <div className="text-sm font-black leading-tight">Business Gate</div>
            <div className="text-[10px] text-white/70 leading-tight">
              Technical Consulting
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {NAV.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-bold transition-colors",
                active
                  ? "bg-white/15 text-white"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10 text-[10px] text-white/60 space-y-0.5">
        <div>م. محمود عون</div>
        <div>المدير التنفيذي</div>
        <div className="pt-1">+965 9999 0412</div>
      </div>
    </aside>
  );
}
