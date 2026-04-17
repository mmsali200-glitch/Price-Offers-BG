"use client";

import { Menu, Plus, Search } from "lucide-react";
import Link from "next/link";

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  return (
    <header className="h-12 sm:h-14 shrink-0 border-b border-bg-line bg-white px-3 sm:px-4 flex items-center gap-2 sm:gap-3 sticky top-0 z-30">
      {/* Mobile menu button */}
      <button
        onClick={onMenu}
        aria-label="فتح القائمة"
        className="lg:hidden size-10 rounded-lg border border-bg-line flex items-center justify-center text-bg-text-2 hover:border-bg-green hover:text-bg-green active:bg-bg-green-lt touch-manipulation"
      >
        <Menu className="size-5" />
      </button>

      {/* Search — hidden on very small screens */}
      <div className="hidden sm:flex flex-1 max-w-md relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-bg-text-3" />
        <input
          type="search"
          placeholder="ابحث عن عرض أو عميل..."
          className="w-full rounded-lg border border-bg-line bg-bg-card-alt pr-10 pl-3 py-2 text-sm outline-none focus:border-bg-green-2"
        />
      </div>

      <div className="flex-1 sm:hidden" />

      {/* New quote */}
      <Link
        href="/quotes/new"
        className="btn-primary inline-flex items-center gap-1.5 !py-2 !px-3 sm:!px-4 !min-h-[40px] text-xs sm:text-sm"
      >
        <Plus className="size-4" />
        <span className="hidden xs:inline sm:inline">عرض جديد</span>
      </Link>
    </header>
  );
}
